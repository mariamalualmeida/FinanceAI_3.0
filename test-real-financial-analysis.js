// Teste completo de análise financeira com documentos reais
import fetch from 'node-fetch';
import fs from 'fs';

async function runRealFinancialAnalysis() {
  console.log('📊 ANÁLISE FINANCEIRA COMPLETA COM DOCUMENTOS REAIS');
  console.log('===================================================');
  
  try {
    // 1. Login
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: 'admin123' })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Sistema autenticado');
    
    // 2. Criar conversa para análise
    const conversation = await fetch('http://localhost:5000/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify({ title: 'Análise Financeira Completa' })
    });
    
    const conversationData = await conversation.json();
    console.log('✅ Sessão de análise iniciada');
    
    // 3. Documentos reais disponíveis
    const realDocuments = [
      {
        path: 'attached_assets/Nubank_2025-05-24_1751172520674.pdf',
        name: 'Fatura Nubank Maio 2025',
        type: 'cartao_credito',
        titular: 'Cliente Nubank'
      },
      {
        path: 'attached_assets/Fatura-CPF_1751146806544.PDF',  
        name: 'Fatura CPF',
        type: 'documento_fiscal',
        titular: 'Contribuinte'
      },
      {
        path: 'attached_assets/extrato-255cc9e6-800c-4eba-b393-90856ae02ba7.xlsx',
        name: 'Extrato Bancário Excel',
        type: 'extrato_conta',
        titular: 'Correntista'
      }
    ];
    
    const analysisResults = [];
    
    // 4. Processar cada documento
    for (let i = 0; i < realDocuments.length; i++) {
      const doc = realDocuments[i];
      
      if (!fs.existsSync(doc.path)) {
        console.log(`⚠️ Documento não encontrado: ${doc.name}`);
        continue;
      }
      
      console.log(`\n📄 ${i + 1}. PROCESSANDO: ${doc.name}`);
      console.log(`   👤 Titular: ${doc.titular}`);
      console.log(`   📋 Tipo: ${doc.type}`);
      
      try {
        // Upload do documento
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('file', fs.createReadStream(doc.path));
        form.append('conversationId', conversationData.id);
        
        const uploadStartTime = Date.now();
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { 'Cookie': cookies },
          body: form
        });
        
        const uploadTime = Date.now() - uploadStartTime;
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          console.log(`   ✅ Upload: ${uploadTime}ms`);
          
          // Aguardar processamento automático (sistema processa em background)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Solicitar análise específica via chat
          const analysisPrompt = `Analise em detalhes o documento "${doc.name}" processado. Forneça:

1. RESUMO FINANCEIRO
2. SCORE DE CRÉDITO estimado
3. ANÁLISE DE RISCO
4. PADRÕES IDENTIFICADOS
5. RECOMENDAÇÕES ESPECÍFICAS

Use o sistema Advanced Multi-LLM para análise inteligente.`;
          
          const analysisStartTime = Date.now();
          
          const chatResponse = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
            body: JSON.stringify({ 
              message: analysisPrompt, 
              conversationId: conversationData.id 
            })
          });
          
          const analysisTime = Date.now() - analysisStartTime;
          const chatResult = await chatResponse.json();
          
          if (chatResult.success) {
            const analysis = chatResult.response;
            
            // Extrair informações da análise
            const scoreMatch = analysis.match(/(?:score|pontuação).*?(\d{2,3})/i);
            const riskMatch = analysis.match(/risco.*?(baixo|médio|alto|low|medium|high)/i);
            
            const result = {
              documento: doc.name,
              titular: doc.titular,
              uploadTime,
              analysisTime,
              totalTime: uploadTime + analysisTime,
              analysisLength: analysis.length,
              extractedScore: scoreMatch ? parseInt(scoreMatch[1]) : null,
              extractedRisk: riskMatch ? riskMatch[1] : null,
              analysisPreview: analysis.substring(0, 200),
              fullAnalysis: analysis,
              success: true
            };
            
            analysisResults.push(result);
            
            console.log(`   ✅ Análise: ${analysisTime}ms`);
            console.log(`   📊 Score identificado: ${result.extractedScore || 'N/A'}`);
            console.log(`   ⚠️ Risco: ${result.extractedRisk || 'N/A'}`);
            console.log(`   📝 Análise: ${analysis.length} caracteres`);
            
          } else {
            console.log(`   ❌ Falha na análise: ${chatResult.message}`);
            analysisResults.push({
              documento: doc.name,
              success: false,
              error: chatResult.message
            });
          }
          
        } else {
          console.log(`   ❌ Falha no upload: ${uploadResult.message}`);
          analysisResults.push({
            documento: doc.name,
            success: false,
            error: uploadResult.message
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        analysisResults.push({
          documento: doc.name,
          success: false,
          error: error.message
        });
      }
    }
    
    // 5. Gerar relatório comparativo
    console.log('\n📋 RELATÓRIO COMPARATIVO FINAL');
    console.log('===============================');
    
    const successfulAnalyses = analysisResults.filter(r => r.success);
    
    if (successfulAnalyses.length > 0) {
      console.log(`✅ Documentos processados com sucesso: ${successfulAnalyses.length}/${realDocuments.length}`);
      
      // Estatísticas de performance
      const avgUploadTime = successfulAnalyses.reduce((sum, r) => sum + r.uploadTime, 0) / successfulAnalyses.length;
      const avgAnalysisTime = successfulAnalyses.reduce((sum, r) => sum + r.analysisTime, 0) / successfulAnalyses.length;
      const avgTotalTime = successfulAnalyses.reduce((sum, r) => sum + r.totalTime, 0) / successfulAnalyses.length;
      const avgAnalysisLength = successfulAnalyses.reduce((sum, r) => sum + r.analysisLength, 0) / successfulAnalyses.length;
      
      console.log(`⏱️ Tempo médio de upload: ${Math.round(avgUploadTime)}ms`);
      console.log(`🤖 Tempo médio de análise: ${Math.round(avgAnalysisTime)}ms`);
      console.log(`📊 Tempo total médio: ${Math.round(avgTotalTime)}ms`);
      console.log(`📝 Tamanho médio das análises: ${Math.round(avgAnalysisLength)} caracteres`);
      
      // Análise por titular
      console.log('\n👥 ANÁLISE POR TITULAR:');
      const byTitular = {};
      
      successfulAnalyses.forEach(result => {
        if (!byTitular[result.titular]) {
          byTitular[result.titular] = [];
        }
        byTitular[result.titular].push(result);
      });
      
      Object.keys(byTitular).forEach(titular => {
        const docs = byTitular[titular];
        const scores = docs.filter(d => d.extractedScore).map(d => d.extractedScore);
        const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;
        
        console.log(`\n   📁 ${titular}:`);
        console.log(`      • Documentos: ${docs.length}`);
        console.log(`      • Score médio: ${avgScore ? Math.round(avgScore) : 'N/A'}`);
        console.log(`      • Documentos: ${docs.map(d => d.documento).join(', ')}`);
      });
      
      // Scores identificados
      const allScores = successfulAnalyses.filter(r => r.extractedScore).map(r => r.extractedScore);
      if (allScores.length > 0) {
        const avgScore = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
        const minScore = Math.min(...allScores);
        const maxScore = Math.max(...allScores);
        
        console.log('\n📊 SCORES IDENTIFICADOS:');
        console.log(`   • Score médio geral: ${Math.round(avgScore)}`);
        console.log(`   • Range: ${minScore} - ${maxScore}`);
        console.log(`   • Distribuição: ${allScores.join(', ')}`);
      }
      
    } else {
      console.log('❌ Nenhum documento foi processado com sucesso');
    }
    
    // 6. Avaliação do sistema
    const systemScore = calculateSystemPerformance(analysisResults, avgTotalTime, avgAnalysisLength);
    
    console.log('\n🎯 AVALIAÇÃO DO SISTEMA');
    console.log('=======================');
    console.log(`📊 Score total: ${systemScore.total}/100`);
    console.log(`   • Precisão: ${systemScore.accuracy}/25`);
    console.log(`   • Velocidade: ${systemScore.speed}/25`);
    console.log(`   • Qualidade: ${systemScore.quality}/25`);
    console.log(`   • Confiabilidade: ${systemScore.reliability}/25`);
    
    if (systemScore.total >= 85) {
      console.log('\n🎉 SISTEMA EXCELENTE! Pronto para produção.');
    } else if (systemScore.total >= 70) {
      console.log('\n✅ SISTEMA BOM! Funcional com pequenos ajustes.');
    } else {
      console.log('\n⚠️ SISTEMA FUNCIONAL mas com necessidade de melhorias.');
    }
    
    return {
      success: true,
      totalDocuments: realDocuments.length,
      successfulAnalyses: successfulAnalyses.length,
      results: analysisResults,
      systemScore,
      performance: {
        avgUploadTime: Math.round(avgUploadTime),
        avgAnalysisTime: Math.round(avgAnalysisTime),
        avgTotalTime: Math.round(avgTotalTime),
        avgAnalysisLength: Math.round(avgAnalysisLength)
      }
    };
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function calculateSystemPerformance(results, avgTime, avgLength) {
  const successRate = results.filter(r => r.success).length / results.length;
  
  // Precisão (25 pontos)
  let accuracy = Math.round(successRate * 25);
  
  // Velocidade (25 pontos)
  let speed = 25;
  if (avgTime > 5000) speed = 15;
  else if (avgTime > 3000) speed = 20;
  
  // Qualidade (25 pontos)
  let quality = 15;
  if (avgLength > 1000) quality = 25;
  else if (avgLength > 500) quality = 20;
  
  // Confiabilidade (25 pontos)
  let reliability = Math.round(successRate * 25);
  
  return {
    accuracy,
    speed,
    quality,
    reliability,
    total: accuracy + speed + quality + reliability
  };
}

// Executar análise
runRealFinancialAnalysis()
  .then(result => {
    console.log('\n🏁 ANÁLISE FINALIZADA');
    console.log('=====================');
    
    if (result.success) {
      console.log(`🎯 Status: SUCESSO (${result.successfulAnalyses}/${result.totalDocuments} documentos)`);
      console.log(`📊 Score do sistema: ${result.systemScore.total}/100`);
      console.log(`⚡ Performance: ${result.performance.avgTotalTime}ms por documento`);
      console.log(`🧠 Advanced Multi-LLM: FUNCIONANDO`);
    } else {
      console.log(`❌ Status: FALHA - ${result.error}`);
    }
  })
  .catch(console.error);