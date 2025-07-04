import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { RecipeCard } from "@/components/RecipeCard";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter } from "lucide-react";
import type { Recipe } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedHashtag, setSelectedHashtag] = useState<string>("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes", selectedCategory, selectedSubcategory],
  });

  const { data: categories } = useQuery<{categories: string[], subcategories: {[key: string]: string[]}}>({
    queryKey: ["/api/recipes/categories"],
  });

  // Filter recipes by hashtag when selectedHashtag changes
  useEffect(() => {
    if (!recipes) {
      setFilteredRecipes([]);
      return;
    }

    if (!selectedHashtag) {
      setFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter((recipe) => {
      const hashtags = recipe.hashtags as string[];
      return hashtags && hashtags.some((tag: string) => 
        tag.toLowerCase().includes(selectedHashtag.toLowerCase().replace('#', ''))
      );
    });
    setFilteredRecipes(filtered);
  }, [recipes, selectedHashtag]);

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    scrollToRecipes();
  };

  const handleCategoryClick = (category: string, subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || "");
    setSelectedHashtag(""); // Clear hashtag filter when filtering by category
    scrollToRecipes();
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedHashtag("");
  };

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
        <div className="bg-gradient-to-r from-fresh-green to-dark-green text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Receitas Rápidas & Deliciosas
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Descubra pratos saudáveis e saborosos criados automaticamente para facilitar seu dia a dia na cozinha
            </p>
            <Button 
              onClick={scrollToRecipes}
              size="lg"
              className="bg-warm-orange hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold"
            >
              Explorar Receitas
            </Button>
          </div>
        </div>

        {/* Latest Recipes */}
        <div id="recipes" className="py-16 bg-light-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-8">
              {selectedCategory || selectedHashtag ? "Receitas Filtradas" : "Últimas Receitas"}
            </h3>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-800">Filtros</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories?.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoria</label>
                  <Select 
                    value={selectedSubcategory} 
                    onValueChange={setSelectedSubcategory}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as subcategorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as subcategorias</SelectItem>
                      {selectedCategory && categories?.subcategories[selectedCategory]?.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                    disabled={!selectedCategory && !selectedSubcategory && !selectedHashtag}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedCategory || selectedSubcategory || selectedHashtag) && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Filtros ativos:</span>
                  {selectedCategory && (
                    <Badge variant="default" className="bg-fresh-green text-white">
                      {selectedCategory}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setSelectedCategory("")} 
                      />
                    </Badge>
                  )}
                  {selectedSubcategory && (
                    <Badge variant="default" className="bg-dark-green text-white">
                      {selectedSubcategory}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setSelectedSubcategory("")} 
                      />
                    </Badge>
                  )}
                  {selectedHashtag && (
                    <Badge variant="default" className="bg-blue-500 text-white">
                      {selectedHashtag}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setSelectedHashtag("")} 
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    onHashtagClick={handleHashtagClick}
                    onCategoryClick={handleCategoryClick}
                  />
                ))}
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
