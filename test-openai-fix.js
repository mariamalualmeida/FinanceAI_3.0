// Test and fix OpenAI API issues
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('🔧 DIAGNÓSTICO OPENAI API');
console.log('========================');

async function testOpenAIModels() {
  console.log('📋 Testando modelos disponíveis...');
  
  try {
    const models = await openai.models.list();
    console.log(`✅ ${models.data.length} modelos encontrados`);
    
    // List available GPT models
    const gptModels = models.data
      .filter(model => model.id.includes('gpt'))
      .map(model => model.id)
      .sort();
    
    console.log('🤖 Modelos GPT disponíveis:');
    gptModels.forEach(model => console.log(`  - ${model}`));
    
    return gptModels;
  } catch (error) {
    console.log('❌ Erro ao listar modelos:', error.message);
    return [];
  }
}

async function testModelAccess(model) {
  console.log(`\n🧪 Testando modelo: ${model}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Olá, apenas responda "OK"' }],
      max_tokens: 5,
      temperature: 0
    });
    
    const result = response.choices[0].message.content;
    console.log(`✅ ${model}: ${result}`);
    return true;
  } catch (error) {
    console.log(`❌ ${model}: ${error.message}`);
    return false;
  }
}

async function findWorkingModel() {
  console.log('\n🔍 Procurando modelo funcional...');
  
  // Test common models in order of preference
  const modelsToTest = [
    'gpt-4o-mini',
    'gpt-4o', 
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ];
  
  for (const model of modelsToTest) {
    const works = await testModelAccess(model);
    if (works) {
      console.log(`\n🎯 MODELO FUNCIONAL ENCONTRADO: ${model}`);
      return model;
    }
  }
  
  console.log('\n❌ Nenhum modelo funcional encontrado');
  return null;
}

async function testOpenAIComplete() {
  console.log('🏁 Teste completo da OpenAI API...\n');
  
  // 1. Test models list
  const availableModels = await testOpenAIModels();
  
  // 2. Find working model
  const workingModel = await findWorkingModel();
  
  // 3. Test financial analysis
  if (workingModel) {
    console.log('\n💰 Testando análise financeira...');
    
    try {
      const response = await openai.chat.completions.create({
        model: workingModel,
        messages: [{
          role: 'user',
          content: 'Analise esta situação financeira: Renda: R$ 5000, Gastos: R$ 3000, Poupança: R$ 500. Dê um score de 0-100.'
        }],
        max_tokens: 200,
        temperature: 0.7
      });
      
      const analysis = response.choices[0].message.content;
      console.log('✅ Análise financeira funcionando:');
      console.log(analysis.substring(0, 200) + '...');
      
      return { workingModel, analysis };
    } catch (error) {
      console.log(`❌ Erro na análise: ${error.message}`);
      return { workingModel, analysis: null };
    }
  }
  
  return { workingModel: null, analysis: null };
}

// Run the complete test
testOpenAIComplete()
  .then(result => {
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('===================');
    
    if (result.workingModel) {
      console.log(`✅ OpenAI funcionando com modelo: ${result.workingModel}`);
      console.log('✅ Análise financeira: OK');
      console.log('\n🔧 CORREÇÃO NECESSÁRIA:');
      console.log(`Alterar modelo no multi-llm-orchestrator.ts para: ${result.workingModel}`);
    } else {
      console.log('❌ OpenAI não funcionando');
      console.log('🔧 Verificar:');
      console.log('1. API key válida');
      console.log('2. Créditos disponíveis');
      console.log('3. Permissões do projeto');
    }
  })
  .catch(console.error);