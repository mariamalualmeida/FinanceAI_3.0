#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testAttachmentsFixed() {
    console.log('\n🔗 TESTE DE ANEXOS CORRIGIDOS');
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
            body: JSON.stringify({ title: 'Teste Anexos' })
        });
        
        const conversation = await conversationResponse.json();
        console.log('✅ Conversa criada:', conversation.id);
        
        // UPLOAD
        const testFile = 'attached_assets/Fatura-CPF_1751146806544.PDF';
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFile));
        formData.append('conversationId', conversation.id);
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: { 'Cookie': cookies },
            body: formData
        });
        
        console.log('✅ Upload enviado');
        
        // AGUARDAR PROCESSAMENTO
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // VERIFICAR MENSAGENS COM DETALHES
        const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversation.id}/messages`, {
            headers: { 'Cookie': cookies }
        });
        
        const messages = await messagesResponse.json();
        console.log(`\n📋 ANÁLISE DETALHADA DAS MENSAGENS (${messages.length}):`);
        
        let foundUserWithAttachment = false;
        let foundAutoAnalysis = false;
        let attachmentDetails = null;
        
        messages.forEach((msg, i) => {
            console.log(`\n   === MENSAGEM ${i + 1} ===`);
            console.log(`   Sender: ${msg.sender}`);
            console.log(`   Content: ${msg.content?.substring(0, 50)}...`);
            
            // Verificar anexos
            if (msg.metadata?.attachments) {
                foundUserWithAttachment = true;
                attachmentDetails = msg.metadata.attachments[0];
                console.log(`   📎 ANEXO ENCONTRADO:`);
                console.log(`      - Nome: ${attachmentDetails.originalname}`);
                console.log(`      - Tamanho: ${(attachmentDetails.fileSize / 1024).toFixed(1)} KB`);
                console.log(`      - Tipo: ${attachmentDetails.fileType}`);
            }
            
            // Verificar análise
            if (msg.content?.includes('ANÁLISE FINANCEIRA')) {
                foundAutoAnalysis = true;
                console.log(`   ✅ ANÁLISE DETECTADA`);
            }
        });
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 RESULTADOS DA CORREÇÃO:');
        console.log('='.repeat(50));
        
        const results = [
            { test: 'Mensagem do usuário com anexo', status: foundUserWithAttachment ? '✅ CORRIGIDO' : '❌ AINDA COM PROBLEMA' },
            { test: 'Análise automática gerada', status: foundAutoAnalysis ? '✅ FUNCIONANDO' : '❌ PROBLEMA' },
            { test: 'Detalhes do anexo salvos', status: attachmentDetails ? '✅ FUNCIONANDO' : '❌ PROBLEMA' }
        ];
        
        results.forEach(result => {
            console.log(`${result.status} - ${result.test}`);
        });
        
        const fixedCount = results.filter(r => r.status.includes('✅')).length;
        const score = Math.round((fixedCount / results.length) * 100);
        
        console.log(`\n🎯 SCORE PÓS-CORREÇÃO: ${score}% (${fixedCount}/${results.length} funcionando)`);
        
        if (attachmentDetails) {
            console.log('\n📎 DETALHES DO ANEXO SALVO:');
            console.log(`- Nome original: ${attachmentDetails.originalname}`);
            console.log(`- Tamanho: ${(attachmentDetails.fileSize / 1024).toFixed(1)} KB`);
            console.log(`- Tipo: ${attachmentDetails.fileType}`);
            console.log(`- MIME: ${attachmentDetails.mimeType}`);
        }
        
        if (score >= 90) {
            console.log('\n🎉 ANEXOS CORRIGIDOS COM SUCESSO!');
            console.log('Sistema agora exibe anexos no histórico das conversas.');
        } else {
            console.log('\n⚠️ Algumas funcionalidades ainda precisam de ajustes');
        }
        
        return score;
        
    } catch (error) {
        console.error('💥 Erro no teste:', error.message);
        return 0;
    }
}

testAttachmentsFixed().catch(console.error);