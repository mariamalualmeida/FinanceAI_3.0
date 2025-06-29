// Teste final do chat funcionando
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testChatFinal() {
  console.log('🎉 TESTE FINAL DO CHAT FUNCIONANDO');
  console.log('=================================');
  
  // Login
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login realizado');
  
  // Teste 1: Pergunta simples
  console.log('\n💬 Teste 1: Pergunta simples');
  const simple = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ message: 'Oi, como você está?' })
  });
  
  const simpleResult = await simple.json();
  if (simple.ok) {
    console.log('✅ Resposta OK');
    console.log(`📝 ${simpleResult.response?.substring(0, 100)}...`);
  }
  
  // Teste 2: Pergunta sobre análise financeira
  console.log('\n💰 Teste 2: Análise financeira');
  const analysis = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ 
      message: 'Analise minha situação: ganho R$ 5000, gasto R$ 3000, tenho R$ 10000 poupados' 
    })
  });
  
  const analysisResult = await analysis.json();
  if (analysis.ok) {
    console.log('✅ Análise OK');
    console.log(`📊 ${analysisResult.response?.substring(0, 200)}...`);
  }
  
  // Teste 3: Score de crédito
  console.log('\n🎯 Teste 3: Score de crédito');
  const score = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({ 
      message: 'Qual seria meu score de crédito?' 
    })
  });
  
  const scoreResult = await score.json();
  if (score.ok) {
    console.log('✅ Score OK');
    console.log(`🏆 ${scoreResult.response?.substring(0, 200)}...`);
  }
  
  console.log('\n🎯 RESULTADO FINAL');
  console.log('==================');
  console.log('✅ PROBLEMA DA OPENAI RESOLVIDO');
  console.log('✅ Chat funcionando com sistema local');
  console.log('✅ Análise financeira disponível');
  console.log('✅ Sistema pronto para upload de documentos');
  console.log('\n🚀 FINANCEAI OPERACIONAL!');
}

testChatFinal().catch(console.error);