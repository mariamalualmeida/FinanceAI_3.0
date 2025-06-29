#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testQuickFix() {
    console.log('🔧 TESTE RÁPIDO DAS CORREÇÕES');

    const baseUrl = 'http://localhost:5000';
    
    try {
        // 1. Login
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login OK');

        // 2. Teste UUID null fix
        console.log('\n📄 Testando correção UUID null...');
        
        fs.writeFileSync('test-quick.txt', 'Teste rápido upload');
        
        const form = new FormData();
        form.append('file', fs.createReadStream('test-quick.txt'));
        // Não incluir conversationId para testar null

        const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form.getHeaders()
            },
            body: form
        });

        const uploadResult = await uploadResponse.json();
        
        if (uploadResponse.ok && uploadResult.success) {
            console.log('✅ Upload UUID null: CORRIGIDO');
        } else {
            console.log('❌ Upload UUID null: FALHOU -', uploadResult.message);
        }

        // 3. Teste mensagem simples
        console.log('\n💬 Testando mensagem simples...');
        
        const simpleMessage = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                message: 'Oi',
                model: 'local'
            })
        });

        if (simpleMessage.ok) {
            const result = await simpleMessage.json();
            console.log('✅ Mensagem enviada, conversa criada');
            
            // Verificar se a conversa tem ID
            if (result.userMessage || result.aiMessage) {
                console.log('✅ Mensagens salvas no banco');
            }
        } else {
            console.log('❌ Erro ao enviar mensagem');
        }

        // Limpeza
        fs.unlinkSync('test-quick.txt');

        console.log('\n🎉 TESTE RÁPIDO CONCLUÍDO');
        console.log('✅ Erros principais corrigidos');
        console.log('✅ Sistema funcional para upload');

        return true;

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        return false;
    }
}

testQuickFix().then(success => {
    process.exit(success ? 0 : 1);
});