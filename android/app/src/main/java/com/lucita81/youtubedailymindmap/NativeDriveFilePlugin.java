package com.lucita81.youtubedailymindmap;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.StatFs;
import android.os.SystemClock;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.text.TextUtils;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Log;
import android.view.WindowManager;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import org.json.JSONArray;

@CapacitorPlugin(name = "NativeDriveFile")
public class NativeDriveFilePlugin extends Plugin {
    private static final String TAG = "NativeDriveFile";
    private static final String PREFS_NAME = "native_drive_file";
    private static final String LAST_DRIVE_URI_KEY = "last_drive_uri";
    private static final String[] ZIP_MIME_TYPES = {
        "application/zip",
        "application/x-zip",
        "application/x-zip-compressed",
        "application/octet-stream"
    };
    private static final String[] YOUTUBE_WATCH_PATTERNS = {
        "youtube.com/watch",
        "youtu.be/",
        "music.youtube.com/watch"
    };
    private static final long MAX_HISTORY_ENTRY_UNCOMPRESSED_BYTES = 512L * 1024L * 1024L;
    private static final long MAX_HTML_HISTORY_ENTRY_BYTES = 96L * 1024L * 1024L;
    private static final long MIN_CACHE_FREE_SPACE_AFTER_COPY_BYTES = 128L * 1024L * 1024L;
    private static final int HTML_PARSE_PROGRESS_ITEM_INTERVAL = 250;
    private static final long HTML_PARSE_PROGRESS_TIME_INTERVAL_MS = 700L;
    private static final String IMPORT_CANCELLED_MESSAGE = "가져오기를 취소했습니다.";
    private static final String INSUFFICIENT_CACHE_SPACE_MESSAGE_PREFIX = "기기 저장공간이 부족해서 Takeout ZIP을 가져올 수 없습니다.";
    private final ExecutorService importExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean importInProgress = new AtomicBoolean(false);
    private final AtomicBoolean cancelImportRequested = new AtomicBoolean(false);
    private InputStream activeDriveInputStream;

    @PluginMethod
    public void pickTakeoutZip(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, ZIP_MIME_TYPES);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        applyLastDriveUri(intent);

        startActivityForResult(call, intent, "handlePickTakeoutZip");
    }

    @PluginMethod
    public void cancelTakeoutImport(PluginCall call) {
        boolean cancelled = importInProgress.get();
        if (cancelled) {
            cancelImportRequested.set(true);
            closeActiveDriveInputStream();
            emitImportProgress("cancelled", 0, IMPORT_CANCELLED_MESSAGE, "takeout.zip", 0L, 0L, 0, 0);
        }

        JSObject response = new JSObject();
        response.put("cancelled", cancelled);
        call.resolve(response);
    }

    @ActivityCallback
    public void handlePickTakeoutZip(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("파일 선택을 취소했습니다.");
            return;
        }

        Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("선택한 파일 정보를 읽지 못했습니다.");
            return;
        }

        if (!isGoogleDriveUri(uri)) {
            call.reject("Google Drive의 Takeout ZIP만 선택할 수 있습니다.");
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        String fileName = getDisplayName(resolver, uri);
        String mimeType = resolver.getType(uri);
        long size = getFileSize(resolver, uri);

        if (!isZipFile(fileName, mimeType)) {
            call.reject("Takeout ZIP 파일만 선택할 수 있습니다.");
            return;
        }

        try {
            resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (SecurityException ignored) {
            // Some providers grant one-time read access only. That is enough for this import.
        }

        importExecutor.execute(() -> importTakeoutZip(call, resolver, uri, fileName, mimeType, size));
    }

    private void importTakeoutZip(PluginCall call, ContentResolver resolver, Uri uri, String fileName, String mimeType, long size) {
        importInProgress.set(true);
        cancelImportRequested.set(false);
        keepScreenOnDuringImport();
        try {
            logImportInfo("Starting native Takeout import: size=" + size);
            emitImportProgress("opening", 0, "Drive ZIP을 준비하는 중입니다.", fileName, 0L, size, 0, 0);
            rememberLastDriveUri(uri);
            throwIfImportCancelled();
            File localZipFile = copyDriveZipToCache(resolver, uri, fileName, size);
            ParsedHistory parsedHistory;
            try {
                throwIfImportCancelled();
                parsedHistory = parseTakeoutZip(localZipFile, fileName, size);
            } finally {
                if (!localZipFile.delete()) {
                    logImportWarning("Failed to delete temporary Takeout ZIP from cache");
                }
            }
            JSObject response = new JSObject();
            response.put("fileName", fileName != null ? fileName : "takeout.zip");
            response.put("mimeType", mimeType != null ? mimeType : "application/zip");
            response.put("size", size);
            response.put("provider", uri.getAuthority());
            response.put("items", parsedHistory.items);
            response.put("skippedCount", parsedHistory.skippedCount);
            response.put("source", "takeout-zip");
            response.put("parserSource", parsedHistory.parserSource);
            response.put("matchedFileName", parsedHistory.matchedFileName);
            response.put("archiveEntryCount", parsedHistory.archiveEntryCount);
            logImportInfo("Finished native Takeout import: items=" + parsedHistory.items.length());
            emitImportProgress(
                "complete",
                100,
                parsedHistory.items.length() + "개 시청 기록을 찾았습니다.",
                fileName,
                size,
                size,
                parsedHistory.archiveEntryCount,
                parsedHistory.items.length()
            );
            resolveOnMainThread(call, response);
        } catch (ImportCancelledException error) {
            logImportInfo("Native Takeout import cancelled");
            emitImportProgress("cancelled", 0, IMPORT_CANCELLED_MESSAGE, fileName, 0L, size, 0, 0);
            rejectOnMainThread(call, IMPORT_CANCELLED_MESSAGE, error);
        } catch (InsufficientCacheSpaceException error) {
            logImportWarning("Native Takeout import rejected: insufficient cache space", error);
            emitImportProgress("error", 0, error.getMessage(), fileName, 0L, size, 0, 0);
            rejectOnMainThread(call, error.getMessage(), error);
        } catch (IOException error) {
            logImportError("Failed to read Drive ZIP", error);
            rejectOnMainThread(call, "Drive ZIP을 읽지 못했습니다. 네트워크 상태나 Drive 파일 접근 권한을 확인해주세요.", error);
        } catch (IllegalArgumentException error) {
            logImportError("Failed to parse Takeout ZIP", error);
            rejectOnMainThread(call, error.getMessage(), error);
        } finally {
            importInProgress.set(false);
            cancelImportRequested.set(false);
            closeActiveDriveInputStream();
            allowScreenSleepAfterImport();
        }
    }

    private void keepScreenOnDuringImport() {
        mainHandler.post(() -> {
            Activity activity = getActivity();
            if (activity != null) {
                activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }

    private void allowScreenSleepAfterImport() {
        mainHandler.post(() -> {
            Activity activity = getActivity();
            if (activity != null) {
                activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }

    private void throwIfImportCancelled() throws ImportCancelledException {
        if (cancelImportRequested.get()) {
            throw new ImportCancelledException();
        }
    }

    private synchronized void setActiveDriveInputStream(InputStream inputStream) {
        activeDriveInputStream = inputStream;
    }

    private synchronized void clearActiveDriveInputStream(InputStream inputStream) {
        if (activeDriveInputStream == inputStream) {
            activeDriveInputStream = null;
        }
    }

    private void closeActiveDriveInputStream() {
        InputStream inputStream;
        synchronized (this) {
            inputStream = activeDriveInputStream;
        }

        if (inputStream == null) {
            return;
        }

        try {
            inputStream.close();
        } catch (IOException ignored) {
            // Closing the active Drive stream is best-effort cancellation.
        }
    }

    private void resolveOnMainThread(PluginCall call, JSObject response) {
        mainHandler.post(() -> call.resolve(response));
    }

    private void rejectOnMainThread(PluginCall call, String message, Exception error) {
        mainHandler.post(() -> call.reject(message, error));
    }

    private void emitImportProgress(
        String phase,
        int percent,
        String message,
        String fileName,
        long bytesRead,
        long totalBytes,
        int entryCount,
        int itemCount
    ) {
        JSObject progress = new JSObject();
        progress.put("phase", phase);
        progress.put("percent", Math.max(0, Math.min(100, percent)));
        progress.put("message", message);
        progress.put("fileName", fileName != null ? fileName : "takeout.zip");
        progress.put("bytesRead", Math.max(0L, bytesRead));
        progress.put("totalBytes", Math.max(0L, totalBytes));
        progress.put("entryCount", Math.max(0, entryCount));
        progress.put("itemCount", Math.max(0, itemCount));
        mainHandler.post(() -> notifyListeners("nativeDriveImportProgress", progress));
    }

    private void applyLastDriveUri(Intent intent) {
        SharedPreferences preferences = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String lastUri = preferences.getString(LAST_DRIVE_URI_KEY, "");
        if (!TextUtils.isEmpty(lastUri)) {
            intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, Uri.parse(lastUri));
        }
    }

    private void rememberLastDriveUri(Uri uri) {
        getContext()
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(LAST_DRIVE_URI_KEY, uri.toString())
            .apply();
    }

    private File copyDriveZipToCache(ContentResolver resolver, Uri uri, String fileName, long size) throws IOException {
        throwIfImportCancelled();
        File cacheDir = getContext().getCacheDir();
        assertEnoughCacheSpaceForDriveCopy(size, cacheDir);
        File tempFile = File.createTempFile("takeout-import-", ".zip", cacheDir);
        long copyStartedAtMs = SystemClock.elapsedRealtime();
        String providerLabel = getSafeProviderLabel(uri);
        logImportInfo("Native Drive copy started: provider=" + providerLabel + ", totalBytes=" + size);
        emitImportProgress(
            "opening",
            8,
            "Drive가 ZIP 파일을 앱에 넘길 준비를 하고 있습니다. 큰 파일은 이 단계가 오래 걸릴 수 있습니다.",
            fileName,
            0L,
            size,
            0,
            0
        );
        long openInputStreamStartedAtMs = SystemClock.elapsedRealtime();
        logImportInfo("Native Drive openInputStream starting: provider=" + providerLabel + ", elapsedMs=0");
        throwIfImportCancelled();
        InputStream driveInputStream = resolver.openInputStream(uri);
        long openInputStreamElapsedMs = elapsedSince(openInputStreamStartedAtMs);
        logImportInfo("Native Drive openInputStream completed: provider=" + providerLabel + ", elapsedMs=" + openInputStreamElapsedMs);
        if (driveInputStream == null) {
            throw new IOException("Input stream is null");
        }
        setActiveDriveInputStream(driveInputStream);

        throwIfImportCancelled();
        emitImportProgress(
            "copying",
            getCopyPercent(0L, size),
            "Drive에서 ZIP을 앱 캐시로 복사하는 중입니다.",
            fileName,
            0L,
            size,
            0,
            0
        );

        try (InputStream inputStream = driveInputStream) {
            try (FileOutputStream outputStream = new FileOutputStream(tempFile)) {
                byte[] buffer = new byte[1024 * 1024];
                int read;
                long copiedBytes = 0L;
                long lastEmitTimeMs = 0L;
                int lastPercent = -1;
                boolean firstReadLogged = false;
                long firstReadStartedAtMs = SystemClock.elapsedRealtime();
                logImportInfo("Native Drive first byte wait started: provider=" + providerLabel);

                while ((read = inputStream.read(buffer)) != -1) {
                    throwIfImportCancelled();
                    if (!firstReadLogged) {
                        firstReadLogged = true;
                        logImportInfo(
                            "Native Drive first byte received: provider=" +
                            providerLabel +
                            ", firstReadElapsedMs=" +
                            elapsedSince(firstReadStartedAtMs) +
                            ", totalElapsedMs=" +
                            elapsedSince(copyStartedAtMs) +
                            ", firstChunkBytes=" +
                            read
                        );
                    }
                    outputStream.write(buffer, 0, read);
                    copiedBytes += read;

                    int percent = getCopyPercent(copiedBytes, size);
                    long now = System.currentTimeMillis();
                    if (percent != lastPercent || now - lastEmitTimeMs > 1200L) {
                        lastPercent = percent;
                        lastEmitTimeMs = now;
                        emitImportProgress(
                            "copying",
                            percent,
                            "Drive에서 ZIP을 준비하는 중입니다. 큰 파일은 네트워크 상태에 따라 시간이 걸립니다.",
                            fileName,
                            copiedBytes,
                            size,
                            0,
                            0
                        );
                    }
                }
                logImportInfo(
                    "Native Drive copy completed: provider=" +
                    providerLabel +
                    ", totalElapsedMs=" +
                    elapsedSince(copyStartedAtMs) +
                    ", copiedBytes=" +
                    copiedBytes +
                    ", totalBytes=" +
                    size
                );
            }
        } catch (IOException error) {
            logImportWarning(
                "Native Drive copy failed: provider=" +
                providerLabel +
                ", totalElapsedMs=" +
                elapsedSince(copyStartedAtMs) +
                ", totalBytes=" +
                size,
                error
            );
            if (!tempFile.delete()) {
                logImportWarning("Failed to delete incomplete temporary Takeout ZIP from cache");
            }
            if (cancelImportRequested.get()) {
                throw new ImportCancelledException();
            }
            throw error;
        } finally {
            clearActiveDriveInputStream(driveInputStream);
        }

        return tempFile;
    }

    private void assertEnoughCacheSpaceForDriveCopy(long size, File cacheDir) throws IOException {
        if (size <= 0L) {
            return;
        }

        long availableBytes = getAvailableCacheBytes(cacheDir);
        long requiredBytes = getRequiredCacheBytesForDriveCopy(size);
        if (availableBytes >= requiredBytes) {
            return;
        }

        throw new InsufficientCacheSpaceException(
            INSUFFICIENT_CACHE_SPACE_MESSAGE_PREFIX +
            " Drive 파일은 " +
            formatBytesForMessage(size) +
            "이고, 앱 캐시는 " +
            formatBytesForMessage(availableBytes) +
            "만 사용할 수 있습니다. 불필요한 파일을 정리한 뒤 다시 시도해주세요."
        );
    }

    private long getAvailableCacheBytes(File cacheDir) {
        StatFs statFs = new StatFs(cacheDir.getPath());
        return statFs.getAvailableBytes();
    }

    private long getRequiredCacheBytesForDriveCopy(long size) {
        if (Long.MAX_VALUE - size < MIN_CACHE_FREE_SPACE_AFTER_COPY_BYTES) {
            return Long.MAX_VALUE;
        }

        return size + MIN_CACHE_FREE_SPACE_AFTER_COPY_BYTES;
    }

    private long elapsedSince(long startedAtMs) {
        return Math.max(0L, SystemClock.elapsedRealtime() - startedAtMs);
    }

    private String getSafeProviderLabel(Uri uri) {
        String authority = uri.getAuthority();
        return authority != null ? authority : "unknown";
    }

    private void logImportInfo(String message) {
        if (isDebugBuild()) {
            Log.i(TAG, message);
        }
    }

    private void logImportWarning(String message) {
        if (isDebugBuild()) {
            Log.w(TAG, message);
        }
    }

    private void logImportWarning(String message, Exception error) {
        if (isDebugBuild()) {
            Log.w(TAG, message, error);
        }
    }

    private void logImportError(String message, Exception error) {
        if (isDebugBuild()) {
            Log.e(TAG, message, error);
        }
    }

    private boolean isDebugBuild() {
        Context context = getContext();
        if (context == null) {
            return false;
        }

        return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    private int getCopyPercent(long copiedBytes, long totalBytes) {
        if (totalBytes <= 0L) {
            return 0;
        }

        return Math.max(0, Math.min(72, (int) ((copiedBytes * 72L) / totalBytes)));
    }

    private ParsedHistory parseTakeoutZip(File zipFile, String fileName, long size) throws IOException {
        throwIfImportCancelled();
        try (ZipFile zip = new ZipFile(zipFile)) {
            List<ZipCandidate> candidates = getZipCandidates(zip);
            int archiveEntryCount = getArchiveEntryCount(zip);
            String lastError = "";

            emitImportProgress(
                "scanning",
                76,
                "ZIP 목록에서 YouTube 시청 기록 파일을 찾는 중입니다.",
                fileName,
                size,
                size,
                archiveEntryCount,
                0
            );

            for (ZipCandidate candidate : candidates) {
                throwIfImportCancelled();
                ZipEntry entry = candidate.entry;
                if (entry.isDirectory()) {
                    continue;
                }

                String entryName = entry.getName();
                try {
                    emitImportProgress(
                        "parsing",
                        82,
                        "시청 기록 파일을 찾았습니다. 기록을 읽는 중입니다.",
                        fileName,
                        size,
                        size,
                        archiveEntryCount,
                        0
                    );
                    try (InputStream entryStream = zip.getInputStream(entry)) {
                        ParsedHistory parsedHistory = parseHistoryEntry(entry, entryStream, entryName, fileName, size, archiveEntryCount);
                        if (parsedHistory.items.length() > 0) {
                            parsedHistory.archiveEntryCount = archiveEntryCount;
                            parsedHistory.matchedFileName = entryName;
                            return parsedHistory;
                        }
                    }
                } catch (ImportCancelledException error) {
                    throw error;
                } catch (Exception error) {
                    lastError = error.getMessage() != null ? error.getMessage() : entryName + " 파일을 읽지 못했습니다.";
                }
            }

            for (ZipCandidate candidate : getFallbackZipCandidates(zip)) {
                throwIfImportCancelled();
                String entryName = candidate.entry.getName();
                try {
                    try (InputStream entryStream = zip.getInputStream(candidate.entry)) {
                        ParsedHistory parsedHistory = parseHistoryEntry(candidate.entry, entryStream, entryName, fileName, size, archiveEntryCount);
                        if (parsedHistory.items.length() > 0) {
                            parsedHistory.archiveEntryCount = archiveEntryCount;
                            parsedHistory.matchedFileName = entryName;
                            return parsedHistory;
                        }
                    }
                } catch (ImportCancelledException error) {
                    throw error;
                } catch (Exception error) {
                    lastError = error.getMessage() != null ? error.getMessage() : entryName + " 파일을 읽지 못했습니다.";
                }
            }

            String detail = TextUtils.isEmpty(lastError) ? "" : " 마지막 오류: " + lastError;
            throw new IllegalArgumentException(
                "Takeout ZIP 안에서 YouTube 시청 기록을 찾지 못했습니다. Takeout에서 YouTube 및 YouTube Music의 기록을 포함했는지 확인해주세요." +
                detail
            );
        }
    }

    private List<ZipCandidate> getZipCandidates(ZipFile zip) {
        List<ZipCandidate> candidates = new ArrayList<>();
        Enumeration<? extends ZipEntry> entries = zip.entries();
        while (entries.hasMoreElements()) {
            ZipEntry entry = entries.nextElement();
            if (!entry.isDirectory() && isPotentialZipHistoryEntry(entry.getName())) {
                candidates.add(new ZipCandidate(entry, scoreZipEntry(entry.getName())));
            }
        }

        Collections.sort(candidates, (left, right) -> {
            int scoreCompare = Integer.compare(right.score, left.score);
            if (scoreCompare != 0) {
                return scoreCompare;
            }

            return left.entry.getName().compareTo(right.entry.getName());
        });

        return candidates;
    }

    private List<ZipCandidate> getFallbackZipCandidates(ZipFile zip) {
        List<ZipCandidate> candidates = new ArrayList<>();
        Enumeration<? extends ZipEntry> entries = zip.entries();
        while (entries.hasMoreElements()) {
            ZipEntry entry = entries.nextElement();
            if (!entry.isDirectory() && isTextHistoryFile(entry.getName())) {
                candidates.add(new ZipCandidate(entry, scoreZipEntry(entry.getName())));
            }
        }

        Collections.sort(candidates, Comparator.comparing(candidate -> candidate.entry.getName()));
        return candidates;
    }

    private int getArchiveEntryCount(ZipFile zip) {
        int count = 0;
        Enumeration<? extends ZipEntry> entries = zip.entries();
        while (entries.hasMoreElements()) {
            if (!entries.nextElement().isDirectory()) {
                count += 1;
            }
        }

        return count;
    }

    private ParsedHistory parseHistoryEntry(
        ZipEntry entry,
        InputStream inputStream,
        String entryName,
        String fileName,
        long totalBytes,
        int archiveEntryCount
    ) throws IOException {
        throwIfImportCancelled();
        String lowerName = normalizeFileName(entryName);
        long entryReadLimitBytes = getHistoryEntryReadLimitBytes(lowerName);
        assertHistoryEntryWithinReadLimit(entry, entryName, entryReadLimitBytes);
        InputStream limitedInputStream = new LimitedInputStream(inputStream, entryReadLimitBytes, entryName);
        if (lowerName.endsWith(".json")) {
            return parseJsonHistory(limitedInputStream, fileName);
        }

        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
            return parseHtmlHistory(readEntryAsString(limitedInputStream, entryReadLimitBytes, entryName), fileName, totalBytes, archiveEntryCount);
        }

        throw new IllegalArgumentException("지원하지 않는 Takeout 기록 파일입니다.");
    }

    private long getHistoryEntryReadLimitBytes(String lowerName) {
        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
            return MAX_HTML_HISTORY_ENTRY_BYTES;
        }

        return MAX_HISTORY_ENTRY_UNCOMPRESSED_BYTES;
    }

    private void assertHistoryEntryWithinReadLimit(ZipEntry entry, String entryName, long maxBytes) {
        long declaredSize = entry.getSize();
        if (declaredSize > maxBytes) {
            throw new IllegalArgumentException(
                "Takeout 시청 기록 파일이 너무 큽니다. " +
                getSafeEntryLabel(entryName) +
                " 파일을 " +
                formatBytesForMessage(maxBytes) +
                " 이하로 나누어 다시 시도해주세요."
            );
        }
    }

    private ParsedHistory parseJsonHistory(InputStream inputStream, String fileName) throws IOException {
        JsonReader reader = new JsonReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
        JSONArray items = new JSONArray();
        int skippedCount = 0;
        int index = 0;
        long lastEmitTimeMs = 0L;

        reader.beginArray();
        while (reader.hasNext()) {
            throwIfImportCancelled();
            TakeoutJsonEntry entry = readJsonEntry(reader);
            JSObject item = parseJsonEntry(entry, index);
            if (item != null) {
                items.put(item);
            } else {
                skippedCount += 1;
            }
            index += 1;
            if (index % 500 == 0) {
                long now = System.currentTimeMillis();
                if (now - lastEmitTimeMs > 700L) {
                    lastEmitTimeMs = now;
                    emitImportProgress(
                        "parsing",
                        Math.min(96, 82 + index / 750),
                        "시청 기록을 정리하는 중입니다.",
                        fileName,
                        0L,
                        0L,
                        0,
                        items.length()
                    );
                }
            }
        }
        reader.endArray();

        return new ParsedHistory(items, skippedCount, "takeout-json");
    }

    private TakeoutJsonEntry readJsonEntry(JsonReader reader) throws IOException {
        TakeoutJsonEntry entry = new TakeoutJsonEntry();

        if (reader.peek() == JsonToken.NULL) {
            reader.nextNull();
            return entry;
        }

        reader.beginObject();
        while (reader.hasNext()) {
            String name = reader.nextName();
            if ("title".equals(name)) {
                entry.title = nextStringOrNull(reader);
            } else if ("titleUrl".equals(name)) {
                entry.titleUrl = nextStringOrNull(reader);
            } else if ("time".equals(name)) {
                entry.time = nextStringOrNull(reader);
            } else if ("subtitles".equals(name)) {
                entry.subtitle = readFirstSubtitle(reader);
            } else {
                reader.skipValue();
            }
        }
        reader.endObject();

        return entry;
    }

    private Subtitle readFirstSubtitle(JsonReader reader) throws IOException {
        if (reader.peek() == JsonToken.NULL) {
            reader.nextNull();
            return null;
        }

        Subtitle firstSubtitle = null;
        reader.beginArray();
        while (reader.hasNext()) {
            if (firstSubtitle == null && reader.peek() == JsonToken.BEGIN_OBJECT) {
                firstSubtitle = readSubtitle(reader);
            } else {
                reader.skipValue();
            }
        }
        reader.endArray();

        return firstSubtitle;
    }

    private Subtitle readSubtitle(JsonReader reader) throws IOException {
        Subtitle subtitle = new Subtitle();

        reader.beginObject();
        while (reader.hasNext()) {
            String name = reader.nextName();
            if ("name".equals(name)) {
                subtitle.name = nextStringOrNull(reader);
            } else if ("url".equals(name)) {
                subtitle.url = nextStringOrNull(reader);
            } else {
                reader.skipValue();
            }
        }
        reader.endObject();

        return subtitle;
    }

    private String nextStringOrNull(JsonReader reader) throws IOException {
        if (reader.peek() == JsonToken.NULL) {
            reader.nextNull();
            return null;
        }

        return reader.nextString();
    }

    private JSObject parseJsonEntry(TakeoutJsonEntry entry, int index) {
        if (isBlank(entry.time) || isBlank(entry.title)) {
            return null;
        }

        String watchedAt = parseDateText(entry.time);
        if (watchedAt == null) {
            return null;
        }

        String title = stripWatchedPrefix(entry.title);
        if (isBlank(title)) {
            return null;
        }

        JSObject item = new JSObject();
        item.put("id", makeId("takeout-json", index, title + "-" + entry.time + "-" + valueOrEmpty(entry.titleUrl)));
        item.put("title", title);
        putIfPresent(item, "url", normalizeUrl(entry.titleUrl));
        if (entry.subtitle != null) {
            putIfPresent(item, "channelName", trimToNull(entry.subtitle.name));
            putIfPresent(item, "channelUrl", normalizeUrl(entry.subtitle.url));
        }
        item.put("watchedAt", watchedAt);
        item.put("rawDateText", entry.time);
        item.put("source", "takeout-json");

        return item;
    }

    private ParsedHistory parseHtmlHistory(String content, String fileName, long totalBytes, int archiveEntryCount) throws IOException {
        List<String> blocks = splitHtmlIntoHistoryBlocks(content);
        JSONArray items = new JSONArray();
        int skippedCount = 0;
        int lastEmittedItemCount = 0;
        long lastEmitTimeMs = 0L;

        for (int index = 0; index < blocks.size(); index += 1) {
            throwIfImportCancelled();
            JSObject item = parseHtmlBlock(blocks.get(index), index);
            if (item != null) {
                items.put(item);
            } else {
                skippedCount += 1;
            }

            long now = System.currentTimeMillis();
            int itemCount = items.length();
            boolean hasItemHeartbeat = itemCount - lastEmittedItemCount >= HTML_PARSE_PROGRESS_ITEM_INTERVAL;
            boolean hasWaitedEnough = now - lastEmitTimeMs >= HTML_PARSE_PROGRESS_TIME_INTERVAL_MS;
            boolean isFinalBlock = index + 1 == blocks.size();
            if ((hasItemHeartbeat && hasWaitedEnough) || isFinalBlock) {
                lastEmittedItemCount = itemCount;
                lastEmitTimeMs = now;
                emitImportProgress(
                    "parsing",
                    getParsePercent(index + 1, blocks.size()),
                    "시청 기록을 정리하는 중입니다.",
                    fileName,
                    totalBytes,
                    totalBytes,
                    archiveEntryCount,
                    itemCount
                );
            }
        }

        return new ParsedHistory(items, skippedCount, "takeout-html");
    }

    private int getParsePercent(int processedBlocks, int totalBlocks) {
        if (totalBlocks <= 0) {
            return 82;
        }

        int percent = 82 + (int) ((Math.max(0, processedBlocks) * 16L) / totalBlocks);
        return Math.max(82, Math.min(98, percent));
    }

    private JSObject parseHtmlBlock(String block, int index) {
        List<Anchor> anchors = extractAnchors(block);
        Anchor titleAnchor = findTitleAnchor(anchors);
        if (titleAnchor == null || isBlank(titleAnchor.text)) {
            return null;
        }

        Anchor channelAnchor = null;
        for (Anchor anchor : anchors) {
            if (anchor != titleAnchor && !isBlank(anchor.text)) {
                channelAnchor = anchor;
                break;
            }
        }

        List<String> lines = extractRawLines(block);
        String rawDateText = null;
        for (int indexFromEnd = lines.size() - 1; indexFromEnd >= 0; indexFromEnd -= 1) {
            String line = lines.get(indexFromEnd);
            if (lineLooksLikeDate(line)) {
                rawDateText = line;
                break;
            }
        }

        String watchedAt = rawDateText != null ? parseDateText(rawDateText) : null;
        if (watchedAt == null) {
            return null;
        }

        String title = stripWatchedPrefix(titleAnchor.text);
        if (isBlank(title)) {
            return null;
        }

        JSObject item = new JSObject();
        item.put("id", makeId("takeout-html", index, title + "-" + rawDateText + "-" + valueOrEmpty(titleAnchor.href)));
        item.put("title", title);
        putIfPresent(item, "url", normalizeUrl(titleAnchor.href));
        if (channelAnchor != null) {
            putIfPresent(item, "channelName", trimToNull(channelAnchor.text));
            putIfPresent(item, "channelUrl", normalizeUrl(channelAnchor.href));
        }
        item.put("watchedAt", watchedAt);
        item.put("rawDateText", rawDateText);
        item.put("source", "takeout-html");

        return item;
    }

    private Anchor findTitleAnchor(List<Anchor> anchors) {
        for (Anchor anchor : anchors) {
            if (anchor.href != null) {
                for (String pattern : YOUTUBE_WATCH_PATTERNS) {
                    if (anchor.href.contains(pattern)) {
                        return anchor;
                    }
                }
            }
        }

        return anchors.isEmpty() ? null : anchors.get(0);
    }

    private List<Anchor> extractAnchors(String block) {
        List<Anchor> anchors = new ArrayList<>();
        Pattern anchorPattern = Pattern.compile("<a\\b([^>]*)>([\\s\\S]*?)</a>", Pattern.CASE_INSENSITIVE);
        Matcher matcher = anchorPattern.matcher(block);

        while (matcher.find()) {
            String attributes = matcher.group(1);
            String href = null;
            Matcher hrefMatcher = Pattern.compile("\\bhref=(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", Pattern.CASE_INSENSITIVE).matcher(attributes);
            if (hrefMatcher.find()) {
                href = firstNonNull(hrefMatcher.group(1), hrefMatcher.group(2), hrefMatcher.group(3));
            }

            anchors.add(new Anchor(normalizeUrl(href), stripTags(matcher.group(2))));
        }

        return anchors;
    }

    private List<String> extractRawLines(String block) {
        String normalized = block
            .replaceAll("(?i)<br\\s*/?>", "\n")
            .replaceAll("(?i)</(div|p|li)>", "\n")
            .replaceAll("<[^>]*>", "");
        String[] rawLines = normalized.split("\n");
        List<String> lines = new ArrayList<>();

        for (String rawLine : rawLines) {
            String line = decodeHtml(rawLine).replaceAll("\\s+", " ").trim();
            if (!line.isEmpty()) {
                lines.add(line);
            }
        }

        return lines;
    }

    private List<String> splitHtmlIntoHistoryBlocks(String content) {
        List<String> blocks = collectMatches(
            content,
            "<div\\b[^>]*class=[\"'][^\"']*outer-cell[^\"']*[\"'][\\s\\S]*?(?=<div\\b[^>]*class=[\"'][^\"']*outer-cell|</body>|$)"
        );
        if (!blocks.isEmpty()) {
            return blocks;
        }

        blocks = collectMatches(content, "<div\\b[^>]*class=[\"'][^\"']*content-cell[^\"']*[\"'][\\s\\S]*?</div>");
        if (!blocks.isEmpty()) {
            return blocks;
        }

        String[] splitBlocks = content.split("(?i)<hr\\s*/?>");
        List<String> fallback = new ArrayList<>();
        for (String block : splitBlocks) {
            fallback.add(block);
        }

        return fallback;
    }

    private List<String> collectMatches(String content, String pattern) {
        Pattern compiledPattern = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);
        Matcher matcher = compiledPattern.matcher(content);
        List<String> matches = new ArrayList<>();
        while (matcher.find()) {
            matches.add(matcher.group());
        }

        return matches;
    }

    private boolean lineLooksLikeDate(String line) {
        return parseDateText(line) != null &&
            Pattern.compile("(\\d{4})|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|오전|오후|KST|UTC", Pattern.CASE_INSENSITIVE)
                .matcher(line)
                .find();
    }

    private String parseDateText(String rawDateText) {
        if (isBlank(rawDateText)) {
            return null;
        }

        String normalized = decodeHtml(rawDateText).replace('\u202f', ' ').replaceAll("\\s+", " ").trim();
        String timezoneAdjusted = normalized.replaceAll("\\bKST\\b", "GMT+09:00").replaceAll("\\bJST\\b", "GMT+09:00").replaceAll("\\bUTC\\b", "GMT");
        String parsed = tryParseDatePatterns(normalized, Locale.US);
        if (parsed != null) {
            return parsed;
        }

        parsed = tryParseDatePatterns(timezoneAdjusted, Locale.US);
        if (parsed != null) {
            return parsed;
        }

        parsed = tryParseDatePatterns(timezoneAdjusted, Locale.KOREAN);
        if (parsed != null) {
            return parsed;
        }

        Matcher koreanMatcher = Pattern.compile(
            "(\\d{4})\\.\\s*(\\d{1,2})\\.\\s*(\\d{1,2})\\.?\\s*(오전|오후)?\\s*(\\d{1,2}):(\\d{2})(?::(\\d{2}))?"
        ).matcher(normalized);
        if (koreanMatcher.find()) {
            int year = Integer.parseInt(koreanMatcher.group(1));
            int month = Integer.parseInt(koreanMatcher.group(2));
            int day = Integer.parseInt(koreanMatcher.group(3));
            String meridiem = koreanMatcher.group(4);
            int hour = Integer.parseInt(koreanMatcher.group(5));
            int minute = Integer.parseInt(koreanMatcher.group(6));
            int second = koreanMatcher.group(7) != null ? Integer.parseInt(koreanMatcher.group(7)) : 0;
            if ("오후".equals(meridiem) && hour < 12) {
                hour += 12;
            }
            if ("오전".equals(meridiem) && hour == 12) {
                hour = 0;
            }

            return formatCalendarDate(year, month, day, hour, minute, second);
        }

        Matcher slashMatcher = Pattern.compile(
            "(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})\\s+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?"
        ).matcher(normalized);
        if (slashMatcher.find()) {
            return formatCalendarDate(
                Integer.parseInt(slashMatcher.group(1)),
                Integer.parseInt(slashMatcher.group(2)),
                Integer.parseInt(slashMatcher.group(3)),
                Integer.parseInt(slashMatcher.group(4)),
                Integer.parseInt(slashMatcher.group(5)),
                slashMatcher.group(6) != null ? Integer.parseInt(slashMatcher.group(6)) : 0
            );
        }

        return null;
    }

    private String tryParseDatePatterns(String value, Locale locale) {
        String[] patterns = {
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            "yyyy-MM-dd'T'HH:mm:ssX",
            "MMM d, yyyy, h:mm:ss a z",
            "MMM d, yyyy, h:mm a z",
            "MMM d, yyyy 'at' h:mm:ss a z",
            "MMM d, yyyy 'at' h:mm a z",
            "yyyy. M. d. a h:mm:ss z",
            "yyyy. M. d. a h:mm z"
        };

        for (String pattern : patterns) {
            try {
                SimpleDateFormat formatter = new SimpleDateFormat(pattern, locale);
                Date date = formatter.parse(value);
                if (date != null) {
                    return formatUtcDate(date);
                }
            } catch (ParseException ignored) {
                // Try the next known Takeout date format.
            }
        }

        return null;
    }

    private String formatCalendarDate(int year, int month, int day, int hour, int minute, int second) {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Seoul"), Locale.KOREAN);
        calendar.clear();
        calendar.set(year, month - 1, day, hour, minute, second);
        return formatUtcDate(calendar.getTime());
    }

    private String formatUtcDate(Date date) {
        SimpleDateFormat output = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        output.setTimeZone(TimeZone.getTimeZone("UTC"));
        return output.format(date);
    }

    private boolean isPotentialZipHistoryEntry(String fileName) {
        if (!isTextHistoryFile(fileName)) {
            return false;
        }

        return scoreZipEntry(fileName) > 0;
    }

    private int scoreZipEntry(String fileName) {
        String lowerName = normalizeFileName(fileName);
        String[] pathParts = lowerName.split("/");
        String baseName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : lowerName;
        int score = 0;

        if ("watch-history.json".equals(baseName)) {
            score += 120;
        }
        if ("watch-history.html".equals(baseName) || "watch-history.htm".equals(baseName)) {
            score += 110;
        }
        if (lowerName.contains("watch-history")) {
            score += 80;
        }
        if (lowerName.contains("youtube")) {
            score += 40;
        }
        if (lowerName.contains("history") || lowerName.contains("기록")) {
            score += 25;
        }
        if (lowerName.endsWith(".json")) {
            score += 8;
        }
        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
            score += 6;
        }

        return score;
    }

    private boolean isGoogleDriveUri(Uri uri) {
        String authority = uri.getAuthority();
        return authority != null && authority.startsWith("com.google.android.apps.docs");
    }

    private boolean isZipFile(String fileName, String mimeType) {
        String normalizedName = fileName != null ? fileName.toLowerCase(Locale.ROOT) : "";
        if (normalizedName.endsWith(".zip")) {
            return true;
        }

        if (mimeType == null) {
            return false;
        }

        for (String allowedMimeType : ZIP_MIME_TYPES) {
            if (allowedMimeType.equalsIgnoreCase(mimeType)) {
                return true;
            }
        }

        return false;
    }

    private boolean isTextHistoryFile(String fileName) {
        String lowerName = normalizeFileName(fileName);
        return lowerName.endsWith(".json") || lowerName.endsWith(".html") || lowerName.endsWith(".htm");
    }

    private String normalizeFileName(String fileName) {
        return valueOrEmpty(fileName).replace("\\", "/").toLowerCase(Locale.KOREAN);
    }

    private String getSafeEntryLabel(String entryName) {
        String normalized = valueOrEmpty(entryName).replace("\\", "/");
        String[] parts = normalized.split("/");
        List<String> safeParts = new ArrayList<>();
        for (String part : parts) {
            if (!part.isEmpty()) {
                safeParts.add(part);
            }
        }

        if (safeParts.isEmpty()) {
            return "watch-history";
        }

        int fromIndex = Math.max(0, safeParts.size() - 3);
        return TextUtils.join("/", safeParts.subList(fromIndex, safeParts.size()));
    }

    private String formatBytesForMessage(long bytes) {
        long mib = Math.max(1L, bytes / 1024L / 1024L);
        return mib + "MiB";
    }

    private String getDisplayName(ContentResolver resolver, Uri uri) {
        try (Cursor cursor = resolver.query(uri, null, null, null, null)) {
            if (cursor == null || !cursor.moveToFirst()) {
                return null;
            }

            int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
            if (nameIndex >= 0) {
                return cursor.getString(nameIndex);
            }
        }

        return null;
    }

    private long getFileSize(ContentResolver resolver, Uri uri) {
        try (Cursor cursor = resolver.query(uri, null, null, null, null)) {
            if (cursor == null || !cursor.moveToFirst()) {
                return -1;
            }

            int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
            if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) {
                return cursor.getLong(sizeIndex);
            }
        }

        return -1;
    }

    private String readEntryAsString(InputStream inputStream, long maxBytes, String entryName) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = inputStream.read(buffer)) != -1) {
            throwIfImportCancelled();
            if (outputStream.size() + read > maxBytes) {
                throw new IOException(
                    "Takeout 시청 기록 파일이 너무 큽니다. " +
                    getSafeEntryLabel(entryName) +
                    " 파일을 " +
                    formatBytesForMessage(maxBytes) +
                    " 이하로 나누어 다시 시도해주세요."
                );
            }
            outputStream.write(buffer, 0, read);
        }

        return outputStream.toString(StandardCharsets.UTF_8.name());
    }

    private String decodeHtml(String value) {
        String decoded = value
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'");
        decoded = replaceNumericHtmlEntities(decoded, "&#(\\d+);", 10);
        return replaceNumericHtmlEntities(decoded, "&#x([0-9a-fA-F]+);", 16);
    }

    private String replaceNumericHtmlEntities(String value, String pattern, int radix) {
        Matcher matcher = Pattern.compile(pattern).matcher(value);
        StringBuffer output = new StringBuffer();
        while (matcher.find()) {
            String replacement;
            try {
                replacement = Character.toString((char) Integer.parseInt(matcher.group(1), radix));
            } catch (NumberFormatException error) {
                replacement = matcher.group();
            }
            matcher.appendReplacement(output, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(output);
        return output.toString();
    }

    private String stripTags(String value) {
        return decodeHtml(value.replaceAll("<[^>]*>", "")).replaceAll("\\s+", " ").trim();
    }

    private String normalizeUrl(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }

        String decoded = decodeHtml(trimmed);
        if (decoded.startsWith("http")) {
            return decoded;
        }
        if (decoded.startsWith("//")) {
            return "https:" + decoded;
        }

        return decoded;
    }

    private String stripWatchedPrefix(String title) {
        return title
            .replaceFirst("(?i)^Watched\\s+", "")
            .replaceFirst("(?i)^You watched\\s+", "")
            .replaceFirst("(?i)^시청한 동영상:\\s*", "")
            .replaceFirst("(?i)^시청함:\\s*", "")
            .replaceFirst("(?i)^시청함\\s*", "")
            .trim();
    }

    private String makeId(String source, int index, String seed) {
        long hash = 0L;
        for (int i = 0; i < seed.length(); i += 1) {
            hash = (hash * 31L + seed.charAt(i)) & 0xffffffffL;
        }

        return source + "-" + index + "-" + Long.toString(hash, 36);
    }

    private void putIfPresent(JSObject object, String key, String value) {
        if (!isBlank(value)) {
            object.put(key, value);
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonNull(String first, String second, String third) {
        if (first != null) {
            return first;
        }
        if (second != null) {
            return second;
        }
        return third;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static class ZipCandidate {
        final ZipEntry entry;
        final int score;

        ZipCandidate(ZipEntry entry, int score) {
            this.entry = entry;
            this.score = score;
        }
    }

    private static class ImportCancelledException extends IOException {
        ImportCancelledException() {
            super(IMPORT_CANCELLED_MESSAGE);
        }
    }

    private static class InsufficientCacheSpaceException extends IOException {
        InsufficientCacheSpaceException(String message) {
            super(message);
        }
    }

    private class LimitedInputStream extends InputStream {
        private final InputStream delegate;
        private final long maxBytes;
        private final String entryName;
        private long bytesRead = 0L;

        LimitedInputStream(InputStream delegate, long maxBytes, String entryName) {
            this.delegate = delegate;
            this.maxBytes = maxBytes;
            this.entryName = entryName;
        }

        @Override
        public int read() throws IOException {
            int value = delegate.read();
            if (value != -1) {
                trackBytesRead(1L);
            }
            return value;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            int read = delegate.read(buffer, offset, length);
            if (read > 0) {
                trackBytesRead(read);
            }
            return read;
        }

        private void trackBytesRead(long count) throws IOException {
            throwIfImportCancelled();
            bytesRead += count;
            if (bytesRead > maxBytes) {
                throw new IOException(
                    "Takeout 시청 기록 파일이 너무 큽니다. " +
                    getSafeEntryLabel(entryName) +
                    " 파일을 " +
                    formatBytesForMessage(maxBytes) +
                    " 이하로 나누어 다시 시도해주세요."
                );
            }
        }
    }

    private static class ParsedHistory {
        final JSONArray items;
        final int skippedCount;
        final String parserSource;
        String matchedFileName;
        int archiveEntryCount;

        ParsedHistory(JSONArray items, int skippedCount, String parserSource) {
            this.items = items;
            this.skippedCount = skippedCount;
            this.parserSource = parserSource;
        }
    }

    private static class TakeoutJsonEntry {
        String title;
        String titleUrl;
        String time;
        Subtitle subtitle;
    }

    private static class Subtitle {
        String name;
        String url;
    }

    private static class Anchor {
        final String href;
        final String text;

        Anchor(String href, String text) {
            this.href = href;
            this.text = text;
        }
    }
}
