import OpenAI from "openai";
import { downloadCompressAndUpload, checkS3Configuration } from "./s3Upload";

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
  "subcategory": "Subcategoria específica (ex: Bolos, Carnes, Sanduíches)"
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
- Foco em receitas saudáveis e saborosas`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-3.5-turbo for cost efficiency as requested by user
      messages: [
        {
          role: "system",
          content: "Você é um chef especialista em receitas brasileiras saudáveis. Responda sempre em JSON válido."
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
