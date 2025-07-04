import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChefHat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/busca?q=${encodeURIComponent(searchQuery.trim())}`;
    }
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
          
          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar receitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-l-md focus:ring-fresh-green focus:border-fresh-green"
                />
              </div>
              <Button 
                type="submit"
                className="bg-fresh-green hover:bg-dark-green text-white px-4 py-2 rounded-r-md rounded-l-none"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

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
              <Link href="/auth">
                <Button 
                  className="bg-fresh-green text-white hover:bg-dark-green"
                >
                  Admin
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => {
                  fetch("/api/logout", { method: "POST" })
                    .then(() => {
                      window.location.href = "/";
                    });
                }}
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
                <Link href="/auth">
                  <Button 
                    className="bg-fresh-green text-white hover:bg-dark-green w-fit"
                  >
                    Admin
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => {
                    fetch("/api/logout", { method: "POST" })
                      .then(() => {
                        window.location.href = "/";
                      });
                  }}
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
