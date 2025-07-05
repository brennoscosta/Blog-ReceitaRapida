import OpenAI from "openai";
import { compressAndUploadImage } from "./server/s3Upload";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  try {
    console.log("🎨 Gerando imagem de fundo para hero...");
    
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: "Modern bright kitchen with fresh vegetables, herbs, wooden cutting boards, cooking utensils, natural lighting, food photography style, clean aesthetic",
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url!;
    console.log("📷 URL gerada:", imageUrl);

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const result = await compressAndUploadImage(imageBuffer, "hero-kitchen-background");
    
    console.log("✅ Salvo em:", result.url);
    console.log("📊", `${Math.round(result.originalSize/1024)}KB → ${Math.round(result.compressedSize/1024)}KB`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌", error);
    process.exit(1);
  }
}

main();