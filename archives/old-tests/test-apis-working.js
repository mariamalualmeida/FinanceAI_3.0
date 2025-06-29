// Teste direto das APIs funcionando
const GEMINI_KEY = "AIzaSyBRQDmpuWiowgl7QEhDNc9d-W04mlQUMbw";
const OPENAI_KEY = "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";

console.log('🔥 TESTE DIRETO DAS APIS FUNCIONANDO');
console.log('===================================');

// Teste OpenAI
async function testOpenAI() {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: OPENAI_KEY });
    
    console.log('🔄 Testando OpenAI GPT-4o...');
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: "Analise um extrato Nubank com 7 transações, saldo R$ 2.594,86. Retorne só: OPENAI FUNCIONANDO - Score: [0-100]"
      }],
      max_tokens: 50
    });
    
    const result = response.choices[0].message.content;
    console.log(`✅ OpenAI: ${result}`);
    return true;
    
  } catch (error) {
    console.log(`❌ OpenAI erro: ${error.message}`);
    return false;
  }
}

// Teste Gemini
async function testGemini() {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    
    console.log('🔄 Testando Gemini 2.5...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Analise extrato Nubank 7 transações R$ 2.594,86. Retorne só: GEMINI FUNCIONANDO - Score: [0-100]"
    });
    
    const result = response.text;
    console.log(`✅ Gemini: ${result}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Gemini erro: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const openaiOK = await testOpenAI();
  const geminiOK = await testGemini();
  
  console.log('\n🎯 RESULTADO:');
  console.log(`OpenAI: ${openaiOK ? '✅' : '❌'}`);
  console.log(`Gemini: ${geminiOK ? '✅' : '❌'}`);
  
  if (openaiOK || geminiOK) {
    console.log('\n🚀 PELO MENOS UMA API FUNCIONANDO!');
    console.log('Sistema pode usar LLMs externos para análise avançada');
  }
}

runTests().catch(console.error);