import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <ChefHat className="h-8 w-8 text-fresh-green mr-2" />
            <h1 className="text-2xl font-bold text-fresh-green">
              Receita Rápida
            </h1>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/"
              className={`transition-colors duration-200 ${
                isActive("/") 
                  ? "text-fresh-green font-semibold" 
                  : "text-gray-700 hover:text-fresh-green"
              }`}
            >
              Início
            </Link>
            <a 
              href="#recipes" 
              className="text-gray-700 hover:text-fresh-green transition-colors duration-200"
            >
              Receitas
            </a>
            {isAuthenticated && (
              <Link 
                href="/admin"
                className={`transition-colors duration-200 ${
                  isActive("/admin") 
                    ? "text-fresh-green font-semibold" 
                    : "text-gray-700 hover:text-fresh-green"
                }`}
              >
                Admin
              </Link>
            )}
            {!isAuthenticated ? (
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-fresh-green text-white hover:bg-dark-green"
              >
                Admin
              </Button>
            ) : (
              <Button 
                onClick={() => window.location.href = "/api/logout"}
                variant="outline"
                className="border-fresh-green text-fresh-green hover:bg-fresh-green hover:text-white"
              >
                Sair
              </Button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-fresh-green transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/"
                className={`transition-colors duration-200 ${
                  isActive("/") 
                    ? "text-fresh-green font-semibold" 
                    : "text-gray-700 hover:text-fresh-green"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Início
              </Link>
              <a 
                href="#recipes" 
                className="text-gray-700 hover:text-fresh-green transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Receitas
              </a>
              {isAuthenticated && (
                <Link 
                  href="/admin"
                  className={`transition-colors duration-200 ${
                    isActive("/admin") 
                      ? "text-fresh-green font-semibold" 
                      : "text-gray-700 hover:text-fresh-green"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {!isAuthenticated ? (
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-fresh-green text-white hover:bg-dark-green w-fit"
                >
                  Admin
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.href = "/api/logout"}
                  variant="outline"
                  className="border-fresh-green text-fresh-green hover:bg-fresh-green hover:text-white w-fit"
                >
                  Sair
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
