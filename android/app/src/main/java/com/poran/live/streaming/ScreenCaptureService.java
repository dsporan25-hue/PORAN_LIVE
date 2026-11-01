package com.poran.live.streaming;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import android.media.projection.MediaProjection;
import android.content.pm.ServiceInfo;

import com.pedro.common.ConnectChecker;
import com.pedro.common.StreamingStatsReport;
import com.pedro.library.rtmp.RtmpDisplay;

public class ScreenCaptureService extends Service implements ConnectChecker {

    public static final String ACTION_START = "PORAN_SCREEN_START";
    public static final String ACTION_STOP = "PORAN_SCREEN_STOP";
    public static final String EXTRA_RESULT_CODE = "resultCode";
    public static final String EXTRA_DATA = "projectionData";
    public static final String EXTRA_URL = "streamUrl";

    private static final String CHANNEL_ID = "poran_live_channel";
    private static final int NOTIFICATION_ID = 7001;

    private RtmpDisplay rtmpDisplay;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_STOP.equals(intent.getAction())) {
            stopStreaming();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (!ACTION_START.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        startLiveNotification();

        int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0);
        Intent projectionData = intent.getParcelableExtra(EXTRA_DATA);
        String streamUrl = intent.getStringExtra(EXTRA_URL);

        if (projectionData == null || streamUrl == null || streamUrl.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            startStreaming(resultCode, projectionData, streamUrl);
        } catch (Exception e) {
            stopStreaming();
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    private void startStreaming(int resultCode, Intent data, String url) {

        DisplayMetrics metrics = new DisplayMetrics();
        WindowManager manager =
            (WindowManager) getSystemService(Context.WINDOW_SERVICE);

        manager.getDefaultDisplay().getRealMetrics(metrics);

        int width = metrics.widthPixels;
        int height = metrics.heightPixels;
        int dpi = metrics.densityDpi;

        if (width % 2 != 0) width--;
        if (height % 2 != 0) height--;

        rtmpDisplay = new RtmpDisplay(this, false, this);

        rtmpDisplay.setMediaProjectionCallback(
            new MediaProjection.Callback() {
                @Override
                public void onStop() {
                    stopStreaming();
                    stopSelf();
                }
            }
        );

        rtmpDisplay.setIntentResult(resultCode, data);

        boolean prepared = rtmpDisplay.prepareVideo(
            width, height, 30, 2000000, 0, dpi
        );

        if (!prepared) {
            throw new RuntimeException("Video encoder preparation failed");
        }

        boolean audioPrepared = rtmpDisplay.prepareAudio();
        if (!audioPrepared) {
            throw new RuntimeException("Microphone audio preparation failed");
        }

        rtmpDisplay.startStream(url);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "PORAN LIVE Screen Broadcast",
                NotificationManager.IMPORTANCE_LOW
            );

            NotificationManager manager =
                getSystemService(NotificationManager.class);

            manager.createNotificationChannel(channel);
        }
    }

    private void startLiveNotification() {

        Notification.Builder builder;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        Notification notification = builder
            .setContentTitle("PORAN LIVE")
            .setContentText("Screen broadcast is running")
            .setSmallIcon(android.R.drawable.presence_video_online)
            .setOngoing(true)
            .build();

        if (Build.VERSION.SDK_INT >= 30) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
                    | ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            );
        } else if (Build.VERSION.SDK_INT >= 29) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void stopStreaming() {
        if (rtmpDisplay != null) {
            try {
                rtmpDisplay.stopStream();
            } catch (Exception ignored) {
            }

            rtmpDisplay = null;
        }
    }

    private void sendStatus(String status, String reason) {
        Intent intent = new Intent("com.poran.live.STREAM_STATUS");
        intent.setPackage(getPackageName());
        intent.putExtra("status", status);
        if (reason != null) intent.putExtra("reason", reason);
        sendBroadcast(intent);
    }

    @Override
    public void onConnectionStarted(String url) {
        sendStatus("CONNECTING", null);
        android.util.Log.d("PORAN_LIVE", "Connecting");
    }

    @Override
    public void onConnectionSuccess() {
        sendStatus("CONNECTED", null);
        android.util.Log.d("PORAN_LIVE", "Connected");
    }

    @Override
    public void onConnectionFailed(String reason) {
        sendStatus("FAILED", reason);
        android.util.Log.e("PORAN_LIVE", reason);
        stopStreaming();
        stopSelf();
    }

    @Override
    public void onDisconnect() {
        sendStatus("DISCONNECTED", null);
        android.util.Log.d("PORAN_LIVE", "Disconnected");
    }

    @Override
    public void onAuthError() {
        sendStatus("AUTH_FAILED", "Facebook authentication failed");
        android.util.Log.e("PORAN_LIVE", "Authentication failed");
    }

    @Override
    public void onAuthSuccess() {
        android.util.Log.d("PORAN_LIVE", "Authentication successful");
    }

    @Override
    public void onNewBitrate(long bitrate) {
        android.util.Log.d("PORAN_LIVE", "Bitrate: " + bitrate);
    }

    @Override
    public void onStreamingStats(StreamingStatsReport report) {
    }

    @Override
    public void onDestroy() {
        stopStreaming();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

