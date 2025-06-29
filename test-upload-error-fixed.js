#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testUploadErrorFixed() {
    console.log('\n🔧 TESTE DE CORREÇÃO DE ERRO DE UPLOAD');
    console.log('='.repeat(50));
    
    try {
        // LOGIN
        const loginResponse = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });
        
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login OK');
        
        // CRIAR CONVERSA
        const conversationResponse = await fetch('http://localhost:5000/api/conversations', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookies 
            },
            body: JSON.stringify({ title: 'Teste Erro Upload' })
        });
        
        const conversation = await conversationResponse.json();
        console.log('✅ Conversa criada:', conversation.id);
        
        // TESTE 1: Upload arquivo simples
        console.log('\n📎 TESTE 1: Upload arquivo PDF...');
        const testFile = 'attached_assets/Fatura-CPF_1751146806544.PDF';
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFile));
        formData.append('conversationId', conversation.id);
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: { 'Cookie': cookies },
            body: formData
        });
        
        if (uploadResponse.ok) {
            console.log('✅ Upload 1 OK');
        } else {
            console.log('❌ Upload 1 FALHOU:', uploadResponse.status);
        }
        
        // AGUARDAR PROCESSAMENTO
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // VERIFICAR MENSAGENS CARREGAM SEM ERRO
        console.log('\n📋 TESTE 2: Carregamento de mensagens...');
        const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversation.id}/messages`, {
            headers: { 'Cookie': cookies }
        });
        
        if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            console.log(`✅ Mensagens carregaram OK: ${messages.length} mensagens`);
            
            // Verificar estrutura das mensagens
            messages.forEach((msg, i) => {
                console.log(`   Msg ${i+1}: sender=${msg.sender}, hasText=${!!msg.text}, hasContent=${!!msg.content}`);
                if (!msg.text && !msg.content) {
                    console.log('⚠️ Mensagem sem texto detectada');
                }
            });
            
        } else {
            console.log('❌ Erro ao carregar mensagens:', messagesResponse.status);
        }
        
        // TESTE 3: Upload via clips
        console.log('\n📎 TESTE 3: Upload via botão clips...');
        const formData2 = new FormData();
        formData2.append('file', fs.createReadStream(testFile));
        formData2.append('conversationId', conversation.id);
        
        const clipUploadResponse = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: { 'Cookie': cookies },
            body: formData2
        });
        
        if (clipUploadResponse.ok) {
            console.log('✅ Upload clips OK');
        } else {
            console.log('❌ Upload clips FALHOU:', clipUploadResponse.status);
        }
        
        // AGUARDAR E VERIFICAR NOVAMENTE
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalMessagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversation.id}/messages`, {
            headers: { 'Cookie': cookies }
        });
        
        if (finalMessagesResponse.ok) {
            const finalMessages = await finalMessagesResponse.json();
            console.log(`✅ Verificação final OK: ${finalMessages.length} mensagens`);
        } else {
            console.log('❌ Erro na verificação final');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 RESULTADO DO TESTE:');
        console.log('='.repeat(50));
        
        const testsPassed = [
            uploadResponse.ok,
            messagesResponse.ok,
            clipUploadResponse.ok,
            finalMessagesResponse.ok
        ];
        
        const passedCount = testsPassed.filter(Boolean).length;
        const score = Math.round((passedCount / testsPassed.length) * 100);
        
        console.log(`Score: ${score}% (${passedCount}/${testsPassed.length} testes passou)`);
        
        if (score >= 90) {
            console.log('🎉 ERRO DE UPLOAD CORRIGIDO COM SUCESSO!');
        } else {
            console.log('⚠️ Ainda há problemas que precisam ser corrigidos');
        }
        
        return score;
        
    } catch (error) {
        console.error('💥 Erro no teste:', error.message);
        return 0;
    }
}

testUploadErrorFixed().catch(console.error);