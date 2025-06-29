package com.financeai.native.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "analysis_results")
data class AnalysisResult(
    @PrimaryKey
    val id: String,
    
    @ColumnInfo(name = "document_path")
    val documentPath: String,
    
    @ColumnInfo(name = "extracted_text")
    val extractedText: String,
    
    @ColumnInfo(name = "credit_score")
    val creditScore: Int,
    
    @ColumnInfo(name = "risk_level")
    val riskLevel: String,
    
    @ColumnInfo(name = "total_income")
    val totalIncome: Double,
    
    @ColumnInfo(name = "total_expenses")
    val totalExpenses: Double,
    
    @ColumnInfo(name = "balance")
    val balance: Double,
    
    @ColumnInfo(name = "transaction_count")
    val transactionCount: Int,
    
    @ColumnInfo(name = "suspicious_transactions")
    val suspiciousTransactions: Int,
    
    @ColumnInfo(name = "recommendations")
    val recommendations: String,
    
    @ColumnInfo(name = "patterns")
    val patterns: String,
    
    @ColumnInfo(name = "income_stability")
    val incomeStability: Double = 0.0,
    
    @ColumnInfo(name = "expense_volatility")
    val expenseVolatility: Double = 0.0,
    
    @ColumnInfo(name = "debt_service_ratio")
    val debtServiceRatio: Double = 0.0,
    
    @ColumnInfo(name = "cash_flow_volatility")
    val cashFlowVolatility: Double = 0.0,
    
    @ColumnInfo(name = "diversification_index")
    val diversificationIndex: Double = 0.0,
    
    @ColumnInfo(name = "temporal_analysis")
    val temporalAnalysis: String = "",
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long,
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)