const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

async function testMultipleDocuments() {
  try {
    console.log('🔍 TESTE - MÚLTIPLOS DOCUMENTOS');
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: 'Admin',
      password: 'admin123'
    });
    
    const cookies = loginResponse.headers['set-cookie']?.join('; ');
    console.log('✅ Login realizado');
    
    // Testar diferentes documentos
    const documents = [
      'PicPay_Fatura_042025_1751172520655.pdf',
      'extrato-255cc9e6-800c-4eba-b393-90856ae02ba7.xlsx (1)_1751172520634.xls',
      'Fatura-CPF_1751146806544.PDF'
    ];
    
    for (const doc of documents) {
      if (fs.existsSync(`./attached_assets/${doc}`)) {
        console.log(`\n📄 Testando: ${doc}`);
        
        const formData = new FormData();
        formData.append('files', fs.createReadStream(`./attached_assets/${doc}`));
        formData.append('message', `Analise este documento: ${doc}`);
        
        const uploadResponse = await axios.post(`${BASE_URL}/chat/upload`, formData, {
          headers: {
            ...formData.getHeaders(),
            'Cookie': cookies
          }
        });
        
        if (uploadResponse.data.success) {
          const analysis = uploadResponse.data.analysis[0];
          console.log(`✅ ${doc}:`);
          console.log(`   Banco: ${analysis.analysis.bankDetected}`);
          console.log(`   Transações: ${analysis.analysis.transactionCount}`);
          console.log(`   Receitas: R$ ${analysis.analysis.totalIncome}`);
          console.log(`   Despesas: R$ ${analysis.analysis.totalExpenses}`);
          console.log(`   Saldo: R$ ${analysis.analysis.balance}`);
        } else {
          console.log(`❌ Erro: ${doc} - ${uploadResponse.data.message}`);
        }
      } else {
        console.log(`⚠️ Arquivo não encontrado: ${doc}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

testMultipleDocuments();
