package com.lucita81.youtubedailymindmap;

import android.app.Activity;
import android.content.Intent;
import android.widget.Toast;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeShareIntent")
public class NativeShareIntentPlugin extends Plugin {
    private static NativeShareIntentPlugin instance;
    private static final String DEFAULT_QUICK_SHARE_COMPLETE_MESSAGE = "오늘 기록에 저장했어요";

    @Override
    public void load() {
        instance = this;
        emitPendingShare();
    }

    @PluginMethod
    public void drainPendingShares(PluginCall call) {
        JSObject result = new JSObject();
        result.put("shares", toShareArray(NativeShareIntentQueue.drain(getContext())));
        call.resolve(result);
    }

    @PluginMethod
    public void ackPendingShares(PluginCall call) {
        JSArray ids = call.getArray("ids", new JSArray());
        NativeShareIntentQueue.acknowledge(getContext(), ids);
        call.resolve();
    }

    @PluginMethod
    public void clearPendingShares(PluginCall call) {
        NativeShareIntentQueue.clear(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setQuickShareSaveEnabled(PluginCall call) {
        NativeShareIntentQueue.setQuickShareSaveEnabled(getContext(), call.getBoolean("enabled", false));
        call.resolve();
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

    public static void handleShareIntent(Activity activity, Intent intent) {
        if (activity == null) {
            return;
        }

        JSONObject share = NativeShareIntentQueue.enqueue(activity, intent);
        if (share == null) {
            return;
        }

        if (instance != null) {
            instance.notifyListeners("shareReceived", toShareEvent(share));
        }
    }

    private void emitPendingShare() {
        JSONArray shares = NativeShareIntentQueue.drain(getContext());
        JSONObject share = shares.optJSONObject(0);

        if (share != null) {
            notifyListeners("shareReceived", toShareEvent(share));
        }
    }

    private static JSObject toShareEvent(JSONObject share) {
        JSObject result = new JSObject();
        putShareFields(result, share);
        return result;
    }

    private static JSArray toShareArray(JSONArray shares) {
        JSArray result = new JSArray();
        for (int index = 0; index < shares.length(); index += 1) {
            JSONObject share = shares.optJSONObject(index);
            if (share != null) {
                result.put(toShareEvent(share));
            }
        }
        return result;
    }

    private static void putShareFields(JSObject result, JSONObject share) {
        result.put("pendingShareId", share.optString("pendingShareId"));
        result.put("text", share.optString("text"));
        result.put("subject", share.optString("subject"));
        result.put("receivedAt", share.optString("receivedAt"));
        result.put("action", share.optString("action"));
        result.put("source", share.optString("source"));
    }
}
