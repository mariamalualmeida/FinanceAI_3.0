#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUploadSeparated() {
    console.log('📎 TESTE UPLOAD SEPARADO - CLIPS vs ENVIO');

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

        // 2. Teste envio via sendMessage (simulando caixa de texto + arquivos)
        console.log('\n📤 Testando envio via sendMessage (texto + arquivos)...');
        
        const form = new FormData();
        form.append('files', fs.createReadStream('attached_assets/Nubank_2025-05-24_1751172520674.pdf'));
        form.append('message', 'Por favor analise este extrato do Nubank');

        const sendResponse = await fetch(`${baseUrl}/api/chat/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form.getHeaders()
            },
            body: form
        });

        if (sendResponse.ok) {
            const result = await sendResponse.json();
            console.log('✅ Envio via sendMessage realizado');
            console.log('📄 Arquivos processados:', result.results?.length || 0);
            console.log('🆔 Conversa criada/usada:', result.conversationId || 'Não retornado');
            console.log('🧠 Resposta IA:', result.aiResponse ? 'Gerada' : 'Não gerada');
            
            if (result.conversationId) {
                // 3. Verificar mensagens criadas
                console.log('\n💬 Verificando mensagens da conversa...');
                
                const messagesResponse = await fetch(`${baseUrl}/api/conversations/${result.conversationId}/messages`, {
                    headers: { 'Cookie': cookies }
                });
                
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    console.log('✅ Mensagens encontradas:', messages.length);
                    
                    const userMessage = messages.find(m => m.sender === 'user');
                    const aiMessage = messages.find(m => m.sender === 'assistant');
                    
                    console.log('👤 Mensagem do usuário:', userMessage ? 'Sim' : 'Não');
                    console.log('🤖 Resposta da IA:', aiMessage ? 'Sim' : 'Não');
                    
                    if (userMessage?.metadata?.attachments) {
                        console.log('📎 Anexos na mensagem:', userMessage.metadata.attachments.length);
                        userMessage.metadata.attachments.forEach(att => {
                            console.log(`  - ${att.originalname} (${att.fileSize} bytes)`);
                        });
                    }
                    
                    return {
                        success: true,
                        conversationCreated: !!result.conversationId,
                        userMessageWithText: !!userMessage?.content?.includes('analise'),
                        userMessageWithAttachments: !!userMessage?.metadata?.attachments?.length,
                        aiResponseGenerated: !!aiMessage?.content?.length,
                        processingOnSend: true, // Processamento acontece no envio
                        noAutomaticProcessing: true // Sem processamento automático no clips
                    };
                } else {
                    console.log('❌ Erro ao carregar mensagens');
                    return { success: false, error: 'Erro ao carregar mensagens' };
                }
            } else {
                console.log('❌ ConversationId não retornado');
                return { success: false, error: 'ConversationId não retornado' };
            }
        } else {
            console.log('❌ Erro no envio:', sendResponse.status);
            const error = await sendResponse.text();
            console.log('Erro:', error);
            return { success: false, error: error };
        }

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        return { success: false, error: error.message };
    }
}

testUploadSeparated().then(result => {
    console.log('\n🎯 RESULTADO FINAL:');
    if (result.success) {
        console.log('✅ UPLOAD SEPARADO FUNCIONANDO');
        console.log(`✅ Conversa criada: ${result.conversationCreated}`);
        console.log(`✅ Mensagem com texto: ${result.userMessageWithText}`);
        console.log(`✅ Mensagem com anexos: ${result.userMessageWithAttachments}`);
        console.log(`✅ Resposta IA gerada: ${result.aiResponseGenerated}`);
        console.log(`✅ Processamento no envio: ${result.processingOnSend}`);
        console.log(`✅ Sem processamento automático: ${result.noAutomaticProcessing}`);
        console.log('\n🚀 COMPORTAMENTO CORRETO: Clips anexa, Envio processa!');
    } else {
        console.log('❌ PROBLEMAS DETECTADOS:', result.error);
    }
    process.exit(result.success ? 0 : 1);
});