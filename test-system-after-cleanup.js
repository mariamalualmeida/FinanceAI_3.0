#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testSystemAfterCleanup() {
    console.log('🔬 TESTE COMPLETO COM DOCUMENTOS REAIS - VALIDAÇÃO FINAL');
    
    const baseUrl = 'http://localhost:5000';
    const testResults = [];
    
    // Documentos reais para teste
    const realDocuments = [
        'attached_assets/Nubank_2025-05-24_1751172520674.pdf',
        'attached_assets/Fatura-CPF_1751146806544.PDF',
        'attached_assets/extrato-255cc9e6-800c-4eba-b393-90856ae02ba7.xlsx',
        'attached_assets/Extrato-13-05-2025-a-12-06-2025_1751172520517.pdf',
        'attached_assets/PicPay_Fatura_042025_1751172520655.pdf'
    ];
    
    try {
        // 1. Login
        console.log('\n=== 1. TESTE DE AUTENTICAÇÃO ===');
        const loginResponse = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login falhou: ${loginResponse.status}`);
        }

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login bem-sucedido');
        
        // 2. Teste de upload de documentos reais
        console.log('\n=== 2. TESTE DE UPLOAD DE DOCUMENTOS REAIS ===');
        
        for (const docPath of realDocuments) {
            if (!fs.existsSync(docPath)) {
                console.log(`⚠️  Documento não encontrado: ${docPath.split('/').pop()}`);
                continue;
            }
            
            const fileName = docPath.split('/').pop();
            console.log(`\n📄 Testando: ${fileName}`);
            
            try {
                // Test upload via /api/upload (rota clips)
                const form = new FormData();
                form.append('file', fs.createReadStream(docPath));
                
                const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
                    method: 'POST',
                    headers: { 
                        'Cookie': cookies,
                        ...form.getHeaders()
                    },
                    body: form
                });
                
                const uploadResult = await uploadResponse.json();
                
                const testResult = {
                    fileName: fileName,
                    uploadStatus: uploadResponse.status,
                    uploadSuccess: uploadResult.success,
                    uploadError: uploadResult.message || null,
                    processingStatus: 'pending',
                    analysisGenerated: false,
                    conversationCreated: false,
                    messagesVisible: false
                };
                
                if (uploadResponse.ok && uploadResult.success) {
                    console.log(`  ✅ Upload: ${fileName}`);
                    testResult.processingStatus = 'success';
                    
                    // Verificar se análise foi gerada
                    if (uploadResult.analysis) {
                        testResult.analysisGenerated = true;
                        console.log(`  ✅ Análise gerada`);
                    }
                } else {
                    console.log(`  ❌ Upload falhou: ${uploadResult.message}`);
                    testResult.uploadError = uploadResult.message;
                }
                
                testResults.push(testResult);
                
                // Aguardar processamento
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`  ❌ Erro no upload: ${error.message}`);
                testResults.push({
                    fileName: fileName,
                    uploadStatus: 'error',
                    uploadSuccess: false,
                    uploadError: error.message,
                    processingStatus: 'failed'
                });
            }
        }
        
        // 3. Teste de conversas e mensagens
        console.log('\n=== 3. TESTE DE CONVERSAS E MENSAGENS ===');
        
        const conversationsResponse = await fetch(`${baseUrl}/api/conversations`, {
            headers: { 'Cookie': cookies }
        });
        
        if (conversationsResponse.ok) {
            const conversations = await conversationsResponse.json();
            console.log(`✅ Conversas carregadas: ${conversations.length}`);
            
            // Testar mensagens das conversas recentes
            for (const conv of conversations.slice(0, 3)) {
                const messagesResponse = await fetch(`${baseUrl}/api/conversations/${conv.id}/messages`, {
                    headers: { 'Cookie': cookies }
                });
                
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    console.log(`  📝 Conversa ${conv.title}: ${messages.length} mensagens`);
                    
                    // Verificar anexos
                    const messagesWithAttachments = messages.filter(m => 
                        m.metadata?.attachments || 
                        (m.content && m.content.includes('📎'))
                    );
                    
                    if (messagesWithAttachments.length > 0) {
                        console.log(`  📎 Mensagens com anexos: ${messagesWithAttachments.length}`);
                    }
                } else {
                    console.log(`  ❌ Erro ao carregar mensagens da conversa ${conv.id}`);
                }
            }
        } else {
            console.log('❌ Erro ao carregar conversas');
        }
        
        // 4. Teste de nova conversa com upload
        console.log('\n=== 4. TESTE DE NOVA CONVERSA COM UPLOAD ===');
        
        const testDoc = realDocuments.find(doc => fs.existsSync(doc));
        if (testDoc) {
            const form = new FormData();
            form.append('files', fs.createReadStream(testDoc));
            form.append('message', 'Teste de análise financeira completa');
            
            const chatUploadResponse = await fetch(`${baseUrl}/api/chat/upload`, {
                method: 'POST',
                headers: { 
                    'Cookie': cookies,
                    ...form.getHeaders()
                },
                body: form
            });
            
            if (chatUploadResponse.ok) {
                const result = await chatUploadResponse.json();
                console.log('✅ Upload via chat/upload funcionando');
                console.log(`📄 Arquivos processados: ${result.results?.length || 0}`);
                console.log(`🧠 Resposta IA: ${result.aiResponse ? 'Gerada' : 'Não gerada'}`);
                
                if (result.conversationId) {
                    console.log(`✅ Nova conversa criada: ${result.conversationId}`);
                }
            } else {
                console.log('❌ Erro no upload via chat/upload');
                const error = await chatUploadResponse.text();
                console.log(`Erro: ${error}`);
            }
        }
        
        // 5. Relatório final
        console.log('\n=== 5. RELATÓRIO DE RESULTADOS ===');
        
        const successfulUploads = testResults.filter(r => r.uploadSuccess).length;
        const totalTests = testResults.length;
        const successRate = totalTests > 0 ? (successfulUploads / totalTests * 100).toFixed(1) : 0;
        
        console.log(`\n📊 ESTATÍSTICAS FINAIS:`);
        console.log(`Total de documentos testados: ${totalTests}`);
        console.log(`Uploads bem-sucedidos: ${successfulUploads}`);
        console.log(`Taxa de sucesso: ${successRate}%`);
        
        console.log(`\n🔍 DETALHES POR DOCUMENTO:`);
        testResults.forEach(result => {
            console.log(`${result.fileName}:`);
            console.log(`  Upload: ${result.uploadSuccess ? '✅' : '❌'} (${result.uploadStatus})`);
            console.log(`  Processamento: ${result.processingStatus}`);
            console.log(`  Análise: ${result.analysisGenerated ? '✅' : '❌'}`);
            if (result.uploadError) {
                console.log(`  Erro: ${result.uploadError}`);
            }
        });
        
        // Identificar problemas
        console.log(`\n⚠️  PROBLEMAS IDENTIFICADOS:`);
        const problems = [];
        
        testResults.forEach(result => {
            if (!result.uploadSuccess) {
                problems.push(`${result.fileName}: Falha no upload - ${result.uploadError}`);
            }
            if (result.uploadSuccess && !result.analysisGenerated) {
                problems.push(`${result.fileName}: Upload OK mas análise não foi gerada`);
            }
        });
        
        if (problems.length > 0) {
            problems.forEach(problem => console.log(`  • ${problem}`));
        } else {
            console.log('  Nenhum problema crítico identificado');
        }
        
        return {
            success: successRate >= 80,
            successRate: successRate,
            totalTests: totalTests,
            problems: problems,
            testResults: testResults
        };
        
    } catch (error) {
        console.error(`❌ ERRO CRÍTICO: ${error.message}`);
        return {
            success: false,
            error: error.message,
            testResults: testResults
        };
    }
}

testSystemAfterCleanup().then(result => {
    console.log(`\n🎯 RESULTADO FINAL: ${result.success ? 'APROVADO' : 'REPROVADO'}`);
    if (result.success) {
        console.log('Sistema funcionando dentro dos parâmetros esperados');
    } else {
        console.log('Sistema apresenta problemas que precisam ser corrigidos');
    }
    process.exit(result.success ? 0 : 1);
});