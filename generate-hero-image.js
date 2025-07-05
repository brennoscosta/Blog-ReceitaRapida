import { generateRecipeImage } from './server/openai.js';
import { compressAndUploadImage } from './server/s3Upload.js';

async function generateHeroBackground() {
  try {
    console.log('🎨 Gerando imagem de background para hero section...');
    
    // Gerar uma imagem de cozinha profissional
    const imageUrl = await generateRecipeImage("Beautiful modern kitchen with fresh vegetables, herbs, cooking utensils, natural lighting, professional food photography, clean and minimalist style");
    
    console.log('✅ Imagem de background gerada:', imageUrl);
    
    // Baixar a imagem e fazer upload para S3 com nome específico
    const response = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    const s3Result = await compressAndUploadImage(imageBuffer, 'hero-kitchen-background');
    
    console.log('📸 Imagem salva no S3:', s3Result.url);
    console.log('📊 Compressão:', s3Result.originalSize, '→', s3Result.compressedSize);
    
    return s3Result.url;
  } catch (error) {
    console.error('❌ Erro ao gerar imagem de background:', error);
    throw error;
  }
}

generateHeroBackground().then(url => {
  console.log('🎉 Background URL final:', url);
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha:', error);
  process.exit(1);
});