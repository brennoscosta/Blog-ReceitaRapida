import { storage } from "./storage";
import { generateRecipe, generateRecipeImage } from "./openai";

// Lista expandida de ideias de receitas para geração automática (100+ opções para evitar duplicatas)
const recipeIdeas = [
  // Pratos principais brasileiros
  "feijoada light",
  "moqueca de peixe",
  "bobó de camarão fit",
  "baião de dois integral",
  "caldo verde mineiro",
  "vatapá de frango",
  "tutu de feijão",
  "pacu assado com farofa",
  "picanha na churrasqueira",
  "costela de porco no bafo",
  
  // Massas e risotos
  "macarrão ao pesto de manjericão",
  "lasanha de abobrinha",
  "nhoque de batata-doce",
  "carbonara integral",
  "risotto de cogumelos",
  "talharim com camarão",
  "canelone de ricota",
  "espaguete à carbonara fit",
  "ravioli de abóbora",
  "penne com molho de tomate fresco",
  
  // Carnes e aves
  "frango xadrez",
  "bife à parmegiana fit",
  "carne de panela",
  "frango refogado com quiabo",
  "almôndegas de peru",
  "escalope de frango",
  "coxão mole ao molho madeira",
  "peito de peru defumado",
  "frango ao curry",
  "carne de sol com macaxeira",
  
  // Peixes e frutos do mar
  "salmão grelhado com ervas",
  "bacalhau à brás",
  "caldeirada de peixe",
  "camarão na moranga",
  "tilápia no papillote",
  "linguado grelhado",
  "casquinha de siri",
  "bobo de camarão",
  "moqueca capixaba",
  "peixe ensopado",
  
  // Sopas e caldos
  "canja de galinha",
  "sopa de mandioquinha",
  "caldo de feijão",
  "sopa de ervilha",
  "consommé de legumes",
  "sopa de tomate",
  "caldo verde",
  "sopa de cebola",
  "gazpacho brasileiro",
  "sopa de batata-baroa",
  
  // Saladas e pratos leves
  "salada de grão-de-bico",
  "tabule brasileiro",
  "salada de beterraba",
  "salada caesar fit",
  "salada de palmito",
  "salada de feijão fradinho",
  "salada morna de quinoa",
  "salada de rúcula com pera",
  "salada de lentilha",
  "salada tropical",
  
  // Sobremesas tradicionais
  "brigadeiro gourmet",
  "pudim de leite condensado",
  "quindim caseiro",
  "beijinho de coco",
  "cocada queimada",
  "pavê de chocolate",
  "mousse de chocolate",
  "torta de morango",
  "petit gateau",
  "tiramisu brasileiro",
  
  // Bolos e tortas
  "bolo de cenoura com cobertura",
  "torta de limão siciliano",
  "bolo de fubá cremoso",
  "torta de maçã",
  "bolo de banana",
  "cheesecake de maracujá",
  "bolo de laranja",
  "torta holandesa",
  "bolo prestígio",
  "bolo de chocolate molhadinho",
  
  // Lanches e salgados
  "pão de queijo mineiro",
  "coxinha de frango",
  "pastel de queijo",
  "esfiha de carne",
  "empada de palmito",
  "sanduíche natural",
  "wrap integral",
  "crepe salgado",
  "quiche de legumes",
  "torta salgada de frango",
  
  // Bebidas e vitaminas
  "vitamina de banana com aveia",
  "suco verde detox",
  "smoothie de frutas vermelhas",
  "batida de coco",
  "caipirinha de frutas",
  "limonada suíça",
  "água saborizada",
  "chá gelado de hibisco",
  "vitamina de açaí",
  "suco de laranja com cenoura",
  
  // Pratos vegetarianos
  "hambúrguer de quinoa",
  "estrogonofe de cogumelos",
  "curry de grão-de-bico",
  "lasanha de berinjela",
  "risotto de abóbora",
  "quiche sem carne",
  "salada de lentilha",
  "wrap vegano",
  "bolinho de aipim",
  "escondidinho vegetal"
];

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

let autoGenerationStats = {
  recipesGenerated: 0,
  sessionStartTime: Date.now(),
};

export function getAutoGenerationStats() {
  return autoGenerationStats;
}

export function resetAutoGenerationStats() {
  autoGenerationStats = {
    recipesGenerated: 0,
    sessionStartTime: Date.now(),
  };
}

async function generateRandomRecipe(): Promise<void> {
  try {
    console.log("🤖 Generating automatic recipe...");
    
    // Tentar gerar receita única por até 5 tentativas
    let generatedRecipe;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Escolher uma ideia aleatória
      const randomIdea = recipeIdeas[Math.floor(Math.random() * recipeIdeas.length)];
      
      try {
        // Gerar receita com IA
        generatedRecipe = await generateRecipe(randomIdea);
        break; // Se chegou aqui, a receita é única
      } catch (error) {
        if (error instanceof Error && error.message.includes("Receita similar já existe")) {
          console.log(`🔄 Tentativa ${attempts}/${maxAttempts}: Receita duplicada, tentando novamente...`);
          if (attempts === maxAttempts) {
            throw new Error("Não foi possível gerar receita única após 5 tentativas");
          }
          continue; // Tenta novamente
        } else {
          throw error; // Outro erro, propaga
        }
      }
    }
    
    if (!generatedRecipe) {
      throw new Error("Falha na geração de receita após múltiplas tentativas");
    }
    
    // Tentar gerar imagem, continuar sem imagem se falhar
    let imageUrl = null;
    try {
      imageUrl = await generateRecipeImage(generatedRecipe.title);
    } catch (error) {
      console.log("⚠️ Falha na geração de imagem automática, continuando sem imagem:", error instanceof Error ? error.message : "Erro desconhecido");
    }
    
    // Criar slug único
    let slug = createSlug(generatedRecipe.title);
    let counter = 1;
    while (await storage.getRecipeBySlug(slug)) {
      slug = `${createSlug(generatedRecipe.title)}-${counter}`;
      counter++;
    }
    
    // Formar conteúdo completo
    const content = `## Ingredientes

${generatedRecipe.ingredients.map(ing => `- ${ing}`).join('\n')}

## Modo de Preparo

${generatedRecipe.instructions.map((inst, index) => `${index + 1}. ${inst}`).join('\n\n')}

## Dicas

${generatedRecipe.tips.map(tip => `- ${tip}`).join('\n')}`;

    // Criar receita no banco
    const recipeData = {
      title: generatedRecipe.title,
      slug,
      description: generatedRecipe.description,
      content,
      ingredients: generatedRecipe.ingredients,
      instructions: generatedRecipe.instructions,
      tips: generatedRecipe.tips,
      cookTime: generatedRecipe.cookTime,
      difficulty: generatedRecipe.difficulty,
      servings: generatedRecipe.servings,
      imageUrl,
      metaTitle: generatedRecipe.metaTitle,
      metaDescription: generatedRecipe.metaDescription,
      metaKeywords: generatedRecipe.metaKeywords,
      hashtags: generatedRecipe.hashtags,
      category: generatedRecipe.category,
      subcategory: generatedRecipe.subcategory,
      externalRecipeTitle: generatedRecipe.externalRecipeTitle,
      externalRecipeUrl: generatedRecipe.externalRecipeUrl,
      published: true,
    };

    await storage.createRecipe(recipeData);
    
    // Atualizar estatísticas
    autoGenerationStats.recipesGenerated++;
    
    // Atualizar timestamp da última geração
    await storage.updateSystemSettings({ 
      lastGenerationAt: new Date() 
    } as any);
    
    console.log(`✅ Auto-generated recipe: "${generatedRecipe.title}" (${autoGenerationStats.recipesGenerated} total this session)`);
    
  } catch (error) {
    console.error("❌ Error generating automatic recipe:", error);
  }
}

let autoGenerationInterval: NodeJS.Timeout | null = null;

export async function startAutoGeneration(): Promise<void> {
  const settings = await storage.getSystemSettings();
  
  if (!settings.autoGenerationEnabled) {
    console.log("🔴 Auto-generation is disabled");
    return;
  }
  
  // Parar intervalo anterior se existir
  if (autoGenerationInterval) {
    clearInterval(autoGenerationInterval);
  }
  
  const intervalMs = settings.generationIntervalMinutes * 60 * 1000;
  
  console.log(`🟢 Starting auto-generation every ${settings.generationIntervalMinutes} minutes`);
  
  // Gerar primeira receita imediatamente
  await generateRandomRecipe();
  
  // Configurar intervalo para próximas gerações
  autoGenerationInterval = setInterval(async () => {
    const currentSettings = await storage.getSystemSettings();
    if (currentSettings.autoGenerationEnabled) {
      await generateRandomRecipe();
    } else {
      stopAutoGeneration();
    }
  }, intervalMs);
}

export function stopAutoGeneration(): void {
  if (autoGenerationInterval) {
    clearInterval(autoGenerationInterval);
    autoGenerationInterval = null;
    console.log("🔴 Auto-generation stopped");
  }
}

export async function restartAutoGeneration(): Promise<void> {
  stopAutoGeneration();
  await startAutoGeneration();
}

// Função para calcular próxima geração
export async function getNextGenerationTime(): Promise<number | null> {
  const settings = await storage.getSystemSettings();
  
  if (!settings.autoGenerationEnabled || !settings.lastGenerationAt) {
    return null;
  }
  
  const lastGeneration = new Date(settings.lastGenerationAt).getTime();
  const intervalMs = settings.generationIntervalMinutes * 60 * 1000;
  const nextGeneration = lastGeneration + intervalMs;
  
  return Math.max(0, nextGeneration - Date.now());
}