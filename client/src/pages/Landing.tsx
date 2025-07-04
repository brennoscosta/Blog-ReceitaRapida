import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { RecipeCard } from "@/components/RecipeCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Recipe } from "@shared/schema";

export default function Landing() {
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

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
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-[#05a13a]">
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
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Últimas Receitas
            </h3>
            
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
            ) : recipes && recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-medium-gray mb-4">
                  Nenhuma receita encontrada ainda.
                </p>
                <p className="text-sm text-medium-gray mb-6">
                  Nosso blog automatizado cria receitas deliciosas usando inteligência artificial.
                </p>
                <Link href="/auth">
                  <Button 
                    className="bg-fresh-green hover:bg-dark-green text-white"
                  >
                    Acesso Administrativo
                  </Button>
                </Link>
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
                  <i className="fab fa-facebook-f text-xl"></i>
                </a>
                <a href="#" className="text-gray-300 hover:text-fresh-green transition-colors duration-200">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a href="#" className="text-gray-300 hover:text-fresh-green transition-colors duration-200">
                  <i className="fab fa-youtube text-xl"></i>
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
