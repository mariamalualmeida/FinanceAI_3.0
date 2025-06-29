const { NoLimitExtractor } = require('./server/services/noLimitExtractor.ts');

async function testExtractionDirect() {
  try {
    console.log('🔧 Teste direto do NoLimitExtractor...');
    
    const extractor = new NoLimitExtractor();
    const filePath = './attached_assets/Nubank_2025-05-24_1751172520674.pdf';
    const fileName = 'Nubank_2025-05-24_1751172520674.pdf';
    
    console.log(`📁 Testando arquivo: ${fileName}`);
    
    const result = await extractor.extractFromDocument(filePath, fileName, 1);
    
    console.log('📊 Resultado da extração:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.data.transactions.length > 0) {
      console.log('✅ Extração funcionando corretamente!');
      console.log(`💰 Transações: ${result.data.transactions.length}`);
      console.log(`🏦 Banco: ${result.data.bank}`);
      console.log(`💵 Créditos: R$ ${result.data.summary.totalCredits}`);
      console.log(`💸 Débitos: R$ ${result.data.summary.totalDebits}`);
    } else {
      console.log('❌ Problema na extração:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testExtractionDirect();