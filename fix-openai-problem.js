// Script para corrigir problema da OpenAI permanentemente
import { DatabaseStorage } from './server/storage.js';

console.log('🔧 CORRIGINDO PROBLEMA DA OPENAI');
console.log('==============================');

async function fixOpenAIProblem() {
  try {
    const storage = new DatabaseStorage();
    
    // Desabilitar todos os provedores OpenAI no banco
    console.log('Desabilitando provedores OpenAI no banco...');
    
    // Buscar configurações LLM
    const llmConfigs = await storage.getLlmConfigs();
    
    for (const config of llmConfigs) {
      if (config.name === 'openai' && config.isEnabled) {
        console.log(`Desabilitando provedor OpenAI: ${config.id}`);
        await storage.updateLlmConfig(config.id, { isEnabled: false });
      }
    }
    
    console.log('✅ Provedores OpenAI desabilitados com sucesso');
    
    // Verificar provedores ativos
    const activeConfigs = await storage.getLlmConfigs();
    const activeProviders = activeConfigs.filter(c => c.isEnabled);
    
    console.log('\n🔍 Provedores ativos restantes:');
    activeProviders.forEach(provider => {
      console.log(`- ${provider.name}: ${provider.model}`);
    });
    
    if (activeProviders.length === 0) {
      console.log('\n⚠️ ATENÇÃO: Nenhum provedor ativo!');
      console.log('Sistema usará NoLimitExtractor como fallback');
    } else {
      console.log(`\n✅ ${activeProviders.length} provedores funcionais disponíveis`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir problema:', error.message);
  }
}

fixOpenAIProblem().then(() => {
  console.log('\n🎯 CORREÇÃO CONCLUÍDA');
  console.log('Reiniciar servidor para aplicar mudanças');
  process.exit(0);
});