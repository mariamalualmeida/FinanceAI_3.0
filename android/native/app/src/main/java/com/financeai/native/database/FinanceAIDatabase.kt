package com.financeai.native.database

import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.financeai.native.database.dao.*
import com.financeai.native.database.entities.*

@Database(
    entities = [
        AnalysisResult::class,
        TransactionEntity::class,
        DocumentMetadata::class,
        UserSettings::class,
        CacheEntry::class,
        SuspiciousPattern::class,
        RecommendationEntity::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class FinanceAIDatabase : RoomDatabase() {
    
    abstract fun analysisDao(): AnalysisDao
    abstract fun transactionDao(): TransactionDao
    abstract fun documentDao(): DocumentDao
    abstract fun userSettingsDao(): UserSettingsDao
    abstract fun cacheDao(): CacheDao
    abstract fun suspiciousPatternDao(): SuspiciousPatternDao
    abstract fun recommendationDao(): RecommendationDao
    
    companion object {
        const val DATABASE_NAME = "financeai_native.db"
        
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Add new columns for enhanced features
                database.execSQL("""
                    ALTER TABLE analysis_results 
                    ADD COLUMN temporal_analysis TEXT DEFAULT ''
                """)
                
                database.execSQL("""
                    ALTER TABLE transactions 
                    ADD COLUMN risk_score REAL DEFAULT 0.0
                """)
                
                database.execSQL("""
                    ALTER TABLE transactions 
                    ADD COLUMN metadata TEXT DEFAULT '{}'
                """)
                
                // Create new tables for advanced features
                database.execSQL("""
                    CREATE TABLE IF NOT EXISTS suspicious_patterns (
                        id TEXT PRIMARY KEY NOT NULL,
                        analysis_id TEXT NOT NULL,
                        pattern_type TEXT NOT NULL,
                        confidence REAL NOT NULL,
                        description TEXT NOT NULL,
                        risk_level TEXT NOT NULL,
                        detected_at INTEGER NOT NULL,
                        FOREIGN KEY(analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                
                database.execSQL("""
                    CREATE TABLE IF NOT EXISTS recommendations (
                        id TEXT PRIMARY KEY NOT NULL,
                        analysis_id TEXT NOT NULL,
                        type TEXT NOT NULL,
                        category TEXT NOT NULL,
                        priority TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        action_items TEXT NOT NULL,
                        estimated_impact TEXT,
                        timeline TEXT,
                        created_at INTEGER NOT NULL,
                        FOREIGN KEY(analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                
                database.execSQL("""
                    CREATE TABLE IF NOT EXISTS cache_entries (
                        id TEXT PRIMARY KEY NOT NULL,
                        cache_key TEXT UNIQUE NOT NULL,
                        cache_value TEXT NOT NULL,
                        expiry_time INTEGER NOT NULL,
                        created_at INTEGER NOT NULL
                    )
                """)
                
                // Create indexes for better performance
                database.execSQL("CREATE INDEX IF NOT EXISTS idx_transactions_analysis_id ON transactions(analysis_id)")
                database.execSQL("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)")
                database.execSQL("CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)")
                database.execSQL("CREATE INDEX IF NOT EXISTS idx_suspicious_patterns_analysis_id ON suspicious_patterns(analysis_id)")
                database.execSQL("CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON recommendations(analysis_id)")
                database.execSQL("CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key)")
            }
        }
    }
}