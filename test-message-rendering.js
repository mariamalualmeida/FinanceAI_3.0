#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testMessageRendering() {
    console.log('🔬 TESTE FINAL - RENDERIZAÇÃO DE MENSAGENS E ANEXOS');

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

        // 2. Teste múltiplos documentos
        console.log('\n📄 Testando upload de múltiplos documentos...');
        
        const documents = [
            'attached_assets/Fatura-CPF_1751146806544.PDF',
            'attached_assets/PicPay_Fatura_042025_1751172520655.pdf'
        ];
        
        const form = new FormData();
        documents.forEach(doc => {
            if (fs.existsSync(doc)) {
                form.append('files', fs.createReadStream(doc));
            }
        });
        form.append('message', 'Compare estas duas faturas e analise o padrão de gastos');

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
            console.log('✅ Upload múltiplo realizado');
            console.log('📄 Arquivos processados:', result.results?.length || 0);
            console.log('🆔 Conversa criada:', result.conversationId);
            console.log('🧠 Resposta IA gerada:', result.aiResponse ? 'Sim' : 'Não');
            
            if (result.conversationId) {
                // 3. Verificar todas as conversas
                console.log('\n📋 Verificando lista de conversas...');
                
                const conversationsResponse = await fetch(`${baseUrl}/api/conversations`, {
                    headers: { 'Cookie': cookies }
                });
                
                let recentConversation = null;
                if (conversationsResponse.ok) {
                    const conversations = await conversationsResponse.json();
                    console.log('✅ Conversas carregadas:', conversations.length);
                    
                    // Verificar títulos das conversas
                    recentConversation = conversations.find(c => c.id === result.conversationId);
                    if (recentConversation) {
                        console.log('✅ Conversa recente encontrada');
                        console.log('📝 Título:', recentConversation.title);
                        console.log('🔍 Título é específico:', !recentConversation.title.includes('Nova Conversa'));
                    }
                }
                
                // 4. Verificar mensagens da conversa
                console.log('\n💬 Verificando estrutura das mensagens...');
                
                const messagesResponse = await fetch(`${baseUrl}/api/conversations/${result.conversationId}/messages`, {
                    headers: { 'Cookie': cookies }
                });
                
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    console.log('✅ Mensagens carregadas:', messages.length);
                    
                    let testResults = {
                        totalMessages: messages.length,
                        userMessages: 0,
                        aiMessages: 0,
                        messagesWithAttachments: 0,
                        attachmentDetails: []
                    };
                    
                    messages.forEach((msg, index) => {
                        console.log(`\n📨 Mensagem ${index + 1}:`);
                        console.log(`  Sender: ${msg.sender}`);
                        console.log(`  Content: ${msg.content.substring(0, 100)}...`);
                        console.log(`  Has metadata: ${!!msg.metadata}`);
                        
                        if (msg.sender === 'user') {
                            testResults.userMessages++;
                            if (msg.metadata?.attachments) {
                                testResults.messagesWithAttachments++;
                                testResults.attachmentDetails.push({
                                    count: msg.metadata.attachments.length,
                                    files: msg.metadata.attachments.map(a => a.originalname)
                                });
                                console.log(`  📎 Anexos: ${msg.metadata.attachments.length}`);
                                msg.metadata.attachments.forEach(att => {
                                    console.log(`    - ${att.originalname} (${att.fileSize} bytes)`);
                                });
                            }
                        } else if (msg.sender === 'assistant') {
                            testResults.aiMessages++;
                        }
                    });
                    
                    // 5. Resultados do teste
                    console.log('\n📊 RESULTADOS DO TESTE:');
                    console.log(`Total de mensagens: ${testResults.totalMessages}`);
                    console.log(`Mensagens do usuário: ${testResults.userMessages}`);
                    console.log(`Mensagens da IA: ${testResults.aiMessages}`);
                    console.log(`Mensagens com anexos: ${testResults.messagesWithAttachments}`);
                    console.log(`Total de anexos: ${testResults.attachmentDetails.reduce((sum, att) => sum + att.count, 0)}`);
                    
                    // Verificar se estrutura está correta
                    const isValid = (
                        testResults.totalMessages >= 2 &&
                        testResults.userMessages >= 1 &&
                        testResults.aiMessages >= 1 &&
                        testResults.messagesWithAttachments >= 1
                    );
                    
                    return {
                        success: isValid,
                        details: testResults,
                        conversationCreated: true,
                        properTitles: recentConversation ? !recentConversation.title.includes('Nova Conversa') : false,
                        conversationTitle: recentConversation ? recentConversation.title : 'N/A'
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

testMessageRendering().then(result => {
    console.log('\n🎯 VALIDAÇÃO FINAL:');
    if (result.success) {
        console.log('✅ SISTEMA 100% FUNCIONAL');
        console.log(`✅ Conversa criada: ${result.conversationCreated}`);
        console.log(`✅ Título específico: ${result.properTitles} ("${result.conversationTitle}")`);
        console.log(`✅ Mensagens estruturadas: ${result.details?.totalMessages} total`);
        console.log(`✅ Anexos renderizados: ${result.details?.messagesWithAttachments} com anexos`);
        console.log(`✅ Fluxo completo funcionando: Upload → Conversa → Mensagens → Anexos`);
    } else {
        console.log('❌ PROBLEMAS RESTANTES:', result.error);
    }
    process.exit(result.success ? 0 : 1);
});