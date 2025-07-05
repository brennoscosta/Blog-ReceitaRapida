import AWS from 'aws-sdk';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

// Configurar AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'receita-rapida-images';

interface ImageUploadResult {
  url: string;
  key: string;
  compressedSize: number;
  originalSize: number;
}

/**
 * Comprime uma imagem e faz upload para S3
 * @param imageBuffer Buffer da imagem original
 * @param fileName Nome do arquivo (opcional)
 * @returns URL da imagem no S3 e informações de compressão
 */
export async function compressAndUploadImage(
  imageBuffer: Buffer,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    const originalSize = imageBuffer.length;
    
    // Gerar nome único se não fornecido
    const key = fileName || `recipe-${nanoid()}.webp`;
    
    // Comprimir imagem usando Sharp
    const compressedBuffer = await sharp(imageBuffer)
      .resize(800, 600, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality: 80,
        effort: 6
      })
      .toBuffer();

    const compressedSize = compressedBuffer.length;

    // Upload para S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: compressedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'max-age=31536000', // Cache por 1 ano
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    console.log(`✅ Imagem comprimida e enviada para S3:`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Comprimida: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(`   Economia: ${(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%`);

    return {
      url: uploadResult.Location,
      key: uploadResult.Key,
      compressedSize,
      originalSize
    };

  } catch (error) {
    console.error('❌ Erro ao comprimir e enviar imagem para S3:', error);
    throw new Error(`Falha no upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Baixa uma imagem de URL, comprime e faz upload para S3
 * @param imageUrl URL da imagem para baixar
 * @param fileName Nome do arquivo (opcional)
 * @returns URL da imagem no S3
 */
export async function downloadCompressAndUpload(
  imageUrl: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    console.log(`📥 Baixando imagem de: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await compressAndUploadImage(buffer, fileName);

  } catch (error) {
    console.error('❌ Erro ao baixar e processar imagem:', error);
    throw new Error(`Falha no processamento da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Verifica se o bucket S3 está configurado corretamente
 */
export async function checkS3Configuration(): Promise<boolean> {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`✅ Bucket S3 "${BUCKET_NAME}" está acessível`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao acessar bucket S3 "${BUCKET_NAME}":`, error instanceof Error ? error.message : 'Erro desconhecido');
    return false;
  }
}

/**
 * Remove uma imagem do S3
 * @param key Chave da imagem no S3
 */
export async function deleteImageFromS3(key: string): Promise<void> {
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
    console.log(`🗑️ Imagem removida do S3: ${key}`);
  } catch (error) {
    console.error('❌ Erro ao remover imagem do S3:', error);
    throw error;
  }
}