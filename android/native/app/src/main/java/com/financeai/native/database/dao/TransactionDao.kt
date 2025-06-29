package com.financeai.native.database.dao

import androidx.room.*
import com.financeai.native.database.entities.TransactionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    
    @Query("SELECT * FROM transactions WHERE analysis_id = :analysisId ORDER BY date DESC")
    suspend fun getTransactionsByAnalysisId(analysisId: String): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE analysis_id = :analysisId ORDER BY date DESC")
    fun getTransactionsByAnalysisIdFlow(analysisId: String): Flow<List<TransactionEntity>>
    
    @Query("SELECT * FROM transactions WHERE id = :id")
    suspend fun getTransactionById(id: String): TransactionEntity?
    
    @Query("SELECT * FROM transactions WHERE type = :type AND analysis_id = :analysisId ORDER BY amount DESC")
    suspend fun getTransactionsByType(analysisId: String, type: String): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE category = :category AND analysis_id = :analysisId")
    suspend fun getTransactionsByCategory(analysisId: String, category: String): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE is_suspicious = 1 AND analysis_id = :analysisId")
    suspend fun getSuspiciousTransactions(analysisId: String): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE is_recurring = 1 AND analysis_id = :analysisId")
    suspend fun getRecurringTransactions(analysisId: String): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE amount >= :minAmount AND analysis_id = :analysisId ORDER BY amount DESC")
    suspend fun getHighValueTransactions(analysisId: String, minAmount: Double): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE risk_score >= :minRiskScore AND analysis_id = :analysisId ORDER BY risk_score DESC")
    suspend fun getHighRiskTransactions(analysisId: String, minRiskScore: Double): List<TransactionEntity>
    
    @Query("SELECT * FROM transactions WHERE date BETWEEN :startDate AND :endDate AND analysis_id = :analysisId ORDER BY date")
    suspend fun getTransactionsByDateRange(analysisId: String, startDate: Long, endDate: Long): List<TransactionEntity>
    
    @Query("SELECT SUM(amount) FROM transactions WHERE type = 'credit' AND analysis_id = :analysisId")
    suspend fun getTotalIncome(analysisId: String): Double?
    
    @Query("SELECT SUM(ABS(amount)) FROM transactions WHERE type = 'debit' AND analysis_id = :analysisId")
    suspend fun getTotalExpenses(analysisId: String): Double?
    
    @Query("SELECT category, SUM(ABS(amount)) as total FROM transactions WHERE type = 'debit' AND analysis_id = :analysisId GROUP BY category ORDER BY total DESC")
    suspend fun getExpensesByCategory(analysisId: String): List<CategoryExpense>
    
    @Query("SELECT category, COUNT(*) as count FROM transactions WHERE analysis_id = :analysisId GROUP BY category")
    suspend fun getTransactionCountByCategory(analysisId: String): List<CategoryCount>
    
    @Query("SELECT COUNT(*) FROM transactions WHERE is_suspicious = 1 AND analysis_id = :analysisId")
    suspend fun getSuspiciousTransactionCount(analysisId: String): Int
    
    @Query("SELECT AVG(risk_score) FROM transactions WHERE analysis_id = :analysisId")
    suspend fun getAverageRiskScore(analysisId: String): Double?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(transaction: TransactionEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(transactions: List<TransactionEntity>)
    
    @Update
    suspend fun update(transaction: TransactionEntity)
    
    @Delete
    suspend fun delete(transaction: TransactionEntity)
    
    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteById(id: String)
    
    @Query("DELETE FROM transactions WHERE analysis_id = :analysisId")
    suspend fun deleteByAnalysisId(analysisId: String)
    
    @Query("DELETE FROM transactions")
    suspend fun deleteAll()
    
    // Advanced analytics
    @Query("""
        SELECT 
            strftime('%Y-%m', datetime(date/1000, 'unixepoch')) as month,
            SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'debit' THEN ABS(amount) ELSE 0 END) as expenses
        FROM transactions 
        WHERE analysis_id = :analysisId 
        GROUP BY month 
        ORDER BY month
    """)
    suspend fun getMonthlyTrends(analysisId: String): List<MonthlyTrend>
    
    @Query("""
        SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(ABS(amount)) as total_amount,
            AVG(ABS(amount)) as avg_amount,
            SUM(CASE WHEN is_suspicious = 1 THEN 1 ELSE 0 END) as suspicious_count
        FROM transactions 
        WHERE analysis_id = :analysisId 
        GROUP BY category
        ORDER BY total_amount DESC
    """)
    suspend fun getCategoryAnalytics(analysisId: String): List<CategoryAnalytics>
}

data class CategoryExpense(
    val category: String,
    val total: Double
)

data class CategoryCount(
    val category: String,
    val count: Int
)

data class MonthlyTrend(
    val month: String,
    val income: Double,
    val expenses: Double
)

data class CategoryAnalytics(
    val category: String,
    val transactionCount: Int,
    val totalAmount: Double,
    val avgAmount: Double,
    val suspiciousCount: Int
)