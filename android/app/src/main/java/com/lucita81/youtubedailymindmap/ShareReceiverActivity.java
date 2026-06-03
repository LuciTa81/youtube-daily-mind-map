package com.lucita81.youtubedailymindmap;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import org.json.JSONObject;

public class ShareReceiverActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        JSONObject queuedShare = NativeShareIntentQueue.enqueue(this, intent);
        if (queuedShare == null) {
            finishWithoutAnimation();
            return;
        }

        if (NativeShareIntentQueue.isQuickShareSaveEnabled(this)) {
            Toast.makeText(this, getString(R.string.quick_share_queued_message), Toast.LENGTH_SHORT).show();
            finishWithoutAnimation();
            return;
        }

        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(mainIntent);
        finishWithoutAnimation();
    }

    private void finishWithoutAnimation() {
        finish();
        overridePendingTransition(R.anim.quick_share_noop, R.anim.quick_share_noop);
    }
}
