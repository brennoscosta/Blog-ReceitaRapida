import OpenAI from "openai";
import { compressAndUploadImage } from "./server/s3Upload";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createHeroBackground() {
  console.log("🎨 Gerando imagem de background para hero...");
  
  const response = await openai.images.generate({
    model: "dall-e-2",
    prompt: "Modern kitchen counter with fresh vegetables, herbs, wooden cutting board, cooking utensils, soft natural lighting, clean minimalist aesthetic, professional food photography, wide angle view",
    n: 1,
    size: "1024x1024",
  });

  const imageUrl = response.data[0].url!;
  console.log("📷 Imagem gerada:", imageUrl);

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const result = await compressAndUploadImage(imageBuffer, "hero-kitchen-background");
  
  console.log("✅ Background salvo:", result.url);
  console.log("📊 Tamanho:", `${Math.round(result.originalSize/1024)}KB → ${Math.round(result.compressedSize/1024)}KB`);
  
  return result.url;
}

createHeroBackground().then(url => {
  console.log("🎉 URL final:", url);
}).catch(console.error);