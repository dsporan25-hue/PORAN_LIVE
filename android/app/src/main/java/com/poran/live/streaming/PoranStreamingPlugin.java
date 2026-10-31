package com.poran.live.streaming;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Build;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "PoranStreaming")
public class PoranStreamingPlugin extends Plugin {

    private String pendingStreamUrl;

    @PluginMethod
    public void pickVideo(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("video/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "videoPickerResult");
    }

    @ActivityCallback
    public void videoPickerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK ||
                result.getData() == null ||
                result.getData().getData() == null) {
            JSObject data = new JSObject();
            data.put("cancelled", true);
            call.resolve(data);
            return;
        }

        Uri uri = result.getData().getData();

        try {
            getContext().getContentResolver().takePersistableUriPermission(
                uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
            );
        } catch (Exception ignored) {}

        JSObject data = new JSObject();
        data.put("cancelled", false);
        data.put("videoUri", uri.toString());
        call.resolve(data);
    }

    @PluginMethod
    public void startScreenLive(PluginCall call) {
        String streamUrl = call.getString("streamUrl");

        if (streamUrl == null ||
                !(streamUrl.startsWith("rtmp://") || streamUrl.startsWith("rtmps://"))) {
            call.reject("A valid Facebook RTMP Server URL and Stream Key are required.");
            return;
        }

        pendingStreamUrl = streamUrl;

        MediaProjectionManager manager =
            (MediaProjectionManager) getContext().getSystemService(
                Context.MEDIA_PROJECTION_SERVICE
            );

        if (manager == null) {
            pendingStreamUrl = null;
            call.reject("Screen capture is not available on this device.");
            return;
        }

        Intent captureIntent = manager.createScreenCaptureIntent();
        startActivityForResult(call, captureIntent, "screenCaptureResult");
    }

    @ActivityCallback
    public void screenCaptureResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            pendingStreamUrl = null;
            JSObject data = new JSObject();
            data.put("cancelled", true);
            call.resolve(data);
            return;
        }

        String streamUrl = pendingStreamUrl;
        pendingStreamUrl = null;

        if (streamUrl == null || streamUrl.isEmpty()) {
            call.reject("Stream URL is missing.");
            return;
        }

        Intent serviceIntent = new Intent(getContext(), ScreenCaptureService.class);
        serviceIntent.setAction(ScreenCaptureService.ACTION_START);
        serviceIntent.putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, result.getResultCode());
        serviceIntent.putExtra(ScreenCaptureService.EXTRA_DATA, result.getData());
        serviceIntent.putExtra(ScreenCaptureService.EXTRA_URL, streamUrl);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }

            JSObject data = new JSObject();
            data.put("cancelled", false);
            data.put("started", true);
            call.resolve(data);
        } catch (Exception e) {
            call.reject("Could not start screen broadcast: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopScreenLive(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), ScreenCaptureService.class);
        serviceIntent.setAction(ScreenCaptureService.ACTION_STOP);

        try {
            getContext().startService(serviceIntent);
            JSObject data = new JSObject();
            data.put("stopped", true);
            call.resolve(data);
        } catch (Exception e) {
            call.reject("Could not stop screen broadcast: " + e.getMessage());
        }
    }
}
