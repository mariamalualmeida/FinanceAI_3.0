package com.financeai.native.database.entities

import androidx.room.*

@Entity(
    tableName = "transactions",
    foreignKeys = [
        ForeignKey(
            entity = AnalysisResult::class,
            parentColumns = ["id"],
            childColumns = ["analysis_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["analysis_id"]),
        Index(value = ["date"]),
        Index(value = ["type"]),
        Index(value = ["category"])
    ]
)
data class TransactionEntity(
    @PrimaryKey
    val id: String,
    
    @ColumnInfo(name = "analysis_id")
    val analysisId: String,
    
    @ColumnInfo(name = "date")
    val date: Long,
    
    @ColumnInfo(name = "description")
    val description: String,
    
    @ColumnInfo(name = "amount")
    val amount: Double,
    
    @ColumnInfo(name = "type")
    val type: String, // "credit" or "debit"
    
    @ColumnInfo(name = "category")
    val category: String,
    
    @ColumnInfo(name = "subcategory")
    val subcategory: String?,
    
    @ColumnInfo(name = "is_suspicious")
    val isSuspicious: Boolean = false,
    
    @ColumnInfo(name = "is_recurring")
    val isRecurring: Boolean = false,
    
    @ColumnInfo(name = "risk_score")
    val riskScore: Double = 0.0,
    
    @ColumnInfo(name = "confidence")
    val confidence: Double = 1.0,
    
    @ColumnInfo(name = "metadata")
    val metadata: String = "{}", // JSON string for additional data
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)