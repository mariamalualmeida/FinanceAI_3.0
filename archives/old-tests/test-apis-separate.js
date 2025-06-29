// Teste separado das APIs Gemini e Grok
import fs from 'fs';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const XAI_KEY = process.env.XAI_API_KEY;

console.log('🧪 TESTE SEPARADO DAS APIS');
console.log('==========================');

// Teste 1: Gemini API
async function testGeminiAPI() {
  console.log('\n=== TESTE GEMINI API ===');
  
  if (!GEMINI_KEY) {
    console.log('❌ GEMINI_API_KEY não configurado');
    return false;
  }
  
  try {
    const { GoogleGenAI } = await import('@google/genai');
    
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    
    console.log('🔄 Testando Gemini com prompt simples...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Responda apenas: GEMINI FUNCIONANDO"
    });
    
    const text = response.text || 'Sem resposta';
    console.log(`✅ Gemini Response: ${text}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Erro Gemini: ${error.message}`);
    return false;
  }
}

// Teste 2: Grok/xAI API  
async function testGrokAPI() {
  console.log('\n=== TESTE GROK/XAI API ===');
  
  if (!XAI_KEY) {
    console.log('❌ XAI_API_KEY não configurado');
    return false;
  }
  
  try {
    const OpenAI = (await import('openai')).default;
    
    const client = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: XAI_KEY
    });
    
    console.log('🔄 Testando Grok com prompt simples...');
    
    const response = await client.chat.completions.create({
      model: "grok-2-1212",
      messages: [{ role: "user", content: "Responda apenas: GROK FUNCIONANDO" }],
      max_tokens: 50
    });
    
    const text = response.choices[0]?.message?.content || 'Sem resposta';
    console.log(`✅ Grok Response: ${text}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Erro Grok: ${error.message}`);
    return false;
  }
}

// Teste 3: Análise de Documento com APIs
async function testDocumentAnalysis() {
  console.log('\n=== TESTE ANÁLISE DE DOCUMENTO COM APIS ===');
  
  const testFile = 'attached_assets/Nubank_2025-05-24_1751172520674.pdf';
  
  if (!fs.existsSync(testFile)) {
    console.log('❌ Arquivo de teste não encontrado');
    return;
  }
  
  console.log(`📄 Testando análise do arquivo: ${testFile}`);
  
  // Teste com Gemini se disponível
  if (GEMINI_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
      
      console.log('🔄 Analisando com Gemini...');
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", 
        contents: `Analise este documento financeiro: Nubank_2025-05-24. 
        Responda em JSON com: {"banco": "nome", "transacoes": numero, "saldo": valor}`,
      });
      
      const analysis = response.text || 'Análise indisponível';
      console.log(`✅ Análise Gemini: ${analysis.substring(0, 200)}...`);
      
    } catch (error) {
      console.log(`❌ Erro análise Gemini: ${error.message}`);
    }
  }
  
  // Teste com Grok se disponível
  if (XAI_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({
        baseURL: "https://api.x.ai/v1", 
        apiKey: XAI_KEY
      });
      
      console.log('🔄 Analisando com Grok...');
      
      const response = await client.chat.completions.create({
        model: "grok-2-1212",
        messages: [{
          role: "user", 
          content: `Analise este extrato bancário do Nubank de maio 2025. 
          Responda em JSON com banco, número de transações e saldo estimado.`
        }],
        max_tokens: 300
      });
      
      const analysis = response.choices[0]?.message?.content || 'Análise indisponível';
      console.log(`✅ Análise Grok: ${analysis.substring(0, 200)}...`);
      
    } catch (error) {
      console.log(`❌ Erro análise Grok: ${error.message}`);
    }
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('Iniciando testes das APIs...\n');
  
  const geminiWorking = await testGeminiAPI();
  const grokWorking = await testGrokAPI();
  
  await testDocumentAnalysis();
  
  console.log('\n🎯 RESUMO DOS TESTES:');
  console.log('=====================');
  console.log(`Gemini API: ${geminiWorking ? '✅ FUNCIONANDO' : '❌ FALHA'}`);
  console.log(`Grok API: ${grokWorking ? '✅ FUNCIONANDO' : '❌ FALHA'}`);
  
  if (!geminiWorking && !grokWorking) {
    console.log('\n⚠️ NENHUMA API EXTERNA FUNCIONANDO');
    console.log('Sistema continua operacional com NoLimitExtractor');
  } else {
    console.log('\n✅ PELO MENOS UMA API FUNCIONANDO');
    console.log('Sistema pode usar LLMs externos para análise avançada');
  }
}

runAllTests().catch(console.error);