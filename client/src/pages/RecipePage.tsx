import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Clock, Users, BarChart3, Check, Lightbulb, Tag, Folder, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { RecipeCard } from "@/components/RecipeCard";
import { SEOHead } from "@/components/SEOHead";
import type { Recipe } from "@shared/schema";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  // Função para navegar para home com filtro de categoria
  const navigateWithCategoryFilter = (category: string) => {
    // Como não temos estado global, vamos para home e o usuário pode clicar na categoria lá
    setLocation('/');
  };

  // Função para navegar para home com filtro de subcategoria
  const navigateWithSubcategoryFilter = (subcategory: string) => {
    setLocation('/');
  };

  // Função para navegar para home com filtro de hashtag
  const navigateWithHashtagFilter = (hashtag: string) => {
    setLocation('/');
  };
  
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ["/api/recipes", slug],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${slug}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: relatedRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes", slug, "related"],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${slug}/related`, {
        credentials: "include",
      });
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
    enabled: !!slug && !!recipe,
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
      
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
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
            <div className="flex flex-wrap gap-6 text-sm text-medium-gray mb-6">
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

            {/* Categories and Hashtags */}
            <div className="space-y-4">
              {/* Categories */}
              {(recipe.category || recipe.subcategory) && (
                <div className="flex items-center flex-wrap gap-2">
                  <Folder className="h-4 w-4 text-fresh-green" />
                  <span className="text-sm font-medium text-gray-600">Categoria:</span>
                  {recipe.category && (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-fresh-green hover:text-white transition-colors"
                      onClick={() => navigateWithCategoryFilter(recipe.category!)}
                    >
                      {recipe.category}
                    </Badge>
                  )}
                  {recipe.subcategory && (
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-fresh-green hover:text-white hover:border-fresh-green transition-colors"
                      onClick={() => navigateWithSubcategoryFilter(recipe.subcategory!)}
                    >
                      {recipe.subcategory}
                    </Badge>
                  )}
                </div>
              )}

              {/* Hashtags */}
              {recipe.hashtags && Array.isArray(recipe.hashtags) && recipe.hashtags.length > 0 && (
                <div className="flex items-start flex-wrap gap-2">
                  <Tag className="h-4 w-4 text-warm-orange mt-1" />
                  <span className="text-sm font-medium text-gray-600">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {(recipe.hashtags as string[]).map((hashtag: string, index: number) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-warm-orange hover:text-white transition-colors"
                        onClick={() => navigateWithHashtagFilter(hashtag)}
                      >
                        {hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Recipe Description */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="h-6 w-6 mr-3 text-fresh-green" />
                Sobre esta Receita
              </h3>
              <div className="prose prose-lg text-gray-700 leading-relaxed">
                <p>{recipe.description}</p>
                
                {/* Additional detailed description if available */}
                {recipe.detailedDescription && (
                  <div className="mt-4 space-y-3">
                    {recipe.detailedDescription.split('\n').map((paragraph: string, index: number) => (
                      paragraph.trim() && (
                        <p key={index}>{paragraph}</p>
                      )
                    ))}
                  </div>
                )}
                
                {/* Recipe highlights */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="h-8 w-8 text-fresh-green mx-auto mb-2" />
                    <div className="font-semibold text-gray-800">{recipe.cookTime} min</div>
                    <div className="text-sm text-gray-600">Tempo de preparo</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Users className="h-8 w-8 text-warm-orange mx-auto mb-2" />
                    <div className="font-semibold text-gray-800">{recipe.servings} pessoas</div>
                    <div className="text-sm text-gray-600">Rendimento</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-800">{recipe.difficulty}</div>
                    <div className="text-sm text-gray-600">Dificuldade</div>
                  </div>
                </div>
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

          {/* Hashtags Section */}
          {Array.isArray(recipe.hashtags) && recipe.hashtags.length > 0 && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Tags da Receita
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.hashtags.map((hashtag: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-fresh-green/10 text-fresh-green hover:bg-fresh-green/20"
                    >
                      {hashtag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Recipes */}
          {relatedRecipes && relatedRecipes.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Receitas Relacionadas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedRecipes.slice(0, 6).map((relatedRecipe) => (
                  <RecipeCard 
                    key={relatedRecipe.id} 
                    recipe={relatedRecipe}
                    onCategoryClick={navigateWithCategoryFilter}
                    onSubcategoryClick={navigateWithSubcategoryFilter}
                    onHashtagClick={navigateWithHashtagFilter}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-fresh-green">Receita Rápida</h3>
              <p className="text-gray-300">
                Seu blog automatizado de receitas rápidas e saudáveis. Descubra novos sabores todos os dias.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/" className="hover:text-fresh-green transition-colors duration-200">Início</Link></li>
                <li><a href="#recipes" className="hover:text-fresh-green transition-colors duration-200">Receitas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Siga-nos</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-fresh-green transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-fresh-green transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.748.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.163-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.750-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-fresh-green transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Receita Rápida. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}