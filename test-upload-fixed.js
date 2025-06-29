#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUploadFixed() {
    console.log('🔧 TESTE UPLOAD CORRIGIDO - CONVERSAS E MENSAGENS');

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

        // 2. Teste upload via clips (nova conversa)
        console.log('\n📄 Testando upload via clips (nova conversa)...');
        
        const form = new FormData();
        form.append('files', fs.createReadStream('attached_assets/Nubank_2025-05-24_1751172520674.pdf'));
        form.append('message', 'Análise financeira do Nubank');

        const uploadResponse = await fetch(`${baseUrl}/api/chat/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form.getHeaders()
            },
            body: form
        });

        if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            console.log('✅ Upload via chat/upload realizado');
            console.log('📄 Arquivos processados:', result.results?.length || 0);
            console.log('🆔 Conversa criada:', result.conversationId || 'Não retornado');
            console.log('🧠 Resposta IA:', result.aiResponse ? 'Gerada' : 'Não gerada');
            
            if (result.conversationId) {
                // 3. Verificar se mensagens foram criadas
                console.log('\n💬 Verificando mensagens na conversa...');
                
                const messagesResponse = await fetch(`${baseUrl}/api/conversations/${result.conversationId}/messages`, {
                    headers: { 'Cookie': cookies }
                });
                
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    console.log('✅ Mensagens carregadas:', messages.length);
                    
                    // Verificar mensagem do usuário com anexo
                    const userMessage = messages.find(m => m.sender === 'user');
                    if (userMessage) {
                        console.log('✅ Mensagem do usuário encontrada');
                        console.log('📎 Anexos:', userMessage.metadata?.attachments?.length || 0);
                        console.log('📝 Conteúdo:', userMessage.content.substring(0, 100) + '...');
                    }
                    
                    // Verificar resposta da IA
                    const aiMessage = messages.find(m => m.sender === 'assistant');
                    if (aiMessage) {
                        console.log('✅ Resposta da IA encontrada');
                        console.log('📝 Tamanho:', aiMessage.content.length, 'chars');
                    }
                    
                    return {
                        success: true,
                        conversationCreated: !!result.conversationId,
                        messagesCreated: messages.length > 0,
                        userMessageWithAttachment: !!userMessage?.metadata?.attachments,
                        aiResponseGenerated: !!aiMessage,
                        totalMessages: messages.length
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
            console.log('❌ Erro no upload:', uploadResponse.status);
            const error = await uploadResponse.text();
            console.log('Erro:', error);
            return { success: false, error: error };
        }

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        return { success: false, error: error.message };
    }
}

testUploadFixed().then(result => {
    console.log('\n🎯 RESULTADO FINAL:');
    if (result.success) {
        console.log('✅ UPLOAD CORRIGIDO COM SUCESSO');
        console.log(`✅ Conversa criada: ${result.conversationCreated}`);
        console.log(`✅ Mensagens criadas: ${result.messagesCreated} (${result.totalMessages})`);
        console.log(`✅ Anexo visível: ${result.userMessageWithAttachment}`);
        console.log(`✅ Resposta IA: ${result.aiResponseGenerated}`);
    } else {
        console.log('❌ PROBLEMAS DETECTADOS:', result.error);
    }
    process.exit(result.success ? 0 : 1);
});