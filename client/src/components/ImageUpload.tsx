import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUploaded?: (imageUrl: string) => void;
  currentImageUrl?: string;
  disabled?: boolean;
}

export function ImageUpload({ onImageUploaded, currentImageUrl, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload da imagem');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPreview(data.imageUrl);
      onImageUploaded?.(data.imageUrl);
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Fazer upload
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || uploadMutation.isPending) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploadMutation.isPending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUploaded?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Imagem da Receita</h3>
            {preview && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                disabled={disabled || uploadMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Remover
              </Button>
            )}
          </div>

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview da imagem"
                className="w-full h-48 object-cover rounded-lg border"
              />
              {uploadMutation.isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-sm">Enviando...</div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                ${disabled || uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400'}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && !uploadMutation.isPending && fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {uploadMutation.isPending 
                  ? "Enviando imagem..." 
                  : "Arraste uma imagem aqui ou clique para selecionar"
                }
              </p>
              <p className="text-sm text-gray-500">
                Formatos suportados: JPEG, PNG, WebP (máx. 10MB)
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || uploadMutation.isPending}
          />

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploadMutation.isPending}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? "Enviando..." : "Selecionar Imagem"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}