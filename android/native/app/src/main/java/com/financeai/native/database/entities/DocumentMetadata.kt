package com.financeai.native.database.entities

import androidx.room.*

@Entity(tableName = "document_metadata")
data class DocumentMetadata(
    @PrimaryKey
    val id: String,
    
    @ColumnInfo(name = "file_name")
    val fileName: String,
    
    @ColumnInfo(name = "file_path")
    val filePath: String,
    
    @ColumnInfo(name = "file_type")
    val fileType: String, // pdf, excel, image, etc.
    
    @ColumnInfo(name = "file_size")
    val fileSize: Long,
    
    @ColumnInfo(name = "mime_type")
    val mimeType: String,
    
    @ColumnInfo(name = "extraction_method")
    val extractionMethod: String, // tesseract, mlkit, pdf_parser, etc.
    
    @ColumnInfo(name = "extraction_confidence")
    val extractionConfidence: Double,
    
    @ColumnInfo(name = "processing_time_ms")
    val processingTimeMs: Long,
    
    @ColumnInfo(name = "page_count")
    val pageCount: Int = 1,
    
    @ColumnInfo(name = "character_count")
    val characterCount: Int = 0,
    
    @ColumnInfo(name = "word_count")
    val wordCount: Int = 0,
    
    @ColumnInfo(name = "language_detected")
    val languageDetected: String = "pt-BR",
    
    @ColumnInfo(name = "analysis_id")
    val analysisId: String?,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "user_settings")
data class UserSettings(
    @PrimaryKey
    val id: String = "default",
    
    @ColumnInfo(name = "llm_provider")
    val llmProvider: String = "openai",
    
    @ColumnInfo(name = "openai_api_key")
    val openaiApiKey: String = "",
    
    @ColumnInfo(name = "anthropic_api_key")
    val anthropicApiKey: String = "",
    
    @ColumnInfo(name = "google_api_key")
    val googleApiKey: String = "",
    
    @ColumnInfo(name = "xai_api_key")
    val xaiApiKey: String = "",
    
    @ColumnInfo(name = "extraction_strategy")
    val extractionStrategy: String = "auto",
    
    @ColumnInfo(name = "auto_analyze")
    val autoAnalyze: Boolean = true,
    
    @ColumnInfo(name = "theme")
    val theme: String = "system",
    
    @ColumnInfo(name = "language")
    val language: String = "pt-BR",
    
    @ColumnInfo(name = "cache_enabled")
    val cacheEnabled: Boolean = true,
    
    @ColumnInfo(name = "offline_mode")
    val offlineMode: Boolean = false,
    
    @ColumnInfo(name = "notification_enabled")
    val notificationEnabled: Boolean = true,
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "cache_entries")
data class CacheEntry(
    @PrimaryKey
    val id: String,
    
    @ColumnInfo(name = "cache_key")
    val cacheKey: String,
    
    @ColumnInfo(name = "cache_value")
    val cacheValue: String,
    
    @ColumnInfo(name = "expiry_time")
    val expiryTime: Long,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "suspicious_patterns",
    foreignKeys = [
        ForeignKey(
            entity = AnalysisResult::class,
            parentColumns = ["id"],
            childColumns = ["analysis_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["analysis_id"])]
)
data class SuspiciousPattern(
    @PrimaryKey
    val id: String,
    
    @ColumnInfo(name = "analysis_id")
    val analysisId: String,
    
    @ColumnInfo(name = "pattern_type")
    val patternType: String, // gambling, money_laundering, fraud, etc.
    
    @ColumnInfo(name = "confidence")
    val confidence: Double,
    
    @ColumnInfo(name = "description")
    val description: String,
    
    @ColumnInfo(name = "risk_level")
    val riskLevel: String, // low, medium, high, critical
    
    @ColumnInfo(name = "detected_at")
    val detectedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "recommendations",
    foreignKeys = [
        ForeignKey(
            entity = AnalysisResult::class,
            parentColumns = ["id"],
            childColumns = ["analysis_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["analysis_id"])]
)
data class RecommendationEntity(
    @PrimaryKey
    val id: String,
    
    @ColumnInfo(name = "analysis_id")
    val analysisId: String,
    
    @ColumnInfo(name = "type")
    val type: String, // credit_improvement, expense_reduction, income_increase, etc.
    
    @ColumnInfo(name = "category")
    val category: String, // financial, risk, budgeting, etc.
    
    @ColumnInfo(name = "priority")
    val priority: String, // low, medium, high, urgent
    
    @ColumnInfo(name = "title")
    val title: String,
    
    @ColumnInfo(name = "description")
    val description: String,
    
    @ColumnInfo(name = "action_items")
    val actionItems: String, // JSON array of action items
    
    @ColumnInfo(name = "estimated_impact")
    val estimatedImpact: String?,
    
    @ColumnInfo(name = "timeline")
    val timeline: String?,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)