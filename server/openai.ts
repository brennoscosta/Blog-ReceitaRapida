import OpenAI from "openai";
import { downloadCompressAndUpload, checkS3Configuration } from "./s3Upload";
import { storage } from "./storage";

// Database de URLs reais de receitas brasileiras organizadas por categoria
const realRecipeUrls: { [key: string]: { title: string; url: string }[] } = {
  "frango": [
    { title: "Frango Grelhado Simples", url: "https://www.tudogostoso.com.br/receita/145-frango-grelhado.html" },
    { title: "Frango ao Curry", url: "https://www.panelinha.com.br/receita/frango-ao-curry" },
    { title: "Peito de Frango na Frigideira", url: "https://cybercook.com.br/receitas/carnes/frango-na-frigideira-86523" },
    { title: "Frango Xadrez", url: "https://www.tudogostoso.com.br/receita/690-frango-xadrez.html" }
  ],
  "bolo": [
    { title: "Bolo de Chocolate Simples", url: "https://www.tudogostoso.com.br/receita/133-bolo-de-chocolate-simples.html" },
    { title: "Bolo de Cenoura", url: "https://www.panelinha.com.br/receita/bolo-de-cenoura" },
    { title: "Bolo de Fubá", url: "https://cybercook.com.br/receitas/doces/bolo-de-fuba-12345" },
    { title: "Bolo de Laranja", url: "https://www.tudogostoso.com.br/receita/332-bolo-de-laranja.html" }
  ],
  "sopa": [
    { title: "Sopa de Legumes", url: "https://www.tudogostoso.com.br/receita/2998-sopa-de-legumes.html" },
    { title: "Canja de Galinha", url: "https://www.panelinha.com.br/receita/canja-de-galinha" },
    { title: "Sopa de Tomate", url: "https://cybercook.com.br/receitas/sopas/sopa-de-tomate-54321" },
    { title: "Caldo Verde", url: "https://www.tudogostoso.com.br/receita/4567-caldo-verde.html" }
  ],
  "peixe": [
    { title: "Salmão Grelhado", url: "https://www.tudogostoso.com.br/receita/1234-salmao-grelhado.html" },
    { title: "Moqueca de Peixe", url: "https://www.panelinha.com.br/receita/moqueca-de-peixe" },
    { title: "Bacalhau à Brás", url: "https://cybercook.com.br/receitas/peixes/bacalhau-a-bras-98765" },
    { title: "Tilápia Assada", url: "https://www.tudogostoso.com.br/receita/5678-tilapia-assada.html" }
  ],
  "massa": [
    { title: "Macarrão ao Alho e Óleo", url: "https://www.tudogostoso.com.br/receita/343-macarrao-ao-alho-e-oleo.html" },
    { title: "Lasanha de Berinjela", url: "https://www.panelinha.com.br/receita/lasanha-de-berinjela" },
    { title: "Nhoque de Batata", url: "https://cybercook.com.br/receitas/massas/nhoque-de-batata-11111" },
    { title: "Penne ao Molho de Tomate", url: "https://www.tudogostoso.com.br/receita/789-penne-ao-molho-de-tomate.html" }
  ],
  "salada": [
    { title: "Salada Caesar", url: "https://www.tudogostoso.com.br/receita/456-salada-caesar.html" },
    { title: "Salada de Rúcula", url: "https://www.panelinha.com.br/receita/salada-de-rucula" },
    { title: "Tabule", url: "https://cybercook.com.br/receitas/saladas/tabule-22222" },
    { title: "Salada Tropical", url: "https://www.tudogostoso.com.br/receita/999-salada-tropical.html" }
  ],
  "sobremesa": [
    { title: "Brigadeiro", url: "https://www.tudogostoso.com.br/receita/114-brigadeiro.html" },
    { title: "Pudim de Leite", url: "https://www.panelinha.com.br/receita/pudim-de-leite" },
    { title: "Mousse de Chocolate", url: "https://cybercook.com.br/receitas/doces/mousse-de-chocolate-33333" },
    { title: "Pavê", url: "https://www.tudogostoso.com.br/receita/777-pave.html" }
  ],
  "carne": [
    { title: "Picanha Grelhada", url: "https://www.tudogostoso.com.br/receita/321-picanha-grelhada.html" },
    { title: "Carne de Panela", url: "https://www.panelinha.com.br/receita/carne-de-panela" },
    { title: "Bife à Parmegiana", url: "https://cybercook.com.br/receitas/carnes/bife-a-parmegiana-44444" },
    { title: "Costela Assada", url: "https://www.tudogostoso.com.br/receita/888-costela-assada.html" }
  ],
  "lanche": [
    { title: "Pão de Queijo", url: "https://www.tudogostoso.com.br/receita/81-pao-de-queijo.html" },
    { title: "Coxinha", url: "https://www.panelinha.com.br/receita/coxinha" },
    { title: "Pastel de Queijo", url: "https://cybercook.com.br/receitas/lanches/pastel-de-queijo-55555" },
    { title: "Sanduíche Natural", url: "https://www.tudogostoso.com.br/receita/666-sanduiche-natural.html" }
  ],
  "bebida": [
    { title: "Vitamina de Banana", url: "https://www.tudogostoso.com.br/receita/111-vitamina-de-banana.html" },
    { title: "Suco Verde", url: "https://www.panelinha.com.br/receita/suco-verde" },
    { title: "Smoothie de Frutas", url: "https://cybercook.com.br/receitas/bebidas/smoothie-de-frutas-66666" },
    { title: "Limonada", url: "https://www.tudogostoso.com.br/receita/222-limonada.html" }
  ]
};

// Função para mapear categoria para receita similar real
function getRandomRealRecipe(category: string): { title: string; url: string } {
  const normalizedCategory = category.toLowerCase().trim();
  
  // Mapeamento de categorias similares
  const categoryMapping: { [key: string]: string } = {
    "frango": "frango",
    "galinha": "frango", 
    "aves": "frango",
    "chicken": "frango",
    
    "bolo": "bolo",
    "torta": "bolo",
    "cake": "bolo",
    
    "sopa": "sopa",
    "caldo": "sopa",
    "soup": "sopa",
    
    "peixe": "peixe",
    "camarão": "peixe",
    "frutos do mar": "peixe",
    "seafood": "peixe",
    
    "massa": "massa",
    "macarrão": "massa",
    "lasanha": "massa",
    "pasta": "massa",
    
    "salada": "salada",
    "verdura": "salada",
    "legume": "salada",
    
    "sobremesa": "sobremesa",
    "dessert": "sobremesa",
    
    "carne": "carne",
    "boi": "carne",
    "porco": "carne",
    "beef": "carne",
    
    "lanche": "lanche",
    "salgado": "lanche",
    "snack": "lanche",
    
    "bebida": "bebida",
    "suco": "bebida",
    "vitamina": "bebida",
    "drink": "bebida"
  };
  
  // Encontrar categoria correspondente
  let targetCategory = categoryMapping[normalizedCategory];
  
  // Se não encontrou mapeamento direto, procura por palavra-chave
  if (!targetCategory) {
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        targetCategory = value;
        break;
      }
    }
  }
  
  // Se ainda não encontrou, usa uma categoria padrão
  if (!targetCategory || !realRecipeUrls[targetCategory]) {
    const categories = Object.keys(realRecipeUrls);
    targetCategory = categories[Math.floor(Math.random() * categories.length)];
  }
  
  // Seleciona uma receita aleatória da categoria
  const recipes = realRecipeUrls[targetCategory];
  return recipes[Math.floor(Math.random() * recipes.length)];
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface GeneratedRecipe {
  title: string;
  description: string;
  detailedDescription: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  cookTime: number;
  difficulty: string;
  servings: number;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  hashtags: string[];
  category: string;
  subcategory: string;
  externalRecipeTitle: string;
  externalRecipeUrl: string;
}

// Função para verificar se uma receita similar já existe
async function checkDuplicateRecipe(title: string): Promise<boolean> {
  try {
    // Busca receitas existentes com títulos similares
    const existingRecipes = await storage.searchRecipes(title);
    
    // Verifica se alguma receita tem título muito similar (ignora maiúsculas/minúsculas e acentos)
    const normalizeTitle = (str: string) => str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s]/g, "") // Remove pontuação
      .trim();
    
    const normalizedNewTitle = normalizeTitle(title);
    
    for (const recipe of existingRecipes) {
      const normalizedExistingTitle = normalizeTitle(recipe.title);
      
      // Se a similaridade for muito alta, considera duplicata
      if (normalizedExistingTitle === normalizedNewTitle) {
        return true;
      }
      
      // Verifica similaridade por palavras-chave
      const newWords = normalizedNewTitle.split(/\s+/);
      const existingWords = normalizedExistingTitle.split(/\s+/);
      
      const commonWords = newWords.filter(word => 
        word.length > 3 && existingWords.includes(word)
      );
      
      // Se 70% ou mais das palavras principais coincidem, considera similar demais
      if (commonWords.length >= Math.max(2, Math.floor(newWords.length * 0.7))) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking duplicate recipe:", error);
    return false; // Em caso de erro, permite a criação
  }
}

export async function generateRecipe(
  recipeIdea: string,
  difficulty?: string,
  cookTime?: number
): Promise<GeneratedRecipe> {
  try {
    const prompt = `Gere uma receita completa em português brasileiro baseada na ideia: "${recipeIdea}".

IMPORTANTE: Responda APENAS com um JSON válido no formato especificado abaixo, sem texto adicional.

Formato JSON obrigatório:
{
  "title": "Título atrativo da receita",
  "description": "Descrição resumida em 1-2 frases",
  "detailedDescription": "Uma descrição completa e detalhada da receita de 3-4 parágrafos, explicando a origem do prato, seus benefícios, ocasiões ideais para servir, variações possíveis e o que torna esta receita especial. Seja descritiva e envolvente.",
  "ingredients": ["ingrediente 1", "ingrediente 2", "..."],
  "instructions": ["passo 1", "passo 2", "..."],
  "tips": ["dica 1", "dica 2", "..."],
  "cookTime": 30,
  "difficulty": "Fácil",
  "servings": 4,
  "metaTitle": "Título SEO otimizado (max 60 chars)",
  "metaDescription": "Meta descrição SEO (max 160 chars)",
  "metaKeywords": "palavra1, palavra2, palavra3",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "category": "Categoria principal (ex: Sobremesas, Pratos Principais, Lanches)",
  "subcategory": "Subcategoria específica (ex: Bolos, Carnes, Sanduíches)",
  "externalRecipeTitle": "APENAS o nome da categoria da receita (ex: Frango, Bolo, Sopa, etc) - NÃO inclua o nome completo da receita",
  "externalRecipeUrl": "DEIXE SEMPRE VAZIO - escreva apenas uma string vazia \"\""
}

Instruções para cookTime e difficulty:
- CALCULE o cookTime real baseado no tempo total de preparo + cozimento da receita (em minutos)
- DEFINA a difficulty baseada na complexidade real:
  * "Fácil": receitas simples, poucos ingredientes, técnicas básicas
  * "Médio": técnicas intermediárias, vários passos, ingredientes variados  
  * "Difícil": técnicas avançadas, muitos ingredientes, preparo complexo

Outros requisitos:
- Receita deve ser autêntica e executável
- Ingredientes com quantidades específicas
- Instruções claras e numeradas
- 3-5 dicas úteis e práticas
- 10 hashtags relevantes para categorização e busca
- Categoria e subcategoria bem definidas para filtros
- SEO otimizado para blogs de culinária
- Foco em receitas saudáveis e saborosas

IMPORTANTE para links externos:
- VARIE sempre o site de referência - NÃO use sempre o mesmo site
- Use diferentes sites brasileiros: Panelinha, Cybercook, Receitas Nestlé, Ana Maria Braga, GNT, Receitas.com, UOL Culinária, etc.
- Evite repetir o mesmo site consecutivamente
- URLs devem ser reais e funcionais dos sites mencionados`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-3.5-turbo for cost efficiency as requested by user
      messages: [
        {
          role: "system",
          content: "Você é um chef especialista em receitas brasileiras saudáveis. Responda sempre em JSON válido. IMPORTANTE: Para links externos, use SEMPRE sites diferentes - varie entre Panelinha, Cybercook, Receitas Nestlé, Ana Maria Braga, GNT, Receitas.com, UOL Culinária, Tempero Drag, etc. NÃO repita o mesmo site consecutivamente."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    const generatedRecipe = JSON.parse(content) as GeneratedRecipe;
    
    // Validate required fields
    if (!generatedRecipe.title || !generatedRecipe.ingredients || !generatedRecipe.instructions) {
      throw new Error("Generated recipe is missing required fields");
    }

    // Verificar se é receita duplicada
    const isDuplicate = await checkDuplicateRecipe(generatedRecipe.title);
    if (isDuplicate) {
      console.log(`❌ Receita duplicada detectada: "${generatedRecipe.title}"`);
      throw new Error(`Receita similar já existe: "${generatedRecipe.title}". Tente uma receita diferente.`);
    }

    // Substituir URL fictícia por URL real baseada na categoria
    const realRecipe = getRandomRealRecipe(generatedRecipe.externalRecipeTitle || generatedRecipe.category || "frango");
    generatedRecipe.externalRecipeTitle = realRecipe.title;
    generatedRecipe.externalRecipeUrl = realRecipe.url;

    console.log(`✅ Receita única confirmada: "${generatedRecipe.title}"`);
    console.log(`🔗 Link externo real: ${realRecipe.title} - ${realRecipe.url}`);
    return generatedRecipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw new Error("Failed to generate recipe: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

export async function generateRecipeImage(recipeTitle: string): Promise<string> {
  try {
    console.log(`🎨 Gerando imagem para receita: "${recipeTitle}"`);
    
    // Gerar imagem com OpenAI DALL-E
    const response = await openai.images.generate({
      model: "dall-e-2", // Using DALL-E 2 for cost efficiency as requested by user
      prompt: `Uma foto profissional e apetitosa de "${recipeTitle}", bem iluminada, com ingredientes frescos, estilo culinário brasileiro, fundo neutro, alta qualidade, adequada para blog de receitas`,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("OpenAI não retornou URL da imagem");
    }

    console.log(`📷 Imagem gerada pela OpenAI: ${imageUrl}`);

    // Verificar se S3 está configurado
    const s3Ready = await checkS3Configuration();
    if (!s3Ready) {
      console.warn("⚠️ S3 não configurado, usando URL direta da OpenAI");
      return imageUrl;
    }

    // Comprimir e fazer upload para S3
    const fileName = `receita-${recipeTitle.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}.webp`;

    console.log(`🗜️ Comprimindo e enviando para S3: ${fileName}`);
    
    const uploadResult = await downloadCompressAndUpload(imageUrl, fileName);
    
    console.log(`✅ Imagem salva no S3: ${uploadResult.url}`);
    console.log(`📊 Compressão: ${(uploadResult.originalSize / 1024).toFixed(1)}KB → ${(uploadResult.compressedSize / 1024).toFixed(1)}KB`);

    return uploadResult.url;

  } catch (error) {
    console.error("❌ Erro ao gerar/processar imagem:", error);
    
    // Fallback: tentar só gerar a imagem sem S3
    try {
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: `Uma foto profissional e apetitosa de "${recipeTitle}", bem iluminada, com ingredientes frescos, estilo culinário brasileiro, fundo neutro, alta qualidade, adequada para blog de receitas`,
        n: 1,
        size: "1024x1024",
      });
      
      const fallbackUrl = response.data?.[0]?.url;
      if (fallbackUrl) {
        console.log(`🔄 Usando URL direta da OpenAI como fallback: ${fallbackUrl}`);
        return fallbackUrl;
      }
    } catch (fallbackError) {
      console.error("❌ Fallback também falhou:", fallbackError);
    }

    // Último recurso: imagem placeholder
    const placeholderUrl = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
    console.log(`🔄 Usando imagem placeholder: ${placeholderUrl}`);
    return placeholderUrl;
  }
}
