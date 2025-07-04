import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "wouter";

export default function Landing() {
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

        {/* Welcome Section */}
        <div id="recipes" className="py-16 bg-light-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-6">
              Bem-vindo ao Receita Rápida
            </h3>
            <p className="text-lg text-medium-gray mb-8 max-w-2xl mx-auto">
              Nosso blog automatizado cria receitas deliciosas e saudáveis usando inteligência artificial. 
              Faça login como administrador para começar a gerar conteúdo automaticamente.
            </p>
            <Link href="/auth">
              <Button 
                size="lg"
                className="bg-fresh-green hover:bg-dark-green text-white"
              >
                Fazer Login
              </Button>
            </Link>
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
