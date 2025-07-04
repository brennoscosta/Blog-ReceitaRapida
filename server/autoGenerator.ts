import { storage } from "./storage";
import { generateRecipe } from "./openai";
import { S3ImageService } from "./s3Service";

// Lista de ideias de receitas aleatórias para geração automática
const recipeIdeas = [
  "bolo de chocolate sem glúten",
  "salada de quinoa com legumes",
  "frango grelhado com ervas",
  "sopa de abóbora cremosa",
  "panqueca integral de banana",
  "lasanha de berinjela",
  "risotto de camarão",
  "hambúrguer de grão-de-bico",
  "torta de limão",
  "curry de batata-doce",
  "peixe assado com legumes",
  "smoothie de frutas vermelhas",
  "pão integral caseiro",
  "mousse de maracujá",
  "strogonoff de cogumelos",
  "pizza integral de rúcula",
  "coxinha de frango assada",
  "salada tropical com manga",
  "brownie de cacau",
  "sopa de lentilha com bacon",
  "wrap de frango com abacate",
  "pudim de chia",
  "escondidinho de batata-doce",
  "bolinho de bacalhau",
  "vitamina de açaí",
  "macarrão ao pesto",
  "brigadeiro gourmet",
  "quiche de espinafre",
  "tapioca recheada",
  "cookies de aveia"
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
    
    // Escolher uma ideia aleatória
    const randomIdea = recipeIdeas[Math.floor(Math.random() * recipeIdeas.length)];
    
    // Gerar receita com IA
    const generatedRecipe = await generateRecipe(randomIdea);
    
    // Gerar e fazer upload da imagem para S3
    const imageUrl = await S3ImageService.generateAndUploadRecipeImage(generatedRecipe.title);
    
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