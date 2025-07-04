import { Clock, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
  onHashtagClick?: (hashtag: string) => void;
  onCategoryClick?: (category: string, subcategory?: string) => void;
}

export function RecipeCard({ recipe, onHashtagClick, onCategoryClick }: RecipeCardProps) {
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
        {/* Categoria e Subcategoria */}
        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-fresh-green hover:text-white transition-colors"
            onClick={() => onCategoryClick?.(recipe.category)}
          >
            {recipe.category}
          </Badge>
          <span className="text-gray-400">•</span>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-fresh-green hover:text-white transition-colors"
            onClick={() => onCategoryClick?.(recipe.category, recipe.subcategory)}
          >
            {recipe.subcategory}
          </Badge>
        </div>

        <h4 className="text-xl font-semibold text-gray-800 mb-3">
          {recipe.title}
        </h4>
        <p className="text-medium-gray mb-4 text-sm line-clamp-3">
          {recipe.description || ''}
        </p>

        {/* Hashtags */}
        {recipe.hashtags && Array.isArray(recipe.hashtags) && recipe.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {recipe.hashtags.slice(0, 5).map((hashtag: string, index: number) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={() => onHashtagClick?.(hashtag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {hashtag}
              </Badge>
            ))}
            {recipe.hashtags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.hashtags.length - 5}
              </Badge>
            )}
          </div>
        )}

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
