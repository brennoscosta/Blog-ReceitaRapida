import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Sistema de fallback para quando a quota da OpenAI estiver esgotada
const fallbackRecipes = [
  {
    title: "Bolo de Chocolate Cremoso",
    description: "Bolo fofinho de chocolate com cobertura cremosa, perfeito para qualquer ocasião especial.",
    ingredients: [
      "2 xícaras de farinha de trigo",
      "1 xícara de açúcar",
      "1/2 xícara de chocolate em pó",
      "3 ovos",
      "1 xícara de leite",
      "1/2 xícara de óleo",
      "1 colher de sopa de fermento",
      "1 pitada de sal"
    ],
    instructions: [
      "Pré-aqueça o forno a 180°C e unte uma forma com manteiga e farinha",
      "Em uma tigela, misture os ingredientes secos: farinha, açúcar, chocolate em pó e sal",
      "Em outra tigela, bata os ovos, adicione o leite e o óleo",
      "Misture os ingredientes líquidos aos secos até formar uma massa homogênea",
      "Adicione o fermento e misture delicadamente",
      "Despeje a massa na forma preparada",
      "Asse por 35-40 minutos ou até que um palito saia limpo",
      "Deixe esfriar antes de desenformar"
    ],
    tips: [
      "Não abra o forno nos primeiros 20 minutos de cozimento",
      "Para verificar se está pronto, espete um palito no centro",
      "Pode ser servido com chantilly ou sorvete",
      "Guarde em recipiente fechado por até 3 dias"
    ],
    cookTime: 45,
    difficulty: "Fácil",
    servings: 8,
    metaTitle: "Bolo de Chocolate Caseiro - Receita Fácil e Deliciosa",
    metaDescription: "Aprenda a fazer um bolo de chocolate caseiro fofinho e saboroso. Receita simples com ingredientes básicos.",
    metaKeywords: "bolo de chocolate, receita caseira, sobremesa, bolo fácil",
    hashtags: ["bolo", "chocolate", "sobremesa", "caseiro", "fácil", "doce", "festa", "família", "cremoso", "fofinho"],
    category: "Doces",
    subcategory: "Bolos"
  },
  {
    title: "Risotto de Camarão Cremoso",
    description: "Risotto italiano autêntico com camarões frescos e temperos especiais, cremoso e saboroso.",
    ingredients: [
      "300g de arroz arbóreo",
      "500g de camarão limpo",
      "1 litro de caldo de peixe",
      "1 cebola média picada",
      "3 dentes de alho",
      "1/2 xícara de vinho branco",
      "50g de manteiga",
      "Queijo parmesão ralado",
      "Salsinha fresca picada"
    ],
    instructions: [
      "Tempere os camarões com sal, pimenta e alho",
      "Aqueça o caldo de peixe em uma panela separada",
      "Refogue a cebola na manteiga até dourar",
      "Adicione o arroz e refogue por 2 minutos",
      "Despeje o vinho branco e mexa até evaporar",
      "Adicione o caldo quente, uma concha por vez",
      "Mexa constantemente por cerca de 18 minutos",
      "Nos últimos minutos, adicione os camarões",
      "Finalize com parmesão e salsinha"
    ],
    tips: [
      "O segredo é mexer sempre para liberar o amido",
      "O caldo deve estar sempre quente",
      "O ponto ideal é al dente, cremoso mas não empapado",
      "Sirva imediatamente após o preparo"
    ],
    cookTime: 35,
    difficulty: "Médio",
    servings: 4,
    metaTitle: "Risotto de Camarão - Receita Italiana Autêntica",
    metaDescription: "Risotto de camarão cremoso e saboroso. Aprenda a técnica italiana para um prato perfeito.",
    metaKeywords: "risotto, camarão, culinária italiana, frutos do mar, arroz cremoso",
    hashtags: ["risotto", "camarão", "italiano", "cremoso", "frutos do mar", "gourmet", "jantar", "especial", "sofisticado", "delicioso"],
    category: "Massas",
    subcategory: "Risotto"
  },
  {
    title: "Salada Caesar Completa",
    description: "Salada caesar clássica com molho cremoso, croutons crocantes e parmesão fresco.",
    ingredients: [
      "1 pé de alface americana",
      "100g de parmesão em lascas",
      "2 fatias de pão de forma",
      "2 gemas de ovo",
      "3 dentes de alho",
      "6 filés de anchova",
      "Suco de 1 limão",
      "1/4 xícara de azeite",
      "Molho inglês a gosto"
    ],
    instructions: [
      "Lave e seque bem as folhas de alface",
      "Corte o pão em cubos e toste no forno com azeite",
      "No liquidificador, bata gemas, alho, anchovas e limão",
      "Adicione o azeite em fio até formar um molho cremoso",
      "Tempere com molho inglês, sal e pimenta",
      "Monte a salada com alface, molho e croutons",
      "Finalize com lascas de parmesão",
      "Sirva imediatamente"
    ],
    tips: [
      "Use ovos frescos e de boa procedência",
      "O molho pode ser feito com até 2 dias de antecedência",
      "Mantenha os ingredientes bem gelados",
      "Adicione o molho apenas na hora de servir"
    ],
    cookTime: 20,
    difficulty: "Fácil",
    servings: 4,
    metaTitle: "Salada Caesar Clássica - Receita Tradicional",
    metaDescription: "Salada caesar autêntica com molho cremoso caseiro. Receita tradicional americana.",
    metaKeywords: "salada caesar, molho caesar, salada americana, entrada",
    hashtags: ["salada", "caesar", "entrada", "americano", "clássico", "molho", "parmesão", "croutons", "fresco", "cremoso"],
    category: "Saladas",
    subcategory: "Entradas"
  }
];

function getRandomFallbackRecipe(): GeneratedRecipe {
  const recipe = fallbackRecipes[Math.floor(Math.random() * fallbackRecipes.length)];
  return { ...recipe };
}

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
  "category": "Categoria específica (ex: Massas, Peixes, Mariscos, Carnes, Sobremesas, Bebidas, Saladas)",
  "subcategory": "Subcategoria detalhada (ex: Pizza, Macarrão, Camarão, Peixe, Bolos, Tortas, Sucos)"
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
    console.error("Error generating recipe with OpenAI:", error);
    
    // Se for erro de quota ou rate limit, usar receita de fallback
    if (error.status === 429 || error.code === 'insufficient_quota' || error.code === 'rate_limit_exceeded') {
      console.log("🔄 Quota OpenAI esgotada, usando receita de fallback");
      const fallbackRecipe = getRandomFallbackRecipe();
      
      // Adaptar o título para incluir a ideia original se fornecida
      if (recipeIdea && recipeIdea.length > 5) {
        fallbackRecipe.title = `${fallbackRecipe.title} - Inspirado em ${recipeIdea}`;
        fallbackRecipe.metaTitle = `${fallbackRecipe.title.substring(0, 55)}...`;
      }
      
      return fallbackRecipe;
    }
    
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
