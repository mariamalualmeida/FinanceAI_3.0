package com.financeai.native

import android.app.Application
import androidx.room.Room
import androidx.work.Configuration
import androidx.work.WorkManager
import com.financeai.native.database.FinanceAIDatabase
import com.financeai.native.utils.LoggingUtils
import timber.log.Timber

class FinanceAIApplication : Application(), Configuration.Provider {
    
    val database by lazy {
        Room.databaseBuilder(
            this,
            FinanceAIDatabase::class.java,
            FinanceAIDatabase.DATABASE_NAME
        )
        .addMigrations(FinanceAIDatabase.MIGRATION_1_2)
        .fallbackToDestructiveMigration()
        .build()
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        
        // Initialize WorkManager
        WorkManager.initialize(this, workManagerConfiguration)
        
        LoggingUtils.logInfo("FinanceAI Native Application initialized", "Application")
    }
    
    override fun getWorkManagerConfiguration(): Configuration {
        return Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()
    }
}