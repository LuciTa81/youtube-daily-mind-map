package com.lucita81.youtubedailymindmap;

import android.app.Activity;
import android.content.Intent;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

@CapacitorPlugin(name = "NativeShareIntent")
public class NativeShareIntentPlugin extends Plugin {
    private static NativeShareIntentPlugin instance;
    private static JSObject pendingShare;
    private static final String DEFAULT_QUICK_SHARE_COMPLETE_MESSAGE = "오늘 기록에 저장했어요";

    @Override
    public void load() {
        instance = this;
        emitPendingShare();
    }

    @PluginMethod
    public void consumePendingShare(PluginCall call) {
        JSObject share;
        synchronized (NativeShareIntentPlugin.class) {
            share = pendingShare;
            pendingShare = null;
        }

        JSObject result = new JSObject();
        if (share == null) {
            result.put("hasShare", false);
        } else {
            result.put("hasShare", true);
            result.put("text", share.getString("text"));
            result.put("subject", share.getString("subject"));
            result.put("receivedAt", share.getString("receivedAt"));
            result.put("action", share.getString("action"));
        }
        call.resolve(result);
    }

    @PluginMethod
    public void completeQuickShare(PluginCall call) {
        String message = call.getString("message", DEFAULT_QUICK_SHARE_COMPLETE_MESSAGE);
        Activity activity = getActivity();

        if (activity == null) {
            call.resolve();
            return;
        }

        activity.runOnUiThread(() -> {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show();
            activity.moveTaskToBack(true);
            call.resolve();
        });
    }

    public static void handleShareIntent(Intent intent) {
        JSObject share = buildShareObject(intent);
        if (share == null) {
            return;
        }

        synchronized (NativeShareIntentPlugin.class) {
            pendingShare = share;
        }

        if (instance != null) {
            instance.emitPendingShare();
        }
    }

    private void emitPendingShare() {
        JSObject share;
        synchronized (NativeShareIntentPlugin.class) {
            share = pendingShare;
        }

        if (share != null) {
            notifyListeners("shareReceived", share);
        }
    }

    private static JSObject buildShareObject(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return null;
        }

        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        String sharedSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (isEmpty(sharedText) && isEmpty(sharedSubject)) {
            return null;
        }

        JSObject object = new JSObject();
        object.put("action", Intent.ACTION_SEND);
        object.put("text", sharedText == null ? "" : sharedText);
        object.put("subject", sharedSubject == null ? "" : sharedSubject);
        object.put("receivedAt", isoNow());
        return object;
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
