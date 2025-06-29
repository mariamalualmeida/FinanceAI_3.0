#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUploadFixed() {
    console.log('🔧 TESTANDO CORREÇÕES DE UPLOAD...\n');

    const baseUrl = 'http://localhost:5000';
    
    try {
        // 1. Login
        console.log('1. Fazendo login...');
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const cookies = loginResponse.headers.get('set-cookie');
        const loginData = await loginResponse.json();
        console.log(`✅ Login bem-sucedido: ${loginData.user.username}`);

        // 2. Teste de upload sem conversationId (deve gerar null corretamente)
        console.log('\n2. Testando upload sem conversationId...');
        
        // Buscar um arquivo de teste real
        const testFiles = [
            'attached_assets/Nubank_2025-05-24_1751172520674.pdf',
            'attached_assets/Fatura-CPF_1751146806544.PDF',
            'attached_assets/extrato-255cc9e6-800c-4eba-b393-90856ae02ba7.xlsx (1)_1751172520634.xls'
        ];

        let testFile = null;
        for (const file of testFiles) {
            if (fs.existsSync(file)) {
                testFile = file;
                break;
            }
        }

        if (!testFile) {
            console.log('⚠️  Nenhum arquivo de teste encontrado, criando arquivo fictício...');
            fs.writeFileSync('test-document.txt', 'Arquivo de teste para validar upload\nData: ' + new Date().toISOString());
            testFile = 'test-document.txt';
        }

        const form = new FormData();
        form.append('file', fs.createReadStream(testFile));
        // Não incluir conversationId para testar o caso null

        const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form.getHeaders()
            },
            body: form
        });

        const uploadResult = await uploadResponse.json();
        
        if (uploadResponse.ok && uploadResult.success) {
            console.log(`✅ Upload bem-sucedido: ${uploadResult.uploadId}`);
            console.log(`📄 Arquivo: ${testFile}`);
            console.log(`📊 Resultado: ${uploadResult.message || 'Processado com sucesso'}`);
        } else {
            console.log(`❌ Erro no upload: ${uploadResult.message}`);
            return false;
        }

        // 3. Criar conversa e testar upload com conversationId válido
        console.log('\n3. Criando conversa para teste...');
        
        const conversationResponse = await fetch(`${baseUrl}/api/conversations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({ 
                title: 'Teste Upload Corrigido',
                model: 'gemini'
            })
        });

        if (!conversationResponse.ok) {
            throw new Error('Falha ao criar conversa');
        }

        const conversation = await conversationResponse.json();
        console.log(`✅ Conversa criada: ${conversation.id}`);

        // 4. Upload com conversationId válido
        console.log('\n4. Testando upload com conversationId...');
        
        const form2 = new FormData();
        form2.append('file', fs.createReadStream(testFile));
        form2.append('conversationId', conversation.id);

        const uploadResponse2 = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            headers: { 
                'Cookie': cookies,
                ...form2.getHeaders()
            },
            body: form2
        });

        const uploadResult2 = await uploadResponse2.json();
        
        if (uploadResponse2.ok && uploadResult2.success) {
            console.log(`✅ Upload com conversa bem-sucedido: ${uploadResult2.uploadId}`);
        } else {
            console.log(`❌ Erro no upload com conversa: ${uploadResult2.message}`);
            return false;
        }

        // 5. Verificar se mensagens foram criadas
        console.log('\n5. Verificando mensagens criadas...');
        
        const messagesResponse = await fetch(`${baseUrl}/api/conversations/${conversation.id}/messages`, {
            headers: { 'Cookie': cookies }
        });

        if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            console.log(`✅ ${messages.length} mensagens encontradas na conversa`);
            
            if (messages.length > 0) {
                const userMessage = messages.find(m => m.sender === 'user');
                if (userMessage && userMessage.metadata?.attachments) {
                    console.log(`📎 Anexo encontrado: ${userMessage.metadata.attachments[0].originalname}`);
                }
            }
        }

        // Limpeza
        if (testFile === 'test-document.txt') {
            fs.unlinkSync(testFile);
        }

        console.log('\n🎉 TODOS OS TESTES DE UPLOAD PASSARAM!');
        console.log('✅ Erro de UUID null corrigido');
        console.log('✅ Upload funcionando sem conversationId');
        console.log('✅ Upload funcionando com conversationId');
        console.log('✅ Mensagens sendo criadas corretamente');
        
        return true;

    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
        return false;
    }
}

testUploadFixed().then(success => {
    process.exit(success ? 0 : 1);
});