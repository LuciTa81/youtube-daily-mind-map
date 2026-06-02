package com.lucita81.youtubedailymindmap;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDriveFilePlugin.class);
        registerPlugin(NativeShareIntentPlugin.class);
        super.onCreate(savedInstanceState);
        NativeShareIntentPlugin.handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        NativeShareIntentPlugin.handleShareIntent(intent);
    }
}
