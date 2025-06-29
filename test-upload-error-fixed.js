#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUploadErrorFixed() {
    console.log('🔧 TESTANDO CORREÇÃO DE ERRO DE UPLOAD');

    const baseUrl = 'http://localhost:5000';
    
    try {
        // 1. Login
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login OK');

        // 2. Testar upload de arquivo real
        console.log('\n📄 Testando upload de arquivo real...');
        
        const testFileName = 'attached_assets/Nubank_2025-05-24_1751172520674.pdf';
        
        if (!fs.existsSync(testFileName)) {
            console.log('❌ Arquivo não encontrado:', testFileName);
            return false;
        }

        const form = new FormData();
        form.append('files', fs.createReadStream(testFileName));
        form.append('message', 'Análise deste comprovante');

        const uploadResponse = await fetch(`${baseUrl}/api/chat/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form.getHeaders()
            },
            body: form
        });

        const uploadResult = await uploadResponse.json();
        
        console.log('Status:', uploadResponse.status);
        console.log('Resultado:', uploadResult);

        if (uploadResponse.ok && uploadResult.success) {
            console.log('✅ Upload realizado com sucesso');
            
            // Verificar se foi processado
            if (uploadResult.analysis) {
                console.log('✅ Análise financeira gerada');
                console.log('📊 Transações:', uploadResult.analysis.transactionCount);
            }
            
            return true;
        } else {
            console.log('❌ Erro no upload:', uploadResult.message || 'Erro desconhecido');
            return false;
        }

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        return false;
    }
}

testUploadErrorFixed().then(success => {
    console.log('\n🎯 RESULTADO FINAL:', success ? 'SUCESSO' : 'FALHA');
    process.exit(success ? 0 : 1);
});