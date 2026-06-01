package com.lucita81.youtubedailymindmap;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@CapacitorPlugin(name = "NativeDriveFile")
public class NativeDriveFilePlugin extends Plugin {
    private static final long MAX_FILE_SIZE_BYTES = 120L * 1024L * 1024L;
    private static final String[] ZIP_MIME_TYPES = {
        "application/zip",
        "application/x-zip",
        "application/x-zip-compressed",
        "application/octet-stream"
    };

    @PluginMethod
    public void pickTakeoutZip(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, ZIP_MIME_TYPES);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);

        startActivityForResult(call, intent, "handlePickTakeoutZip");
    }

    @ActivityCallback
    private void handlePickTakeoutZip(PluginCall call, ActivityResult result) {
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

        if (size > MAX_FILE_SIZE_BYTES) {
            call.reject("파일이 너무 큽니다. YouTube 기록만 포함한 Takeout ZIP을 선택해주세요.");
            return;
        }

        try {
            resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (SecurityException ignored) {
            // Some providers grant one-time read access only. That is enough for this import.
        }

        try {
            byte[] bytes = readAllBytes(resolver, uri);
            JSObject response = new JSObject();
            response.put("fileName", fileName != null ? fileName : "takeout.zip");
            response.put("mimeType", mimeType != null ? mimeType : "application/zip");
            response.put("size", bytes.length);
            response.put("provider", uri.getAuthority());
            response.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
            call.resolve(response);
        } catch (IOException error) {
            call.reject("Drive 파일을 읽지 못했습니다. 네트워크 상태나 Drive 파일 접근 권한을 확인해주세요.", error);
        }
    }

    private boolean isGoogleDriveUri(Uri uri) {
        String authority = uri.getAuthority();
        return authority != null && authority.startsWith("com.google.android.apps.docs");
    }

    private boolean isZipFile(String fileName, String mimeType) {
        String normalizedName = fileName != null ? fileName.toLowerCase() : "";
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

    private byte[] readAllBytes(ContentResolver resolver, Uri uri) throws IOException {
        try (InputStream inputStream = resolver.openInputStream(uri)) {
            if (inputStream == null) {
                throw new IOException("Input stream is null");
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            long totalBytes = 0;
            while ((read = inputStream.read(buffer)) != -1) {
                totalBytes += read;
                if (totalBytes > MAX_FILE_SIZE_BYTES) {
                    throw new IOException("Selected file exceeds max import size");
                }
                outputStream.write(buffer, 0, read);
            }

            return outputStream.toByteArray();
        }
    }
}
