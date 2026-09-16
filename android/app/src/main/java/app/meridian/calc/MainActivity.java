package app.meridian.calc;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
  private WebView web;

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Window window = getWindow();
    window.setStatusBarColor(Color.parseColor("#090a0d"));
    window.setNavigationBarColor(Color.parseColor("#090a0d"));

    web = new WebView(this);
    web.setBackgroundColor(Color.parseColor("#090a0d"));
    setContentView(web);

    WebViewAssetLoader loader =
        new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

    web.setWebViewClient(
        new WebViewClient() {
          @Override
          public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            return loader.shouldInterceptRequest(req.getUrl());
          }
        });
    web.setWebChromeClient(new WebChromeClient());

    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);
    settings.setUseWideViewPort(true);
    settings.setLoadWithOverviewMode(true);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
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
