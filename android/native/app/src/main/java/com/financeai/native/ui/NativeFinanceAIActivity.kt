package com.financeai.native.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.DocumentsContract
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.room.Room
import com.financeai.native.R
import com.financeai.native.analysis.AdvancedFinancialAnalyzer
import com.financeai.native.database.FinanceAIDatabase
import com.financeai.native.database.entities.AnalysisResult
import com.financeai.native.llm.LLMOrchestrator
import com.financeai.native.llm.ProcessingStrategy
import com.financeai.native.ocr.AdvancedOCRProcessor
import com.financeai.native.ui.adapters.AnalysisHistoryAdapter
import com.financeai.native.ui.adapters.RecentAnalysisAdapter
import com.financeai.native.utils.FileUtils
import com.financeai.native.utils.LoggingUtils
import com.financeai.native.utils.PerformanceUtils
import com.financeai.native.utils.SecurityUtils
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.progressindicator.CircularProgressIndicator
import com.google.android.material.textview.MaterialTextView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

class NativeFinanceAIActivity : AppCompatActivity() {
    
    private lateinit var database: FinanceAIDatabase
    private lateinit var analyzer: AdvancedFinancialAnalyzer
    private lateinit var ocrProcessor: AdvancedOCRProcessor
    private lateinit var llmOrchestrator: LLMOrchestrator
    
    // UI Components
    private lateinit var fabUpload: FloatingActionButton
    private lateinit var progressIndicator: CircularProgressIndicator
    private lateinit var tvWelcome: MaterialTextView
    private lateinit var tvStats: MaterialTextView
    private lateinit var cardQuickStats: MaterialCardView
    private lateinit var btnSettings: MaterialButton
    private lateinit var btnHistory: MaterialButton
    private lateinit var btnReports: MaterialButton
    private lateinit var rvRecentAnalyses: RecyclerView
    
    private lateinit var recentAnalysisAdapter: RecentAnalysisAdapter
    private var isProcessing = false
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
        private const val TAG = "NativeFinanceAI"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_native_finance_ai)
        
        initializeComponents()
        setupUI()
        setupClickListeners()
        checkPermissions()
        loadRecentAnalyses()
        updateQuickStats()
    }
    
    private fun initializeComponents() {
        // Initialize database
        database = Room.databaseBuilder(
            applicationContext,
            FinanceAIDatabase::class.java,
            FinanceAIDatabase.DATABASE_NAME
        )
        .addMigrations(FinanceAIDatabase.MIGRATION_1_2)
        .build()
        
        // Initialize processors
        ocrProcessor = AdvancedOCRProcessor(this)
        llmOrchestrator = LLMOrchestrator()
        analyzer = AdvancedFinancialAnalyzer(database, ocrProcessor, llmOrchestrator, this)
        
        // Load user settings and initialize LLM providers
        loadUserSettings()
        
        LoggingUtils.logInfo("Native FinanceAI components initialized", TAG)
    }
    
    private fun setupUI() {
        // Find views
        fabUpload = findViewById(R.id.fab_upload)
        progressIndicator = findViewById(R.id.progress_indicator)
        tvWelcome = findViewById(R.id.tv_welcome)
        tvStats = findViewById(R.id.tv_stats)
        cardQuickStats = findViewById(R.id.card_quick_stats)
        btnSettings = findViewById(R.id.btn_settings)
        btnHistory = findViewById(R.id.btn_history)
        btnReports = findViewById(R.id.btn_reports)
        rvRecentAnalyses = findViewById(R.id.rv_recent_analyses)
        
        // Setup RecyclerView
        recentAnalysisAdapter = RecentAnalysisAdapter { analysis ->
            openAnalysisDetails(analysis)
        }
        
        rvRecentAnalyses.apply {
            layoutManager = LinearLayoutManager(this@NativeFinanceAIActivity)
            adapter = recentAnalysisAdapter
        }
        
        // Set welcome message
        tvWelcome.text = "Bem-vindo ao FinanceAI\nAnálise Financeira Inteligente"
        
        // Hide progress initially
        progressIndicator.hide()
    }
    
    private fun setupClickListeners() {
        fabUpload.setOnClickListener {
            if (!isProcessing) {
                openDocumentPicker()
            } else {
                Toast.makeText(this, "Processamento em andamento...", Toast.LENGTH_SHORT).show()
            }
        }
        
        btnSettings.setOnClickListener {
            openSettings()
        }
        
        btnHistory.setOnClickListener {
            openAnalysisHistory()
        }
        
        btnReports.setOnClickListener {
            openReports()
        }
        
        cardQuickStats.setOnClickListener {
            openDetailedStats()
        }
    }
    
    private fun loadUserSettings() {
        lifecycleScope.launch {
            try {
                val settings = database.userSettingsDao().getUserSettings()
                if (settings != null) {
                    llmOrchestrator.initializeProviders(
                        openaiKey = settings.openaiApiKey,
                        anthropicKey = settings.anthropicApiKey,
                        googleKey = settings.googleApiKey,
                        xaiKey = settings.xaiApiKey,
                        primaryProvider = settings.llmProvider
                    )
                    LoggingUtils.logInfo("User settings loaded successfully", TAG)
                } else {
                    LoggingUtils.logWarning("No user settings found, using defaults", tag = TAG)
                }
            } catch (e: Exception) {
                LoggingUtils.logError("Failed to load user settings", e, TAG)
            }
        }
    }
    
    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }
    
    private fun openDocumentPicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
                "image/jpeg",
                "image/png",
                "image/bmp"
            ))
        }
        
        documentPickerLauncher.launch(intent)
    }
    
    private val documentPickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.data?.let { uri ->
                processDocument(uri)
            }
        }
    }
    
    private fun processDocument(uri: Uri) {
        if (isProcessing) {
            Toast.makeText(this, "Já há um processamento em andamento", Toast.LENGTH_SHORT).show()
            return
        }
        
        isProcessing = true
        showProcessingUI(true)
        
        lifecycleScope.launch {
            try {
                val (result, executionTime) = PerformanceUtils.measureSuspendExecutionTime {
                    processDocumentInternal(uri)
                }
                
                LoggingUtils.logPerformance("Document analysis", executionTime, TAG)
                LoggingUtils.logAnalysisResult(result.id, result.creditScore, result.riskLevel, TAG)
                
                withContext(Dispatchers.Main) {
                    showProcessingUI(false)
                    showAnalysisResult(result)
                    loadRecentAnalyses()
                    updateQuickStats()
                }
                
            } catch (e: Exception) {
                LoggingUtils.logError("Document processing failed", e, TAG)
                
                withContext(Dispatchers.Main) {
                    showProcessingUI(false)
                    showError("Erro na análise: ${e.message}")
                }
            }
            
            isProcessing = false
        }
    }
    
    private suspend fun processDocumentInternal(uri: Uri): AnalysisResult = withContext(Dispatchers.IO) {
        // Copy URI to temporary file
        val tempFile = copyUriToTempFile(uri)
        
        try {
            // Validate file
            if (!FileUtils.validateFileIntegrity(tempFile)) {
                throw IllegalArgumentException("Arquivo inválido ou corrompido")
            }
            
            if (!FileUtils.isFileSizeValid(tempFile, 10)) {
                throw IllegalArgumentException("Arquivo muito grande (máximo 10MB)")
            }
            
            // Perform analysis
            analyzer.analyzeDocument(tempFile)
            
        } finally {
            // Cleanup temporary file
            tempFile.delete()
        }
    }
    
    private suspend fun copyUriToTempFile(uri: Uri): File = withContext(Dispatchers.IO) {
        val inputStream = contentResolver.openInputStream(uri)
            ?: throw IllegalArgumentException("Não foi possível abrir o arquivo")
        
        val fileName = getFileName(uri) ?: "document_${System.currentTimeMillis()}"
        val tempFile = File(cacheDir, SecurityUtils.sanitizeInput(fileName))
        
        inputStream.use { input ->
            FileOutputStream(tempFile).use { output ->
                input.copyTo(output)
            }
        }
        
        tempFile
    }
    
    private fun getFileName(uri: Uri): String? {
        return contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
            if (nameIndex >= 0 && cursor.moveToFirst()) {
                cursor.getString(nameIndex)
            } else {
                null
            }
        }
    }
    
    private fun showProcessingUI(show: Boolean) {
        if (show) {
            progressIndicator.show()
            fabUpload.hide()
            tvStats.text = "Processando documento..."
        } else {
            progressIndicator.hide()
            fabUpload.show()
        }
    }
    
    private fun showAnalysisResult(result: AnalysisResult) {
        val intent = Intent(this, AnalysisResultActivity::class.java).apply {
            putExtra("analysis_id", result.id)
        }
        startActivity(intent)
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
    
    private fun loadRecentAnalyses() {
        lifecycleScope.launch {
            try {
                val recentAnalyses = database.analysisDao().getAllAnalyses()
                recentAnalyses.collect { analyses ->
                    recentAnalysisAdapter.submitList(analyses.take(5))
                }
            } catch (e: Exception) {
                LoggingUtils.logError("Failed to load recent analyses", e, TAG)
            }
        }
    }
    
    private fun updateQuickStats() {
        lifecycleScope.launch {
            try {
                val stats = database.analysisDao().getAnalyticsStats(
                    System.currentTimeMillis() - (30 * 24 * 60 * 60 * 1000L) // Last 30 days
                )
                
                withContext(Dispatchers.Main) {
                    tvStats.text = buildString {
                        append("📊 Análises: ${stats.totalCount}\n")
                        append("⭐ Score Médio: ${String.format("%.0f", stats.avgScore)}\n")
                        append("💰 Renda Total: R$ ${String.format("%,.2f", stats.totalIncome)}\n")
                        append("💸 Gastos Totais: R$ ${String.format("%,.2f", stats.totalExpenses)}")
                    }
                }
                
            } catch (e: Exception) {
                LoggingUtils.logError("Failed to update stats", e, TAG)
            }
        }
    }
    
    private fun openSettings() {
        val intent = Intent(this, SettingsActivity::class.java)
        startActivity(intent)
    }
    
    private fun openAnalysisHistory() {
        val intent = Intent(this, AnalysisHistoryActivity::class.java)
        startActivity(intent)
    }
    
    private fun openReports() {
        val intent = Intent(this, ReportsActivity::class.java)
        startActivity(intent)
    }
    
    private fun openDetailedStats() {
        val intent = Intent(this, StatisticsActivity::class.java)
        startActivity(intent)
    }
    
    private fun openAnalysisDetails(analysis: AnalysisResult) {
        val intent = Intent(this, AnalysisResultActivity::class.java).apply {
            putExtra("analysis_id", analysis.id)
        }
        startActivity(intent)
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allPermissionsGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            
            if (!allPermissionsGranted) {
                Toast.makeText(
                    this,
                    "Permissões necessárias para acessar arquivos",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        loadRecentAnalyses()
        updateQuickStats()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Cleanup temporary files
        FileUtils.cleanupTempFiles(cacheDir)
        
        LoggingUtils.logInfo("Native FinanceAI activity destroyed", TAG)
    }
}