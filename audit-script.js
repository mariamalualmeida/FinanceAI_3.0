// Auditoria completa do sistema
import fs from 'fs';
import path from 'path';

console.log('🔍 AUDITORIA COMPLETA DO SISTEMA');
console.log('================================');

// 1. Identificar arquivos duplicados
console.log('\n=== ANÁLISE 1: ARQUIVOS DUPLICADOS ===');
const fileMap = new Map();
const duplicates = [];

function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const baseName = path.basename(file, path.extname(file));
        if (fileMap.has(baseName)) {
          duplicates.push({
            name: baseName,
            files: [fileMap.get(baseName), filePath]
          });
        } else {
          fileMap.set(baseName, filePath);
        }
      }
    });
  } catch (error) {
    // Ignore permission errors
  }
}

scanDirectory('.');

if (duplicates.length > 0) {
  console.log('❌ DUPLICADOS ENCONTRADOS:');
  duplicates.forEach(dup => {
    console.log(`- ${dup.name}:`);
    dup.files.forEach(file => console.log(`  ${file}`));
  });
} else {
  console.log('✅ Nenhum arquivo duplicado encontrado');
}

// 2. Verificar imports quebrados
console.log('\n=== ANÁLISE 2: IMPORTS QUEBRADOS ===');
const brokenImports = [];

function checkImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Verificar imports relativos
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(filePath), importPath);
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
        let exists = false;
        
        for (const ext of extensions) {
          if (fs.existsSync(resolvedPath + ext)) {
            exists = true;
            break;
          }
        }
        
        if (!exists) {
          brokenImports.push({
            file: filePath,
            import: importPath,
            resolved: resolvedPath
          });
        }
      }
    }
  } catch (error) {
    // Ignore read errors
  }
}

// Verificar arquivos principais
['client/src', 'server', 'shared', 'pwa'].forEach(dir => {
  if (fs.existsSync(dir)) {
    scanForImports(dir);
  }
});

function scanForImports(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanForImports(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        checkImports(filePath);
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

if (brokenImports.length > 0) {
  console.log('❌ IMPORTS QUEBRADOS:');
  brokenImports.forEach(broken => {
    console.log(`- ${broken.file}: ${broken.import}`);
  });
} else {
  console.log('✅ Todos os imports relativos estão corretos');
}

// 3. Verificar arquivos órfãos
console.log('\n=== ANÁLISE 3: ARQUIVOS ÓRFÃOS ===');
const allFiles = [];
const referencedFiles = new Set();

// Coletar todos os arquivos
function collectFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        collectFiles(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        allFiles.push(filePath);
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

collectFiles('.');

// Encontrar referências
allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(file), importPath);
        referencedFiles.add(resolvedPath);
        referencedFiles.add(resolvedPath + '.ts');
        referencedFiles.add(resolvedPath + '.tsx');
        referencedFiles.add(resolvedPath + '.js');
        referencedFiles.add(resolvedPath + '.jsx');
      }
    }
  } catch (error) {
    // Ignore errors
  }
});

const orphanFiles = allFiles.filter(file => {
  const isMainFile = file.includes('index.') || file.includes('App.') || file.includes('main.');
  const isReferenced = referencedFiles.has(path.resolve(file));
  return !isMainFile && !isReferenced;
});

if (orphanFiles.length > 0) {
  console.log('⚠️ POSSÍVEIS ARQUIVOS ÓRFÃOS:');
  orphanFiles.slice(0, 10).forEach(file => {
    console.log(`- ${file}`);
  });
} else {
  console.log('✅ Nenhum arquivo órfão identificado');
}

console.log('\n🎯 AUDITORIA CONCLUÍDA');
console.log('======================');