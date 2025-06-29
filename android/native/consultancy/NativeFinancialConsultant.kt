/**
 * Native Financial Consultant for Android APK
 * Implementa consultoria financeira 100% offline com planos de ação nativos
 */
package com.financeai.consultancy

import androidx.room.*
import kotlinx.coroutines.*
import org.json.JSONObject
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.*

// Entidades de banco de dados
@Entity(tableName = "client_profiles")
data class ClientProfileEntity(
    @PrimaryKey val id: String,
    val name: String,
    val age: Int,
    val monthlyIncome: Double,
    val familySize: Int,
    val region: String,
    val profession: String,
    val riskProfile: String, // conservative, moderate, aggressive
    val financialGoals: String, // JSON array
    val currentDebts: Double,
    val currentSavings: Double,
    val emergencyFund: Double,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "financial_goals")
data class FinancialGoalEntity(
    @PrimaryKey val id: String,
    val clientId: String,
    val title: String,
    val description: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val targetDate: String,
    val priority: String, // high, medium, low
    val category: String, // emergency, debt, investment, purchase, retirement
    val status: String, // active, completed, paused
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "action_plans")
data class ActionPlanEntity(
    @PrimaryKey val id: String,
    val clientId: String,
    val goalId: String?,
    val title: String,
    val description: String,
    val timeframe: String, // short, medium, long
    val steps: String, // JSON array
    val metrics: String, // JSON array
    val status: String, // active, completed, cancelled
    val createdAt: Long,
    val updatedAt: Long
)

// Classes de dados para trabalho interno
data class BrazilianClientProfile(
    val id: String,
    val name: String,
    val age: Int,
    val monthlyIncome: Double,
    val familySize: Int,
    val region: String,
    val profession: String,
    val riskProfile: String,
    val financialGoals: List<String>,
    val currentDebts: Double,
    val currentSavings: Double,
    val emergencyFund: Double
)

data class ActionStep(
    val id: String,
    val title: String,
    val description: String,
    val targetDate: String,
    val completed: Boolean,
    val category: String,
    val priority: Int,
    val estimatedImpact: Int
)

data class PlanMetric(
    val id: String,
    val name: String,
    val currentValue: Double,
    val targetValue: Double,
    val unit: String
)

// Consultor Financeiro Nativo
class NativeFinancialConsultant {
    
    companion object {
        private const val TAG = "NativeFinancialConsultant"
        
        // Prompts do Mig em Kotlin
        private const val MIG_PERSONALITY = """
Você é Mig, um consultor financeiro especializado com mais de 15 anos de experiência no mercado brasileiro.

ESPECIALIDADES:
- Análise de crédito e scoring
- Consultoria financeira personalizada
- Gestão de risco e compliance
- Economia brasileira e mercado financeiro
- Administração e planejamento financeiro

PERSONALIDADE:
- Educado e prestativo
- Comunicação clara e objetiva
- Foco em soluções práticas
- Conhecimento profundo do mercado brasileiro
- Capacidade de simplificar conceitos complexos
"""
    }
    
    /**
     * Gera análise financeira completa usando prompts do Mig
     */
    suspend fun generateMigAnalysis(clientProfile: BrazilianClientProfile): String {
        return withContext(Dispatchers.IO) {
            val score = calculateCreditScore(clientProfile)
            val riskLevel = assessRiskLevel(score)
            val strengths = identifyStrengths(clientProfile)
            val weaknesses = identifyWeaknesses(clientProfile)
            val recommendations = generateBrazilianRecommendations(clientProfile, riskLevel)
            
            """
            **Análise do Mig - Consultor Financeiro Especializado**
            
            Olá ${clientProfile.name}, sou o Mig, seu consultor financeiro especializado. Após analisar seu perfil, aqui está minha avaliação:
            
            **SITUAÇÃO ATUAL:**
            - Renda mensal: R$ ${formatCurrency(clientProfile.monthlyIncome)}
            - Perfil profissional: ${clientProfile.profession}
            - Score de crédito calculado: $score
            - Nível de risco: ${riskLevel.uppercase()}
            
            **PONTOS FORTES:**
            ${strengths.joinToString("\n") { "• $it" }}
            
            **ÁREAS DE MELHORIA:**
            ${weaknesses.joinToString("\n") { "• $it" }}
            
            **RECOMENDAÇÕES PRIORITÁRIAS:**
            ${recommendations.take(3).joinToString("\n") { "• $it" }}
            
            Estou aqui para ajudá-lo a alcançar seus objetivos financeiros com estratégias práticas e adaptadas à realidade brasileira.
            
            Atenciosamente,
            **Mig - Consultor Financeiro**
            """.trimIndent()
        }
    }
    
    /**
     * Cria plano de ação personalizado para realidade brasileira
     */
    suspend fun generateActionPlan(clientProfile: BrazilianClientProfile): List<ActionStep> {
        return withContext(Dispatchers.IO) {
            val currentTime = System.currentTimeMillis()
            val steps = mutableListOf<ActionStep>()
            
            // Passo 1: Auditoria Financeira Completa
            steps.add(
                ActionStep(
                    id = "step_${currentTime}_1",
                    title = "Auditoria Financeira Completa",
                    description = "Mapear todos os gastos, receitas e compromissos financeiros",
                    targetDate = addDaysToDate(Date(), 7),
                    completed = false,
                    category = "budget",
                    priority = 1,
                    estimatedImpact = 9
                )
            )
            
            // Passo 2: Controle de Gastos Mensais
            steps.add(
                ActionStep(
                    id = "step_${currentTime}_2",
                    title = "Implementar Controle de Gastos",
                    description = "Estabelecer orçamento mensal com categorias específicas",
                    targetDate = addDaysToDate(Date(), 14),
                    completed = false,
                    category = "budget",
                    priority = 2,
                    estimatedImpact = 8
                )
            )
            
            // Passo 3: Quitação de Dívidas Caras (se aplicável)
            if (clientProfile.currentDebts > 0) {
                steps.add(
                    ActionStep(
                        id = "step_${currentTime}_3",
                        title = "Negociar e Quitar Dívidas",
                        description = "Priorizar dívidas com juros altos (cartão, cheque especial)",
                        targetDate = addDaysToDate(Date(), 21),
                        completed = false,
                        category = "debt",
                        priority = 3,
                        estimatedImpact = 10
                    )
                )
            }
            
            // Passo 4: Formar Reserva de Emergência
            steps.add(
                ActionStep(
                    id = "step_${currentTime}_4",
                    title = "Formar Reserva de Emergência",
                    description = "Poupar mensalmente para atingir reserva ideal",
                    targetDate = addDaysToDate(Date(), 180), // 6 meses
                    completed = false,
                    category = "saving",
                    priority = 4,
                    estimatedImpact = 9
                )
            )
            
            steps
        }
    }
    
    /**
     * Gera métricas de acompanhamento
     */
    suspend fun generateMetrics(clientProfile: BrazilianClientProfile): List<PlanMetric> {
        return withContext(Dispatchers.IO) {
            val currentTime = System.currentTimeMillis()
            val metrics = mutableListOf<PlanMetric>()
            
            metrics.add(
                PlanMetric(
                    id = "metric_${currentTime}_1",
                    name = "Taxa de Poupança Mensal",
                    currentValue = (clientProfile.currentSavings / clientProfile.monthlyIncome) * 100,
                    targetValue = 20.0, // 20% da renda
                    unit = "%"
                )
            )
            
            metrics.add(
                PlanMetric(
                    id = "metric_${currentTime}_2",
                    name = "Relação Dívida/Renda",
                    currentValue = (clientProfile.currentDebts / clientProfile.monthlyIncome) * 100,
                    targetValue = 0.0, // Zero dívidas
                    unit = "%"
                )
            )
            
            metrics
        }
    }
    
    // Métodos auxiliares privados
    
    private fun calculateCreditScore(profile: BrazilianClientProfile): Int {
        var score = 500 // Base score
        
        // Fator renda
        when {
            profile.monthlyIncome >= 10000 -> score += 150
            profile.monthlyIncome >= 5000 -> score += 100
            profile.monthlyIncome >= 2000 -> score += 50
        }
        
        // Fator dívidas
        val debtRatio = profile.currentDebts / profile.monthlyIncome
        when {
            debtRatio == 0.0 -> score += 100
            debtRatio <= 0.3 -> score += 50
            debtRatio <= 0.5 -> score += 0
            else -> score -= 100
        }
        
        // Fator reserva
        val emergencyMonths = profile.emergencyFund / (profile.monthlyIncome * 0.7)
        when {
            emergencyMonths >= 6 -> score += 100
            emergencyMonths >= 3 -> score += 50
            emergencyMonths >= 1 -> score += 25
        }
        
        // Fator idade (experiência financeira)
        when {
            profile.age >= 35 -> score += 50
            profile.age >= 25 -> score += 25
        }
        
        // Fator profissional
        when {
            profile.profession.contains("funcionário público", true) -> score += 50
            profile.profession.contains("CLT", true) -> score += 25
        }
        
        return maxOf(0, minOf(score, 1000)) // Entre 0 e 1000
    }
    
    private fun assessRiskLevel(score: Int): String {
        return when {
            score >= 700 -> "low"
            score >= 400 -> "medium"
            else -> "high"
        }
    }
    
    private fun identifyStrengths(profile: BrazilianClientProfile): List<String> {
        val strengths = mutableListOf<String>()
        if (profile.emergencyFund > 0) strengths.add("Possui reserva de emergência")
        if (profile.currentDebts == 0.0) strengths.add("Sem dívidas pendentes")
        if (profile.monthlyIncome >= 5000) strengths.add("Boa capacidade de renda")
        if (profile.age >= 30) strengths.add("Experiência e maturidade financeira")
        return strengths
    }
    
    private fun identifyWeaknesses(profile: BrazilianClientProfile): List<String> {
        val weaknesses = mutableListOf<String>()
        if (profile.emergencyFund < profile.monthlyIncome * 3) weaknesses.add("Reserva de emergência insuficiente")
        if (profile.currentDebts > 0) weaknesses.add("Presença de dívidas")
        if (profile.currentSavings < profile.monthlyIncome) weaknesses.add("Baixa capacidade de poupança")
        return weaknesses
    }
    
    private fun generateBrazilianRecommendations(profile: BrazilianClientProfile, riskLevel: String): List<String> {
        val recommendations = mutableListOf<String>()
        
        when (riskLevel) {
            "high" -> {
                recommendations.add("Priorizar formação de reserva de emergência de R$ 1.000")
                recommendations.add("Renegociar dívidas em feirões ou com desconto à vista")
                recommendations.add("Revisar gastos mensais e cortar supérfluos")
                recommendations.add("Buscar renda extra através de trabalhos complementares")
            }
            "medium" -> {
                recommendations.add("Expandir reserva de emergência para 3-6 meses de gastos")
                recommendations.add("Considerar investimentos em Tesouro SELIC para liquidez")
                recommendations.add("Implementar controle rigoroso de orçamento mensal")
                recommendations.add("Avaliar seguros básicos (vida, saúde)")
            }
            "low" -> {
                recommendations.add("Diversificar investimentos em CDB, LCI/LCA")
                recommendations.add("Considerar Tesouro IPCA para proteção inflacionária")
                recommendations.add("Avaliar investimentos em fundos imobiliários")
                recommendations.add("Planejar aposentadoria complementar")
            }
        }
        
        return recommendations
    }
    
    private fun addDaysToDate(date: Date, days: Int): String {
        val calendar = Calendar.getInstance()
        calendar.time = date
        calendar.add(Calendar.DAY_OF_YEAR, days)
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.time)
    }
    
    private fun formatCurrency(amount: Double): String {
        return String.format(Locale("pt", "BR"), "%.2f", amount)
    }
}