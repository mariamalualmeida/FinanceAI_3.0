// Teste específico para validar a nova chave OpenAI
import OpenAI from 'openai';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testOpenAIModels() {
  console.log('🔧 TESTE DETALHADO DA CHAVE OPENAI');
  console.log('================================');
  
  // Teste direto da API OpenAI
  console.log('\n1️⃣ TESTE DIRETO DA API OPENAI');
  console.log('============================');
  
  const openai = new OpenAI({
    apiKey: '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'
  });

  const testModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ];

  const workingModels = [];
  const failedModels = [];

  for (const model of testModels) {
    console.log(`\n🧪 Testando modelo: ${model}`);
    try {
      const startTime = Date.now();
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'user', content: 'Responda apenas: "OpenAI funcionando"' }
        ],
        max_tokens: 50
      });
      
      const endTime = Date.now();
      const responseText = response.choices[0].message.content;
      
      console.log(`   ✅ ${model}: ${endTime - startTime}ms`);
      console.log(`   📝 Resposta: ${responseText}`);
      
      workingModels.push({
        model,
        responseTime: endTime - startTime,
        response: responseText
      });
      
    } catch (error) {
      console.log(`   ❌ ${model}: ${error.message}`);
      failedModels.push({
        model,
        error: error.message,
        code: error.code
      });
    }
  }

  console.log('\n📊 RESULTADO DOS TESTES DIRETOS:');
  console.log(`✅ Modelos funcionando: ${workingModels.length}/${testModels.length}`);
  console.log(`❌ Modelos com erro: ${failedModels.length}/${testModels.length}`);

  if (workingModels.length > 0) {
    console.log('\n🎉 OPENAI FUNCIONANDO!');
    workingModels.forEach(m => {
      console.log(`   ✅ ${m.model}: ${m.responseTime}ms`);
    });
  }

  if (failedModels.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    failedModels.forEach(m => {
      console.log(`   ❌ ${m.model}: ${m.error}`);
    });
  }

  return { workingModels, failedModels };
}

async function testModelAccess(model) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 10
    });
    return { success: true, response: response.choices[0].message.content };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
}

async function findWorkingModel() {
  console.log('\n2️⃣ BUSCA PELO MELHOR MODELO DISPONÍVEL');
  console.log('=====================================');
  
  const modelsToTest = [
    'gpt-4o',
    'gpt-4o-mini', 
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ];

  for (const model of modelsToTest) {
    console.log(`🔍 Testando acesso ao ${model}...`);
    const result = await testModelAccess(model);
    
    if (result.success) {
      console.log(`✅ ${model} disponível!`);
      return model;
    } else {
      console.log(`❌ ${model}: ${result.error}`);
    }
  }
  
  return null;
}

async function testOpenAIComplete() {
  console.log('\n3️⃣ TESTE INTEGRADO NO SISTEMA FINANCEAI');
  console.log('======================================');
  
  // Login
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login realizado no FinanceAI');
  
  // Criar conversa
  const conversation = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ title: 'Teste OpenAI' })
  });
  
  const conversationData = await conversation.json();
  const conversationId = conversationData.id;
  console.log('✅ Conversa criada');
  
  // Teste com mensagem que força OpenAI
  const testMessages = [
    'Teste OpenAI: preciso de análise detalhada',
    'Análise financeira: tenho R$ 10.000 na conta',
    'OpenAI está funcionando agora?'
  ];
  
  const results = [];
  
  for (const message of testMessages) {
    console.log(`\n💬 Testando: ${message.substring(0, 40)}...`);
    
    try {
      const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
        body: JSON.stringify({ message, conversationId })
      });
      
      const chatResult = await chatResponse.json();
      
      if (chatResult.success) {
        const response = chatResult.response;
        
        // Verificar se OpenAI foi usado
        const usedOpenAI = !response.includes('local') && 
                          !response.includes('fallback') &&
                          !response.includes('APIs temporarily disabled');
        
        console.log(`   ✅ Resposta recebida (${response.length} chars)`);
        console.log(`   🤖 OpenAI usado: ${usedOpenAI ? 'SIM' : 'NÃO (fallback)'}`);
        console.log(`   📝 Preview: ${response.substring(0, 100)}...`);
        
        results.push({
          message: message.substring(0, 30),
          success: true,
          usedOpenAI,
          responseLength: response.length
        });
        
      } else {
        console.log(`   ❌ Falha: ${chatResult.message}`);
        results.push({
          message: message.substring(0, 30),
          success: false,
          error: chatResult.message
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      results.push({
        message: message.substring(0, 30),
        success: false,
        error: error.message
      });
    }
    
    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function runCompleteTest() {
  try {
    console.log('🚀 ANÁLISE COMPLETA DA CHAVE OPENAI FORNECIDA');
    console.log('=============================================');
    console.log('Chave: sk-proj-V8ff...N4A (truncada por segurança)');
    
    // Teste 1: API direta
    const directTest = await testOpenAIModels();
    
    // Teste 2: Melhor modelo
    const bestModel = await findWorkingModel();
    
    // Teste 3: Sistema integrado
    const systemTest = await testOpenAIComplete();
    
    // Análise final
    console.log('\n🎯 ANÁLISE FINAL');
    console.log('===============');
    
    const hasWorkingModels = directTest.workingModels.length > 0;
    const systemWorking = systemTest.filter(t => t.success).length > 0;
    const openaiUsed = systemTest.filter(t => t.usedOpenAI).length > 0;
    
    console.log(`🔑 Chave OpenAI válida: ${hasWorkingModels ? '✅' : '❌'}`);
    console.log(`🤖 Melhor modelo: ${bestModel || 'Nenhum disponível'}`);
    console.log(`🌐 Sistema integrado: ${systemWorking ? '✅' : '❌'}`);
    console.log(`⚡ OpenAI ativa no chat: ${openaiUsed ? '✅' : '❌'}`);
    
    if (hasWorkingModels) {
      console.log('\n🎉 SUCESSO! OpenAI está funcionando');
      console.log('   - Chave válida e ativa');
      console.log('   - Modelos acessíveis');
      console.log('   - Integração com FinanceAI possível');
      
      if (!openaiUsed) {
        console.log('\n💡 NOTA: Sistema ainda usando fallback local');
        console.log('   - Pode precisar reiniciar completamente');
        console.log('   - Verificar configuração do multi-LLM orchestrator');
      }
    } else {
      console.log('\n❌ PROBLEMA IDENTIFICADO');
      
      const errors = directTest.failedModels.map(m => m.error);
      const commonError = errors[0];
      
      if (commonError.includes('401')) {
        console.log('   - Erro 401: Chave inválida ou sem permissões');
      } else if (commonError.includes('429')) {
        console.log('   - Erro 429: Limite de taxa excedido');
      } else if (commonError.includes('insufficient_quota')) {
        console.log('   - Erro: Cota insuficiente na conta');
      } else {
        console.log(`   - Erro: ${commonError}`);
      }
      
      console.log('\n🔧 RECOMENDAÇÕES:');
      console.log('   1. Verificar validade da chave');
      console.log('   2. Confirmar créditos na conta OpenAI');
      console.log('   3. Verificar permissões da chave');
    }
    
    return {
      keyValid: hasWorkingModels,
      bestModel,
      systemWorking,
      openaiActive: openaiUsed,
      workingModels: directTest.workingModels.length,
      totalModels: directTest.workingModels.length + directTest.failedModels.length
    };
    
  } catch (error) {
    console.error('❌ Erro crítico no teste:', error.message);
    return { error: error.message };
  }
}

runCompleteTest()
  .then(result => {
    if (!result.error) {
      console.log('\n📋 RESULTADO FINAL');
      console.log('==================');
      console.log(`✅ Chave OpenAI: ${result.keyValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
      console.log(`🤖 Modelos funcionando: ${result.workingModels}/${result.totalModels}`);
      console.log(`🚀 Sistema: ${result.systemWorking ? 'OPERACIONAL' : 'COM PROBLEMAS'}`);
      
      if (result.keyValid) {
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('   1. Reiniciar workflow para ativar OpenAI');
        console.log('   2. Testar chat com análises complexas');
        console.log('   3. Verificar se fallback local foi desativado');
      }
    }
  })
  .catch(console.error);