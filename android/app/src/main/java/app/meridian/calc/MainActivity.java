package app.meridian.calc;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
  private static final String ASSET_HOST = "appassets.androidplatform.net";
  private static final String ASSET_PREFIX = "/assets/";
  private WebView web;

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.parseColor("#090a0d"));
    getWindow().setNavigationBarColor(Color.parseColor("#090a0d"));

    web = new WebView(this);
    web.setBackgroundColor(Color.parseColor("#090a0d"));
    setContentView(web);

    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);
    settings.setUseWideViewPort(true);
    settings.setLoadWithOverviewMode(true);
    settings.setSupportMultipleWindows(true);
    settings.setJavaScriptCanOpenWindowsAutomatically(true);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setMediaPlaybackRequiresUserGesture(false);
    web.addJavascriptInterface(new NativeBridge(), "MeridianNative");

    web.setWebViewClient(
        new WebViewClient() {
          @Override
          public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri url = req.getUrl();
            if (ASSET_HOST.equals(url.getHost())) {
              return loadAsset(url);
            }
            return null;
          }

          @Override
          public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            return openExternal(req.getUrl());
          }
        });

    web.setWebChromeClient(
        new WebChromeClient() {
          @Override
          public boolean onCreateWindow(
              WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView dummy = new WebView(view.getContext());
            dummy.setWebViewClient(
                new WebViewClient() {
                  @Override
                  public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                    openExternal(req.getUrl());
                    return true;
                  }
                });
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(dummy);
            resultMsg.sendToTarget();
            return true;
          }
        });

    web.loadUrl("https://" + ASSET_HOST + "/assets/www/index.html");
  }

  private class NativeBridge {
    @JavascriptInterface
    public void openUrl(String url) {
      if (url == null) return;
      runOnUiThread(() -> openExternal(Uri.parse(url)));
    }
  }

  private boolean openExternal(Uri url) {
    if (url == null) return false;
    String host = url.getHost();
    if (ASSET_HOST.equals(host)) return false;
    String scheme = url.getScheme();
    if (!"http".equals(scheme) && !"https".equals(scheme) && !"mailto".equals(scheme)) {
      return true;
    }
    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, url);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      startActivity(intent);
    } catch (Exception ignored) {
    }
    return true;
  }

  private WebResourceResponse loadAsset(Uri url) {
    String path = url.getPath();
    if (path == null || !path.startsWith(ASSET_PREFIX)) {
      return notFound();
    }
    String assetPath = path.substring(ASSET_PREFIX.length());
    if (assetPath.isEmpty() || assetPath.endsWith("/")) {
      assetPath = assetPath + "index.html";
    }
    try {
      InputStream stream = getAssets().open(assetPath);
      String mime = mimeFrom(assetPath);
      Map<String, String> headers = new HashMap<>();
      headers.put("Access-Control-Allow-Origin", "*");
      headers.put("Cache-Control", "public, max-age=60");
      headers.put("Content-Type", mime + "; charset=utf-8");
      return new WebResourceResponse(mime, "utf-8", 200, "OK", headers, stream);
    } catch (IOException e) {
      return notFound();
    }
  }

  private static WebResourceResponse notFound() {
    Map<String, String> headers = new HashMap<>();
    headers.put("Access-Control-Allow-Origin", "*");
    return new WebResourceResponse(
        "text/plain", "utf-8", 404, "Not Found", headers, new java.io.ByteArrayInputStream(new byte[0]));
  }

  private static String mimeFrom(String path) {
    String lower = path.toLowerCase();
    if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
    if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript";
    if (lower.endsWith(".css")) return "text/css";
    if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".woff2")) return "font/woff2";
    if (lower.endsWith(".woff")) return "font/woff";
    if (lower.endsWith(".ttf")) return "font/ttf";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
  }

  @Override
  public void onBackPressed() {
    if (web != null && web.canGoBack()) {
      web.goBack();
      return;
    }
    super.onBackPressed();
  }
}
