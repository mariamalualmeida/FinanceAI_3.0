#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testDebugMessage() {
    console.log('🔍 DEBUG - VERIFICANDO CRIAÇÃO DE MENSAGENS');

    const baseUrl = 'http://localhost:5000';
    
    try {
        // Login
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login realizado');

        // Upload com debug
        const form = new FormData();
        form.append('files', fs.createReadStream('attached_assets/Nubank_2025-05-24_1751172520674.pdf'));
        form.append('message', 'Debug test - analise este arquivo');

        const uploadResponse = await fetch(`${baseUrl}/api/chat/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form.getHeaders()
            },
            body: form
        });

        const result = await uploadResponse.json();
        console.log('📄 Upload response:', JSON.stringify(result, null, 2));

        if (result.conversationId) {
            // Buscar mensagens
            const messagesResponse = await fetch(`${baseUrl}/api/conversations/${result.conversationId}/messages`, {
                headers: { 'Cookie': cookies }
            });
            
            const messages = await messagesResponse.json();
            console.log('\n💬 Mensagens encontradas:');
            messages.forEach((msg, i) => {
                console.log(`${i + 1}. [${msg.sender}] ${msg.content.substring(0, 100)}...`);
            });
        }

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testDebugMessage();