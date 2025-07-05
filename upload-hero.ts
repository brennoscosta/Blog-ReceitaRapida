import OpenAI from "openai";
import { compressAndUploadImage } from "./server/s3Upload";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function uploadHeroImage() {
  try {
    console.log("🎨 Gerando imagem de background...");
    
    // Gerar imagem com OpenAI
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: "Beautiful modern kitchen with fresh vegetables, herbs, cooking utensils, natural lighting, professional food photography, clean and minimalist style",
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url!;
    console.log("📷 Imagem gerada:", imageUrl);

    // Baixar a imagem
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Fazer upload para S3
    const result = await compressAndUploadImage(imageBuffer, "hero-kitchen-background");
    
    console.log("✅ Upload concluído:", result.url);
    console.log("📊 Compressão:", `${(result.originalSize / 1024).toFixed(1)}KB → ${(result.compressedSize / 1024).toFixed(1)}KB`);
    
    return result.url;
  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  }
}

uploadHeroImage();