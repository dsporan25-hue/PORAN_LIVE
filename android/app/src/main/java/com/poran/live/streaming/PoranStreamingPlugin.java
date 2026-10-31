package com.poran.live.streaming;

import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

@CapacitorPlugin(name = "PoranStreaming")
public class PoranStreamingPlugin extends Plugin {

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
    if (result.getResultCode() != android.app.Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
      JSObject data = new JSObject();
      data.put("cancelled", true);
      call.resolve(data);
      return;
    }
    Uri uri = result.getData().getData();
    try {
      getContext().getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
    } catch (Exception ignored) {}
    JSObject data = new JSObject();
    data.put("cancelled", false);
    data.put("videoUri", uri.toString());
    call.resolve(data);
  }
}
