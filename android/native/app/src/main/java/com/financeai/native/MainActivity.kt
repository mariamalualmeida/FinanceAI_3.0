package com.financeai.native

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.room.Room
import com.financeai.native.analysis.AdvancedFinancialAnalyzer
import com.financeai.native.database.FinanceAIDatabase
import com.financeai.native.llm.LLMOrchestrator
import com.financeai.native.ocr.AdvancedOCRProcessor
import com.financeai.native.ui.NativeFinanceAIActivity
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {
    
    private lateinit var database: FinanceAIDatabase
    private lateinit var analyzer: AdvancedFinancialAnalyzer
    private lateinit var ocrProcessor: AdvancedOCRProcessor
    private lateinit var llmOrchestrator: LLMOrchestrator
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        initializeNativeComponents()
        startNativeFinanceAI()
    }
    
    private fun initializeNativeComponents() {
        // Initialize native SQLite database
        database = Room.databaseBuilder(
            applicationContext,
            FinanceAIDatabase::class.java,
            "financeai_native_db"
        ).build()
        
        // Initialize components
        ocrProcessor = AdvancedOCRProcessor(this)
        llmOrchestrator = LLMOrchestrator()
        analyzer = AdvancedFinancialAnalyzer(database, ocrProcessor, llmOrchestrator, this)
    }
    
    private fun startNativeFinanceAI() {
        val intent = Intent(this, NativeFinanceAIActivity::class.java)
        startActivity(intent)
        finish()
    }
}