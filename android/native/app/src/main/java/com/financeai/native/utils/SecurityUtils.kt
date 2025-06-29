package com.financeai.native.utils

import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

object SecurityUtils {
    
    private const val ALGORITHM = "AES"
    private const val TRANSFORMATION = "AES/CBC/PKCS5Padding"
    private const val HASH_ALGORITHM = "SHA-256"
    
    fun generateSecureId(): String {
        return UUID.randomUUID().toString()
    }
    
    fun generateSecureToken(length: Int = 32): String {
        val random = SecureRandom()
        val bytes = ByteArray(length)
        random.nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP)
    }
    
    fun hashString(input: String): String {
        val digest = MessageDigest.getInstance(HASH_ALGORITHM)
        val hashBytes = digest.digest(input.toByteArray())
        return Base64.encodeToString(hashBytes, Base64.NO_WRAP)
    }
    
    fun generateEncryptionKey(): SecretKey {
        val keyGenerator = KeyGenerator.getInstance(ALGORITHM)
        keyGenerator.init(256)
        return keyGenerator.generateKey()
    }
    
    fun encryptData(data: String, key: SecretKey): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key)
        
        val iv = cipher.iv
        val encryptedData = cipher.doFinal(data.toByteArray())
        
        val combined = iv + encryptedData
        return Base64.encodeToString(combined, Base64.DEFAULT)
    }
    
    fun decryptData(encryptedData: String, key: SecretKey): String {
        val combined = Base64.decode(encryptedData, Base64.DEFAULT)
        
        val iv = combined.sliceArray(0..15)
        val encrypted = combined.sliceArray(16 until combined.size)
        
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val ivSpec = IvParameterSpec(iv)
        cipher.init(Cipher.DECRYPT_MODE, key, ivSpec)
        
        val decryptedData = cipher.doFinal(encrypted)
        return String(decryptedData)
    }
    
    fun validateApiKey(apiKey: String): Boolean {
        return apiKey.isNotBlank() && 
               apiKey.length >= 20 && 
               apiKey.matches(Regex("^[a-zA-Z0-9_-]+$"))
    }
    
    fun sanitizeInput(input: String): String {
        return input.trim()
            .replace(Regex("[<>\"'&]"), "")
            .take(1000) // Limit length
    }
    
    fun isValidFileType(fileName: String): Boolean {
        val allowedExtensions = setOf("pdf", "xlsx", "xls", "docx", "doc", "jpg", "jpeg", "png", "bmp")
        val extension = fileName.substringAfterLast('.', "").lowercase()
        return extension in allowedExtensions
    }
    
    fun generateFileHash(fileBytes: ByteArray): String {
        val digest = MessageDigest.getInstance(HASH_ALGORITHM)
        val hashBytes = digest.digest(fileBytes)
        return Base64.encodeToString(hashBytes, Base64.NO_WRAP)
    }
}

object DateUtils {
    
    fun parseDate(dateString: String): Long {
        return try {
            // Try multiple date formats
            val formats = listOf(
                "yyyy-MM-dd",
                "dd/MM/yyyy",
                "MM/dd/yyyy",
                "dd-MM-yyyy",
                "yyyy/MM/dd"
            )
            
            for (format in formats) {
                try {
                    val sdf = java.text.SimpleDateFormat(format, Locale.getDefault())
                    return sdf.parse(dateString)?.time ?: 0L
                } catch (e: Exception) {
                    continue
                }
            }
            
            // If all formats fail, return current time
            System.currentTimeMillis()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }
    
    fun formatDate(timestamp: Long, format: String = "dd/MM/yyyy"): String {
        val sdf = java.text.SimpleDateFormat(format, Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
    
    fun formatDateTime(timestamp: Long): String {
        val sdf = java.text.SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
    
    fun getDateRangeString(startTimestamp: Long, endTimestamp: Long): String {
        val start = formatDate(startTimestamp)
        val end = formatDate(endTimestamp)
        return "$start - $end"
    }
    
    fun isValidDateRange(startTimestamp: Long, endTimestamp: Long): Boolean {
        return startTimestamp <= endTimestamp && 
               startTimestamp > 0 && 
               endTimestamp <= System.currentTimeMillis()
    }
}

object FileUtils {
    
    fun getFileType(file: java.io.File): String {
        return file.extension.lowercase()
    }
    
    fun getFileSize(file: java.io.File): Long {
        return file.length()
    }
    
    fun isFileSizeValid(file: java.io.File, maxSizeMB: Int = 10): Boolean {
        val maxSizeBytes = maxSizeMB * 1024 * 1024L
        return file.length() <= maxSizeBytes
    }
    
    fun getMimeType(fileName: String): String {
        return when (getFileType(java.io.File(fileName))) {
            "pdf" -> "application/pdf"
            "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            "xls" -> "application/vnd.ms-excel"
            "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "doc" -> "application/msword"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "bmp" -> "image/bmp"
            else -> "application/octet-stream"
        }
    }
    
    fun createTempFile(originalFile: java.io.File, prefix: String = "financeai_"): java.io.File {
        val tempDir = java.io.File(System.getProperty("java.io.tmpdir"))
        val extension = getFileType(originalFile)
        val tempFileName = "$prefix${System.currentTimeMillis()}.$extension"
        
        val tempFile = java.io.File(tempDir, tempFileName)
        originalFile.copyTo(tempFile, overwrite = true)
        
        return tempFile
    }
    
    fun cleanupTempFiles(directory: java.io.File, olderThanHours: Int = 24) {
        val cutoffTime = System.currentTimeMillis() - (olderThanHours * 60 * 60 * 1000L)
        
        directory.listFiles()?.forEach { file ->
            if (file.lastModified() < cutoffTime && file.name.startsWith("financeai_")) {
                file.delete()
            }
        }
    }
    
    fun validateFileIntegrity(file: java.io.File): Boolean {
        return file.exists() && 
               file.canRead() && 
               file.length() > 0 &&
               SecurityUtils.isValidFileType(file.name)
    }
}

object ValidationUtils {
    
    fun validateCreditScore(score: Int): Boolean {
        return score in 300..850
    }
    
    fun validateRiskLevel(riskLevel: String): Boolean {
        return riskLevel in setOf("low", "medium", "high", "critical")
    }
    
    fun validateTransactionType(type: String): Boolean {
        return type in setOf("credit", "debit")
    }
    
    fun validateAmount(amount: Double): Boolean {
        return amount.isFinite() && !amount.isNaN()
    }
    
    fun validatePercentage(value: Double): Boolean {
        return value in 0.0..1.0
    }
    
    fun validateEmailFormat(email: String): Boolean {
        return email.matches(Regex("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$"))
    }
    
    fun validatePhoneNumber(phone: String): Boolean {
        val cleanPhone = phone.replace(Regex("[^0-9]"), "")
        return cleanPhone.length in 10..15
    }
    
    fun sanitizeFileName(fileName: String): String {
        return fileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
    }
    
    fun validateJsonString(jsonString: String): Boolean {
        return try {
            org.json.JSONObject(jsonString)
            true
        } catch (e: Exception) {
            try {
                org.json.JSONArray(jsonString)
                true
            } catch (e2: Exception) {
                false
            }
        }
    }
}

object PerformanceUtils {
    
    fun measureExecutionTime(block: () -> Unit): Long {
        val startTime = System.currentTimeMillis()
        block()
        return System.currentTimeMillis() - startTime
    }
    
    suspend fun <T> measureSuspendExecutionTime(block: suspend () -> T): Pair<T, Long> {
        val startTime = System.currentTimeMillis()
        val result = block()
        val executionTime = System.currentTimeMillis() - startTime
        return Pair(result, executionTime)
    }
    
    fun formatExecutionTime(milliseconds: Long): String {
        return when {
            milliseconds < 1000 -> "${milliseconds}ms"
            milliseconds < 60000 -> "${milliseconds / 1000}s"
            else -> "${milliseconds / 60000}m ${(milliseconds % 60000) / 1000}s"
        }
    }
    
    fun getMemoryUsage(): String {
        val runtime = Runtime.getRuntime()
        val usedMemory = runtime.totalMemory() - runtime.freeMemory()
        val maxMemory = runtime.maxMemory()
        
        val usedMB = usedMemory / (1024 * 1024)
        val maxMB = maxMemory / (1024 * 1024)
        
        return "Memory: ${usedMB}MB / ${maxMB}MB"
    }
}

object LoggingUtils {
    
    private const val TAG = "FinanceAINative"
    
    fun logInfo(message: String, tag: String = TAG) {
        android.util.Log.i(tag, message)
    }
    
    fun logWarning(message: String, throwable: Throwable? = null, tag: String = TAG) {
        android.util.Log.w(tag, message, throwable)
    }
    
    fun logError(message: String, throwable: Throwable? = null, tag: String = TAG) {
        android.util.Log.e(tag, message, throwable)
    }
    
    fun logDebug(message: String, tag: String = TAG) {
        android.util.Log.d(tag, message)
    }
    
    fun logPerformance(operation: String, executionTime: Long, tag: String = TAG) {
        val formattedTime = PerformanceUtils.formatExecutionTime(executionTime)
        logInfo("Performance: $operation completed in $formattedTime", tag)
    }
    
    fun logAnalysisResult(analysisId: String, creditScore: Int, riskLevel: String, tag: String = TAG) {
        logInfo("Analysis $analysisId completed: Score=$creditScore, Risk=$riskLevel", tag)
    }
}