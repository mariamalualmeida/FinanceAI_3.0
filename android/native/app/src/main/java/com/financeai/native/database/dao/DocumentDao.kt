package com.financeai.native.database.dao

import androidx.room.*
import com.financeai.native.database.entities.DocumentMetadata
import kotlinx.coroutines.flow.Flow

@Dao
interface DocumentDao {
    
    @Query("SELECT * FROM document_metadata ORDER BY created_at DESC")
    fun getAllDocuments(): Flow<List<DocumentMetadata>>
    
    @Query("SELECT * FROM document_metadata WHERE id = :id")
    suspend fun getDocumentById(id: String): DocumentMetadata?
    
    @Query("SELECT * FROM document_metadata WHERE analysis_id = :analysisId")
    suspend fun getDocumentsByAnalysisId(analysisId: String): List<DocumentMetadata>
    
    @Query("SELECT * FROM document_metadata WHERE file_type = :fileType ORDER BY created_at DESC")
    suspend fun getDocumentsByType(fileType: String): List<DocumentMetadata>
    
    @Query("SELECT * FROM document_metadata WHERE extraction_confidence >= :minConfidence ORDER BY extraction_confidence DESC")
    suspend fun getDocumentsByConfidence(minConfidence: Double): List<DocumentMetadata>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(document: DocumentMetadata)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(documents: List<DocumentMetadata>)
    
    @Update
    suspend fun update(document: DocumentMetadata)
    
    @Delete
    suspend fun delete(document: DocumentMetadata)
    
    @Query("DELETE FROM document_metadata WHERE id = :id")
    suspend fun deleteById(id: String)
    
    @Query("DELETE FROM document_metadata")
    suspend fun deleteAll()
}

@Dao
interface UserSettingsDao {
    
    @Query("SELECT * FROM user_settings WHERE id = 'default'")
    suspend fun getUserSettings(): com.financeai.native.database.entities.UserSettings?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(settings: com.financeai.native.database.entities.UserSettings)
    
    @Update
    suspend fun update(settings: com.financeai.native.database.entities.UserSettings)
    
    @Query("UPDATE user_settings SET llm_provider = :provider WHERE id = 'default'")
    suspend fun updateLLMProvider(provider: String)
    
    @Query("UPDATE user_settings SET theme = :theme WHERE id = 'default'")
    suspend fun updateTheme(theme: String)
    
    @Query("UPDATE user_settings SET auto_analyze = :autoAnalyze WHERE id = 'default'")
    suspend fun updateAutoAnalyze(autoAnalyze: Boolean)
}

@Dao
interface CacheDao {
    
    @Query("SELECT * FROM cache_entries WHERE cache_key = :key AND expiry_time > :currentTime")
    suspend fun getCacheEntry(key: String, currentTime: Long): com.financeai.native.database.entities.CacheEntry?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: com.financeai.native.database.entities.CacheEntry)
    
    @Query("DELETE FROM cache_entries WHERE expiry_time < :currentTime")
    suspend fun deleteExpiredEntries(currentTime: Long)
    
    @Query("DELETE FROM cache_entries WHERE cache_key = :key")
    suspend fun deleteCacheEntry(key: String)
    
    @Query("DELETE FROM cache_entries")
    suspend fun deleteAll()
}

@Dao
interface SuspiciousPatternDao {
    
    @Query("SELECT * FROM suspicious_patterns WHERE analysis_id = :analysisId ORDER BY confidence DESC")
    suspend fun getPatternsByAnalysisId(analysisId: String): List<com.financeai.native.database.entities.SuspiciousPattern>
    
    @Query("SELECT * FROM suspicious_patterns WHERE pattern_type = :type ORDER BY detected_at DESC")
    suspend fun getPatternsByType(type: String): List<com.financeai.native.database.entities.SuspiciousPattern>
    
    @Query("SELECT * FROM suspicious_patterns WHERE risk_level = :riskLevel ORDER BY confidence DESC")
    suspend fun getPatternsByRiskLevel(riskLevel: String): List<com.financeai.native.database.entities.SuspiciousPattern>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(pattern: com.financeai.native.database.entities.SuspiciousPattern)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(patterns: List<com.financeai.native.database.entities.SuspiciousPattern>)
    
    @Delete
    suspend fun delete(pattern: com.financeai.native.database.entities.SuspiciousPattern)
    
    @Query("DELETE FROM suspicious_patterns WHERE analysis_id = :analysisId")
    suspend fun deleteByAnalysisId(analysisId: String)
}

@Dao
interface RecommendationDao {
    
    @Query("SELECT * FROM recommendations WHERE analysis_id = :analysisId ORDER BY priority DESC, created_at DESC")
    suspend fun getRecommendationsByAnalysisId(analysisId: String): List<com.financeai.native.database.entities.RecommendationEntity>
    
    @Query("SELECT * FROM recommendations WHERE priority = :priority ORDER BY created_at DESC")
    suspend fun getRecommendationsByPriority(priority: String): List<com.financeai.native.database.entities.RecommendationEntity>
    
    @Query("SELECT * FROM recommendations WHERE category = :category ORDER BY created_at DESC")
    suspend fun getRecommendationsByCategory(category: String): List<com.financeai.native.database.entities.RecommendationEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(recommendation: com.financeai.native.database.entities.RecommendationEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(recommendations: List<com.financeai.native.database.entities.RecommendationEntity>)
    
    @Delete
    suspend fun delete(recommendation: com.financeai.native.database.entities.RecommendationEntity)
    
    @Query("DELETE FROM recommendations WHERE analysis_id = :analysisId")
    suspend fun deleteByAnalysisId(analysisId: String)
}

@Dao
interface Converters {
    // Room type converters for complex data types if needed
}