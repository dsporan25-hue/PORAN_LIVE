package com.poran.live;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.poran.live.streaming.PoranStreamingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PoranStreamingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
