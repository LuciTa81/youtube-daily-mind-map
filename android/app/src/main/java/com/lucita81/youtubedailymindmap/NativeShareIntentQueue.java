package com.lucita81.youtubedailymindmap;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class NativeShareIntentQueue {
    private static final String PREFS_NAME = "native-share-intent";
    private static final String KEY_PENDING_SHARES = "pending-shares";
    private static final String KEY_QUICK_SHARE_SAVE_ENABLED = "quick-share-save-enabled";
    private static final int MAX_PENDING_SHARES = 20;
    private static final long MAX_PENDING_AGE_MS = 7L * 24L * 60L * 60L * 1000L;

    private NativeShareIntentQueue() {}

    static synchronized JSONObject enqueue(Context context, Intent intent) {
        JSONObject share = buildShareObject(intent);
        if (share == null) {
            return null;
        }

        long now = System.currentTimeMillis();
        JSONArray pendingShares = prune(readPendingShares(context), now);
        pendingShares.put(share);
        writePendingShares(context, cap(pendingShares));
        return copyObject(share);
    }

    static synchronized JSONArray drain(Context context) {
        long now = System.currentTimeMillis();
        JSONArray pendingShares = prune(readPendingShares(context), now);
        writePendingShares(context, pendingShares);
        return copyArray(pendingShares);
    }

    static synchronized void acknowledge(Context context, JSONArray ids) {
        if (ids == null || ids.length() == 0) {
            return;
        }

        Set<String> acknowledgedIds = new HashSet<>();
        for (int index = 0; index < ids.length(); index += 1) {
            String id = ids.optString(index, "");
            if (!id.trim().isEmpty()) {
                acknowledgedIds.add(id);
            }
        }

        if (acknowledgedIds.isEmpty()) {
            return;
        }

        JSONArray pendingShares = readPendingShares(context);
        JSONArray nextShares = new JSONArray();
        for (int index = 0; index < pendingShares.length(); index += 1) {
            JSONObject share = pendingShares.optJSONObject(index);
            if (share == null || acknowledgedIds.contains(share.optString("pendingShareId", ""))) {
                continue;
            }
            nextShares.put(share);
        }
        writePendingShares(context, nextShares);
    }

    static synchronized void clear(Context context) {
        preferences(context).edit().remove(KEY_PENDING_SHARES).apply();
    }

    static void setQuickShareSaveEnabled(Context context, boolean enabled) {
        preferences(context).edit().putBoolean(KEY_QUICK_SHARE_SAVE_ENABLED, enabled).apply();
    }

    static boolean isQuickShareSaveEnabled(Context context) {
        return preferences(context).getBoolean(KEY_QUICK_SHARE_SAVE_ENABLED, false);
    }

    private static JSONObject buildShareObject(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return null;
        }

        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        String sharedSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (isEmpty(sharedText) && isEmpty(sharedSubject)) {
            return null;
        }

        JSONObject object = new JSONObject();
        try {
            object.put("pendingShareId", UUID.randomUUID().toString());
            object.put("action", Intent.ACTION_SEND);
            object.put("text", sharedText == null ? "" : sharedText);
            object.put("subject", sharedSubject == null ? "" : sharedSubject);
            object.put("receivedAt", isoNow());
            object.put("queuedAtMillis", System.currentTimeMillis());
            object.put("source", "android-share");
        } catch (JSONException ignored) {
            return null;
        }
        return object;
    }

    private static JSONArray readPendingShares(Context context) {
        String rawValue = preferences(context).getString(KEY_PENDING_SHARES, "[]");
        try {
            return new JSONArray(rawValue);
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static void writePendingShares(Context context, JSONArray shares) {
        preferences(context).edit().putString(KEY_PENDING_SHARES, shares.toString()).apply();
    }

    private static JSONArray prune(JSONArray shares, long now) {
        JSONArray nextShares = new JSONArray();
        for (int index = 0; index < shares.length(); index += 1) {
            JSONObject share = shares.optJSONObject(index);
            if (share == null) {
                continue;
            }

            long queuedAtMillis = share.optLong("queuedAtMillis", now);
            if (now - queuedAtMillis > MAX_PENDING_AGE_MS) {
                continue;
            }

            nextShares.put(share);
        }
        return cap(nextShares);
    }

    private static JSONArray cap(JSONArray shares) {
        JSONArray nextShares = new JSONArray();
        int startIndex = Math.max(0, shares.length() - MAX_PENDING_SHARES);
        for (int index = startIndex; index < shares.length(); index += 1) {
            JSONObject share = shares.optJSONObject(index);
            if (share != null) {
                nextShares.put(share);
            }
        }
        return nextShares;
    }

    private static JSONObject copyObject(JSONObject object) {
        try {
            return new JSONObject(object.toString());
        } catch (JSONException ignored) {
            return new JSONObject();
        }
    }

    private static JSONArray copyArray(JSONArray array) {
        try {
            return new JSONArray(array.toString());
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static SharedPreferences preferences(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String isoNow() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date());
    }
}
