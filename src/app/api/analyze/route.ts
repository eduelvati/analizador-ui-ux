import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Função para converter o buffer da imagem para base64
function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// O prompt que instrui a IA sobre como analisar a imagem
const SYSTEM_PROMPT = `Você é um especialista sênior em UX/UI. Sua tarefa é analisar a imagem de um protótipo e retornar suas descobertas como um array JSON.

**Formato de Saída Obrigatório:**
Sua resposta DEVE ser um array JSON válido. Cada objeto no array representa um ponto de análise e deve conter os seguintes campos:
- "category": (string) A categoria do problema. Deve ser estritamente "UI" ou "UX".
- "issue": (string) Uma descrição clara e concisa do problema identificado.
- "suggestion": (string) Uma sugestão prática e acionável para resolver o problema.
- "reference": (string) Uma breve explicação do princípio de design ou heurística que fundamenta sua sugestão (ex: "Lei de Hick", "Contraste e Acessibilidade (WCAG)", "Consistência Visual").

**Diretrizes:**
- Identifique entre 3 a 5 dos problemas mais impactantes.
- A resposta deve ser em português do Brasil.

**Exemplo de Saída JSON:**
[
  {
    "category": "UI",
    "issue": "O contraste de cor entre o texto do botão e seu fundo é baixo, dificultando a leitura.",
    "suggestion": "Aumente o contraste utilizando um branco mais puro (#FFFFFF) para o texto ou escurecendo o tom do fundo para atender às diretrizes WCAG AA.",
    "reference": "Contraste e Acessibilidade (WCAG)"
  },
  {
    "category": "UX",
    "issue": "Não há um feedback visual claro quando o usuário clica no botão 'Salvar'.",
    "suggestion": "Implemente um feedback imediato, como uma notificação de sucesso (toast) ou um ícone de carregamento no botão.",
    "reference": "Feedback do Sistema (1ª Heurística de Nielsen)"
  }
]

Analise a imagem fornecida e retorne APENAS o array JSON.`;

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
        max_tokens: 1500,
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
    const errorMessage = error.response?.data?.error?.message || error.message || "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: `Erro ao processar a análise: ${errorMessage}` }, { status: 500 });
  }
}