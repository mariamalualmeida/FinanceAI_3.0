// Teste direto com chave hardcoded para testar Gemini
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

const GEMINI_KEY = 'AIzaSyBt5tBqkHSjo7Tdlhc2Ajl9B2ddPnYV4XI';

async function testGeminiWithDirectKey() {
  console.log('🔧 TESTE GEMINI COM CHAVE DIRETA');
  console.log('================================');
  
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Responda em português: Como você pode ajudar na análise financeira?'
    });
    
    console.log('✅ Gemini Response:');
    console.log(response.text);
    
    return true;
  } catch (error) {
    console.log('❌ Gemini Error:', error.message);
    return false;
  }
}

async function testSystemWithGeminiIntegration() {
  console.log('\n🔧 TESTE SISTEMA COM CHAVE CONFIGURADA');
  console.log('======================================');
  
  // Definir a chave de ambiente manualmente
  process.env.GEMINI_API_KEY = GEMINI_KEY;
  
  try {
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: 'admin123' })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login OK');
    
    const conversation = await fetch('http://localhost:5000/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ title: 'Teste Gemini Direto' })
    });
    
    const conversationData = await conversation.json();
    console.log('✅ Conversa criada');
    
    const chatResponse = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ 
        message: 'Teste: Você consegue processar análise financeira complexa com Gemini?', 
        conversationId: conversationData.id 
      })
    });
    
    const chatResult = await chatResponse.json();
    
    if (chatResult.success) {
      const response = chatResult.response;
      
      // Verificar se usou sistema local ou API externa
      const usesLocal = response.includes('local') || 
                       response.includes('fallback') ||
                       response.includes('temporarily disabled');
      
      const usesGemini = !usesLocal && (
        response.length > 500 ||
        response.includes('análise detalhada') ||
        !response.includes('FinanceAI, especialista')
      );
      
      console.log(`✅ Chat Response (${response.length} chars)`);
      console.log(`🤖 System Used: ${usesLocal ? 'Local' : usesGemini ? 'Gemini' : 'Unknown'}`);
      console.log(`📝 Preview: ${response.substring(0, 150)}...`);
      
      return { success: true, usedGemini: usesGemini, usedLocal: usesLocal };
      
    } else {
      console.log(`❌ Chat failed: ${chatResult.message}`);
      return { success: false, error: chatResult.message };
    }
    
  } catch (error) {
    console.log(`❌ System error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTest() {
  console.log('🚀 TESTE GEMINI INTEGRAÇÃO COMPLETA');
  console.log('===================================');
  
  const directTest = await testGeminiWithDirectKey();
  const systemTest = await testSystemWithGeminiIntegration();
  
  console.log('\n📋 RESULTADO FINAL');
  console.log('==================');
  
  console.log(`🌐 Gemini API Direct: ${directTest ? '✅' : '❌'}`);
  console.log(`🤖 System Integration: ${systemTest.success ? '✅' : '❌'}`);
  
  if (systemTest.success) {
    console.log(`🔧 Using Gemini: ${systemTest.usedGemini ? '✅' : '❌'}`);
    console.log(`🔧 Using Local: ${systemTest.usedLocal ? '✅' : '❌'}`);
    
    if (systemTest.usedGemini) {
      console.log('\n🎉 SUCESSO! GEMINI INTEGRADO AO SISTEMA!');
      console.log('   ✅ API Gemini funcionando');
      console.log('   ✅ Sistema usando Gemini como principal');
      console.log('   ✅ Respostas mais elaboradas');
    } else if (systemTest.usedLocal) {
      console.log('\n⚠️ GEMINI FUNCIONA MAS SISTEMA USA LOCAL');
      console.log('   ✅ API Gemini disponível');
      console.log('   ❌ Sistema não detectou/usou Gemini');
      console.log('   💡 Necessário ajustar orquestrador');
    }
  } else {
    console.log('\n❌ PROBLEMA NO SISTEMA');
    console.log(`   Error: ${systemTest.error}`);
  }
  
  return { directTest, systemTest };
}

runTest()
  .then(result => {
    console.log('\n🎯 TESTE FINALIZADO');
    
    if (result.directTest && result.systemTest.success && result.systemTest.usedGemini) {
      console.log('🎉 GEMINI 100% INTEGRADO AO FINANCEAI!');
    } else if (result.directTest) {
      console.log('⚠️ GEMINI DISPONÍVEL MAS PRECISA INTEGRAÇÃO');
    } else {
      console.log('❌ PROBLEMAS COM GEMINI API');
    }
  })
  .catch(console.error);