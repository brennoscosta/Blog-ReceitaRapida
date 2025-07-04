import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Clock, Users, BarChart3, Check, Lightbulb, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ["/api/recipes/slug", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Carregando receita...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Receita não encontrada</h1>
          <Link href="/">
            <Button className="bg-fresh-green hover:bg-dark-green text-white">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shareRecipe = (platform: string) => {
    const url = window.location.href;
    const title = `Confira esta receita: ${recipe.title}`;
    
    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank");
        break;
    }
  };

  // Ensure arrays are properly handled
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const tips = Array.isArray(recipe.tips) ? recipe.tips : [];

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    name: recipe.title || "",
    description: recipe.description || "",
    author: {
      "@type": "Organization",
      name: "Receita Rápida"
    },
    cookTime: `PT${recipe.cookTime || 30}M`,
    recipeYield: `${recipe.servings || 4} porções`,
    recipeCategory: "Receita",
    recipeCuisine: "Brasileira",
    recipeIngredient: ingredients,
    recipeInstructions: instructions.map((instruction: string, index: number) => ({
      "@type": "HowToStep",
      name: `Passo ${index + 1}`,
      text: instruction
    })),
    image: recipe.imageUrl || "",
    url: window.location.href
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={recipe.metaTitle || `${recipe.title} - Receita Rápida`}
        description={recipe.metaDescription || recipe.description}
        keywords={recipe.metaKeywords || "receitas, culinária, comida saudável"}
        image={recipe.imageUrl}
        type="article"
        schemaData={schemaData}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/">
            <Button 
              variant="ghost" 
              className="flex items-center text-fresh-green hover:text-dark-green mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar às receitas
            </Button>
          </Link>

          {/* Recipe Header */}
          <div className="mb-8">
            <img
              src={recipe.imageUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"}
              alt={recipe.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg mb-6"
            />
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {recipe.title}
            </h1>
            
            <p className="text-lg text-medium-gray mb-6">
              {recipe.description}
            </p>
            
            {/* Recipe Meta */}
            <div className="flex flex-wrap gap-6 text-sm text-medium-gray">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-fresh-green" />
                <span>{recipe.cookTime} minutos</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-fresh-green" />
                <span>{recipe.servings} porções</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-fresh-green" />
                <span>{recipe.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center">
                  <Share2 className="h-5 w-5 mr-2 text-fresh-green" />
                  <span className="font-semibold">Compartilhar receita:</span>
                </div>
                <Button 
                  onClick={() => shareRecipe("facebook")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Facebook
                </Button>
                <Button 
                  onClick={() => shareRecipe("twitter")}
                  className="bg-blue-400 hover:bg-blue-500 text-white"
                  size="sm"
                >
                  Twitter
                </Button>
                <Button 
                  onClick={() => shareRecipe("whatsapp")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Content */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Ingredients */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Check className="h-6 w-6 mr-3 text-fresh-green" />
                  Ingredientes
                </h3>
                <ul className="space-y-3">
                  {ingredients.map((ingredient: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-fresh-green mt-1 mr-3 flex-shrink-0" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-fresh-green" />
                  Modo de Preparo
                </h3>
                <ol className="space-y-4">
                  {instructions.map((instruction: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-fresh-green text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Tips Section */}
          {tips.length > 0 && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-3 text-fresh-green" />
                  Dicas da Receita
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {tips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-fresh-green mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}