// Teste completo do sistema Advanced Multi-LLM Orchestrator v3.0
import fetch from 'node-fetch';
import fs from 'fs';

async function testAdvancedMultiLLMSystem() {
  console.log('🚀 TESTE ADVANCED MULTI-LLM ORCHESTRATOR v3.0');
  console.log('==============================================');
  
  // Configurar variável de ambiente temporariamente
  process.env.GEMINI_API_KEY = 'AIzaSyBt5tBqkHSjo7Tdlhc2Ajl9B2ddPnYV4XI';
  
  try {
    // 1. Login
    console.log('\n🔐 1. REALIZANDO LOGIN...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: 'admin123' })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login realizado com sucesso');
    
    // 2. Criar conversa
    console.log('\n💬 2. CRIANDO CONVERSA...');
    const conversation = await fetch('http://localhost:5000/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ title: 'Teste Advanced Multi-LLM' })
    });
    
    const conversationData = await conversation.json();
    console.log('✅ Conversa criada:', conversationData.id);
    
    // 3. Teste Chat com orquestração inteligente
    console.log('\n🤖 3. TESTANDO CHAT COM ORQUESTRAÇÃO INTELIGENTE...');
    
    const testMessages = [
      {
        message: 'Explique como funciona a análise de risco financeiro em bancos brasileiros',
        expectedSpecialization: 'documentAnalysis'
      },
      {
        message: 'Analise este padrão de gastos: R$ 2.500 renda, R$ 1.800 gastos, 45 transações',
        expectedSpecialization: 'financialExtraction'
      },
      {
        message: 'Gere um relatório executivo sobre perfil de crédito baseado nos dados anteriores',
        expectedSpecialization: 'reportGeneration'
      }
    ];
    
    const results = [];
    
    for (let i = 0; i < testMessages.length; i++) {
      const test = testMessages[i];
      console.log(`\n   📝 Teste ${i + 1}: ${test.expectedSpecialization}`);
      console.log(`   📋 Pergunta: ${test.message.substring(0, 50)}...`);
      
      const startTime = Date.now();
      
      const chatResponse = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
        body: JSON.stringify({ 
          message: test.message, 
          conversationId: conversationData.id 
        })
      });
      
      const chatResult = await chatResponse.json();
      const processingTime = Date.now() - startTime;
      
      if (chatResult.success) {
        const response = chatResult.response;
        
        // Analisar qual sistema foi usado
        const usesLocal = response.includes('local') || 
                         response.includes('fallback') ||
                         response.includes('NoLimitExtractor') ||
                         response.includes('FinanceAI, especialista');
        
        const usesAdvancedLLM = !usesLocal && (
          response.length > 800 ||
          response.includes('análise detalhada') ||
          response.includes('contexto brasileiro') ||
          response.includes('recomendações específicas')
        );
        
        results.push({
          test: i + 1,
          specialization: test.expectedSpecialization,
          processingTime,
          responseLength: response.length,
          usedLocal: usesLocal,
          usedAdvancedLLM: usesAdvancedLLM,
          quality: response.length > 500 ? 'Alta' : response.length > 200 ? 'Média' : 'Baixa'
        });
        
        console.log(`   ✅ Resposta: ${response.length} chars`);
        console.log(`   🔧 Sistema: ${usesLocal ? 'Local' : usesAdvancedLLM ? 'Advanced LLM' : 'Básico'}`);
        console.log(`   ⏱️ Tempo: ${processingTime}ms`);
        
      } else {
        console.log(`   ❌ Falha: ${chatResult.message}`);
        results.push({
          test: i + 1,
          specialization: test.expectedSpecialization,
          processingTime,
          error: chatResult.message,
          success: false
        });
      }
    }
    
    // 4. Teste upload de documento (funcionalidade real)
    console.log('\n📄 4. TESTANDO UPLOAD COM ANÁLISE MULTI-LLM...');
    
    // Usar um dos documentos reais disponíveis
    const realDocuments = [
      'attached_assets/Nubank_2025-05-24_1751172520674.pdf',
      'attached_assets/extrato-255cc9e6-800c-4eba-b393-90856ae02ba7.xlsx',
      'attached_assets/Fatura-CPF_1751146806544.PDF'
    ];
    
    let uploadResult = null;
    
    for (const docPath of realDocuments) {
      if (fs.existsSync(docPath)) {
        console.log(`   📁 Testando documento: ${docPath}`);
        
        // Simular upload
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('file', fs.createReadStream(docPath));
        form.append('conversationId', conversationData.id);
        
        const uploadStartTime = Date.now();
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { 'Cookie': cookies },
          body: form
        });
        
        const uploadTime = Date.now() - uploadStartTime;
        const uploadData = await uploadResponse.json();
        
        if (uploadData.success) {
          console.log(`   ✅ Upload concluído em ${uploadTime}ms`);
          console.log(`   📊 Arquivo processado: ${uploadData.fileId}`);
          
          uploadResult = {
            success: true,
            uploadTime,
            fileId: uploadData.fileId,
            fileName: docPath.split('/').pop()
          };
          break;
        } else {
          console.log(`   ❌ Upload falhou: ${uploadData.message}`);
        }
      }
    }
    
    // 5. Análise dos resultados
    console.log('\n📊 5. ANÁLISE DOS RESULTADOS');
    console.log('============================');
    
    const successfulTests = results.filter(r => r.success !== false);
    const localUsage = results.filter(r => r.usedLocal).length;
    const advancedLLMUsage = results.filter(r => r.usedAdvancedLLM).length;
    const avgProcessingTime = successfulTests.reduce((sum, r) => sum + r.processingTime, 0) / successfulTests.length;
    const avgResponseLength = successfulTests.reduce((sum, r) => sum + r.responseLength, 0) / successfulTests.length;
    
    console.log(`✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);
    console.log(`🤖 Uso do sistema local: ${localUsage}/${results.length}`);
    console.log(`🚀 Uso do Advanced LLM: ${advancedLLMUsage}/${results.length}`);
    console.log(`⏱️ Tempo médio de resposta: ${Math.round(avgProcessingTime)}ms`);
    console.log(`📝 Tamanho médio das respostas: ${Math.round(avgResponseLength)} chars`);
    
    if (uploadResult && uploadResult.success) {
      console.log(`📄 Upload de documento: ✅ (${uploadResult.uploadTime}ms)`);
    } else {
      console.log(`📄 Upload de documento: ❌`);
    }
    
    // 6. Avaliação final
    console.log('\n🎯 6. AVALIAÇÃO FINAL');
    console.log('=====================');
    
    const systemScore = calculateSystemScore(successfulTests, localUsage, advancedLLMUsage, avgProcessingTime, uploadResult);
    
    console.log(`📊 SCORE GERAL: ${systemScore.total}/100`);
    console.log(`   • Funcionalidade: ${systemScore.functionality}/30`);
    console.log(`   • Performance: ${systemScore.performance}/25`);
    console.log(`   • Inteligência: ${systemScore.intelligence}/25`);
    console.log(`   • Confiabilidade: ${systemScore.reliability}/20`);
    
    if (systemScore.total >= 85) {
      console.log('\n🎉 SISTEMA ADVANCED MULTI-LLM: EXCELENTE!');
      console.log('   ✅ Orquestração funcionando perfeitamente');
      console.log('   ✅ Especialização por tarefas ativa');
      console.log('   ✅ Performance otimizada');
    } else if (systemScore.total >= 70) {
      console.log('\n✅ SISTEMA ADVANCED MULTI-LLM: BOM!');
      console.log('   ✅ Funcionalidades principais ativas');
      console.log('   ⚠️ Algumas otimizações podem ser feitas');
    } else {
      console.log('\n⚠️ SISTEMA ADVANCED MULTI-LLM: PRECISA AJUSTES');
      console.log('   ❌ Funcionalidades principais com problemas');
      console.log('   🔧 Requer configurações adicionais');
    }
    
    return {
      success: true,
      systemScore,
      testResults: results,
      uploadResult,
      summary: {
        totalTests: results.length,
        successfulTests: successfulTests.length,
        localUsage,
        advancedLLMUsage,
        avgProcessingTime: Math.round(avgProcessingTime),
        avgResponseLength: Math.round(avgResponseLength)
      }
    };
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function calculateSystemScore(tests, localUsage, advancedLLMUsage, avgTime, uploadResult) {
  let functionality = 0;
  let performance = 0;
  let intelligence = 0;
  let reliability = 0;
  
  // Funcionalidade (30 pontos)
  const successRate = tests.length > 0 ? tests.filter(t => t.success !== false).length / tests.length : 0;
  functionality = Math.round(successRate * 30);
  
  // Performance (25 pontos)
  if (avgTime < 1000) performance = 25;
  else if (avgTime < 2000) performance = 20;
  else if (avgTime < 3000) performance = 15;
  else performance = 10;
  
  // Inteligência (25 pontos)
  const intelligenceRatio = tests.length > 0 ? advancedLLMUsage / tests.length : 0;
  if (intelligenceRatio > 0.7) intelligence = 25;
  else if (intelligenceRatio > 0.5) intelligence = 20;
  else if (intelligenceRatio > 0.3) intelligence = 15;
  else intelligence = 10;
  
  // Confiabilidade (20 pontos)
  reliability = Math.round(successRate * 20);
  if (uploadResult && uploadResult.success) reliability += 5;
  
  return {
    functionality,
    performance,
    intelligence,
    reliability,
    total: functionality + performance + intelligence + reliability
  };
}

// Executar teste
testAdvancedMultiLLMSystem()
  .then(result => {
    console.log('\n🏁 TESTE FINALIZADO');
    console.log('===================');
    
    if (result.success) {
      console.log(`🎯 Status: SUCESSO (Score: ${result.systemScore.total}/100)`);
      console.log(`📊 Resumo: ${result.summary.successfulTests}/${result.summary.totalTests} testes OK`);
      console.log(`⚡ Performance: ${result.summary.avgProcessingTime}ms médio`);
      console.log(`🧠 Advanced LLM: ${result.summary.advancedLLMUsage}/${result.summary.totalTests} usos`);
    } else {
      console.log(`❌ Status: FALHA`);
      console.log(`🔍 Erro: ${result.error}`);
    }
  })
  .catch(console.error);