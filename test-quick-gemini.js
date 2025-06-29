// Teste rápido do Gemini
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

async function quickGeminiTest() {
  console.log('🔧 TESTE RÁPIDO GEMINI');
  console.log('======================');
  
  const ai = new GoogleGenAI({ apiKey: 'AIzaSyBt5tBqkHSjo7Tdlhc2Ajl9B2ddPnYV4XI' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Responda: "Gemini OK"'
    });
    
    console.log(`✅ Gemini funcionando: ${response.text}`);
    return true;
  } catch (error) {
    console.log(`❌ Gemini erro: ${error.message}`);
    return false;
  }
}

async function testLocalSystem() {
  console.log('\n🤖 TESTE SISTEMA LOCAL');
  console.log('=======================');
  
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
      body: JSON.stringify({ title: 'Teste' })
    });
    
    const conversationData = await conversation.json();
    console.log('✅ Conversa criada');
    
    const chatResponse = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ 
        message: 'Teste simples', 
        conversationId: conversationData.id 
      })
    });
    
    const chatResult = await chatResponse.json();
    
    if (chatResult.success) {
      const isLocal = chatResult.response.includes('local') || 
                     chatResult.response.includes('fallback');
      console.log(`✅ Chat OK - Sistema: ${isLocal ? 'Local' : 'API Externa'}`);
      return { success: true, isLocal };
    } else {
      console.log(`❌ Chat falhou: ${chatResult.message}`);
      return { success: false };
    }
    
  } catch (error) {
    console.log(`❌ Sistema erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runQuickTest() {
  console.log('⚡ TESTE RÁPIDO COMPLETO');
  console.log('========================');
  
  const geminiWorking = await quickGeminiTest();
  const systemTest = await testLocalSystem();
  
  console.log('\n📋 RESULTADO');
  console.log('=============');
  console.log(`🌐 Gemini API: ${geminiWorking ? '✅' : '❌'}`);
  console.log(`🤖 Sistema FinanceAI: ${systemTest.success ? '✅' : '❌'}`);
  
  if (systemTest.success) {
    console.log(`🔧 Modo atual: ${systemTest.isLocal ? 'Local (fallback)' : 'API Externa'}`);
  }
  
  if (geminiWorking && systemTest.success) {
    if (systemTest.isLocal) {
      console.log('\n💡 GEMINI FUNCIONA MAS SISTEMA USA LOCAL');
      console.log('   Possível causa: Orquestrador ainda em modo fallback');
      console.log('   Solução: Reiniciar sistema ou ajustar configuração');
    } else {
      console.log('\n🎉 GEMINI INTEGRADO E FUNCIONANDO!');
    }
  } else if (!geminiWorking) {
    console.log('\n❌ PROBLEMA COM GEMINI API');
    console.log('   Verificar: Chave API válida');
    console.log('   Verificar: Créditos disponíveis');
  } else if (!systemTest.success) {
    console.log('\n❌ PROBLEMA COM FINANCEAI');
    console.log('   Verificar: Servidor rodando');
    console.log('   Verificar: Banco de dados');
  }
  
  return { geminiWorking, systemWorking: systemTest.success };
}

runQuickTest()
  .then(result => {
    console.log('\n🎯 TESTE CONCLUÍDO');
    console.log(`Status: Gemini ${result.geminiWorking ? '✅' : '❌'} | Sistema ${result.systemWorking ? '✅' : '❌'}`);
  })
  .catch(console.error);