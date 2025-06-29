interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface CrossValidationConfig {
  enableAutoValidation: boolean;
  complexityThreshold: number;
  minimumConfidence: number;
  maxValidationAttempts: number;
}

export class CrossValidationSystem {
  private config: CrossValidationConfig = {
    enableAutoValidation: true,
    complexityThreshold: 0.7,
    minimumConfidence: 0.8,
    maxValidationAttempts: 3
  };

  private multiLLMOrchestrator: any;

  constructor(orchestrator: any) {
    this.multiLLMOrchestrator = orchestrator;
  }

  async validateExtraction(
    originalContent: string,
    extractedData: any,
    bankDetected: string
  ): Promise<ValidationResult> {
    
    const complexity = this.calculateComplexity(originalContent);
    const extractionConfidence = extractedData.summary?.accuracy || 0;

    // Determinar se precisa de validação
    const needsValidation = this.shouldValidate(complexity, extractionConfidence);
    
    if (!needsValidation) {
      return {
        isValid: true,
        score: extractionConfidence,
        issues: [],
        suggestions: []
      };
    }

    // Executar validação cruzada
    return await this.performCrossValidation(originalContent, extractedData, bankDetected);
  }

  private calculateComplexity(content: string): number {
    let complexityScore = 0;
    
    // Fatores de complexidade
    const factors = [
      { pattern: /[^\x00-\x7F]/g, weight: 0.1 }, // Caracteres especiais
      { pattern: /\d{2}\/\d{2}\/\d{4}/g, weight: 0.05 }, // Múltiplas datas
      { pattern: /R\$\s*[\d.,]+/g, weight: 0.03 }, // Múltiplos valores
      { pattern: /\n/g, weight: 0.001 }, // Linhas múltiplas
      { pattern: /[A-Z]{2,}/g, weight: 0.02 }, // Texto em maiúsculas
    ];

    for (const factor of factors) {
      const matches = content.match(factor.pattern);
      if (matches) {
        complexityScore += matches.length * factor.weight;
      }
    }

    // Normalizar entre 0 e 1
    return Math.min(complexityScore, 1);
  }

  private shouldValidate(complexity: number, confidence: number): boolean {
    if (!this.config.enableAutoValidation) return false;
    
    return complexity > this.config.complexityThreshold || 
           confidence < this.config.minimumConfidence;
  }

  private async performCrossValidation(
    content: string,
    originalData: any,
    bankCode: string
  ): Promise<ValidationResult> {
    
    try {
      const validationPrompt = this.buildValidationPrompt(content, originalData, bankCode);
      
      // Usar Multi-LLM para validação
      const validationResponse = await this.multiLLMOrchestrator.processRequest(
        validationPrompt,
        'documentValidation',
        { 
          requireStructuredOutput: true,
          preferredProvider: 'anthropic',
          fallbackProviders: ['openai', 'grok']
        }
      );

      return this.parseValidationResponse(validationResponse, originalData);
      
    } catch (error) {
      console.error('[CrossValidation] Erro na validação:', error);
      return {
        isValid: false,
        score: 0.3,
        issues: ['Erro na validação cruzada'],
        suggestions: ['Revisar dados manualmente']
      };
    }
  }

  private buildValidationPrompt(content: string, extractedData: any, bank: string): string {
    return `
Analise esta extração de dados financeiros e valide sua precisão:

BANCO DETECTADO: ${bank}
DOCUMENTO ORIGINAL: 
${content.substring(0, 2000)}...

DADOS EXTRAÍDOS:
- Total de transações: ${extractedData.transactions?.length || 0}
- Saldo final: R$ ${extractedData.summary?.finalBalance || 0}
- Total créditos: R$ ${extractedData.summary?.totalCredits || 0}
- Total débitos: R$ ${extractedData.summary?.totalDebits || 0}

TRANSAÇÕES EXEMPLO:
${extractedData.transactions?.slice(0, 3).map((t: any) => 
  `${t.date} - ${t.description} - R$ ${t.amount} (${t.type})`
).join('\n') || 'Nenhuma transação'}

VALIDE:
1. O banco foi identificado corretamente?
2. Os valores monetários estão corretos?
3. As datas estão no formato adequado?
4. As descrições fazem sentido?
5. A categorização está apropriada?

Responda em JSON:
{
  "bankCorrect": boolean,
  "valuesAccurate": boolean,
  "datesValid": boolean,
  "descriptionsValid": boolean,
  "categorizationGood": boolean,
  "overallScore": number (0-100),
  "issues": ["lista de problemas encontrados"],
  "suggestions": ["lista de melhorias sugeridas"]
}
    `;
  }

  private parseValidationResponse(response: any, originalData: any): ValidationResult {
    try {
      const validation = typeof response === 'string' ? JSON.parse(response) : response;
      
      const isValid = validation.bankCorrect && 
                     validation.valuesAccurate && 
                     validation.datesValid && 
                     validation.descriptionsValid;

      return {
        isValid,
        score: validation.overallScore / 100,
        issues: validation.issues || [],
        suggestions: validation.suggestions || []
      };
      
    } catch (error) {
      // Fallback: análise básica
      return this.basicValidation(originalData);
    }
  }

  private basicValidation(data: any): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 0.7;

    // Validações básicas
    if (!data.transactions || data.transactions.length === 0) {
      issues.push('Nenhuma transação foi extraída');
      score -= 0.3;
    }

    if (data.summary?.finalBalance === undefined) {
      issues.push('Saldo final não calculado');
      score -= 0.1;
    }

    if (data.transactions?.some((t: any) => !t.date || !t.description)) {
      issues.push('Algumas transações estão incompletas');
      score -= 0.2;
    }

    if (issues.length === 0) {
      suggestions.push('Extração aparenta estar correta');
    } else {
      suggestions.push('Revisar dados extraídos manualmente');
    }

    return {
      isValid: issues.length === 0,
      score: Math.max(score, 0),
      issues,
      suggestions
    };
  }

  updateConfig(newConfig: Partial<CrossValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CrossValidationConfig {
    return { ...this.config };
  }
}

export default CrossValidationSystem;