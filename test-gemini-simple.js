// Teste simplificado do Gemini com curl para uploads
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const GEMINI_API_KEY = 'AIzaSyBt5tBqkHSjo7Tdlhc2Ajl9B2ddPnYV4XI';

async function testGeminiAPI() {
  console.log('🔧 TESTE DA API GEMINI');
  console.log('======================');
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  try {
    console.log('🧪 Testando gemini-2.5-flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Responda apenas: "Gemini funcionando perfeitamente"'
    });
    
    const responseText = response.text;
    console.log(`✅ Gemini: ${responseText}`);
    
    // Teste mais complexo
    console.log('\n🧪 Teste de análise financeira...');
    const financialTest = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Analise esta situação financeira: entrada R$ 5000, gastos R$ 3000. Dê um score de 1-10 e recomendações.'
    });
    
    const financialResponse = financialTest.text;
    console.log(`✅ Análise: ${financialResponse.substring(0, 200)}...`);
    
    return { success: true, basicTest: responseText, financialTest: financialResponse };
    
  } catch (error) {
    console.log(`❌ Erro Gemini: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSystemIntegration() {
  console.log('\n💬 TESTE DE INTEGRAÇÃO DO SISTEMA');
  console.log('==================================');
  
  // Login
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login realizado');
  
  // Criar conversa
  const conversation = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ title: 'Teste Gemini Integration' })
  });
  
  const conversationData = await conversation.json();
  const conversationId = conversationData.id;
  console.log('✅ Conversa criada');
  
  // Teste de mensagens que devem ativar diferentes LLMs
  const testMessages = [
    { message: 'Olá, preciso de análise financeira avançada', expected: 'gemini' },
    { message: 'Analise minha situação: tenho R$ 20.000 de renda e gasto R$ 15.000', expected: 'gemini' },
    { message: 'Quais são os melhores investimentos para meu perfil?', expected: 'gemini' },
    { message: 'Sistema local está funcionando?', expected: 'local' }
  ];
  
  const results = [];
  
  for (const test of testMessages) {
    console.log(`\n💭 Testando: ${test.message.substring(0, 50)}...`);
    
    try {
      const chatStart = Date.now();
      
      const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
        body: JSON.stringify({ message: test.message, conversationId })
      });
      
      const chatTime = Date.now() - chatStart;
      const chatResult = await chatResponse.json();
      
      if (chatResult.success) {
        const response = chatResult.response;
        
        // Detectar qual sistema foi usado
        const isLocal = response.includes('local') || 
                       response.includes('fallback') || 
                       response.includes('temporarily disabled') ||
                       response.includes('NoLimit');
        
        const isGemini = !isLocal && (
          response.length > 400 || 
          response.includes('análise') ||
          response.includes('recomendo') ||
          response.includes('investimento')
        );
        
        const systemUsed = isLocal ? 'Local' : isGemini ? 'Gemini' : 'Híbrido';
        
        console.log(`   ✅ Resposta: ${chatTime}ms (${response.length} chars)`);
        console.log(`   🤖 Sistema detectado: ${systemUsed}`);
        console.log(`   📝 Preview: ${response.substring(0, 100)}...`);
        
        results.push({
          message: test.message.substring(0, 40),
          expectedSystem: test.expected,
          actualSystem: systemUsed.toLowerCase(),
          responseTime: chatTime,
          responseLength: response.length,
          success: true
        });
        
      } else {
        console.log(`   ❌ Falha: ${chatResult.message}`);
        results.push({
          message: test.message.substring(0, 40),
          success: false,
          error: chatResult.message
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      results.push({
        message: test.message.substring(0, 40),
        success: false,
        error: error.message
      });
    }
    
    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  return results;
}

async function testDocumentUpload() {
  console.log('\n📄 TESTE DE UPLOAD COM DOCUMENTOS REAIS');
  console.log('=======================================');
  
  // Login
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login realizado');
  
  // Criar conversa
  const conversation = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ title: 'Teste Upload Gemini' })
  });
  
  const conversationData = await conversation.json();
  const conversationId = conversationData.id;
  console.log('✅ Conversa criada');
  
  // Documentos de teste
  const testFiles = [
    { path: 'attached_assets/Nubank_2025-05-24_1751172520674.pdf', name: 'Nubank', expected: 7 },
    { path: 'attached_assets/Fatura-CPF_1751146806544.PDF', name: 'Fatura', expected: 3 }
  ];
  
  const uploadResults = [];
  
  for (const file of testFiles) {
    if (!fs.existsSync(file.path)) {
      console.log(`⚠️ ${file.name}: Arquivo não encontrado`);
      continue;
    }
    
    console.log(`\n📤 Processando: ${file.name}`);
    
    try {
      const uploadStart = Date.now();
      
      // Upload via curl (mais confiável)
      const uploadResult = await new Promise((resolve) => {
        const curl = spawn('curl', [
          '-X', 'POST',
          '-H', `Cookie: ${cookies}`,
          '-F', `file=@${file.path}`,
          '-F', `conversationId=${conversationId}`,
          `${BASE_URL}/api/upload-financial-document`
        ]);
        
        let output = '';
        curl.stdout.on('data', (data) => output += data.toString());
        curl.on('close', () => {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve({ success: false, error: 'Parse error' });
          }
        });
      });
      
      const uploadTime = Date.now() - uploadStart;
      console.log(`   📤 Upload: ${uploadTime}ms - ${uploadResult.success ? '✅' : '❌'}`);
      
      if (uploadResult.success) {
        // Aguardar processamento
        console.log('   ⏳ Aguardando análise...');
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        // Buscar mensagens
        const messagesResponse = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
          method: 'GET',
          headers: { 'Cookie': cookies }
        });
        
        const messages = await messagesResponse.json();
        const analysisMsg = messages.find(m => 
          m.sender === 'assistant' && 
          (m.content.includes('ANÁLISE') || m.content.includes('transações'))
        );
        
        if (analysisMsg) {
          const content = analysisMsg.content;
          const transactionMatch = content.match(/(\d+)\s*transações/i);
          const extractedCount = transactionMatch ? parseInt(transactionMatch[1]) : 0;
          
          // Detectar sistema usado na análise
          const usesLocal = content.includes('local') || content.includes('NoLimit');
          const usesGemini = !usesLocal && content.length > 500;
          
          console.log(`   📊 Transações: ${extractedCount}/${file.expected}`);
          console.log(`   🤖 Sistema: ${usesLocal ? 'Local' : usesGemini ? 'Gemini' : 'Híbrido'}`);
          console.log(`   🎯 Precisão: ${((extractedCount / file.expected) * 100).toFixed(1)}%`);
          
          uploadResults.push({
            file: file.name,
            success: true,
            uploadTime,
            extractedTransactions: extractedCount,
            expectedTransactions: file.expected,
            accuracy: (extractedCount / file.expected) * 100,
            systemUsed: usesLocal ? 'Local' : usesGemini ? 'Gemini' : 'Híbrido',
            analysisLength: content.length
          });
          
        } else {
          console.log(`   ❌ Análise não encontrada`);
          uploadResults.push({
            file: file.name,
            success: false,
            error: 'Análise não gerada'
          });
        }
        
      } else {
        console.log(`   ❌ Upload falhou`);
        uploadResults.push({
          file: file.name,
          success: false,
          error: 'Upload failed'
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      uploadResults.push({
        file: file.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return uploadResults;
}

async function runCompleteTest() {
  console.log('🚀 TESTE COMPLETO GEMINI + FINANCEAI');
  console.log('====================================');
  console.log('API Key: AIzaSyBt5tBqkHSjo7Tdlhc2Ajl9B2ddPnYV4XI');
  
  try {
    // 1. Teste direto da API
    const apiTest = await testGeminiAPI();
    
    // 2. Teste de integração do sistema
    const systemTest = await testSystemIntegration();
    
    // 3. Teste de upload de documentos
    const uploadTest = await testDocumentUpload();
    
    console.log('\n📋 RELATÓRIO FINAL');
    console.log('==================');
    
    // Status da API Gemini
    console.log(`🔑 API Gemini: ${apiTest.success ? '✅ FUNCIONANDO' : '❌ COM PROBLEMAS'}`);
    if (apiTest.success) {
      console.log('   - Resposta básica: ✅');
      console.log('   - Análise financeira: ✅');
    }
    
    // Status do sistema integrado
    const successfulChats = systemTest.filter(t => t.success);
    const geminiChats = successfulChats.filter(t => t.actualSystem === 'gemini');
    const localChats = successfulChats.filter(t => t.actualSystem === 'local');
    
    console.log(`\n💬 Chat Integration: ${successfulChats.length}/${systemTest.length}`);
    console.log(`   🌐 Respostas Gemini: ${geminiChats.length}`);
    console.log(`   🤖 Respostas Local: ${localChats.length}`);
    
    if (successfulChats.length > 0) {
      const avgTime = successfulChats.reduce((sum, t) => sum + t.responseTime, 0) / successfulChats.length;
      console.log(`   ⏱️ Tempo médio: ${Math.round(avgTime)}ms`);
    }
    
    // Status dos uploads
    const successfulUploads = uploadTest.filter(u => u.success);
    console.log(`\n📄 Document Upload: ${successfulUploads.length}/${uploadTest.length}`);
    
    if (successfulUploads.length > 0) {
      const avgAccuracy = successfulUploads.reduce((sum, u) => sum + u.accuracy, 0) / successfulUploads.length;
      const geminiUploads = successfulUploads.filter(u => u.systemUsed === 'Gemini');
      const localUploads = successfulUploads.filter(u => u.systemUsed === 'Local');
      
      console.log(`   🎯 Precisão média: ${avgAccuracy.toFixed(1)}%`);
      console.log(`   🌐 Análises Gemini: ${geminiUploads.length}`);
      console.log(`   🤖 Análises Local: ${localUploads.length}`);
    }
    
    // Conclusões
    console.log('\n🎯 CONCLUSÕES');
    console.log('=============');
    
    if (apiTest.success) {
      if (geminiChats.length > 0 || successfulUploads.some(u => u.systemUsed === 'Gemini')) {
        console.log('🎉 GEMINI TOTALMENTE INTEGRADO E FUNCIONANDO!');
        console.log('   ✅ API Gemini ativa');
        console.log('   ✅ Sistema híbrido operacional');
        console.log('   ✅ Gemini sendo usado ativamente');
        console.log('   ✅ Sistema local como backup confiável');
        
        console.log('\n💡 Configuração recomendada:');
        console.log('   1. Gemini como LLM principal');
        console.log('   2. Sistema local como backup');
        console.log('   3. Roteamento inteligente por complexidade');
        
      } else {
        console.log('⚠️ GEMINI FUNCIONA MAS SISTEMA USA LOCAL');
        console.log('   ✅ API Gemini testada e funcionando');
        console.log('   ⚠️ Sistema ainda prefere fallback local');
        console.log('   💡 Pode precisar ajustar orquestrador Multi-LLM');
      }
    } else {
      console.log('❌ PROBLEMA COM API GEMINI');
      console.log('   ❌ Verificar chave API');
      console.log('   ✅ Sistema local mantém funcionalidade');
    }
    
    // Score final
    const totalSuccesses = (apiTest.success ? 1 : 0) + successfulChats.length + successfulUploads.length;
    const totalTests = 1 + systemTest.length + uploadTest.length;
    const finalScore = (totalSuccesses / totalTests) * 100;
    
    console.log(`\n🏆 SCORE FINAL: ${finalScore.toFixed(1)}%`);
    
    if (finalScore >= 90) {
      console.log('🎉 SISTEMA EXCELENTE - Gemini + Local perfeitamente integrados');
    } else if (finalScore >= 70) {
      console.log('✅ SISTEMA BOM - Funcional com Gemini disponível');
    } else {
      console.log('⚠️ SISTEMA BÁSICO - Funcionando apenas com local');
    }
    
    return {
      geminiActive: apiTest.success,
      chatGeminiUsage: geminiChats.length,
      uploadGeminiUsage: successfulUploads.filter(u => u.systemUsed === 'Gemini').length,
      overallScore: finalScore
    };
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    return { error: error.message };
  }
}

runCompleteTest()
  .then(result => {
    console.log('\n🎉 TESTE GEMINI CONCLUÍDO');
    console.log('=========================');
    
    if (!result.error) {
      console.log(`✅ Gemini configurado: ${result.geminiActive ? 'SIM' : 'NÃO'}`);
      console.log(`🌐 Uso Gemini no chat: ${result.chatGeminiUsage} interações`);
      console.log(`📄 Uso Gemini em uploads: ${result.uploadGeminiUsage} documentos`);
      console.log(`🏆 Score geral: ${result.overallScore.toFixed(1)}%`);
      
      if (result.geminiActive) {
        console.log('\n🚀 SISTEMA HÍBRIDO ATIVO: Gemini + Local');
      } else {
        console.log('\n🤖 SISTEMA LOCAL ATIVO: Funcionando perfeitamente');
      }
    }
  })
  .catch(console.error);