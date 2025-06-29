// Teste direto sem conversationId problemático
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testChatSimple() {
  console.log('🔐 Login...');
  
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login OK');
  
  // Teste SEM conversationId (deixar sistema criar novo)
  console.log('\n🤖 Teste sem conversationId...');
  
  const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      message: 'Oi, você funciona?'
      // SEM conversationId - deixar criar novo
    })
  });
  
  const result = await chatResponse.json();
  
  if (chatResponse.ok) {
    console.log('✅ FUNCIONOU!');
    console.log(`📝 Resposta: ${result.message?.substring(0, 150)}...`);
  } else {
    console.log(`❌ Falhou: ${result.message}`);
  }
}

testChatSimple().catch(console.error);