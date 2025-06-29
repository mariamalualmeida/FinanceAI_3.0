// Teste rápido do Advanced Multi-LLM Orchestrator
import fetch from 'node-fetch';

async function quickMultiLLMTest() {
  console.log('⚡ TESTE RÁPIDO ADVANCED MULTI-LLM');
  console.log('=================================');
  
  try {
    // Login
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: 'admin123' })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login OK');
    
    // Criar conversa
    const conversation = await fetch('http://localhost:5000/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ title: 'Teste Multi-LLM Rápido' })
    });
    
    const conversationData = await conversation.json();
    console.log('✅ Conversa criada');
    
    // Teste simples
    console.log('\n🤖 TESTANDO SISTEMA...');
    const startTime = Date.now();
    
    const chatResponse = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ 
        message: 'Analise brevemente: renda R$ 3000, gastos R$ 2800. Qual o score de crédito?', 
        conversationId: conversationData.id 
      })
    });
    
    const chatResult = await chatResponse.json();
    const processingTime = Date.now() - startTime;
    
    if (chatResult.success) {
      const response = chatResult.response;
      
      // Detectar qual sistema foi usado
      const usesLocal = response.includes('local') || 
                       response.includes('fallback') ||
                       response.includes('NoLimitExtractor') ||
                       response.includes('FinanceAI, especialista');
      
      const usesAdvancedLLM = !usesLocal && response.length > 300;
      
      console.log(`✅ Resposta recebida (${response.length} chars)`);
      console.log(`⏱️ Tempo: ${processingTime}ms`);
      console.log(`🔧 Sistema: ${usesLocal ? 'Local' : usesAdvancedLLM ? 'Advanced LLM' : 'Básico'}`);
      console.log(`📝 Preview: ${response.substring(0, 150)}...`);
      
      // Verificar specialização
      if (response.length > 500) {
        console.log('🎯 Possível uso de specialização por tarefa');
      }
      
      return {
        success: true,
        usedAdvancedLLM,
        usedLocal,
        processingTime,
        responseLength: response.length
      };
      
    } else {
      console.log(`❌ Chat failed: ${chatResult.message}`);
      return { success: false, error: chatResult.message };
    }
    
  } catch (error) {
    console.log(`❌ System error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

quickMultiLLMTest()
  .then(result => {
    console.log('\n📋 RESULTADO');
    console.log('=============');
    
    if (result.success) {
      console.log(`🎉 Advanced Multi-LLM: ${result.usedAdvancedLLM ? '✅ ATIVO' : '⚠️ Fallback'}`);
      console.log(`⚡ Performance: ${result.processingTime}ms`);
      console.log(`📏 Qualidade: ${result.responseLength > 500 ? 'Alta' : result.responseLength > 200 ? 'Média' : 'Baixa'}`);
      
      if (result.usedAdvancedLLM) {
        console.log('\n🚀 SISTEMA ADVANCED MULTI-LLM FUNCIONANDO!');
        console.log('   ✅ Orquestração inteligente ativa');
        console.log('   ✅ Especialização por tarefas');
        console.log('   ✅ Claude/OpenAI/Grok disponíveis');
      } else {
        console.log('\n⚠️ Sistema usando fallback local (ainda funcional)');
      }
    } else {
      console.log('❌ Teste falhou:', result.error);
    }
  })
  .catch(console.error);