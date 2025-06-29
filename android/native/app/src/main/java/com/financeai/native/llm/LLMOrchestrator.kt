package com.financeai.native.llm

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class LLMOrchestrator {
    
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    companion object {
        private const val TAG = "LLMOrchestrator"
        
        // API Endpoints
        private const val OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"
        private const val ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages"
        private const val GOOGLE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        private const val XAI_ENDPOINT = "https://api.x.ai/v1/chat/completions"
        
        // Default models
        private const val OPENAI_MODEL = "gpt-4o"
        private const val ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"
        private const val GOOGLE_MODEL = "gemini-2.0-flash-exp"
        private const val XAI_MODEL = "grok-2-1212"
    }
    
    private var defaultApiKey: String = ""
    private var defaultProvider: String = "openai"
    private var providers = mutableMapOf<String, LLMProvider>()
    
    fun initializeProviders(
        openaiKey: String = "",
        anthropicKey: String = "",
        googleKey: String = "",
        xaiKey: String = "",
        primaryProvider: String = "openai"
    ) {
        defaultProvider = primaryProvider
        
        if (openaiKey.isNotEmpty()) {
            providers["openai"] = LLMProvider(
                name = "openai",
                apiKey = openaiKey,
                endpoint = OPENAI_ENDPOINT,
                model = OPENAI_MODEL
            )
        }
        
        if (anthropicKey.isNotEmpty()) {
            providers["anthropic"] = LLMProvider(
                name = "anthropic",
                apiKey = anthropicKey,
                endpoint = ANTHROPIC_ENDPOINT,
                model = ANTHROPIC_MODEL
            )
        }
        
        if (googleKey.isNotEmpty()) {
            providers["google"] = LLMProvider(
                name = "google",
                apiKey = googleKey,
                endpoint = GOOGLE_ENDPOINT,
                model = GOOGLE_MODEL
            )
        }
        
        if (xaiKey.isNotEmpty()) {
            providers["xai"] = LLMProvider(
                name = "xai",
                apiKey = xaiKey,
                endpoint = XAI_ENDPOINT,
                model = XAI_MODEL
            )
        }
        
        Log.d(TAG, "Initialized ${providers.size} LLM providers")
    }
    
    suspend fun processMessage(
        message: String,
        preferredProvider: String? = null,
        strategy: ProcessingStrategy = ProcessingStrategy.ECONOMIC
    ): String = withContext(Dispatchers.IO) {
        
        val providerToUse = preferredProvider ?: defaultProvider
        
        when (strategy) {
            ProcessingStrategy.ECONOMIC -> processWithEconomicStrategy(message, providerToUse)
            ProcessingStrategy.BALANCED -> processWithBalancedStrategy(message, providerToUse)
            ProcessingStrategy.PREMIUM -> processWithPremiumStrategy(message, providerToUse)
            ProcessingStrategy.MULTI_VALIDATION -> processWithMultiValidation(message)
        }
    }
    
    private suspend fun processWithEconomicStrategy(message: String, provider: String): String {
        val selectedProvider = providers[provider] ?: providers.values.firstOrNull()
        ?: throw LLMException("No LLM providers available")
        
        return try {
            callLLMProvider(selectedProvider, message)
        } catch (e: Exception) {
            // Fallback to any available provider
            val fallbackProvider = providers.values.firstOrNull { it.name != provider }
            if (fallbackProvider != null) {
                Log.w(TAG, "Primary provider failed, using fallback: ${fallbackProvider.name}")
                callLLMProvider(fallbackProvider, message)
            } else {
                throw LLMException("All providers failed: ${e.message}")
            }
        }
    }
    
    private suspend fun processWithBalancedStrategy(message: String, provider: String): String {
        val primaryProvider = providers[provider]
        val fallbackProviders = providers.values.filter { it.name != provider }
        
        // Try primary provider first
        if (primaryProvider != null) {
            try {
                return callLLMProvider(primaryProvider, message)
            } catch (e: Exception) {
                Log.w(TAG, "Primary provider failed: ${e.message}")
            }
        }
        
        // Try fallback providers
        for (fallback in fallbackProviders) {
            try {
                return callLLMProvider(fallback, message)
            } catch (e: Exception) {
                Log.w(TAG, "Fallback provider ${fallback.name} failed: ${e.message}")
                continue
            }
        }
        
        throw LLMException("All providers failed in balanced strategy")
    }
    
    private suspend fun processWithPremiumStrategy(message: String, provider: String): String {
        // Use the most capable model available
        val premiumProviders = listOf("gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash", "grok-2")
        
        for (providerName in premiumProviders) {
            val llmProvider = providers[providerName.split("-")[0]]
            if (llmProvider != null) {
                try {
                    return callLLMProvider(llmProvider, message)
                } catch (e: Exception) {
                    Log.w(TAG, "Premium provider $providerName failed: ${e.message}")
                    continue
                }
            }
        }
        
        throw LLMException("All premium providers failed")
    }
    
    private suspend fun processWithMultiValidation(message: String): String {
        val responses = mutableListOf<String>()
        val availableProviders = providers.values.take(2) // Use up to 2 providers for validation
        
        for (provider in availableProviders) {
            try {
                val response = callLLMProvider(provider, message)
                responses.add(response)
            } catch (e: Exception) {
                Log.w(TAG, "Provider ${provider.name} failed in multi-validation: ${e.message}")
            }
        }
        
        return if (responses.isNotEmpty()) {
            // For financial analysis, we want consistency, so return the first successful response
            // In a more advanced implementation, we could compare responses and choose the best one
            responses.first()
        } else {
            throw LLMException("All providers failed in multi-validation strategy")
        }
    }
    
    private suspend fun callLLMProvider(provider: LLMProvider, message: String): String {
        return when (provider.name) {
            "openai", "xai" -> callOpenAICompatible(provider, message)
            "anthropic" -> callAnthropic(provider, message)
            "google" -> callGoogle(provider, message)
            else -> throw LLMException("Unsupported provider: ${provider.name}")
        }
    }
    
    private suspend fun callOpenAICompatible(provider: LLMProvider, message: String): String {
        val requestBody = JSONObject().apply {
            put("model", provider.model)
            put("messages", JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "user")
                    put("content", message)
                })
            })
            put("max_tokens", 4000)
            put("temperature", 0.7)
        }
        
        val request = Request.Builder()
            .url(provider.endpoint)
            .header("Authorization", "Bearer ${provider.apiKey}")
            .header("Content-Type", "application/json")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        return executeRequest(request) { responseBody ->
            val jsonResponse = JSONObject(responseBody)
            val choices = jsonResponse.getJSONArray("choices")
            if (choices.length() > 0) {
                choices.getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content")
            } else {
                throw LLMException("No response from ${provider.name}")
            }
        }
    }
    
    private suspend fun callAnthropic(provider: LLMProvider, message: String): String {
        val requestBody = JSONObject().apply {
            put("model", provider.model)
            put("max_tokens", 4000)
            put("messages", JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "user")
                    put("content", message)
                })
            })
        }
        
        val request = Request.Builder()
            .url(provider.endpoint)
            .header("x-api-key", provider.apiKey)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        return executeRequest(request) { responseBody ->
            val jsonResponse = JSONObject(responseBody)
            val content = jsonResponse.getJSONArray("content")
            if (content.length() > 0) {
                content.getJSONObject(0).getString("text")
            } else {
                throw LLMException("No response from Anthropic")
            }
        }
    }
    
    private suspend fun callGoogle(provider: LLMProvider, message: String): String {
        val requestBody = JSONObject().apply {
            put("contents", JSONArray().apply {
                put(JSONObject().apply {
                    put("parts", JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", message)
                        })
                    })
                })
            })
            put("generationConfig", JSONObject().apply {
                put("maxOutputTokens", 4000)
                put("temperature", 0.7)
            })
        }
        
        val request = Request.Builder()
            .url("${provider.endpoint}?key=${provider.apiKey}")
            .header("Content-Type", "application/json")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        return executeRequest(request) { responseBody ->
            val jsonResponse = JSONObject(responseBody)
            val candidates = jsonResponse.getJSONArray("candidates")
            if (candidates.length() > 0) {
                candidates.getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text")
            } else {
                throw LLMException("No response from Google")
            }
        }
    }
    
    private suspend fun <T> executeRequest(
        request: Request,
        responseParser: (String) -> T
    ): T = withContext(Dispatchers.IO) {
        
        val response = httpClient.newCall(request).execute()
        
        if (!response.isSuccessful) {
            val errorBody = response.body?.string() ?: "Unknown error"
            throw LLMException("HTTP ${response.code}: $errorBody")
        }
        
        val responseBody = response.body?.string()
            ?: throw LLMException("Empty response body")
        
        try {
            responseParser(responseBody)
        } catch (e: Exception) {
            throw LLMException("Failed to parse response: ${e.message}")
        }
    }
    
    // Enhanced financial analysis prompt
    fun createFinancialAnalysisPrompt(extractedText: String): String {
        return """
        Como especialista em análise financeira, analise o seguinte documento e extraia TODAS as transações em formato JSON estruturado.
        
        INSTRUÇÕES ESPECÍFICAS:
        1. Extraia cada transação com data, descrição, valor e tipo
        2. Classifique como "credit" (entrada) ou "debit" (saída)
        3. Categorize cada transação (ex: salário, alimentação, transporte, etc.)
        4. Identifique padrões suspeitos (jogos, transferências grandes, etc.)
        5. Calcule estatísticas relevantes
        
        DOCUMENTO:
        $extractedText
        
        RESPONDA APENAS COM JSON VÁLIDO:
        {
          "transactions": [
            {
              "date": "2024-01-15",
              "description": "Descrição completa",
              "amount": 100.50,
              "type": "credit",
              "category": "categoria",
              "confidence": 0.95
            }
          ],
          "summary": {
            "total_income": 0,
            "total_expenses": 0,
            "balance": 0,
            "transaction_count": 0,
            "date_range": {
              "start": "2024-01-01",
              "end": "2024-01-31"
            }
          },
          "patterns": {
            "recurring_transactions": [],
            "suspicious_activities": [],
            "spending_categories": {}
          }
        }
        """.trimIndent()
    }
    
    fun getAvailableProviders(): List<String> {
        return providers.keys.toList()
    }
    
    fun isProviderAvailable(providerName: String): Boolean {
        return providers.containsKey(providerName)
    }
}

data class LLMProvider(
    val name: String,
    val apiKey: String,
    val endpoint: String,
    val model: String,
    val isAvailable: Boolean = true
)

enum class ProcessingStrategy {
    ECONOMIC,    // Use cheapest provider
    BALANCED,    // Balance cost and quality
    PREMIUM,     // Use best available model
    MULTI_VALIDATION // Cross-validate with multiple providers
}

class LLMException(message: String, cause: Throwable? = null) : Exception(message, cause)