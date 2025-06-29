#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemAudit {
    constructor() {
        this.issues = {
            duplicatedFiles: [],
            unusedFiles: [],
            orphanedFiles: [],
            brokenFiles: [],
            executionErrors: [],
            sizeConcerns: []
        };
        
        this.fileMap = new Map();
        this.importMap = new Map();
        this.testResults = [];
    }

    scanDirectory(dir, baseDir = dir) {
        try {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (!file.startsWith('.') && 
                        !['node_modules', 'dist', 'build'].includes(file)) {
                        this.scanDirectory(fullPath, baseDir);
                    }
                } else {
                    this.analyzeFile(fullPath, baseDir);
                }
            }
        } catch (error) {
            this.issues.executionErrors.push({
                type: 'Directory scan error',
                path: dir,
                error: error.message
            });
        }
    }

    analyzeFile(filePath, baseDir) {
        try {
            const relativePath = path.relative(baseDir, filePath);
            const ext = path.extname(filePath);
            const basename = path.basename(filePath, ext);
            const stats = fs.statSync(filePath);
            
            // Mapear arquivos por nome base para detectar duplicatas
            if (!this.fileMap.has(basename)) {
                this.fileMap.set(basename, []);
            }
            this.fileMap.get(basename).push({
                path: relativePath,
                size: stats.size,
                ext: ext,
                fullPath: filePath
            });
            
            // Verificar arquivos grandes demais
            if (stats.size > 10 * 1024 * 1024) { // 10MB
                this.issues.sizeConcerns.push({
                    path: relativePath,
                    size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                    type: 'Large file'
                });
            }
            
            // Analisar conteúdo se for arquivo de código
            if (['.js', '.jsx', '.ts', '.tsx', '.json'].includes(ext)) {
                this.analyzeCodeFile(filePath, relativePath);
            }
            
        } catch (error) {
            this.issues.brokenFiles.push({
                path: path.relative(baseDir, filePath),
                error: error.message,
                type: 'File access error'
            });
        }
    }

    analyzeCodeFile(filePath, relativePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Detectar imports/exports
            const importRegex = /import.*from\s+['"`]([^'"`]+)['"`]/g;
            const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
            
            let match;
            const imports = [];
            
            while ((match = importRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }
            
            while ((match = requireRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }
            
            this.importMap.set(relativePath, imports);
            
            // Verificar sintaxe básica
            this.checkBasicSyntax(content, relativePath);
            
        } catch (error) {
            this.issues.brokenFiles.push({
                path: relativePath,
                error: error.message,
                type: 'Code analysis error'
            });
        }
    }

    checkBasicSyntax(content, filePath) {
        const issues = [];
        
        // Verificar parênteses/chaves balanceados
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const stack = [];
        
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (brackets[char]) {
                stack.push(char);
            } else if (Object.values(brackets).includes(char)) {
                const last = stack.pop();
                if (brackets[last] !== char) {
                    issues.push(`Unmatched bracket at position ${i}`);
                    break;
                }
            }
        }
        
        if (stack.length > 0) {
            issues.push(`Unclosed brackets: ${stack.join(', ')}`);
        }
        
        // Verificar imports quebrados óbvios
        const brokenImports = content.match(/import.*from\s+['"`][^'"`]*undefined[^'"`]*['"`]/g);
        if (brokenImports) {
            issues.push(`Broken imports detected: ${brokenImports.length}`);
        }
        
        if (issues.length > 0) {
            this.issues.brokenFiles.push({
                path: filePath,
                issues: issues,
                type: 'Syntax issues'
            });
        }
    }

    findDuplicates() {
        for (const [basename, files] of this.fileMap.entries()) {
            if (files.length > 1) {
                // Verificar se são realmente duplicatas (mesmo conteúdo)
                const groups = this.groupBySimilarity(files);
                
                for (const group of groups) {
                    if (group.length > 1) {
                        this.issues.duplicatedFiles.push({
                            basename: basename,
                            files: group.map(f => ({
                                path: f.path,
                                size: f.size
                            })),
                            type: 'Potential duplicate'
                        });
                    }
                }
            }
        }
    }

    groupBySimilarity(files) {
        const groups = [];
        
        for (const file of files) {
            try {
                if (fs.existsSync(file.fullPath)) {
                    const content = fs.readFileSync(file.fullPath, 'utf8');
                    file.contentHash = this.simpleHash(content);
                }
            } catch (error) {
                file.contentHash = `error:${file.size}`;
            }
        }
        
        const hashGroups = {};
        for (const file of files) {
            if (!hashGroups[file.contentHash]) {
                hashGroups[file.contentHash] = [];
            }
            hashGroups[file.contentHash].push(file);
        }
        
        return Object.values(hashGroups);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    findOrphanedFiles() {
        const referencedFiles = new Set();
        
        // Coletar todos os arquivos referenciados
        for (const [filePath, imports] of this.importMap.entries()) {
            for (const importPath of imports) {
                if (importPath.startsWith('./') || importPath.startsWith('../')) {
                    // Resolver path relativo
                    const resolvedPath = this.resolveImportPath(filePath, importPath);
                    if (resolvedPath) {
                        referencedFiles.add(resolvedPath);
                    }
                }
            }
        }
        
        // Encontrar arquivos não referenciados
        for (const [basename, files] of this.fileMap.entries()) {
            for (const file of files) {
                if (['.js', '.jsx', '.ts', '.tsx'].includes(file.ext)) {
                    const withoutExt = file.path.replace(file.ext, '');
                    const isReferenced = referencedFiles.has(file.path) || 
                                       referencedFiles.has(withoutExt) ||
                                       file.path.includes('index') ||
                                       file.path.includes('main') ||
                                       file.path.includes('App') ||
                                       file.path.startsWith('test-') ||
                                       file.path.includes('.test.') ||
                                       file.path.includes('.spec.');
                    
                    if (!isReferenced) {
                        this.issues.orphanedFiles.push({
                            path: file.path,
                            size: file.size,
                            type: 'Potentially unused'
                        });
                    }
                }
            }
        }
    }

    resolveImportPath(fromFile, importPath) {
        try {
            const fromDir = path.dirname(fromFile);
            const resolved = path.resolve(fromDir, importPath);
            const relative = path.relative('.', resolved);
            return relative;
        } catch (error) {
            return null;
        }
    }

    generateReport() {
        console.log('\n🔍 AUDITORIA COMPLETA DO SISTEMA');
        console.log('='.repeat(80));
        
        // Resumo
        const totalIssues = Object.values(this.issues).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`\n📊 RESUMO EXECUTIVO:`);
        console.log(`- Total de problemas encontrados: ${totalIssues}`);
        console.log(`- Arquivos duplicados: ${this.issues.duplicatedFiles.length}`);
        console.log(`- Arquivos não utilizados: ${this.issues.orphanedFiles.length}`);
        console.log(`- Arquivos com problemas: ${this.issues.brokenFiles.length}`);
        console.log(`- Erros de execução: ${this.issues.executionErrors.length}`);
        console.log(`- Arquivos grandes: ${this.issues.sizeConcerns.length}`);
        
        // Detalhes de cada categoria
        this.reportCategory('📁 ARQUIVOS DUPLICADOS', this.issues.duplicatedFiles);
        this.reportCategory('🗑️ ARQUIVOS NÃO UTILIZADOS', this.issues.orphanedFiles);
        this.reportCategory('💥 ARQUIVOS COM PROBLEMAS', this.issues.brokenFiles);
        this.reportCategory('⚠️ ERROS DE EXECUÇÃO', this.issues.executionErrors);
        this.reportCategory('📦 ARQUIVOS GRANDES', this.issues.sizeConcerns);
        
        return this.issues;
    }

    reportCategory(title, items) {
        if (items.length === 0) {
            console.log(`\n${title}: ✅ Nenhum problema encontrado`);
            return;
        }
        
        console.log(`\n${title}: ⚠️ ${items.length} problema(s) encontrado(s)`);
        console.log('-'.repeat(50));
        
        items.slice(0, 10).forEach((item, index) => {
            console.log(`${index + 1}. ${this.formatIssue(item)}`);
        });
        
        if (items.length > 10) {
            console.log(`... e mais ${items.length - 10} problema(s)`);
        }
    }

    formatIssue(issue) {
        if (issue.files) {
            return `${issue.basename}: ${issue.files.map(f => f.path).join(', ')}`;
        }
        if (issue.path) {
            return `${issue.path}${issue.size ? ` (${issue.size})` : ''}${issue.error ? ` - ${issue.error}` : ''}`;
        }
        return JSON.stringify(issue);
    }
}

// Executar auditoria
const audit = new SystemAudit();

console.log('🔍 Iniciando auditoria do sistema...');
audit.scanDirectory('.');

console.log('🔍 Analisando duplicatas...');
audit.findDuplicates();

console.log('🔍 Procurando arquivos órfãos...');
audit.findOrphanedFiles();

const results = audit.generateReport();

// Salvar relatório
fs.writeFileSync('audit-report.json', JSON.stringify(results, null, 2));
console.log('\n💾 Relatório salvo em: audit-report.json');

export default results;