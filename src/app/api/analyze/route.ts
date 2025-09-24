import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Função para converter o buffer da imagem para base64
function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// O prompt que instrui a IA sobre como analisar a imagem
const SYSTEM_PROMPT = `Você é um especialista em UX/UI e design de interfaces. Sua tarefa é analisar a imagem de um protótipo de aplicativo ou site. 
Forneça uma crítica construtiva e detalhada, focando nos seguintes pontos:
1.  **Primeiras Impressões:** Qual é a sua impressão geral da interface?
2.  **Clareza e Usabilidade:** A interface é intuitiva? Os elementos são fáceis de entender e usar?
3.  **Hierarquia Visual:** A informação está bem organizada? Os elementos mais importantes se destacam?
4.  **Consistência:** O design é consistente em toda a tela (cores, fontes, espaçamento)?
5.  **Acessibilidade:** O contraste das cores é adequado? Os textos são legíveis? Os alvos de clique são grandes o suficiente?
6.  **Sugestões de Melhoria:** Ofereça sugestões claras e acionáveis para cada ponto problemático identificado.

Formate sua resposta usando markdown para melhor legibilidade. Use títulos, listas e negrito para organizar a análise. A resposta deve ser em português do Brasil.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const provider = formData.get("provider") as "openai" | "google";
    const apiKey = formData.get("apiKey") as string;

    if (!imageFile || !provider || !apiKey) {
      return NextResponse.json({ error: "Faltando parâmetros necessários." }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageMimeType = imageFile.type;
    
    let analysisText: string | null = null;

    if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      const imageBase64 = bufferToBase64(imageBuffer, imageMimeType);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: SYSTEM_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });
      analysisText = response.choices[0].message.content;

    } else if (provider === "google") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: imageMimeType,
        },
      };

      const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
      const response = result.response;
      analysisText = response.text();
    }

    if (!analysisText) {
      return NextResponse.json({ error: "Não foi possível obter a análise da IA." }, { status: 500 });
    }

    return NextResponse.json({ analysis: analysisText });

  } catch (error: any) {
    console.error("Erro na API de análise:", error);
    // Retorna uma mensagem de erro mais amigável para o cliente
    const errorMessage = error.response?.data?.error?.message || error.message || "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: `Erro ao processar a análise: ${errorMessage}` }, { status: 500 });
  }
}