package site.lxwis.brat;

import android.content.ContentValues;
import android.content.ContentResolver;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "BratGallery")
public class BratGalleryPlugin extends Plugin {
    @PluginMethod
    public void saveImage(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Direct gallery saving requires Android 10 or newer");
            return;
        }
        String data = call.getString("data");
        String mime = call.getString("mimeType", "image/png");
        String name = call.getString("fileName", "brat.png");
        if (data == null || !(mime.equals("image/png") || mime.equals("image/jpeg") || mime.equals("image/webp"))) {
            call.reject("Invalid image data or format");
            return;
        }
        Uri uri = null;
        ContentResolver resolver = getContext().getContentResolver();
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
            values.put(MediaStore.Images.Media.MIME_TYPE, mime);
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/BRAT");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
            uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new Exception("Could not create gallery image");
            try (OutputStream stream = resolver.openOutputStream(uri)) {
                if (stream == null) throw new Exception("Could not write gallery image");
                stream.write(bytes);
            }
            ContentValues done = new ContentValues();
            done.put(MediaStore.Images.Media.IS_PENDING, 0);
            resolver.update(uri, done, null, null);
            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception error) {
            if (uri != null) resolver.delete(uri, null, null);
            call.reject("Could not save image: " + error.getMessage());
        }
    }
}
