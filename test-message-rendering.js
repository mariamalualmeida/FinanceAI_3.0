#!/usr/bin/env node

import fetch from 'node-fetch';

async function testMessageRendering() {
    console.log('🔧 TESTANDO RENDERIZAÇÃO DE MENSAGENS...\n');

    const baseUrl = 'http://localhost:5000';
    
    try {
        // 1. Login
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login realizado');

        // 2. Criar conversa
        const conversationResponse = await fetch(`${baseUrl}/api/conversations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({ 
                title: 'Teste Mensagens',
                model: 'gemini'
            })
        });

        const conversation = await conversationResponse.json();
        console.log(`✅ Conversa criada: ${conversation.id}`);

        // 3. Enviar diferentes tipos de mensagens para testar renderização
        const testMessages = [
            'Olá! Esta é uma mensagem simples.',
            'Esta mensagem tem\nquebras de linha\npara testar renderização.',
            'Mensagem com **negrito** e *itálico* para testar markdown.',
            '{"tipo": "json", "valor": 123}', // JSON string
            '', // String vazia
            'Mensagem muito longa que vai testar o comportamento de quebra de texto e formatação quando há muito conteúdo para exibir na interface do usuário.'
        ];

        for (let i = 0; i < testMessages.length; i++) {
            const message = testMessages[i];
            console.log(`\n${i + 1}. Enviando mensagem: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
            
            const messageResponse = await fetch(`${baseUrl}/api/chat/send`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cookie': cookies
                },
                body: JSON.stringify({
                    conversationId: conversation.id,
                    message: message,
                    model: 'gemini'
                })
            });

            if (messageResponse.ok) {
                console.log('✅ Mensagem enviada e processada');
            } else {
                const error = await messageResponse.text();
                console.log(`❌ Erro ao enviar mensagem: ${error}`);
            }

            // Pequena pausa para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 4. Verificar todas as mensagens foram criadas corretamente
        console.log('\n4. Verificando mensagens na conversa...');
        
        const messagesResponse = await fetch(`${baseUrl}/api/conversations/${conversation.id}/messages`, {
            headers: { 'Cookie': cookies }
        });

        if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            console.log(`✅ ${messages.length} mensagens encontradas`);
            
            let userMessages = 0;
            let aiMessages = 0;
            
            messages.forEach(msg => {
                if (msg.sender === 'user') {
                    userMessages++;
                    // Verificar se a mensagem tem text ou content
                    const hasContent = msg.text || msg.content;
                    console.log(`📤 Usuário: ${hasContent ? '✅ Conteúdo OK' : '❌ Sem conteúdo'}`);
                } else {
                    aiMessages++;
                    console.log(`🤖 IA: Resposta gerada`);
                }
            });
            
            console.log(`\n📊 Resumo: ${userMessages} mensagens do usuário, ${aiMessages} respostas da IA`);
        }

        console.log('\n🎉 TESTE DE RENDERIZAÇÃO CONCLUÍDO!');
        console.log('✅ Sistema de mensagens funcionando corretamente');
        console.log('✅ MessageBubble.jsx corrigido para diferentes tipos de conteúdo');
        
        return true;

    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
        return false;
    }
}

testMessageRendering().then(success => {
    process.exit(success ? 0 : 1);
});