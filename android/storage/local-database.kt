package com.financeai.app.storage

import androidx.room.*
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.room.migration.Migration
import kotlinx.coroutines.flow.Flow
import java.util.Date

// Entity definitions for local SQLite storage

@Entity(tableName = "conversations")
data class ConversationEntity(
    @PrimaryKey val id: String,
    val userId: Int,
    val title: String,
    val createdAt: Date,
    val updatedAt: Date,
    val syncStatus: String = "pending" // pending, synced, error
)

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val conversationId: String,
    val sender: String, // "user" or "assistant"
    val content: String,
    val metadata: String? = null,
    val createdAt: Date,
    val syncStatus: String = "pending"
)

@Entity(tableName = "file_uploads")
data class FileUploadEntity(
    @PrimaryKey val id: String,
    val userId: Int,
    val conversationId: String,
    val fileName: String,
    val originalName: String,
    val fileSize: Long,
    val fileType: String,
    val localPath: String,
    val status: String, // "pending", "processing", "completed", "error"
    val createdAt: Date,
    val syncStatus: String = "pending"
)

@Entity(tableName = "financial_analyses")
data class FinancialAnalysisEntity(
    @PrimaryKey val id: String,
    val fileUploadId: String,
    val userId: Int,
    val results: String, // JSON string
    val status: String,
    val recommendations: String,
    val createdAt: Date,
    val syncStatus: String = "pending"
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val entityType: String, // "conversation", "message", "file_upload", "analysis"
    val entityId: String,
    val operation: String, // "create", "update", "delete"
    val data: String, // JSON payload
    val priority: Int = 0, // Higher numbers = higher priority
    val attempts: Int = 0,
    val createdAt: Date,
    val lastAttempt: Date? = null
)

// Type converters for Room
class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time?.toLong()
    }
}

// DAOs for database operations

@Dao
interface ConversationDao {
    @Query("SELECT * FROM conversations WHERE userId = :userId ORDER BY updatedAt DESC")
    fun getConversationsByUser(userId: Int): Flow<List<ConversationEntity>>

    @Query("SELECT * FROM conversations WHERE id = :id")
    suspend fun getConversation(id: String): ConversationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversation(conversation: ConversationEntity)

    @Update
    suspend fun updateConversation(conversation: ConversationEntity)

    @Delete
    suspend fun deleteConversation(conversation: ConversationEntity)

    @Query("SELECT * FROM conversations WHERE syncStatus = 'pending'")
    suspend fun getPendingSync(): List<ConversationEntity>

    @Query("UPDATE conversations SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String)
}

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt ASC")
    fun getMessagesByConversation(conversationId: String): Flow<List<MessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity): Long

    @Delete
    suspend fun deleteMessage(message: MessageEntity)

    @Query("SELECT * FROM messages WHERE syncStatus = 'pending'")
    suspend fun getPendingSync(): List<MessageEntity>

    @Query("UPDATE messages SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String)

    @Query("DELETE FROM messages WHERE conversationId = :conversationId")
    suspend fun deleteMessagesByConversation(conversationId: String)
}

@Dao
interface FileUploadDao {
    @Query("SELECT * FROM file_uploads WHERE userId = :userId ORDER BY createdAt DESC")
    fun getFileUploadsByUser(userId: Int): Flow<List<FileUploadEntity>>

    @Query("SELECT * FROM file_uploads WHERE id = :id")
    suspend fun getFileUpload(id: String): FileUploadEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFileUpload(fileUpload: FileUploadEntity)

    @Update
    suspend fun updateFileUpload(fileUpload: FileUploadEntity)

    @Query("SELECT * FROM file_uploads WHERE syncStatus = 'pending'")
    suspend fun getPendingSync(): List<FileUploadEntity>

    @Query("UPDATE file_uploads SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String)
}

@Dao
interface FinancialAnalysisDao {
    @Query("SELECT * FROM financial_analyses WHERE userId = :userId ORDER BY createdAt DESC")
    fun getAnalysesByUser(userId: Int): Flow<List<FinancialAnalysisEntity>>

    @Query("SELECT * FROM financial_analyses WHERE id = :id")
    suspend fun getFinancialAnalysis(id: String): FinancialAnalysisEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFinancialAnalysis(analysis: FinancialAnalysisEntity)

    @Update
    suspend fun updateFinancialAnalysis(analysis: FinancialAnalysisEntity)

    @Query("SELECT * FROM financial_analyses WHERE syncStatus = 'pending'")
    suspend fun getPendingSync(): List<FinancialAnalysisEntity>

    @Query("UPDATE financial_analyses SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY priority DESC, createdAt ASC")
    suspend fun getAllPending(): List<SyncQueueEntity>

    @Insert
    suspend fun insertSyncItem(item: SyncQueueEntity)

    @Delete
    suspend fun deleteSyncItem(item: SyncQueueEntity)

    @Query("UPDATE sync_queue SET attempts = attempts + 1, lastAttempt = :timestamp WHERE id = :id")
    suspend fun incrementAttempts(id: Long, timestamp: Date)

    @Query("DELETE FROM sync_queue WHERE attempts >= 5 AND lastAttempt < :cutoff")
    suspend fun cleanupFailedItems(cutoff: Date)
}

// Main Room database
@Database(
    entities = [
        ConversationEntity::class,
        MessageEntity::class,
        FileUploadEntity::class,
        FinancialAnalysisEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class FinanceAIDatabase : RoomDatabase() {
    abstract fun conversationDao(): ConversationDao
    abstract fun messageDao(): MessageDao
    abstract fun fileUploadDao(): FileUploadDao
    abstract fun financialAnalysisDao(): FinancialAnalysisDao
    abstract fun syncQueueDao(): SyncQueueDao

    companion object {
        @Volatile
        private var INSTANCE: FinanceAIDatabase? = null

        fun getDatabase(context: android.content.Context): FinanceAIDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FinanceAIDatabase::class.java,
                    "financeai_database"
                )
                .addCallback(object : RoomDatabase.Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Initialize database with default data if needed
                    }
                })
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// Repository for managing local data and sync
class LocalRepository(private val database: FinanceAIDatabase) {
    
    private val conversationDao = database.conversationDao()
    private val messageDao = database.messageDao()
    private val fileUploadDao = database.fileUploadDao()
    private val financialAnalysisDao = database.financialAnalysisDao()
    private val syncQueueDao = database.syncQueueDao()

    // Conversation operations
    fun getConversationsByUser(userId: Int) = conversationDao.getConversationsByUser(userId)
    
    suspend fun createConversation(conversation: ConversationEntity) {
        conversationDao.insertConversation(conversation)
        queueForSync("conversation", conversation.id, "create", conversation)
    }

    suspend fun updateConversation(conversation: ConversationEntity) {
        conversationDao.updateConversation(conversation)
        queueForSync("conversation", conversation.id, "update", conversation)
    }

    suspend fun deleteConversation(conversationId: String) {
        val conversation = conversationDao.getConversation(conversationId)
        conversation?.let {
            conversationDao.deleteConversation(it)
            messageDao.deleteMessagesByConversation(conversationId)
            queueForSync("conversation", conversationId, "delete", it)
        }
    }

    // Message operations
    fun getMessagesByConversation(conversationId: String) = messageDao.getMessagesByConversation(conversationId)
    
    suspend fun createMessage(message: MessageEntity): Long {
        val id = messageDao.insertMessage(message)
        queueForSync("message", id.toString(), "create", message)
        return id
    }

    // File upload operations
    suspend fun createFileUpload(fileUpload: FileUploadEntity) {
        fileUploadDao.insertFileUpload(fileUpload)
        queueForSync("file_upload", fileUpload.id, "create", fileUpload)
    }

    suspend fun updateFileUploadStatus(id: String, status: String) {
        val fileUpload = fileUploadDao.getFileUpload(id)
        fileUpload?.let {
            val updated = it.copy(status = status)
            fileUploadDao.updateFileUpload(updated)
            queueForSync("file_upload", id, "update", updated)
        }
    }

    // Financial analysis operations
    suspend fun createFinancialAnalysis(analysis: FinancialAnalysisEntity) {
        financialAnalysisDao.insertFinancialAnalysis(analysis)
        queueForSync("financial_analysis", analysis.id, "create", analysis)
    }

    // Sync operations
    private suspend fun queueForSync(entityType: String, entityId: String, operation: String, data: Any) {
        val syncItem = SyncQueueEntity(
            entityType = entityType,
            entityId = entityId,
            operation = operation,
            data = kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.json.JsonElement.serializer(), 
                kotlinx.serialization.json.Json.parseToJsonElement(data.toString())),
            createdAt = Date()
        )
        syncQueueDao.insertSyncItem(syncItem)
    }

    suspend fun getPendingSyncItems(): List<SyncQueueEntity> {
        return syncQueueDao.getAllPending()
    }

    suspend fun markSyncComplete(item: SyncQueueEntity) {
        syncQueueDao.deleteSyncItem(item)
    }

    suspend fun markSyncFailed(item: SyncQueueEntity) {
        syncQueueDao.incrementAttempts(item.id, Date())
    }

    suspend fun cleanupOldSyncItems() {
        val cutoff = Date(System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        syncQueueDao.cleanupFailedItems(cutoff)
    }
}