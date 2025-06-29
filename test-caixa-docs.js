const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

async function testCaixaDocuments() {
  try {
    console.log('🔍 TESTE - DOCUMENTOS CAIXA ECONÔMICA FEDERAL');
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: 'Admin',
      password: 'admin123'
    });
    
    const cookies = loginResponse.headers['set-cookie']?.join('; ');
    console.log('✅ Login realizado');
    
    // Testar um dos documentos da Caixa enviados
    const testFile = 'comprovante2025-06-10_101417_250610_133622_1751239395698.pdf';
    
    if (fs.existsSync(`./attached_assets/${testFile}`)) {
      console.log(`\n📄 Testando extrato da Caixa: ${testFile}`);
      
      const formData = new FormData();
      formData.append('files', fs.createReadStream(`./attached_assets/${testFile}`));
      formData.append('message', `Analise este extrato da Caixa Econômica Federal - NATHALIA MANOELA F S BARNABE`);
      
      const uploadResponse = await axios.post(`${BASE_URL}/chat/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': cookies
        }
      });
      
      if (uploadResponse.data.success) {
        const analysis = uploadResponse.data.analysis[0];
        
        console.log(`\n✅ RESULTADO DA ANÁLISE:`);
        console.log(`   📄 Arquivo: ${testFile}`);
        console.log(`   🏦 Banco Detectado: ${analysis.analysis.bankDetected}`);
        console.log(`   📊 Transações: ${analysis.analysis.transactionCount}`);
        console.log(`   💰 Receitas: R$ ${analysis.analysis.totalIncome}`);
        console.log(`   💸 Despesas: R$ ${analysis.analysis.totalExpenses}`);
        console.log(`   💳 Saldo Final: R$ ${analysis.analysis.balance}`);
        console.log(`   🎯 Credit Score: ${analysis.analysis.creditScore}/850`);
        console.log(`   ⚠️ Risk Level: ${analysis.analysis.riskLevel}`);
        console.log(`   📝 Recomendações: ${analysis.analysis.recommendations}`);
        
        // Verificar se detectou Caixa corretamente
        if (analysis.analysis.bankDetected === 'Caixa Econômica Federal') {
          console.log('\n✅ DETECÇÃO DE BANCO: CORRETA');
        } else {
          console.log(`\n❌ DETECÇÃO DE BANCO: INCORRETA (detectou ${analysis.analysis.bankDetected})`);
        }
        
        // Verificar se há transações
        if (analysis.analysis.transactionCount > 0) {
          console.log('✅ EXTRAÇÃO DE TRANSAÇÕES: FUNCIONANDO');
          
          // Mostrar algumas transações
          const transactions = analysis.analysis.extractedTransactions || [];
          console.log('\n📋 AMOSTRA DE TRANSAÇÕES:');
          transactions.slice(0, 3).forEach((t, i) => {
            console.log(`   ${i+1}. ${t.date} - ${t.description} - ${t.type} - R$ ${t.amount}`);
          });
        } else {
          console.log('❌ EXTRAÇÃO DE TRANSAÇÕES: FALHANDO');
        }
        
      } else {
        console.log(`❌ Erro no upload: ${uploadResponse.data.message}`);
      }
    } else {
      console.log(`⚠️ Arquivo não encontrado: ${testFile}`);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes:', error.response.data);
    }
  }
}

testCaixaDocuments();