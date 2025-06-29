package com.financeai.native.ocr

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.financeai.native.analysis.ExtractedContent
import com.financeai.native.utils.FileUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.apache.poi.ss.usermodel.WorkbookFactory
import org.apache.poi.xwpf.usermodel.XWPFDocument
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import kotlin.math.max

class AdvancedOCRProcessor(private val context: Context) {
    
    private val textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    
    companion object {
        private const val MAX_IMAGE_SIZE = 2048
        private const val MIN_CONFIDENCE_THRESHOLD = 0.5
        private const val MAX_RETRY_ATTEMPTS = 3
    }
    
    suspend fun extractWithAdvancedOCR(file: File): ExtractedContent = withContext(Dispatchers.IO) {
        val fileType = FileUtils.getFileType(file)
        
        when (fileType.lowercase()) {
            "pdf" -> extractFromPDF(file)
            "xlsx", "xls" -> extractFromExcel(file)
            "docx", "doc" -> extractFromWord(file)
            "jpg", "jpeg", "png", "bmp" -> extractFromImage(file)
            else -> throw UnsupportedOperationException("Unsupported file type: $fileType")
        }
    }
    
    suspend fun extractWithTesseract(file: File): ExtractedContent = withContext(Dispatchers.IO) {
        // Tesseract OCR implementation for Android
        // Using Android Tesseract4Android library (would need to be added to dependencies)
        try {
            val bitmap = when (FileUtils.getFileType(file).lowercase()) {
                "pdf" -> convertPDFToBitmap(file)
                else -> BitmapFactory.decodeFile(file.absolutePath)
            }
            
            if (bitmap != null) {
                val optimizedBitmap = optimizeBitmap(bitmap)
                val extractedText = performTesseractOCR(optimizedBitmap)
                
                ExtractedContent(
                    text = extractedText,
                    confidence = calculateTesseractConfidence(extractedText)
                )
            } else {
                throw IOException("Could not decode image from file")
            }
        } catch (e: Exception) {
            throw OCRException("Tesseract OCR failed: ${e.message}", e)
        }
    }
    
    suspend fun extractWithMLKit(file: File): ExtractedContent = withContext(Dispatchers.IO) {
        try {
            val bitmap = when (FileUtils.getFileType(file).lowercase()) {
                "pdf" -> convertPDFToBitmap(file)
                else -> BitmapFactory.decodeFile(file.absolutePath)
            }
            
            if (bitmap != null) {
                val optimizedBitmap = optimizeBitmap(bitmap)
                val image = InputImage.fromBitmap(optimizedBitmap, 0)
                
                val result = textRecognizer.process(image).await()
                val extractedText = result.text
                val confidence = calculateMLKitConfidence(result)
                
                ExtractedContent(
                    text = extractedText,
                    confidence = confidence
                )
            } else {
                throw IOException("Could not decode image from file")
            }
        } catch (e: Exception) {
            throw OCRException("ML Kit OCR failed: ${e.message}", e)
        }
    }
    
    suspend fun extractWithPDFParser(file: File): ExtractedContent = withContext(Dispatchers.IO) {
        try {
            val fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
            val pdfRenderer = PdfRenderer(fileDescriptor)
            
            val extractedText = StringBuilder()
            val pageCount = pdfRenderer.pageCount
            
            for (i in 0 until pageCount) {
                val page = pdfRenderer.openPage(i)
                
                // Convert page to bitmap for OCR
                val bitmap = Bitmap.createBitmap(
                    page.width * 2, // Higher resolution
                    page.height * 2,
                    Bitmap.Config.ARGB_8888
                )
                
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                
                // Use ML Kit on the bitmap
                val image = InputImage.fromBitmap(bitmap, 0)
                val result = textRecognizer.process(image).await()
                
                extractedText.append(result.text)
                extractedText.append("\n")
                
                page.close()
            }
            
            pdfRenderer.close()
            fileDescriptor.close()
            
            ExtractedContent(
                text = extractedText.toString().trim(),
                confidence = 0.8 // Reasonable confidence for PDF text extraction
            )
            
        } catch (e: Exception) {
            throw OCRException("PDF parser failed: ${e.message}", e)
        }
    }
    
    private suspend fun extractFromPDF(file: File): ExtractedContent {
        return try {
            // First try direct PDF text extraction
            extractWithPDFParser(file)
        } catch (e: Exception) {
            // Fallback to OCR
            extractWithMLKit(file)
        }
    }
    
    private suspend fun extractFromExcel(file: File): ExtractedContent = withContext(Dispatchers.IO) {
        try {
            val inputStream = FileInputStream(file)
            val workbook = WorkbookFactory.create(inputStream)
            val extractedText = StringBuilder()
            
            for (sheetIndex in 0 until workbook.numberOfSheets) {
                val sheet = workbook.getSheetAt(sheetIndex)
                extractedText.append("=== Sheet: ${sheet.sheetName} ===\n")
                
                for (row in sheet) {
                    val rowData = mutableListOf<String>()
                    for (cell in row) {
                        val cellValue = when {
                            cell.cellType.name == "NUMERIC" -> cell.numericCellValue.toString()
                            cell.cellType.name == "STRING" -> cell.stringCellValue
                            cell.cellType.name == "BOOLEAN" -> cell.booleanCellValue.toString()
                            cell.cellType.name == "FORMULA" -> cell.cellFormula
                            else -> ""
                        }
                        rowData.add(cellValue)
                    }
                    extractedText.append(rowData.joinToString("\t"))
                    extractedText.append("\n")
                }
                extractedText.append("\n")
            }
            
            workbook.close()
            inputStream.close()
            
            ExtractedContent(
                text = extractedText.toString(),
                confidence = 0.95 // High confidence for structured data
            )
            
        } catch (e: Exception) {
            throw OCRException("Excel extraction failed: ${e.message}", e)
        }
    }
    
    private suspend fun extractFromWord(file: File): ExtractedContent = withContext(Dispatchers.IO) {
        try {
            val inputStream = FileInputStream(file)
            val document = XWPFDocument(inputStream)
            val extractedText = StringBuilder()
            
            // Extract paragraphs
            for (paragraph in document.paragraphs) {
                extractedText.append(paragraph.text)
                extractedText.append("\n")
            }
            
            // Extract tables
            for (table in document.tables) {
                extractedText.append("\n=== Table ===\n")
                for (row in table.rows) {
                    val rowData = row.tableCells.map { it.text }
                    extractedText.append(rowData.joinToString("\t"))
                    extractedText.append("\n")
                }
                extractedText.append("\n")
            }
            
            document.close()
            inputStream.close()
            
            ExtractedContent(
                text = extractedText.toString(),
                confidence = 0.95 // High confidence for structured data
            )
            
        } catch (e: Exception) {
            throw OCRException("Word extraction failed: ${e.message}", e)
        }
    }
    
    private suspend fun extractFromImage(file: File): ExtractedContent {
        return try {
            // Try ML Kit first
            extractWithMLKit(file)
        } catch (e: Exception) {
            // Fallback to Tesseract if available
            try {
                extractWithTesseract(file)
            } catch (e2: Exception) {
                throw OCRException("All image OCR methods failed", e2)
            }
        }
    }
    
    private fun convertPDFToBitmap(file: File): Bitmap? {
        return try {
            val fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
            val pdfRenderer = PdfRenderer(fileDescriptor)
            
            if (pdfRenderer.pageCount > 0) {
                val page = pdfRenderer.openPage(0) // Convert first page
                
                val bitmap = Bitmap.createBitmap(
                    page.width * 2,
                    page.height * 2,
                    Bitmap.Config.ARGB_8888
                )
                
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()
                pdfRenderer.close()
                fileDescriptor.close()
                
                bitmap
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun optimizeBitmap(bitmap: Bitmap): Bitmap {
        val maxDimension = max(bitmap.width, bitmap.height)
        
        return if (maxDimension > MAX_IMAGE_SIZE) {
            val scale = MAX_IMAGE_SIZE.toFloat() / maxDimension
            val newWidth = (bitmap.width * scale).toInt()
            val newHeight = (bitmap.height * scale).toInt()
            
            Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
        } else {
            bitmap
        }
    }
    
    private fun performTesseractOCR(bitmap: Bitmap): String {
        // Implementation would use Tesseract4Android library
        // This is a placeholder for the actual Tesseract implementation
        return "Tesseract OCR text extraction would be implemented here"
    }
    
    private fun calculateTesseractConfidence(text: String): Double {
        // Simple confidence calculation based on text characteristics
        return when {
            text.length < 10 -> 0.3
            text.matches(Regex(".*\\d+.*")) -> 0.8 // Contains numbers (good for financial docs)
            text.contains("R$") || text.contains("USD") || text.contains("EUR") -> 0.9
            else -> 0.6
        }
    }
    
    private fun calculateMLKitConfidence(result: com.google.mlkit.vision.text.Text): Double {
        val blocks = result.textBlocks
        if (blocks.isEmpty()) return 0.0
        
        val confidenceSum = blocks.mapNotNull { block ->
            block.confidence
        }.sum()
        
        return if (blocks.isNotEmpty()) {
            (confidenceSum / blocks.size).coerceAtMost(1.0)
        } else {
            0.0
        }
    }
    
    // Enhanced extraction with multiple strategies and validation
    suspend fun extractWithMultipleStrategies(file: File): ExtractedContent {
        val strategies = listOf(
            { extractWithMLKit(file) },
            { extractWithPDFParser(file) },
            { extractWithTesseract(file) },
            { extractWithAdvancedOCR(file) }
        )
        
        var bestResult: ExtractedContent? = null
        var maxConfidence = 0.0
        
        for (strategy in strategies) {
            try {
                val result = strategy()
                if (result.confidence > maxConfidence && validateExtraction(result)) {
                    bestResult = result
                    maxConfidence = result.confidence
                }
                
                // If we get a high-confidence result, use it
                if (result.confidence > 0.9) {
                    return result
                }
            } catch (e: Exception) {
                // Continue to next strategy
                continue
            }
        }
        
        return bestResult ?: throw OCRException("All extraction strategies failed")
    }
    
    private fun validateExtraction(content: ExtractedContent): Boolean {
        val text = content.text.trim()
        
        return text.isNotEmpty() && 
               text.length > 20 && // Minimum meaningful length
               content.confidence >= MIN_CONFIDENCE_THRESHOLD &&
               !text.contains("����") && // No encoding issues
               text.count { it.isLetter() } > text.length * 0.3 // At least 30% letters
    }
}

class OCRException(message: String, cause: Throwable? = null) : Exception(message, cause)