import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

// Configuração do cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'receita-rapida-images';
const CDN_URL = process.env.AWS_CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

interface ImageUploadOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export class S3ImageService {
  /**
   * Comprime e faz upload de uma imagem para o S3
   */
  static async uploadImage(
    imageBuffer: Buffer,
    originalName: string,
    options: ImageUploadOptions = {}
  ): Promise<string> {
    try {
      const {
        width = 800,
        height = 600,
        quality = 85
      } = options;

      // Gerar nome único para o arquivo
      const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `recipes/${nanoid()}.${fileExtension}`;

      // Comprimir a imagem usando Sharp
      const compressedImageBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality })
        .toBuffer();

      // Upload para S3
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: compressedImageBuffer,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000', // Cache por 1 ano
        Metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(uploadCommand);

      // Retornar URL da imagem
      return `${CDN_URL}/${fileName}`;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error('Falha no upload da imagem');
    }
  }

  /**
   * Remove uma imagem do S3
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extrair o nome do arquivo da URL
      const fileName = imageUrl.replace(`${CDN_URL}/`, '');

      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      });

      await s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw new Error('Falha ao deletar imagem');
    }
  }

  /**
   * Gera uma imagem automaticamente usando DALL-E 2 e faz upload para S3
   */
  static async generateAndUploadRecipeImage(recipeTitle: string): Promise<string> {
    try {
      // Importar o generateRecipeImage do openai.ts
      const { generateRecipeImage } = await import('./openai');
      
      // Gerar imagem usando DALL-E 2
      const imageUrl = await generateRecipeImage(recipeTitle);
      
      // Baixar a imagem gerada
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Falha ao baixar imagem gerada');
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      // Comprimir e fazer upload para S3
      const s3ImageUrl = await this.uploadImage(
        imageBuffer, 
        `${recipeTitle.replace(/[^a-zA-Z0-9]/g, '-')}.jpg`,
        {
          width: 1024,
          height: 768,
          quality: 90
        }
      );
      
      return s3ImageUrl;
    } catch (error) {
      console.error('Erro ao gerar e fazer upload da imagem:', error);
      // Retornar uma imagem padrão caso falhe
      return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&h=768';
    }
  }

  /**
   * Faz upload de múltiplas variações de uma imagem (thumbnails)
   */
  static async uploadMultipleSizes(
    imageBuffer: Buffer,
    originalName: string
  ): Promise<{ original: string; thumbnail: string; medium: string }> {
    try {
      const baseFileName = originalName.split('.')[0];
      
      // Upload da imagem original (redimensionada)
      const original = await this.uploadImage(imageBuffer, `${baseFileName}-original.jpg`, {
        width: 1024,
        height: 768,
        quality: 90
      });

      // Upload do thumbnail
      const thumbnail = await this.uploadImage(imageBuffer, `${baseFileName}-thumb.jpg`, {
        width: 300,
        height: 225,
        quality: 80
      });

      // Upload da versão média
      const medium = await this.uploadImage(imageBuffer, `${baseFileName}-medium.jpg`, {
        width: 600,
        height: 450,
        quality: 85
      });

      return { original, thumbnail, medium };
    } catch (error) {
      console.error('Erro ao fazer upload de múltiplos tamanhos:', error);
      throw new Error('Falha no upload das variações da imagem');
    }
  }
}

export default S3ImageService;