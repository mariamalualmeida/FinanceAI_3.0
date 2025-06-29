interface CategoryRule {
  name: string;
  keywords: string[];
  priority: number;
  subcategories?: string[];
  patterns?: RegExp[];
}

interface CategorizationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  matchedKeywords: string[];
}

export class IntelligentCategorizer {
  private categories: CategoryRule[] = [
    {
      name: 'Alimentação',
      priority: 10,
      keywords: [
        'restaurante', 'lanchonete', 'padaria', 'sorveteria', 'pizzaria',
        'ifood', 'uber eats', 'rappi', 'delivery', 'fast food',
        'mcdonalds', 'burger king', 'subway', 'kfc', 'bobs',
        'mercado', 'supermercado', 'hipermercado', 'açougue', 'quitanda',
        'pao de acucar', 'carrefour', 'extra', 'walmart', 'big',
        'feira', 'hortifruti', 'sacolao', 'emporio', 'mercearia'
      ],
      subcategories: ['Restaurantes', 'Delivery', 'Supermercados', 'Feiras'],
      patterns: [/.*food.*/, /.*eat.*/, /.*rest.*/, /.*market.*/]
    },
    
    {
      name: 'Transporte',
      priority: 9,
      keywords: [
        'uber', '99', 'taxi', 'cabify', 'blablacar',
        'metro', 'metrô', 'onibus', 'ônibus', 'trem', 'cptm',
        'combustivel', 'gasolina', 'alcool', 'etanol', 'diesel',
        'posto', 'ipiranga', 'shell', 'br', 'petrobras',
        'estacionamento', 'zona azul', 'pedagio', 'pedágio',
        'oficina', 'mecanico', 'lavagem', 'revisao', 'seguro auto'
      ],
      subcategories: ['Apps de Transporte', 'Transporte Público', 'Combustível', 'Manutenção'],
      patterns: [/.*transport.*/, /.*fuel.*/, /.*gas.*/, /.*park.*/]
    },
    
    {
      name: 'Saúde',
      priority: 8,
      keywords: [
        'hospital', 'clinica', 'clínica', 'medico', 'médico',
        'dentista', 'laboratorio', 'laboratório', 'exame',
        'farmacia', 'farmácia', 'drogaria', 'remedio', 'remédio',
        'consulta', 'cirurgia', 'tratamento', 'terapia',
        'unimed', 'amil', 'bradesco saude', 'sul america',
        'psicologia', 'fisioterapia', 'academia', 'personal'
      ],
      subcategories: ['Consultas', 'Medicamentos', 'Exames', 'Planos de Saúde'],
      patterns: [/.*health.*/, /.*medical.*/, /.*clinic.*/, /.*pharma.*/]
    },
    
    {
      name: 'Educação',
      priority: 7,
      keywords: [
        'escola', 'colegio', 'colégio', 'universidade', 'faculdade',
        'curso', 'aula', 'mensalidade', 'matricula', 'matrícula',
        'livro', 'apostila', 'material escolar', 'uniforme',
        'udemy', 'coursera', 'alura', 'eadbox', 'hotmart'
      ],
      subcategories: ['Mensalidades', 'Materiais', 'Cursos Online'],
      patterns: [/.*education.*/, /.*school.*/, /.*course.*/, /.*learn.*/]
    },
    
    {
      name: 'Entretenimento',
      priority: 6,
      keywords: [
        'cinema', 'teatro', 'show', 'concerto', 'festival',
        'netflix', 'amazon prime', 'spotify', 'youtube', 'disney',
        'ingresso', 'ticket', 'evento', 'balada', 'bar',
        'jogo', 'steam', 'playstation', 'xbox', 'nintendo',
        'parque', 'zoologico', 'aquario', 'museu'
      ],
      subcategories: ['Streaming', 'Cinema/Teatro', 'Games', 'Eventos'],
      patterns: [/.*entertainment.*/, /.*movie.*/, /.*music.*/, /.*game.*/]
    },
    
    {
      name: 'Compras',
      priority: 5,
      keywords: [
        'loja', 'shopping', 'magazine luiza', 'casas bahia',
        'amazon', 'mercado livre', 'americanas', 'submarino',
        'roupa', 'sapato', 'calcado', 'calçado', 'acessorio',
        'eletronico', 'eletrônico', 'celular', 'notebook',
        'casa', 'decoracao', 'decoração', 'moveis', 'móveis'
      ],
      subcategories: ['Online', 'Roupas', 'Eletrônicos', 'Casa'],
      patterns: [/.*shop.*/, /.*store.*/, /.*buy.*/, /.*purchase.*/]
    },
    
    {
      name: 'Casa',
      priority: 4,
      keywords: [
        'aluguel', 'condominio', 'condomínio', 'iptu', 'agua', 'água',
        'luz', 'energia', 'gas', 'gás', 'internet', 'telefone',
        'limpeza', 'diarista', 'porteiro', 'seguranca', 'segurança',
        'material construcao', 'construção', 'reforma', 'pintura'
      ],
      subcategories: ['Contas', 'Manutenção', 'Serviços'],
      patterns: [/.*house.*/, /.*home.*/, /.*rent.*/, /.*utility.*/]
    },
    
    {
      name: 'Investimentos',
      priority: 3,
      keywords: [
        'aplicacao', 'aplicação', 'investimento', 'poupanca', 'poupança',
        'cdb', 'lci', 'lca', 'tesouro', 'acao', 'ação',
        'fundo', 'previdencia', 'previdência', 'seguro',
        'btg', 'xp', 'rico', 'clear', 'easynvest'
      ],
      subcategories: ['Renda Fixa', 'Renda Variável', 'Previdência'],
      patterns: [/.*invest.*/, /.*fund.*/, /.*stock.*/, /.*saving.*/]
    },
    
    {
      name: 'Transferências',
      priority: 2,
      keywords: [
        'transferencia', 'transferência', 'ted', 'doc', 'pix',
        'pagamento', 'recebimento', 'deposito', 'depósito',
        'emprestimo', 'empréstimo', 'financiamento'
      ],
      subcategories: ['PIX', 'TED/DOC', 'Empréstimos'],
      patterns: [/.*transfer.*/, /.*payment.*/, /.*deposit.*/, /.*loan.*/]
    },
    
    {
      name: 'Tarifas Bancárias',
      priority: 1,
      keywords: [
        'tarifa', 'taxa', 'juros', 'iof', 'anuidade',
        'manutencao', 'manutenção', 'saque', 'extrato',
        'cartao', 'cartão', 'conta corrente', 'cheque especial'
      ],
      subcategories: ['Anuidades', 'Tarifas', 'Juros'],
      patterns: [/.*fee.*/, /.*tax.*/, /.*interest.*/, /.*charge.*/]
    }
  ];

  categorizeTransaction(description: string, amount: number): CategorizationResult {
    const descLower = description.toLowerCase().trim();
    const bestMatch = this.findBestMatch(descLower, amount);
    
    return bestMatch;
  }

  private findBestMatch(description: string, amount: number): CategorizationResult {
    let bestCategory: CategorizationResult = {
      category: 'Outros',
      confidence: 0.1,
      matchedKeywords: []
    };

    for (const category of this.categories) {
      const match = this.scoreCategory(description, category, amount);
      
      if (match.confidence > bestCategory.confidence) {
        bestCategory = {
          category: category.name,
          subcategory: match.subcategory,
          confidence: match.confidence,
          matchedKeywords: match.matchedKeywords
        };
      }
    }

    return bestCategory;
  }

  private scoreCategory(description: string, category: CategoryRule, amount: number): {
    confidence: number;
    subcategory?: string;
    matchedKeywords: string[];
  } {
    const matchedKeywords: string[] = [];
    let score = 0;

    // Pontuação por palavras-chave
    for (const keyword of category.keywords) {
      if (description.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        score += 1.0;
      }
    }

    // Pontuação por padrões regex
    if (category.patterns) {
      for (const pattern of category.patterns) {
        if (pattern.test(description)) {
          score += 0.5;
        }
      }
    }

    // Bônus por prioridade da categoria
    score *= (category.priority / 10);

    // Ajuste por valor (algumas categorias têm valores típicos)
    score *= this.getAmountBonus(category.name, amount);

    // Determinar subcategoria
    const subcategory = this.determineSubcategory(
      description, 
      category.subcategories || [], 
      matchedKeywords
    );

    // Normalizar confiança (0-1)
    const confidence = Math.min(score / category.keywords.length, 1.0);

    return {
      confidence,
      subcategory,
      matchedKeywords
    };
  }

  private getAmountBonus(categoryName: string, amount: number): number {
    // Bônus baseado em valores típicos por categoria
    const typicalRanges: Record<string, [number, number]> = {
      'Alimentação': [10, 200],
      'Transporte': [5, 100],
      'Saúde': [20, 500],
      'Entretenimento': [15, 150],
      'Casa': [50, 2000],
      'Investimentos': [100, 10000],
      'Tarifas Bancárias': [5, 50]
    };

    const range = typicalRanges[categoryName];
    if (!range) return 1.0;

    const [min, max] = range;
    if (amount >= min && amount <= max) {
      return 1.2; // Bônus de 20%
    } else if (amount < min * 0.5 || amount > max * 2) {
      return 0.8; // Penalidade de 20%
    }
    
    return 1.0;
  }

  private determineSubcategory(
    description: string, 
    subcategories: string[], 
    matchedKeywords: string[]
  ): string | undefined {
    
    if (subcategories.length === 0) return undefined;

    // Mapear palavras-chave para subcategorias
    const subcategoryKeywords: Record<string, string[]> = {
      'Restaurantes': ['restaurante', 'lanchonete', 'pizzaria'],
      'Delivery': ['ifood', 'uber eats', 'delivery', 'rappi'],
      'Supermercados': ['mercado', 'supermercado', 'hipermercado'],
      'Apps de Transporte': ['uber', '99', 'taxi', 'cabify'],
      'Combustível': ['combustivel', 'gasolina', 'posto'],
      'Consultas': ['medico', 'dentista', 'consulta'],
      'Medicamentos': ['farmacia', 'remedio', 'drogaria'],
      'Streaming': ['netflix', 'spotify', 'amazon prime'],
      'PIX': ['pix'],
      'TED/DOC': ['ted', 'doc', 'transferencia']
    };

    for (const subcategory of subcategories) {
      const keywords = subcategoryKeywords[subcategory] || [];
      for (const keyword of keywords) {
        if (matchedKeywords.includes(keyword) || description.includes(keyword)) {
          return subcategory;
        }
      }
    }

    return subcategories[0]; // Fallback para primeira subcategoria
  }

  // Métodos para machine learning futuro
  learnFromCorrection(
    description: string, 
    wrongCategory: string, 
    correctCategory: string
  ): void {
    // TODO: Implementar aprendizado baseado em correções do usuário
    console.log(`[Categorizer] Aprendizado: "${description}" não é "${wrongCategory}", é "${correctCategory}"`);
  }

  getTopCategories(limit: number = 10): CategoryRule[] {
    return this.categories
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  addCustomCategory(category: CategoryRule): void {
    this.categories.push(category);
    this.categories.sort((a, b) => b.priority - a.priority);
  }

  updateCategoryKeywords(categoryName: string, newKeywords: string[]): void {
    const category = this.categories.find(c => c.name === categoryName);
    if (category) {
      category.keywords = [...new Set([...category.keywords, ...newKeywords])];
    }
  }
}

export const intelligentCategorizer = new IntelligentCategorizer();