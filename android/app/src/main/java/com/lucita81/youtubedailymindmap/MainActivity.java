package com.lucita81.youtubedailymindmap;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDriveFilePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
