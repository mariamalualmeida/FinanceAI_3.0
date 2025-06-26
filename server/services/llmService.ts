interface LLMService {
  generateChatResponse(
    content: string,
    provider: string,
    context: string,
    apiKey?: string
  ): Promise<string>;
  
  generateFinancialReport(
    analysisData: any,
    provider: string,
    apiKey?: string
  ): Promise<string>;
}

class MockLLMService implements LLMService {
  async generateChatResponse(
    content: string,
    provider: string,
    context: string,
    apiKey?: string
  ): Promise<string> {
    // Simulate AI response for financial queries
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    if (content.toLowerCase().includes('análise') || content.toLowerCase().includes('financeiro')) {
      return `Entendi sua solicitação sobre análise financeira. Para fornecer uma análise precisa, vou precisar que você faça upload dos documentos financeiros relevantes (extratos bancários, faturas de cartão, comprovantes de renda).

Com base nos documentos, posso ajudar com:
• Análise detalhada de entradas e saídas
• Identificação de padrões de gastos
• Detecção de movimentações suspeitas
• Cálculo de score de crédito
• Relatórios profissionais personalizados

Por favor, use o botão de anexo para enviar seus documentos e começaremos a análise.`;
    }
    
    if (content.toLowerCase().includes('upload') || content.toLowerCase().includes('documento')) {
      return `Para fazer upload de documentos, clique no ícone de clipe de papel (📎) ao lado da caixa de mensagem. 

Aceito os seguintes formatos:
• PDF (extratos, faturas, contracheques)
• Excel/CSV (planilhas financeiras)
• Imagens (JPG, PNG de documentos)

Após o upload, processarei automaticamente os dados e fornecerei uma análise completa com insights sobre sua situação financeira.`;
    }
    
    return `Olá! Sou seu assistente de análise financeira inteligente. Posso ajudar com:

• **Análise de Extratos**: Processe extratos bancários para identificar padrões de gastos
• **Detecção de Riscos**: Identifique apostas e movimentações suspeitas  
• **Score de Crédito**: Calcule sua pontuação de crédito com base nos dados
• **Relatórios Detalhados**: Gere análises profissionais para apresentações

Como posso ajudar você hoje? Envie documentos financeiros ou faça perguntas específicas sobre análise financeira.`;
  }

  async generateFinancialReport(
    analysisData: any,
    provider: string,
    apiKey?: string
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `# Relatório de Análise Financeira

## Resumo Executivo
Com base na análise dos documentos fornecidos, identificamos os principais padrões financeiros e oportunidades de melhoria.

## Principais Insights
• Padrão de gastos analisado
• Score de crédito calculado
• Riscos identificados
• Recomendações personalizadas

## Próximos Passos
1. Revisar as recomendações destacadas
2. Implementar estratégias de otimização
3. Monitorar progresso mensalmente

*Relatório gerado automaticamente pelo FinanceAI*`;
  }
}

export const llmService = new MockLLMService();