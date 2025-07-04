import { Clock } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.imageUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-6">
        <h4 className="text-xl font-semibold text-gray-800 mb-3">
          {recipe.title}
        </h4>
        <p className="text-medium-gray mb-4 text-sm line-clamp-3">
          {recipe.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-medium-gray">
            <Clock className="h-4 w-4 mr-1" />
            <span>{recipe.cookTime} min</span>
          </div>
          <Link href={`/receita/${recipe.slug}`}>
            <Button 
              size="sm"
              className="bg-fresh-green text-white hover:bg-dark-green transition-colors duration-200"
            >
              Leia Mais
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
