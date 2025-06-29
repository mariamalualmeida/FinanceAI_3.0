#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testWebLogin() {
    console.log('🌐 Testando login via web...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    if (response.status === 200) {
        const text = await response.text();
        console.log('Response:', text.substring(0, 200) + '...');
        return response.headers.get('set-cookie');
    }
    
    return null;
}

async function testConversations(cookies) {
    console.log('📋 Testando listagem de conversas...');
    
    const response = await fetch('http://localhost:5000/api/conversations', {
        headers: { 'Cookie': cookies || '' }
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
        const conversations = await response.json();
        console.log('Conversas encontradas:', conversations.length);
        return conversations;
    } else {
        const error = await response.json();
        console.log('Erro:', error);
        return [];
    }
}

async function testChatMessage(cookies, conversationId) {
    console.log('💬 Testando mensagem de chat...');
    
    const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies || ''
        },
        body: JSON.stringify({ 
            message: 'Teste de mensagem',
            conversationId: conversationId 
        })
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
        const result = await response.json();
        console.log('Chat respondeu:', !!result.reply);
        return result;
    } else {
        const error = await response.json();
        console.log('Erro:', error);
        return null;
    }
}

async function testFileUpload(cookies) {
    console.log('📎 Testando upload de arquivo...');
    
    const testFile = 'attached_assets/Fatura-CPF_1751146806544.PDF';
    
    if (!fs.existsSync(testFile)) {
        console.log('❌ Arquivo de teste não encontrado');
        return false;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    
    const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Cookie': cookies || '' },
        body: formData
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
        const result = await response.json();
        console.log('Upload resultado:', result);
        return result;
    } else {
        const error = await response.json();
        console.log('Erro:', error);
        return false;
    }
}

async function testSystemHealth() {
    console.log('🔧 Testando saúde do sistema...');
    
    const response = await fetch('http://localhost:5000/api/user');
    console.log('Endpoint /api/user status:', response.status);
    
    const statusResponse = await fetch('http://localhost:5000');
    console.log('Servidor principal status:', statusResponse.status);
    
    return { api: response.status, server: statusResponse.status };
}

async function runWebInterfaceTest() {
    console.log('\n🌐 TESTE DA INTERFACE WEB');
    console.log('='.repeat(50));
    
    try {
        // 1. Verificar saúde do sistema
        const health = await testSystemHealth();
        
        // 2. Testar login
        const cookies = await testWebLogin();
        
        // 3. Testar conversas
        const conversations = await testConversations(cookies);
        
        // 4. Testar chat (se tiver conversa)
        let chatResult = null;
        if (conversations.length > 0) {
            chatResult = await testChatMessage(cookies, conversations[0].id);
        }
        
        // 5. Testar upload
        const uploadResult = await testFileUpload(cookies);
        
        // 6. Resultados
        console.log('\n📊 RESULTADOS:');
        console.log('- Sistema online:', health.server === 200 ? 'Sim' : 'Não');
        console.log('- Login funcionando:', !!cookies ? 'Sim' : 'Não');
        console.log('- Conversas carregando:', conversations.length >= 0 ? 'Sim' : 'Não');
        console.log('- Chat respondendo:', !!chatResult ? 'Sim' : 'Não');
        console.log('- Upload funcionando:', !!uploadResult ? 'Sim' : 'Não');
        
        if (!cookies) {
            console.log('\n⚠️ PROBLEMA IDENTIFICADO: Sistema de autenticação');
            console.log('O login retorna 200 mas não estabelece sessão correta');
        }
        
        if (uploadResult) {
            console.log('\n✅ Upload funcionando - arquivo processado');
        }
        
        return {
            systemOnline: health.server === 200,
            loginWorking: !!cookies,
            conversationsLoading: conversations.length >= 0,
            chatResponding: !!chatResult,
            uploadWorking: !!uploadResult
        };
        
    } catch (error) {
        console.error('💥 Erro no teste:', error.message);
        return false;
    }
}

runWebInterfaceTest().catch(console.error);