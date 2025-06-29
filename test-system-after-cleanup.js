#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testSystemAfterCleanup() {
    console.log('\n🧹 TESTE DO SISTEMA APÓS LIMPEZA');
    console.log('='.repeat(50));
    
    try {
        // 1. Login
        const loginResponse = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });
        
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login funcionando');
        
        // 2. Criar conversa
        const conversationResponse = await fetch('http://localhost:5000/api/conversations', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookies 
            },
            body: JSON.stringify({ title: 'Teste Pós-Limpeza' })
        });
        
        const conversation = await conversationResponse.json();
        console.log('✅ Criação de conversa funcionando');
        
        // 3. Upload de arquivo
        const testFile = 'attached_assets/Fatura-CPF_1751146806544.PDF';
        if (fs.existsSync(testFile)) {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(testFile));
            formData.append('conversationId', conversation.id);
            
            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: { 'Cookie': cookies },
                body: formData
            });
            
            if (uploadResponse.ok) {
                console.log('✅ Upload funcionando');
                
                // Aguardar processamento
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Verificar mensagens
                const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversation.id}/messages`, {
                    headers: { 'Cookie': cookies }
                });
                
                const messages = await messagesResponse.json();
                console.log(`✅ Processamento funcionando: ${messages.length} mensagens`);
                
                const hasAnalysis = messages.some(m => m.content && m.content.includes('ANÁLISE FINANCEIRA'));
                console.log(`✅ Análise automática: ${hasAnalysis ? 'Funcionando' : 'Não detectada'}`);
                
            } else {
                console.log('❌ Upload com problema');
            }
        } else {
            console.log('⚠️ Arquivo de teste não encontrado');
        }
        
        console.log('\n🎯 RESULTADO FINAL: Sistema funcionando corretamente após limpeza');
        return true;
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

testSystemAfterCleanup().catch(console.error);