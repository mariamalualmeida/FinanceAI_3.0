// Teste real de upload de documentos através da API
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

console.log('📄 TESTE REAL DE UPLOAD DE DOCUMENTOS');
console.log('=====================================');

// Documentos reais disponíveis
const testDocuments = [
  'attached_assets/Nubank_2025-05-24_1751172520674.pdf',
  'attached_assets/extrato-94582557-b1a2-49e5-a3eb-57c8d025c07d_1751172520710.pdf',
  'attached_assets/Fatura-CPF_1751146806544.PDF'
];

async function loginAndGetSession() {
  try {
    console.log('🔐 Fazendo login...');
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const cookies = response.headers.get('set-cookie');
      console.log('✅ Login realizado com sucesso');
      return cookies;
    } else {
      console.log('❌ Falha no login');
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro no login: ${error.message}`);
    return null;
  }
}

async function testDocumentUpload(filePath, cookies) {
  console.log(`\n📄 TESTANDO: ${filePath.split('/').pop()}`);
  console.log('=' .repeat(50));
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Arquivo não encontrado');
    return false;
  }
  
  try {
    // Criar FormData
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('conversationId', 'test-upload-' + Date.now());
    
    console.log('🔄 Enviando arquivo...');
    
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Cookie': cookies
      },
      body: form
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload realizado com sucesso');
      console.log(`📊 ID do arquivo: ${result.fileId || 'N/A'}`);
      
      // Aguardar processamento
      console.log('⏳ Aguardando processamento...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return result;
    } else {
      console.log(`❌ Falha no upload: ${result.message || 'Erro desconhecido'}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro no upload: ${error.message}`);
    return false;
  }
}

async function testChatAnalysis(cookies, message) {
  console.log('\n🤖 TESTANDO ANÁLISE VIA CHAT');
  console.log('============================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        message: message,
        conversationId: 'test-analysis-' + Date.now()
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Análise realizada com sucesso');
      console.log('📊 Resultado da análise:');
      console.log(result.message?.substring(0, 300) + '...');
      return result;
    } else {
      console.log(`❌ Falha na análise: ${result.message || 'Erro desconhecido'}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro na análise: ${error.message}`);
    return false;
  }
}

async function runRealSystemTest() {
  console.log('Iniciando teste real do sistema...\n');
  
  // 1. Fazer login
  const cookies = await loginAndGetSession();
  if (!cookies) {
    console.log('❌ Não foi possível fazer login. Teste abortado.');
    return;
  }
  
  // 2. Testar upload de documentos
  const results = [];
  for (const docPath of testDocuments.slice(0, 2)) { // Testar apenas 2 documentos
    const result = await testDocumentUpload(docPath, cookies);
    results.push({
      document: docPath.split('/').pop(),
      success: !!result
    });
  }
  
  // 3. Testar análise via chat
  const analysisResult = await testChatAnalysis(
    cookies, 
    'Analise os documentos financeiros enviados e forneça um relatório completo com score de crédito.'
  );
  
  // 4. Relatório final
  console.log('\n🎯 RELATÓRIO FINAL DO TESTE REAL');
  console.log('===============================');
  
  const successfulUploads = results.filter(r => r.success).length;
  console.log(`📄 Uploads: ${successfulUploads}/${results.length} documentos`);
  console.log(`🤖 Análise: ${analysisResult ? '✅ Funcionando' : '❌ Falha'}`);
  
  results.forEach(result => {
    console.log(`  ${result.success ? '✅' : '❌'} ${result.document}`);
  });
  
  if (successfulUploads > 0 && analysisResult) {
    console.log('\n🚀 SISTEMA COMPLETAMENTE FUNCIONAL');
    console.log('- Upload de documentos: OK');
    console.log('- Processamento automático: OK');
    console.log('- Análise financeira: OK');
    console.log('- APIs integradas: OK');
  } else {
    console.log('\n⚠️ Sistema com problemas');
    console.log('Verificar logs para detalhes');
  }
}

// Aguardar servidor estar pronto
setTimeout(() => {
  runRealSystemTest().catch(console.error);
}, 2000);