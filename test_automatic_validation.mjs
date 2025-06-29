#!/usr/bin/env node

/**
 * Sistema de Validação Automática Documento por Documento
 * Compara dados extraídos com documentos reais usando LLMs
 */

const fs = require('fs');
const path = require('path');

// Simular processamento e validação
async function testAutomaticValidation() {
    console.log('\n🔍 SISTEMA DE VALIDAÇÃO AUTOMÁTICA INICIADO\n');

    // Lista de documentos para testar
    const documents = [
        {
            name: 'Nubank_2025-05-24_1751172520674.pdf',
            expectedBank: 'nubank',
            expectedType: 'fatura_cartao',
            description: 'Fatura Nubank Maio 2025'
        },
        {
            name: 'PicPay_Fatura_042025_1751172520655.pdf',
            expectedBank: 'picpay',
            expectedType: 'fatura_cartao',
            description: 'Fatura PicPay Abril 2025'
        },
        {
            name: 'InfinitePay 18-03-2025 a 17-06-2025_1751172372227.pdf',
            expectedBank: 'infinitepay',
            expectedType: 'extrato_bancario',
            description: 'Extrato InfinitePay'
        },
        {
            name: 'extrato-f11d355d-584d-4b2d-a81a-01175304a322_1751172520692.pdf',
            expectedBank: 'stone',
            expectedType: 'extrato_bancario',
            description: 'Extrato Stone (Empresarial)'
        },
        {
            name: 'Extrato-15-03-2025-a-12-06-2025_1751172520575.pdf',
            expectedBank: 'inter',
            expectedType: 'extrato_bancario',
            description: 'Extrato Banco Inter'
        }
    ];

    console.log('📋 DOCUMENTOS PARA VALIDAÇÃO:');
    documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.description}`);
        console.log(`   Arquivo: ${doc.name}`);
        console.log(`   Banco esperado: ${doc.expectedBank}`);
        console.log(`   Tipo esperado: ${doc.expectedType}\n`);
    });

    // Simular teste de cada documento
    const results = [];
    
    for (const doc of documents) {
        console.log(`\n=== PROCESSANDO: ${doc.description} ===`);
        
        try {
            // Fazer upload e processar via API real
            const result = await testDocumentProcessing(doc.name);
            
            // Validar resultado
            const validation = validateDocumentResult(result, doc);
            
            results.push({
                document: doc,
                result,
                validation,
                score: validation.overallScore
            });
            
            console.log(`✅ CONCLUÍDO: Score ${validation.overallScore}/100`);
            
        } catch (error) {
            console.error(`❌ ERRO ao processar ${doc.name}:`, error.message);
            results.push({
                document: doc,
                result: null,
                validation: { overallScore: 0, errors: [error.message] },
                score: 0
            });
        }
    }
    
    // Gerar relatório final
    generateFinalReport(results);
}

async function testDocumentProcessing(filename) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
        // Testar via curl a API real
        const curlCommand = `curl -X POST http://localhost:5000/api/test/upload -H "Content-Type: multipart/form-data" -F "files=@attached_assets/${filename}" -b cookies.txt`;
        
        const curl = spawn('bash', ['-c', curlCommand]);
        
        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        curl.stderr.on('data', (data) => {
            console.error('CURL Error:', data.toString());
        });
        
        curl.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Failed to parse response: ${parseError.message}`));
                }
            } else {
                reject(new Error(`CURL failed with code ${code}`));
            }
        });
    });
}

function validateDocumentResult(apiResult, expectedDoc) {
    const validation = {
        overallScore: 0,
        bankDetectionCorrect: false,
        typeDetectionCorrect: false,
        transactionsExtracted: 0,
        issues: [],
        recommendations: []
    };
    
    if (!apiResult?.success || !apiResult?.results?.[0]) {
        validation.issues.push('API call failed or no results returned');
        return validation;
    }
    
    const extractedData = apiResult.results[0].data;
    const metadata = extractedData.metadata || {};
    
    // Validar detecção de banco
    const detectedBank = metadata.bank;
    if (detectedBank === expectedDoc.expectedBank) {
        validation.bankDetectionCorrect = true;
        validation.overallScore += 30;
    } else {
        validation.issues.push(`Banco incorreto: detectado '${detectedBank}', esperado '${expectedDoc.expectedBank}'`);
        validation.recommendations.push(`Melhorar detecção para ${expectedDoc.expectedBank}`);
    }
    
    // Validar tipo de documento
    const detectedType = metadata.docType;
    if (detectedType === expectedDoc.expectedType) {
        validation.typeDetectionCorrect = true;
        validation.overallScore += 20;
    } else {
        validation.issues.push(`Tipo incorreto: detectado '${detectedType}', esperado '${expectedDoc.expectedType}'`);
    }
    
    // Validar extração de transações
    const transactions = metadata.transactions || [];
    validation.transactionsExtracted = transactions.length;
    
    if (transactions.length > 0) {
        validation.overallScore += Math.min(50, transactions.length * 5); // Máximo 50 pontos
    } else {
        validation.issues.push('Nenhuma transação extraída');
        validation.recommendations.push('Implementar parser específico para este formato');
    }
    
    // Validar conteúdo do texto
    const textLength = (extractedData.text || '').length;
    if (textLength > 500) {
        validation.overallScore += 10; // Bônus por extrair texto adequado
    } else {
        validation.issues.push('Texto extraído muito curto');
    }
    
    // Limitar score máximo
    validation.overallScore = Math.min(100, validation.overallScore);
    
    return validation;
}

function generateFinalReport(results) {
    console.log('\n\n📈 RELATÓRIO FINAL DE VALIDAÇÃO AUTOMÁTICA\n');
    console.log(''.padEnd(60, '='));
    
    const totalDocs = results.length;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalDocs;
    const successfulDocs = results.filter(r => r.score > 70).length;
    const partialDocs = results.filter(r => r.score > 30 && r.score <= 70).length;
    const failedDocs = results.filter(r => r.score <= 30).length;
    
    console.log(`🎯 RESUMO GERAL:`);
    console.log(`   Documentos processados: ${totalDocs}`);
    console.log(`   Score médio: ${avgScore.toFixed(1)}/100`);
    console.log(`   Sucessos (>70): ${successfulDocs} documentos`);
    console.log(`   Parciais (30-70): ${partialDocs} documentos`);
    console.log(`   Falhas (<30): ${failedDocs} documentos`);
    
    console.log(`\n📊 RESULTADOS DETALHADOS:`);
    results.forEach((result, index) => {
        const status = result.score > 70 ? '✅' : result.score > 30 ? '⚠️' : '❌';
        console.log(`\n${index + 1}. ${status} ${result.document.description}`);
        console.log(`   Score: ${result.score}/100`);
        console.log(`   Banco detectado: ${result.result?.results?.[0]?.data?.metadata?.bank || 'N/A'}`);
        console.log(`   Transações: ${result.validation.transactionsExtracted}`);
        
        if (result.validation.issues.length > 0) {
            console.log(`   Problemas: ${result.validation.issues.slice(0, 2).join(', ')}`);
        }
    });
    
    console.log(`\n💡 RECOMENDAÇÕES PRIORITÁRIAS:`);
    const allRecommendations = results.flatMap(r => r.validation.recommendations || []);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    uniqueRecommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
    });
    
    console.log(`\n🔧 PRÓXIMOS PASSOS:`);
    console.log(`   • Corrigir parsers com score < 70`);
    console.log(`   • Implementar parsers específicos para fintechs`);
    console.log(`   • Testar novamente após melhorias`);
    console.log(`   • Expandir para mais bancos brasileiros`);
    
    console.log('\n' + ''.padEnd(60, '='));
    console.log('🎯 VALIDAÇÃO AUTOMÁTICA CONCLUÍDA');
}

// Executar se chamado diretamente
if (require.main === module) {
    testAutomaticValidation().catch(console.error);
}

module.exports = { testAutomaticValidation };