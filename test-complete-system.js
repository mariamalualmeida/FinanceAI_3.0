#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

async function loginAndGetSession() {
    console.log('🔐 Fazendo login...');
    const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const cookies = response.headers.get('set-cookie');
    if (response.status === 200) {
        console.log('✅ Login realizado');
        return cookies;
    }
    throw new Error('Falha no login');
}

async function createConversation(cookies) {
    console.log('💬 Criando conversa...');
    const response = await fetch('http://localhost:5000/api/conversations', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies 
        },
        body: JSON.stringify({ title: 'Teste Sistema Completo' })
    });
    
    const conversation = await response.json();
    if (response.ok) {
        console.log('✅ Conversa criada:', conversation.id);
        return conversation.id;
    }
    throw new Error('Falha ao criar conversa');
}

async function uploadDocumentWithConversation(filePath, cookies, conversationId) {
    console.log('📎 Testando upload via clips...');
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('conversationId', conversationId);
    
    const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Cookie': cookies },
        body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
        console.log('✅ Upload realizado:', result.uploadId);
        console.log('📄 Status:', result.message);
        return result;
    } else {
        throw new Error(`Upload falhou: ${result.message}`);
    }
}

async function checkMessagesAndData(cookies, conversationId) {
    console.log('🔍 Verificando mensagens e dados...');
    
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
        headers: { 'Cookie': cookies }
    });
    
    const messages = await response.json();
    
    if (!Array.isArray(messages)) {
        throw new Error('Resposta de mensagens inválida');
    }
    
    console.log(`📝 Total de mensagens: ${messages.length}`);
    
    let hasRealData = false;
    let hasFileAttachment = false;
    let realTransactionCount = 0;
    
    messages.forEach((msg, index) => {
        console.log(`\n   Mensagem ${index + 1}:`);
        console.log(`   - Remetente: ${msg.sender}`);
        console.log(`   - Tipo: ${msg.type || 'text'}`);
        
        if (msg.attachments && msg.attachments.length > 0) {
            hasFileAttachment = true;
            console.log(`   - 📎 Anexos: ${msg.attachments.length}`);
            msg.attachments.forEach(att => {
                console.log(`     📄 ${att.originalname} (${att.size} bytes)`);
            });
        }
        
        if (msg.content) {
            // Verificar se contém dados reais (números, valores, transações)
            const hasNumbers = /\d+/.test(msg.content);
            const hasCurrency = /R\$|reais|crédito|débito/i.test(msg.content);
            const hasTransactions = /transaç|moviment|saldo/i.test(msg.content);
            
            if (hasNumbers && (hasCurrency || hasTransactions)) {
                hasRealData = true;
                
                // Contar transações mencionadas
                const transactionMatches = msg.content.match(/transaç\w*:\s*(\d+)/i);
                if (transactionMatches) {
                    realTransactionCount = parseInt(transactionMatches[1]);
                }
            }
            
            if (msg.content.length > 200) {
                console.log(`   - 📝 Conteúdo: ${msg.content.substring(0, 200)}...`);
            } else {
                console.log(`   - 📝 Conteúdo: ${msg.content}`);
            }
        }
    });
    
    return {
        hasRealData,
        hasFileAttachment,
        realTransactionCount,
        messageCount: messages.length,
        messages
    };
}

async function testMessageDeletion(cookies, conversationId) {
    console.log('🗑️ Testando exclusão de mensagens...');
    
    // Obter mensagens atuais
    const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
        headers: { 'Cookie': cookies }
    });
    
    const messages = await messagesResponse.json();
    
    if (!Array.isArray(messages) || messages.length === 0) {
        console.log('⚠️ Nenhuma mensagem para excluir');
        return false;
    }
    
    console.log(`📝 Encontradas ${messages.length} mensagens para excluir`);
    
    // Tentar excluir a primeira mensagem
    const messageToDelete = messages[0];
    console.log(`🎯 Tentando excluir mensagem: ${messageToDelete.id}`);
    
    const deleteResponse = await fetch(`http://localhost:5000/api/messages/${messageToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': cookies }
    });
    
    if (deleteResponse.ok) {
        console.log('✅ Mensagem excluída com sucesso');
        
        // Verificar se realmente foi excluída
        const checkResponse = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
            headers: { 'Cookie': cookies }
        });
        
        const updatedMessages = await checkResponse.json();
        const wasDeleted = updatedMessages.length < messages.length;
        
        console.log(`📊 Antes: ${messages.length} | Depois: ${updatedMessages.length} | Excluída: ${wasDeleted ? 'Sim' : 'Não'}`);
        return wasDeleted;
    } else {
        console.log('❌ Falha ao excluir mensagem');
        return false;
    }
}

async function testConversationDeletion(cookies) {
    console.log('🗂️ Testando exclusão de conversa completa...');
    
    // Listar conversas atuais
    const conversationsResponse = await fetch('http://localhost:5000/api/conversations', {
        headers: { 'Cookie': cookies }
    });
    
    const conversations = await conversationsResponse.json();
    
    if (!Array.isArray(conversations) || conversations.length === 0) {
        console.log('⚠️ Nenhuma conversa para excluir');
        return false;
    }
    
    const conversationToDelete = conversations[0];
    console.log(`🎯 Tentando excluir conversa: ${conversationToDelete.id}`);
    
    const deleteResponse = await fetch(`http://localhost:5000/api/conversations/${conversationToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': cookies }
    });
    
    if (deleteResponse.ok) {
        console.log('✅ Conversa excluída com sucesso');
        return true;
    } else {
        console.log('❌ Falha ao excluir conversa');
        return false;
    }
}

async function testChatInteraction(cookies, conversationId) {
    console.log('💬 Testando interação de chat...');
    
    const testMessage = 'Olá, você pode me ajudar com análise financeira?';
    
    const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies 
        },
        body: JSON.stringify({ 
            message: testMessage,
            conversationId: conversationId 
        })
    });
    
    const result = await response.json();
    
    if (response.ok && result.reply) {
        console.log('✅ Chat respondeu');
        console.log(`💬 Resposta (${result.reply.length} chars): ${result.reply.substring(0, 150)}...`);
        return true;
    } else {
        console.log('❌ Chat não respondeu');
        return false;
    }
}

async function runCompleteSystemTest() {
    console.log('\n🔄 TESTE COMPLETO DO SISTEMA FinanceAI');
    console.log('='.repeat(60));
    
    try {
        // 1. Login
        const cookies = await loginAndGetSession();
        
        // 2. Criar conversa
        const conversationId = await createConversation(cookies);
        
        // 3. Upload de arquivo real
        const testFile = 'attached_assets/Fatura-CPF_1751146806544.PDF';
        const uploadResult = await uploadDocumentWithConversation(testFile, cookies, conversationId);
        
        // 4. Verificar dados reais
        const dataCheck = await checkMessagesAndData(cookies, conversationId);
        
        // 5. Testar chat
        const chatWorking = await testChatInteraction(cookies, conversationId);
        
        // 6. Testar exclusão de mensagem
        const messageDeletionWorking = await testMessageDeletion(cookies, conversationId);
        
        // 7. Testar exclusão de conversa
        const conversationDeletionWorking = await testConversationDeletion(cookies);
        
        // 8. Resultados finais
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESULTADOS DO TESTE COMPLETO:');
        console.log('='.repeat(60));
        
        const tests = [
            { name: 'Login', passed: !!cookies },
            { name: 'Criar Conversa', passed: !!conversationId },
            { name: 'Upload Arquivo', passed: !!uploadResult.uploadId },
            { name: 'Arquivo no Histórico', passed: dataCheck.hasFileAttachment },
            { name: 'Dados Reais Gerados', passed: dataCheck.hasRealData },
            { name: 'Chat Funcionando', passed: chatWorking },
            { name: 'Exclusão Mensagem', passed: messageDeletionWorking },
            { name: 'Exclusão Conversa', passed: conversationDeletionWorking }
        ];
        
        let passedTests = 0;
        tests.forEach(test => {
            const status = test.passed ? '✅ PASSOU' : '❌ FALHOU';
            console.log(`${status} - ${test.name}`);
            if (test.passed) passedTests++;
        });
        
        const score = Math.round((passedTests / tests.length) * 100);
        console.log(`\n🎯 SCORE GERAL: ${score}% (${passedTests}/${tests.length} testes)`);
        
        // Detalhes específicos
        console.log('\n📊 DETALHES DOS DADOS:');
        console.log(`- Mensagens encontradas: ${dataCheck.messageCount}`);
        console.log(`- Anexos detectados: ${dataCheck.hasFileAttachment ? 'Sim' : 'Não'}`);
        console.log(`- Dados financeiros reais: ${dataCheck.hasRealData ? 'Sim' : 'Não'}`);
        console.log(`- Transações processadas: ${dataCheck.realTransactionCount || 'N/A'}`);
        
        // Status final
        if (score >= 80) {
            console.log('\n🎉 SISTEMA FUNCIONANDO ADEQUADAMENTE!');
        } else if (score >= 60) {
            console.log('\n⚠️ Sistema parcialmente funcional - necessárias melhorias');
        } else {
            console.log('\n🚨 SISTEMA COM PROBLEMAS CRÍTICOS');
        }
        
        return { score, tests, dataCheck };
        
    } catch (error) {
        console.error('\n💥 ERRO NO TESTE:', error.message);
        return false;
    }
}

// Executar teste
runCompleteSystemTest().catch(console.error);