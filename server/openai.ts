import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface GeneratedRecipe {
  title: string;
  description: string;
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
    const response = await openai.images.generate({
      model: "dall-e-2", // Using DALL-E 2 for cost efficiency as requested by user
      prompt: `Uma foto profissional e apetitosa de "${recipeTitle}", bem iluminada, com ingredientes frescos, estilo culinário brasileiro, fundo neutro, alta qualidade, adequada para blog de receitas`,
      n: 1,
      size: "1024x1024",
    });

    return response.data?.[0]?.url || "";
  } catch (error) {
    console.error("Error generating recipe image:", error);
    // Return a placeholder image URL if generation fails
    return "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  }
}
