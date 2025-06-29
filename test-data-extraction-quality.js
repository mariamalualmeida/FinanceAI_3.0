#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

class DataExtractionQualityTest {
    constructor() {
        this.testDocuments = [
            {
                name: 'Nubank_2025-05-24_1751172520674.pdf',
                type: 'Fatura Cartão',
                expectedBank: 'Nubank',
                expectedTransactions: '>= 5'
            },
            {
                name: 'Fatura-CPF_1751146806544.PDF',
                type: 'Fatura',
                expectedBank: 'Detectar automaticamente',
                expectedTransactions: '>= 3'
            },
            {
                name: 'Extrato-13-05-2025-a-12-06-2025_1751172520517.pdf',
                type: 'Extrato Bancário',
                expectedBank: 'Banco do Brasil ou similar',
                expectedTransactions: '>= 10'
            },
            {
                name: 'InfinitePay 18-03-2025 a 17-06-2025_1751172372227.pdf',
                type: 'Extrato Fintech',
                expectedBank: 'InfinitePay',
                expectedTransactions: '>= 5'
            },
            {
                name: 'PicPay_Fatura_042025_1751172520655.pdf',
                type: 'Fatura Digital',
                expectedBank: 'PicPay',
                expectedTransactions: '>= 3'
            }
        ];
        
        this.results = [];
        this.cookies = null;
    }

    async login() {
        console.log('🔐 Realizando login...');
        const loginResponse = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Admin', password: 'admin123' })
        });
        
        if (!loginResponse.ok) {
            throw new Error('Falha no login');
        }
        
        this.cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login realizado com sucesso');
    }

    async testDocument(doc) {
        const filePath = path.join('attached_assets', doc.name);
        
        if (!fs.existsSync(filePath)) {
            return {
                document: doc.name,
                status: 'ARQUIVO NÃO ENCONTRADO',
                score: 0,
                details: 'Arquivo não existe no sistema'
            };
        }
        
        console.log(`\n📄 Testando: ${doc.name} (${doc.type})`);
        
        try {
            // Criar conversa
            const conversationResponse = await fetch('http://localhost:5000/api/conversations', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cookie': this.cookies 
                },
                body: JSON.stringify({ title: `Teste ${doc.name}` })
            });
            
            const conversation = await conversationResponse.json();
            
            // Upload do documento
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('conversationId', conversation.id);
            
            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: { 'Cookie': this.cookies },
                body: formData
            });
            
            if (!uploadResponse.ok) {
                return {
                    document: doc.name,
                    status: 'ERRO NO UPLOAD',
                    score: 0,
                    details: `HTTP ${uploadResponse.status}`
                };
            }
            
            console.log(`  ✅ Upload realizado`);
            
            // Aguardar processamento
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Verificar mensagens
            const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${conversation.id}/messages`, {
                headers: { 'Cookie': this.cookies }
            });
            
            const messages = await messagesResponse.json();
            
            // Analisar resultados
            return this.analyzeExtractionQuality(doc, messages);
            
        } catch (error) {
            return {
                document: doc.name,
                status: 'ERRO DE EXECUÇÃO',
                score: 0,
                details: error.message
            };
        }
    }

    analyzeExtractionQuality(doc, messages) {
        const analysisMessage = messages.find(m => 
            m.sender === 'assistant' && 
            m.content && 
            m.content.includes('ANÁLISE FINANCEIRA')
        );
        
        if (!analysisMessage) {
            return {
                document: doc.name,
                status: 'SEM ANÁLISE',
                score: 0,
                details: 'Nenhuma análise financeira foi gerada'
            };
        }
        
        const content = analysisMessage.content;
        let score = 0;
        const details = [];
        
        // Critério 1: Detecção de banco (25 pontos)
        if (content.includes('BANCO DETECTADO') || 
            content.includes(doc.expectedBank) || 
            content.toLowerCase().includes('nubank') ||
            content.toLowerCase().includes('infinitepay') ||
            content.toLowerCase().includes('picpay')) {
            score += 25;
            details.push('✅ Banco detectado corretamente');
        } else {
            details.push('❌ Banco não detectado');
        }
        
        // Critério 2: Extração de transações (30 pontos)
        const transactionCount = this.countTransactions(content);
        if (transactionCount >= 3) {
            score += 30;
            details.push(`✅ ${transactionCount} transações extraídas`);
        } else {
            details.push(`❌ Apenas ${transactionCount} transações extraídas`);
        }
        
        // Critério 3: Valores monetários (20 pontos)
        const hasValidAmounts = this.hasValidMonetaryValues(content);
        if (hasValidAmounts) {
            score += 20;
            details.push('✅ Valores monetários válidos detectados');
        } else {
            details.push('❌ Valores monetários não detectados');
        }
        
        // Critério 4: Categorização (15 pontos)
        if (content.includes('crédito') || content.includes('débito') || 
            content.includes('categoria') || content.includes('tipo')) {
            score += 15;
            details.push('✅ Categorização presente');
        } else {
            details.push('❌ Categorização ausente');
        }
        
        // Critério 5: Análise de risco (10 pontos)
        if (content.includes('risco') || content.includes('score') || 
            content.includes('recomenda')) {
            score += 10;
            details.push('✅ Análise de risco presente');
        } else {
            details.push('❌ Análise de risco ausente');
        }
        
        let status = 'BAIXA QUALIDADE';
        if (score >= 80) status = 'ALTA QUALIDADE';
        else if (score >= 60) status = 'QUALIDADE MÉDIA';
        else if (score >= 40) status = 'QUALIDADE BAIXA';
        
        return {
            document: doc.name,
            type: doc.type,
            status: status,
            score: score,
            transactionCount: transactionCount,
            details: details,
            fullAnalysis: content.substring(0, 200) + '...'
        };
    }

    countTransactions(content) {
        // Contar linhas que parecem transações
        const lines = content.split('\n');
        let count = 0;
        
        for (const line of lines) {
            // Procurar por padrões de transação (data + valor + descrição)
            if (line.match(/\d{2}\/\d{2}/) && 
                (line.includes('R$') || line.match(/\d+[,\.]\d{2}/))) {
                count++;
            }
        }
        
        // Método alternativo: contar menções explícitas
        const explicitCount = (content.match(/transação|operação|lançamento/gi) || []).length;
        
        return Math.max(count, Math.min(explicitCount, 20));
    }

    hasValidMonetaryValues(content) {
        // Procurar por valores monetários brasileiros
        const brazilianCurrency = /R\$\s*\d+[,\.]\d{2}/g;
        const matches = content.match(brazilianCurrency);
        return matches && matches.length >= 2;
    }

    generateQualityReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 RELATÓRIO DE QUALIDADE DA EXTRAÇÃO DE DADOS');
        console.log('='.repeat(80));
        
        const avgScore = this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length;
        const highQuality = this.results.filter(r => r.score >= 80).length;
        const mediumQuality = this.results.filter(r => r.score >= 60 && r.score < 80).length;
        const lowQuality = this.results.filter(r => r.score < 60).length;
        
        console.log(`\n📈 RESUMO GERAL:`);
        console.log(`- Score médio: ${avgScore.toFixed(1)}%`);
        console.log(`- Alta qualidade: ${highQuality}/${this.results.length} documentos`);
        console.log(`- Qualidade média: ${mediumQuality}/${this.results.length} documentos`);
        console.log(`- Baixa qualidade: ${lowQuality}/${this.results.length} documentos`);
        
        console.log(`\n📋 DETALHES POR DOCUMENTO:`);
        console.log('-'.repeat(80));
        
        this.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.document} (${result.type})`);
            console.log(`   Status: ${result.status} (${result.score}%)`);
            if (result.transactionCount !== undefined) {
                console.log(`   Transações: ${result.transactionCount}`);
            }
            
            if (result.details) {
                result.details.forEach(detail => {
                    console.log(`   ${detail}`);
                });
            }
            
            if (result.fullAnalysis) {
                console.log(`   Prévia: ${result.fullAnalysis}`);
            }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('🎯 CONCLUSÕES:');
        console.log('='.repeat(80));
        
        if (avgScore >= 75) {
            console.log('✅ SISTEMA DE EXTRAÇÃO DE ALTA QUALIDADE');
            console.log('   O sistema demonstra excelente capacidade de extração de dados.');
        } else if (avgScore >= 60) {
            console.log('⚠️ SISTEMA DE EXTRAÇÃO DE QUALIDADE MÉDIA');
            console.log('   O sistema funciona mas precisa de melhorias.');
        } else {
            console.log('❌ SISTEMA DE EXTRAÇÃO PRECISA DE MELHORIAS');
            console.log('   Várias áreas críticas precisam ser corrigidas.');
        }
        
        return {
            averageScore: avgScore,
            totalDocuments: this.results.length,
            qualityDistribution: { highQuality, mediumQuality, lowQuality },
            detailedResults: this.results
        };
    }

    async runCompleteTest() {
        try {
            await this.login();
            
            console.log(`\n🧪 Testando qualidade de extração em ${this.testDocuments.length} documentos...`);
            
            for (const doc of this.testDocuments) {
                const result = await this.testDocument(doc);
                this.results.push(result);
                
                console.log(`  Resultado: ${result.status} (${result.score}%)`);
                
                // Aguardar entre testes para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const report = this.generateQualityReport();
            
            // Salvar relatório
            fs.writeFileSync('data-extraction-quality-report.json', JSON.stringify(report, null, 2));
            console.log('\n💾 Relatório salvo em: data-extraction-quality-report.json');
            
            return report;
            
        } catch (error) {
            console.error('💥 Erro no teste:', error.message);
            return null;
        }
    }
}

// Executar teste
const test = new DataExtractionQualityTest();
test.runCompleteTest().catch(console.error);