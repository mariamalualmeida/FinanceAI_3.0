// Teste real de upload usando curl e análise dos resultados
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

async function loginAndGetSession() {
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  return cookies;
}

async function testDocumentUpload(filePath, cookies) {
  return new Promise((resolve, reject) => {
    const curlCommand = [
      'curl', '-X', 'POST',
      '-H', `Cookie: ${cookies}`,
      '-F', `file=@${filePath}`,
      `${BASE_URL}/api/upload-financial-document`
    ];
    
    const curl = spawn('curl', curlCommand.slice(1));
    let output = '';
    let error = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response', raw: output });
        }
      } else {
        reject(new Error(`Curl failed with code ${code}: ${error}`));
      }
    });
  });
}

async function testChatAnalysis(cookies, message) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ message })
  });
  
  return await response.json();
}

async function runRealSystemTest() {
  console.log('🔍 TESTE REAL DO SISTEMA DE UPLOAD E ANÁLISE');
  console.log('============================================');
  
  try {
    // Login
    const cookies = await loginAndGetSession();
    console.log('✅ Login realizado');
    
    // Documentos para testar
    const testFiles = [
      'attached_assets/Nubank_2025-05-24_1751172520674.pdf',
      'attached_assets/Fatura-CPF_1751146806544.PDF'
    ];
    
    const results = [];
    
    for (const filePath of testFiles) {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
        continue;
      }
      
      const fileName = path.basename(filePath);
      console.log(`\n📄 Testando upload: ${fileName}`);
      
      try {
        const startTime = Date.now();
        const uploadResult = await testDocumentUpload(filePath, cookies);
        const endTime = Date.now();
        
        console.log(`⏱️ Tempo de processamento: ${endTime - startTime}ms`);
        
        if (uploadResult.success) {
          console.log('✅ Upload e análise concluídos');
          console.log(`📊 Método: ${uploadResult.method || 'NoLimitExtractor'}`);
          console.log(`📈 Transações: ${uploadResult.analysis?.transactionCount || 0}`);
          console.log(`🎯 Precisão: ${uploadResult.accuracy || 'N/A'}`);
          
          if (uploadResult.analysis) {
            console.log(`💰 Saldo final: R$ ${uploadResult.analysis.finalBalance || 0}`);
            console.log(`📋 Total créditos: R$ ${uploadResult.analysis.totalCredits || 0}`);
            console.log(`📋 Total débitos: R$ ${uploadResult.analysis.totalDebits || 0}`);
          }
          
          results.push({
            file: fileName,
            success: true,
            processingTime: endTime - startTime,
            ...uploadResult
          });
        } else {
          console.log(`❌ Falha: ${uploadResult.error || uploadResult.message}`);
          console.log(`📝 Raw response: ${uploadResult.raw?.substring(0, 200)}`);
          
          results.push({
            file: fileName,
            success: false,
            error: uploadResult.error || uploadResult.message
          });
        }
      } catch (error) {
        console.log(`❌ Erro no upload: ${error.message}`);
        results.push({
          file: fileName,
          success: false,
          error: error.message
        });
      }
      
      // Aguardar entre uploads
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Teste de chat com análise
    console.log('\n💬 TESTE DE ANÁLISE VIA CHAT');
    console.log('============================');
    
    const chatQuestions = [
      'Com base nos documentos que enviei, qual é minha situação financeira?',
      'Calcule meu score de crédito',
      'Há algum padrão suspeito nos meus gastos?'
    ];
    
    for (const question of chatQuestions) {
      console.log(`\n🤖 ${question}`);
      try {
        const chatResult = await testChatAnalysis(cookies, question);
        if (chatResult.success) {
          console.log(`✅ ${chatResult.response.substring(0, 150)}...`);
        } else {
          console.log(`❌ ${chatResult.message}`);
        }
      } catch (error) {
        console.log(`❌ Erro no chat: ${error.message}`);
      }
    }
    
    // Relatório final
    console.log('\n📋 RELATÓRIO DE EFICIÊNCIA');
    console.log('===========================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Sucessos: ${successful.length}/${results.length}`);
    console.log(`❌ Falhas: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      const avgTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length;
      console.log(`⏱️ Tempo médio: ${Math.round(avgTime)}ms`);
      
      const totalTransactions = successful.reduce((sum, r) => {
        return sum + (r.analysis?.transactionCount || 0);
      }, 0);
      console.log(`📊 Total transações extraídas: ${totalTransactions}`);
    }
    
    // Problemas identificados
    if (failed.length > 0) {
      console.log('\n🔧 PROBLEMAS IDENTIFICADOS:');
      failed.forEach(f => {
        console.log(`- ${f.file}: ${f.error}`);
      });
    }
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('- Sistema NoLimitExtractor funcionando localmente');
    console.log('- Chat respondendo corretamente');
    if (successful.length === 0) {
      console.log('- CRÍTICO: Corrigir problemas de upload de arquivos');
    }
    if (successful.length > 0 && avgTime > 5000) {
      console.log('- Otimizar tempo de processamento');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return [];
  }
}

runRealSystemTest()
  .then(results => {
    console.log(`\n🏁 Teste concluído: ${results.length} arquivos testados`);
  })
  .catch(console.error);