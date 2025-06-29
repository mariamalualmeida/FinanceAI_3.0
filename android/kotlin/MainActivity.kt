package com.financeai.app

import android.Manifest
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.DocumentsContract
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val FILECHOOSER_RESULTCODE = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupWebView()
        setupFileUploadHandling()
        
        // Load the PWA
        webView.loadUrl("http://localhost:5000")
    }

    private fun setupWebView() {
        webView = findViewById(R.id.webview)
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            
            // Enhanced settings for financial app
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            
            // Security settings
            setSavePassword(false)
            setSaveFormData(false)
        }

        // Add JavaScript interface for native functionality
        webView.addJavascriptInterface(AndroidBridge(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                
                // Handle deep links for financial documents
                if (url.startsWith("financeai://")) {
                    handleDeepLink(url)
                    return true
                }
                
                // Handle external links
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (!url.contains("localhost:5000")) {
                        // Open external links in browser
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    }
                }
                
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                
                // Inject Android-specific CSS and JavaScript
                injectAndroidEnhancements()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                
                // Show offline page if network error
                if (error?.errorCode == WebViewClient.ERROR_CONNECT || 
                    error?.errorCode == WebViewClient.ERROR_TIMEOUT) {
                    loadOfflinePage()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback = filePathCallback
                openFileChooser()
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                android.util.Log.d("WebView", "${consoleMessage?.message()}")
                return true
            }
        }

        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            downloadFile(url, contentDisposition, mimetype)
        }
    }

    private fun setupFileUploadHandling() {
        // Request necessary permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) 
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, 
                arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), 
                PERMISSION_REQUEST_STORAGE)
        }
    }

    private fun openFileChooser() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "text/csv",
                "image/jpeg",
                "image/png",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ))
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }

        try {
            startActivityForResult(Intent.createChooser(intent, "Selecionar Documentos Financeiros"), FILECHOOSER_RESULTCODE)
        } catch (e: Exception) {
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
            Toast.makeText(this, "Erro ao abrir seletor de arquivos", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (fileUploadCallback == null) return

            val results = if (data == null || resultCode != RESULT_OK) {
                null
            } else {
                val dataString = data.dataString
                if (dataString != null) {
                    arrayOf(Uri.parse(dataString))
                } else {
                    // Handle multiple files
                    val clipData = data.clipData
                    if (clipData != null) {
                        val uris = mutableListOf<Uri>()
                        for (i in 0 until clipData.itemCount) {
                            uris.add(clipData.getItemAt(i).uri)
                        }
                        uris.toTypedArray()
                    } else {
                        null
                    }
                }
            }

            fileUploadCallback?.onReceiveValue(results)
            fileUploadCallback = null
        }
    }

    private fun downloadFile(url: String, contentDisposition: String, mimeType: String) {
        val request = DownloadManager.Request(Uri.parse(url)).apply {
            setMimeType(mimeType)
            addRequestHeader("User-Agent", webView.settings.userAgentString)
            setDescription("Download de relatório FinanceAI")
            setTitle("Relatório Financeiro")
            allowScanningByMediaScanner()
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, 
                "FinanceAI_Report_${System.currentTimeMillis()}.pdf")
        }

        val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        downloadManager.enqueue(request)
        
        Toast.makeText(this, "Download iniciado", Toast.LENGTH_SHORT).show()
    }

    private fun handleDeepLink(url: String) {
        // Handle deep links for document analysis
        when {
            url.contains("analyze") -> {
                webView.evaluateJavascript("window.location.href = '/new-analysis';", null)
            }
            url.contains("report") -> {
                val reportId = url.substringAfter("report/")
                webView.evaluateJavascript("window.location.href = '/reports?id=$reportId';", null)
            }
        }
    }

    private fun injectAndroidEnhancements() {
        val androidCSS = """
            javascript:(function() {
                var style = document.createElement('style');
                style.innerHTML = `
                    /* Android-specific optimizations */
                    body { 
                        -webkit-user-select: none; 
                        -webkit-touch-callout: none; 
                    }
                    
                    /* Enhanced touch targets */
                    button, .btn, [role="button"] {
                        min-height: 44px !important;
                        min-width: 44px !important;
                    }
                    
                    /* Better scrolling on Android */
                    .chat-area {
                        -webkit-overflow-scrolling: touch;
                        overflow-scrolling: touch;
                    }
                    
                    /* Android keyboard optimizations */
                    input, textarea {
                        font-size: 16px !important; /* Prevents zoom on iOS */
                    }
                    
                    /* Pull-to-refresh indicator */
                    .ptr-element {
                        position: fixed;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 9999;
                    }
                `;
                document.head.appendChild(style);
                
                // Add Android app identifier
                window.isAndroidApp = true;
                window.appVersion = "2.8.0";
                
                // Enable pull-to-refresh
                enablePullToRefresh();
            })();
        """
        
        webView.evaluateJavascript(androidCSS, null)
    }

    private fun loadOfflinePage() {
        val offlineHtml = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>FinanceAI - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        text-align: center;
                        padding: 40px 20px;
                        background: #f5f5f5;
                    }
                    .container {
                        max-width: 400px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                    }
                    .icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #333;
                        margin-bottom: 16px;
                    }
                    p {
                        color: #666;
                        line-height: 1.5;
                        margin-bottom: 30px;
                    }
                    button {
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 24px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">📱</div>
                    <h1>FinanceAI Offline</h1>
                    <p>Você está offline. As funcionalidades básicas estão disponíveis localmente.</p>
                    <button onclick="location.reload()">Tentar Novamente</button>
                </div>
            </body>
            </html>
        """
        
        webView.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            PERMISSION_REQUEST_STORAGE -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(this, "Permissão concedida", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Permissão necessária para upload de arquivos", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    companion object {
        private const val PERMISSION_REQUEST_STORAGE = 1
    }
}

// JavaScript bridge for native Android functionality
class AndroidBridge(private val context: Context) {
    
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    
    @JavascriptInterface
    fun shareReport(reportContent: String) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, reportContent)
            putExtra(Intent.EXTRA_SUBJECT, "Relatório FinanceAI")
        }
        context.startActivity(Intent.createChooser(intent, "Compartilhar Relatório"))
    }
    
    @JavascriptInterface
    fun saveToDevice(filename: String, content: String) {
        try {
            val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), filename)
            file.writeText(content)
            Toast.makeText(context, "Arquivo salvo em Downloads", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(context, "Erro ao salvar arquivo", Toast.LENGTH_SHORT).show()
        }
    }
    
    @JavascriptInterface
    fun getDeviceInfo(): String {
        return """
        {
            "platform": "android",
            "version": "2.8.0",
            "model": "${android.os.Build.MODEL}",
            "sdk": ${android.os.Build.VERSION.SDK_INT}
        }
        """.trimIndent()
    }
}