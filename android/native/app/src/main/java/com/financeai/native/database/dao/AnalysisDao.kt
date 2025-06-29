package com.financeai.native.database.dao

import androidx.room.*
import com.financeai.native.database.entities.AnalysisResult
import kotlinx.coroutines.flow.Flow

@Dao
interface AnalysisDao {
    
    @Query("SELECT * FROM analysis_results ORDER BY created_at DESC")
    fun getAllAnalyses(): Flow<List<AnalysisResult>>
    
    @Query("SELECT * FROM analysis_results WHERE id = :id")
    suspend fun getAnalysisById(id: String): AnalysisResult?
    
    @Query("SELECT * FROM analysis_results WHERE risk_level = :riskLevel ORDER BY created_at DESC")
    suspend fun getAnalysesByRiskLevel(riskLevel: String): List<AnalysisResult>
    
    @Query("SELECT * FROM analysis_results WHERE credit_score BETWEEN :minScore AND :maxScore ORDER BY credit_score DESC")
    suspend fun getAnalysesByScoreRange(minScore: Int, maxScore: Int): List<AnalysisResult>
    
    @Query("SELECT * FROM analysis_results WHERE created_at >= :startDate ORDER BY created_at DESC")
    suspend fun getAnalysesAfterDate(startDate: Long): List<AnalysisResult>
    
    @Query("SELECT AVG(credit_score) FROM analysis_results WHERE created_at >= :startDate")
    suspend fun getAverageCreditScore(startDate: Long): Double?
    
    @Query("SELECT COUNT(*) FROM analysis_results WHERE suspicious_transactions > 0")
    suspend fun getSuspiciousAnalysesCount(): Int
    
    @Query("SELECT * FROM analysis_results WHERE total_income > :minIncome ORDER BY total_income DESC")
    suspend fun getHighIncomeAnalyses(minIncome: Double): List<AnalysisResult>
    
    @Query("SELECT * FROM analysis_results WHERE balance < 0 ORDER BY balance ASC")
    suspend fun getNegativeBalanceAnalyses(): List<AnalysisResult>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(analysis: AnalysisResult): Long
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(analyses: List<AnalysisResult>)
    
    @Update
    suspend fun update(analysis: AnalysisResult)
    
    @Delete
    suspend fun delete(analysis: AnalysisResult)
    
    @Query("DELETE FROM analysis_results WHERE id = :id")
    suspend fun deleteById(id: String)
    
    @Query("DELETE FROM analysis_results WHERE created_at < :cutoffDate")
    suspend fun deleteOldAnalyses(cutoffDate: Long)
    
    @Query("DELETE FROM analysis_results")
    suspend fun deleteAll()
    
    // Analytics queries
    @Query("""
        SELECT 
            COUNT(*) as total_count,
            AVG(credit_score) as avg_score,
            SUM(total_income) as total_income,
            SUM(total_expenses) as total_expenses,
            SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) as positive_balance_count
        FROM analysis_results 
        WHERE created_at >= :startDate
    """)
    suspend fun getAnalyticsStats(startDate: Long): AnalyticsStats
    
    @Query("""
        SELECT risk_level, COUNT(*) as count 
        FROM analysis_results 
        WHERE created_at >= :startDate 
        GROUP BY risk_level
    """)
    suspend fun getRiskDistribution(startDate: Long): List<RiskDistribution>
}

data class AnalyticsStats(
    val totalCount: Int,
    val avgScore: Double,
    val totalIncome: Double,
    val totalExpenses: Double,
    val positiveBalanceCount: Int
)

data class RiskDistribution(
    val riskLevel: String,
    val count: Int
)