import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Wand2, Edit, Trash2, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Recipe } from "@shared/schema";

const generateRecipeSchema = z.object({
  recipeIdea: z.string().min(1, "Ideia da receita é obrigatória"),
});

type GenerateRecipeData = z.infer<typeof generateRecipeSchema>;

export default function AdminPanel() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);

  const form = useForm<GenerateRecipeData>({
    resolver: zodResolver(generateRecipeSchema),
    defaultValues: {
      recipeIdea: "",
    },
  });

  const { data: recipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    enabled: isAuthenticated,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateRecipeData) => {
      const response = await apiRequest("POST", "/api/recipes/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedRecipe(data);
      toast({
        title: "Receita gerada com sucesso!",
        description: "Revise o conteúdo antes de publicar.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro ao gerar receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (recipeData: any) => {
      const response = await apiRequest("POST", "/api/recipes", recipeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Receita publicada!",
        description: "A receita foi publicada com sucesso.",
      });
      setGeneratedRecipe(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro ao publicar receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Receita excluída",
        description: "A receita foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro ao excluir receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const onSubmit = (data: GenerateRecipeData) => {
    generateMutation.mutate(data);
  };

  const publishRecipe = () => {
    if (generatedRecipe) {
      publishMutation.mutate(generatedRecipe);
    }
  };

  const discardRecipe = () => {
    setGeneratedRecipe(null);
    form.reset();
  };

  const deleteRecipe = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) {
      deleteMutation.mutate(id);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">Carregando...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead title="Painel Administrativo - Receita Rápida" />
      <Header />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel Administrativo</h1>
            <p className="text-medium-gray">Gere novas receitas automaticamente usando IA</p>
          </div>

          {/* Main Admin Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">
                Gerar Nova Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Input for recipe idea */}
                  <FormField
                    control={form.control}
                    name="recipeIdea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ideia da Receita</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: bolo de cenoura saudável"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-medium-gray">
                          Digite uma frase curta descrevendo a receita que deseja gerar
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Info about automatic generation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-blue-800">
                          Geração Automática Inteligente
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>A IA calculará automaticamente:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li><strong>Tempo de preparo:</strong> baseado na complexidade real da receita</li>
                            <li><strong>Nível de dificuldade:</strong> determinado pelos ingredientes e técnicas</li>
                            <li><strong>Hashtags:</strong> 5 tags relevantes para categorização</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    type="submit"
                    className="w-full bg-fresh-green hover:bg-dark-green text-white py-4"
                    disabled={generateMutation.isPending}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {generateMutation.isPending ? "Gerando..." : "Gerar Receita Automaticamente"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Generated Content Preview */}
          {generatedRecipe && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Prévia da Receita Gerada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-2">{generatedRecipe.title}</h4>
                    <p className="text-gray-600 mb-2">{generatedRecipe.description}</p>
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>Dificuldade: {generatedRecipe.difficulty}</span>
                      <span>Tempo: {generatedRecipe.cookTime} min</span>
                      <span>Porções: {generatedRecipe.servings}</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <Eye className="h-4 w-4 inline mr-2" />
                      Esta é uma prévia. O conteúdo completo inclui ingredientes, modo de preparo, dicas e otimização SEO.
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={publishRecipe}
                    className="bg-fresh-green hover:bg-dark-green text-white"
                    disabled={publishMutation.isPending}
                  >
                    {publishMutation.isPending ? "Publicando..." : "Publicar Receita"}
                  </Button>
                  <Button
                    onClick={discardRecipe}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Descartar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Posts Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Gerenciar Receitas Existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipes && recipes.length > 0 ? (
                <div className="space-y-4">
                  {recipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center justify-between p-4 bg-light-gray rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{recipe.title}</h4>
                        <p className="text-sm text-medium-gray">URL: /receita/{recipe.slug}</p>
                        <p className="text-sm text-medium-gray">
                          Criado em: {new Date(recipe.createdAt!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/receita/${recipe.slug}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500 text-blue-500 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => deleteRecipe(recipe.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-medium-gray">Nenhuma receita encontrada.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to Homepage */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="ghost" className="text-fresh-green hover:text-dark-green">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Site
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
