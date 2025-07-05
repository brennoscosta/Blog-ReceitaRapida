import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { RecipeCard } from "@/components/RecipeCard";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import type { Recipe } from "@shared/schema";

export default function Home() {
  const [activeFilters, setActiveFilters] = useState<{
    category?: string;
    subcategory?: string;
    hashtag?: string;
  }>({});

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Filtrar receitas baseado nos filtros ativos
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    
    return recipes.filter(recipe => {
      if (activeFilters.category && recipe.category !== activeFilters.category) {
        return false;
      }
      if (activeFilters.subcategory && recipe.subcategory !== activeFilters.subcategory) {
        return false;
      }
      if (activeFilters.hashtag && !Array.isArray(recipe.hashtags)) {
        return false;
      }
      if (activeFilters.hashtag && !(recipe.hashtags as string[])?.includes(activeFilters.hashtag)) {
        return false;
      }
      return true;
    });
  }, [recipes, activeFilters]);

  const handleCategoryFilter = (category: string) => {
    setActiveFilters(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category,
      subcategory: undefined // Limpar subcategoria ao mudar categoria
    }));
  };

  const handleSubcategoryFilter = (subcategory: string) => {
    setActiveFilters(prev => ({
      ...prev,
      subcategory: prev.subcategory === subcategory ? undefined : subcategory
    }));
  };

  const handleHashtagFilter = (hashtag: string) => {
    setActiveFilters(prev => ({
      ...prev,
      hashtag: prev.hashtag === hashtag ? undefined : hashtag
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  const hasActiveFilters = Object.values(activeFilters).some(filter => filter !== undefined);

  const scrollToRecipes = () => {
    const recipesSection = document.getElementById('recipes');
    if (recipesSection) {
      recipesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <div 
          className="relative text-white py-20 overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(135deg, rgba(76, 175, 80, 0.92) 0%, rgba(56, 142, 60, 0.90) 50%, rgba(46, 125, 50, 0.88) 100%),
              url('https://nuvee.s3.us-east-2.amazonaws.com/receita-salada-de-gr-o-de-bico-com-tomate-e-manjeric-o.webp')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="fill-white">
              <g fillOpacity="0.3">
                <circle cx="15" cy="15" r="2"/>
                <circle cx="45" cy="15" r="2"/>
                <circle cx="30" cy="30" r="2"/>
                <circle cx="15" cy="45" r="2"/>
                <circle cx="45" cy="45" r="2"/>
              </g>
            </svg>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-10 left-10 opacity-20 animate-pulse">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
          </div>
          <div className="absolute top-20 right-20 opacity-15 animate-pulse delay-1000">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl">🍳</span>
            </div>
          </div>
          <div className="absolute bottom-20 left-20 opacity-10 animate-pulse delay-500">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-lg">🥄</span>
            </div>
          </div>
          <div className="absolute bottom-32 right-16 opacity-20 animate-pulse delay-1500">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <span className="text-lg">🌿</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              Receitas Rápidas & Deliciosas
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-md">
              Descubra pratos saudáveis e saborosos criados automaticamente para facilitar seu dia a dia na cozinha
            </p>
            <Button 
              onClick={scrollToRecipes}
              size="lg"
              className="bg-warm-orange hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Explorar Receitas
            </Button>
          </div>
        </div>

        {/* Latest Recipes */}
        <div id="recipes" className="py-16 bg-light-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-8">
              {hasActiveFilters ? 'Receitas Filtradas' : 'Últimas Receitas'}
            </h3>

            {/* Filtros Ativos */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-3 justify-center mb-8">
                <Filter className="h-4 w-4 text-fresh-green" />
                <span className="text-sm font-medium text-gray-600">Filtros ativos:</span>
                
                {activeFilters.category && (
                  <Badge 
                    variant="default"
                    className="bg-fresh-green text-white cursor-pointer hover:bg-dark-green"
                    onClick={() => handleCategoryFilter(activeFilters.category!)}
                  >
                    {activeFilters.category}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                
                {activeFilters.subcategory && (
                  <Badge 
                    variant="outline"
                    className="border-fresh-green text-fresh-green cursor-pointer hover:bg-fresh-green hover:text-white"
                    onClick={() => handleSubcategoryFilter(activeFilters.subcategory!)}
                  >
                    {activeFilters.subcategory}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                
                {activeFilters.hashtag && (
                  <Badge 
                    variant="secondary"
                    className="bg-warm-orange text-white cursor-pointer hover:bg-orange-600"
                    onClick={() => handleHashtagFilter(activeFilters.hashtag!)}
                  >
                    {activeFilters.hashtag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-medium-gray hover:text-gray-800 hover:bg-gray-100"
                >
                  Limpar todos
                </Button>
              </div>
            )}
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6">
                      <Skeleton className="h-6 mb-3" />
                      <Skeleton className="h-4 mb-4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRecipes && filteredRecipes.length > 0 ? (
              <>
                <div className="text-center mb-6 text-medium-gray">
                  Mostrando {filteredRecipes.length} de {recipes?.length || 0} receitas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe}
                      onCategoryClick={handleCategoryFilter}
                      onSubcategoryClick={handleSubcategoryFilter}
                      onHashtagClick={handleHashtagFilter}
                    />
                  ))}
                </div>
              </>
            ) : hasActiveFilters ? (
              <div className="text-center py-12">
                <p className="text-lg text-medium-gray mb-4">
                  Nenhuma receita encontrada com os filtros selecionados.
                </p>
                <Button 
                  onClick={clearAllFilters}
                  className="bg-fresh-green hover:bg-dark-green text-white"
                >
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-medium-gray mb-4">
                  Nenhuma receita encontrada. Seja o primeiro a criar uma!
                </p>
                <Button 
                  onClick={() => window.location.href = "/admin"}
                  className="bg-fresh-green hover:bg-dark-green text-white"
                >
                  Criar Primeira Receita
                </Button>
              </div>
            )}
          </div>
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
                <li><a href="#home" className="hover:text-fresh-green transition-colors duration-200">Início</a></li>
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
