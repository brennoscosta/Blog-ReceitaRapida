import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Users, BarChart3, Share2, Check, Lightbulb } from "lucide-react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Recipe } from "@shared/schema";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: recipe, isLoading, error } = useQuery<Recipe>({
    queryKey: ["/api/recipes", slug],
    enabled: !!slug,
  });

  const shareRecipe = (platform: string) => {
    const url = window.location.href;
    const title = recipe?.title || "Receita Rápida";
    
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="w-full h-64 md:h-80 rounded-xl mb-6" />
            <Skeleton className="h-12 mb-4" />
            <Skeleton className="h-6 mb-6" />
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-4" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 mb-4" />
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-6" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Receita não encontrada</h1>
            <p className="text-medium-gray mb-8">A receita que você procura não existe ou foi removida.</p>
            <Link href="/">
              <Button className="bg-fresh-green hover:bg-dark-green text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    author: {
      "@type": "Organization",
      name: "Receita Rápida"
    },
    cookTime: `PT${recipe.cookTime}M`,
    recipeYield: `${recipe.servings} porções`,
    recipeCategory: "Receita",
    recipeCuisine: "Brasileira",
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((instruction, index) => ({
      "@type": "HowToStep",
      name: `Passo ${index + 1}`,
      text: instruction
    })),
    image: recipe.imageUrl,
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
      <Header />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Social Sharing */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-fresh-green" />
                Compartilhe esta receita
              </h3>
              <div className="flex space-x-3">
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
                  {recipe.ingredients.map((ingredient, index) => (
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
                  {recipe.instructions.map((instruction, index) => (
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
          {recipe.tips && recipe.tips.length > 0 && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-3 text-fresh-green" />
                  Dicas da Receita
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {recipe.tips.map((tip, index) => (
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
