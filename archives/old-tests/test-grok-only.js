// Teste isolado do Grok
const XAI_KEY = process.env.XAI_API_KEY;

console.log('⚡ TESTE ISOLADO GROK (XAI)');
console.log('==========================');

async function testGrokOnly() {
  if (!XAI_KEY) {
    console.log('❌ XAI_API_KEY não configurada');
    return false;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: XAI_KEY
    });
    
    console.log('🔄 Testando Grok-2 com prompt simples...');
    
    const response = await client.chat.completions.create({
      model: "grok-2-1212",
      messages: [{
        role: "user",
        content: "Analise extrato Nubank: 7 transações, R$ 2.594,86. JSON: {\"score\": numero, \"risco\": \"baixo/medio/alto\"}"
      }],
      max_tokens: 100
    });
    
    const result = response.choices[0].message.content;
    console.log('✅ Grok Result:');
    console.log(result);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Grok Error: ${error.message}`);
    return false;
  }
}

testGrokOnly().then(success => {
  console.log(`\n🎯 Grok Status: ${success ? '✅ FUNCIONANDO' : '❌ FALHA'}`);
}).catch(console.error);