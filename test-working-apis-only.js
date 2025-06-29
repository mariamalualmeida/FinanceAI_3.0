#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testWorkingAPIsOnly() {
    console.log('\n🔄 TESTE APENAS APIS FUNCIONAIS');
    console.log('='.repeat(50));
    
    try {
        // 1. LOGIN com endpoint correto
        console.log('🔐 Testando login...');
        const loginResponse = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });
        
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Status login:', loginResponse.status);
        
        if (loginResponse.ok && cookies) {
            console.log('✅ Login funcionando');
            
            // 2. CRIAR CONVERSA
            console.log('\n💬 Criando conversa...');
            const conversationResponse = await fetch('http://localhost:5000/api/conversations', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cookie': cookies 
                },
                body: JSON.stringify({ title: 'Teste Real Upload' })
            });
            
            if (conversationResponse.ok) {
                const conversation = await conversationResponse.json();
                console.log('✅ Conversa criada:', conversation.id);
                
                // 3. UPLOAD DE ARQUIVO REAL
                console.log('\n📎 Testando upload de arquivo real...');
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
                    
                    const uploadResult = await uploadResponse.json();
                    console.log('Status upload:', uploadResponse.status);
                    
                    if (uploadResponse.ok) {
                        console.log('✅ Upload funcionando:', uploadResult.uploadId);
                        
                        // 4. AGUARDAR PROCESSAMENTO
                        console.log('\n⏳ Aguardando processamento...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        // 5. VERIFICAR MENSAGENS
                        console.log('\n📋 Verificando mensagens...');
                        const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversation.id}/messages`, {
                            headers: { 'Cookie': cookies }
                        });
                        
                        if (messagesResponse.ok) {
                            const messages = await messagesResponse.json();
                            console.log(`✅ Mensagens carregadas: ${messages.length}`);
                            
                            let foundFile = false;
                            let foundAnalysis = false;
                            let realData = false;
                            
                            messages.forEach((msg, i) => {
                                console.log(`\n   Mensagem ${i + 1}:`);
                                console.log(`   - Sender: ${msg.sender}`);
                                
                                if (msg.attachments && msg.attachments.length > 0) {
                                    foundFile = true;
                                    console.log(`   - 📎 Arquivo: ${msg.attachments[0].originalname}`);
                                }
                                
                                if (msg.content) {
                                    if (msg.content.includes('análise') || msg.content.includes('transaç')) {
                                        foundAnalysis = true;
                                    }
                                    
                                    if (/\d+.*R\$|\d+.*real|saldo.*\d+/i.test(msg.content)) {
                                        realData = true;
                                    }
                                    
                                    console.log(`   - Content: ${msg.content.substring(0, 100)}...`);
                                }
                            });
                            
                            // 6. TESTE DE EXCLUSÃO
                            console.log('\n🗑️ Testando exclusão de mensagem...');
                            if (messages.length > 0) {
                                const messageToDelete = messages[0];
                                const deleteResponse = await fetch(`http://localhost:5000/api/messages/${messageToDelete.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Cookie': cookies }
                                });
                                
                                console.log('Status exclusão:', deleteResponse.status);
                                const deletionWorked = deleteResponse.ok;
                                
                                // 7. RESULTADOS FINAIS
                                console.log('\n' + '='.repeat(50));
                                console.log('📊 RESULTADOS FINAIS:');
                                console.log('='.repeat(50));
                                
                                const results = [
                                    { test: 'Login', status: '✅ FUNCIONANDO' },
                                    { test: 'Criar Conversa', status: '✅ FUNCIONANDO' },
                                    { test: 'Upload Arquivo', status: '✅ FUNCIONANDO' },
                                    { test: 'Arquivo no Histórico', status: foundFile ? '✅ FUNCIONANDO' : '❌ PROBLEMA' },
                                    { test: 'Análise Gerada', status: foundAnalysis ? '✅ FUNCIONANDO' : '❌ PROBLEMA' },
                                    { test: 'Dados Reais', status: realData ? '✅ FUNCIONANDO' : '⚠️ SIMULADOS' },
                                    { test: 'Exclusão Mensagem', status: deletionWorked ? '✅ FUNCIONANDO' : '❌ PROBLEMA' }
                                ];
                                
                                results.forEach(result => {
                                    console.log(`${result.status} - ${result.test}`);
                                });
                                
                                const workingCount = results.filter(r => r.status.includes('✅')).length;
                                const score = Math.round((workingCount / results.length) * 100);
                                
                                console.log(`\n🎯 SCORE: ${score}% (${workingCount}/${results.length} funcionando)`);
                                
                                if (score >= 80) {
                                    console.log('\n🎉 SISTEMA FUNCIONANDO BEM!');
                                } else {
                                    console.log('\n⚠️ Sistema com problemas identificados');
                                }
                                
                                // DETALHES ESPECÍFICOS
                                console.log('\n📋 DETALHES:');
                                console.log(`- Total mensagens: ${messages.length}`);
                                console.log(`- Arquivo anexado: ${foundFile ? 'Sim' : 'Não'}`);
                                console.log(`- Análise automática: ${foundAnalysis ? 'Sim' : 'Não'}`);
                                console.log(`- Dados financeiros reais: ${realData ? 'Sim' : 'Não'}`);
                                console.log(`- Exclusão funcionando: ${deletionWorked ? 'Sim' : 'Não'}`);
                                
                                return true;
                            }
                        }
                    } else {
                        console.log('❌ Upload falhou:', uploadResult.message);
                    }
                } else {
                    console.log('❌ Arquivo de teste não encontrado');
                }
            } else {
                console.log('❌ Falha ao criar conversa');
            }
        } else {
            console.log('❌ Login falhou');
        }
        
    } catch (error) {
        console.error('💥 Erro:', error.message);
        return false;
    }
}

testWorkingAPIsOnly().catch(console.error);