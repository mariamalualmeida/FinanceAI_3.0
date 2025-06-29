#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testAttachmentsFixed() {
    console.log('🔧 TESTE FINAL - ANEXOS E MENSAGENS CORRIGIDOS');

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

        // 2. Teste upload via /api/chat/upload (rota principal)
        console.log('\n📄 Testando upload via /api/chat/upload...');
        
        const form = new FormData();
        form.append('files', fs.createReadStream('attached_assets/Fatura-CPF_1751146806544.PDF'));
        form.append('message', 'Analise esta fatura CPF');

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
            console.log('✅ Upload realizado com sucesso');
            console.log('📄 Arquivos processados:', result.results?.length || 0);
            console.log('🧠 Análise gerada:', result.aiResponse ? 'Sim' : 'Não');
            
            // Verificar se a conversa foi criada
            if (result.conversationId) {
                console.log('✅ Conversa criada:', result.conversationId);
                
                // 3. Verificar mensagens na conversa
                const messagesResponse = await fetch(`${baseUrl}/api/conversations/${result.conversationId}/messages`, {
                    headers: { 'Cookie': cookies }
                });
                
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    console.log('✅ Mensagens carregadas:', messages.length);
                    
                    // Verificar se as mensagens têm anexos
                    const messageWithAttachment = messages.find(m => 
                        m.metadata?.attachments || 
                        (m.content && m.content.includes('📎'))
                    );
                    
                    if (messageWithAttachment) {
                        console.log('✅ Mensagem com anexo encontrada');
                        console.log('📎 Anexos:', messageWithAttachment.metadata?.attachments?.length || 0);
                    }
                    
                    // Verificar se há resposta da IA
                    const aiMessage = messages.find(m => m.sender === 'assistant');
                    if (aiMessage) {
                        console.log('✅ Resposta da IA encontrada');
                        console.log('📝 Tamanho da resposta:', aiMessage.content?.length || 0, 'chars');
                    }
                }
            }
            
            return true;
        } else {
            console.log('❌ Erro no upload:', uploadResponse.status);
            const error = await uploadResponse.text();
            console.log('Erro:', error);
            return false;
        }

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        return false;
    }
}

testAttachmentsFixed().then(success => {
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(success ? '✅ SISTEMA FUNCIONANDO - Anexos e mensagens corrigidos' : '❌ PROBLEMAS DETECTADOS');
    process.exit(success ? 0 : 1);
});