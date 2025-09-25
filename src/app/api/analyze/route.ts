import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Função para converter o buffer da imagem para base64
function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// O prompt base que instrui a IA sobre como analisar a imagem
const BASE_SYSTEM_PROMPT = `Você é um especialista sênior em Design de Produto e UX/UI. Sua tarefa é analisar a imagem de um protótipo de interface e fornecer críticas construtivas.

**METODOLOGIA DE AVALIAÇÃO:**
Baseie sua análise nos seguintes princípios:
1.  **Heurísticas de Nielsen:** Foco em usabilidade, consistência, feedback ao usuário e prevenção de erros.
2.  **Princípios de Design Visual:** Avalie hierarquia, contraste, alinhamento, repetição e proximidade.
3.  **Leis de UX:** Considere como as leis de Fitts, Miller e Hick se aplicam à interface.
4.  **Acessibilidade (WCAG):** Verifique o contraste de cores e a clareza da tipografia.

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Sua resposta DEVE ser um array JSON contendo de 3 a 5 objetos. Não inclua nenhum texto ou formatação fora do array JSON (como \`\`\`json).

Cada objeto no array deve ter a seguinte estrutura:
{
  "category": "UI" | "UX",
  "issue": "Uma descrição clara e concisa do problema identificado.",
  "suggestion": "Uma sugestão prática e acionável para resolver o problema.",
  "reference": "O princípio ou heurística de design que fundamenta sua sugestão (ex: 'Heurística de Nielsen: Consistência e Padrões')."
}

**DIRETRIZES:**
- **Seja Direto:** Foque nos pontos mais impactantes.
- **Linguagem Clara:** Use termos que um designer ou desenvolvedor possa entender e aplicar facilmente.
- **Foco em UI e UX:** Classifique cada ponto como 'UI' (relacionado à aparência visual e layout) ou 'UX' (relacionado à experiência do usuário e usabilidade).

**EXEMPLO DE SAÍDA:**
[
  {
    "category": "UI",
    "issue": "O contraste entre o texto do botão principal e seu fundo é baixo, dificultando a leitura.",
    "suggestion": "Aumente o contraste para atender às diretrizes WCAG AA (pelo menos 4.5:1). Por exemplo, use um texto mais escuro ou um fundo mais claro para o botão.",
    "reference": "WCAG 2.1 - Contraste Mínimo"
  },
  {
    "category": "UX",
    "issue": "A falta de um estado 'vazio' claro na lista de itens pode confundir novos usuários.",
    "suggestion": "Implemente uma mensagem de estado vazio com um ícone e um texto explicativo, como 'Nenhum item adicionado ainda. Clique em + para começar'.",
    "reference": "Heurística de Nielsen: Ajuda e Documentação"
  }
]

Analise a imagem fornecida e retorne APENAS o array JSON.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const provider = formData.get("provider") as "openai" | "google";
    const apiKey = formData.get("apiKey") as string;
    const context = formData.get("context") as string | null;

    if (!imageFile || !provider || !apiKey) {
      return NextResponse.json({ error: "Faltando parâmetros necessários." }, { status: 400 });
    }

    let finalSystemPrompt = BASE_SYSTEM_PROMPT;
    if (context && context.trim() !== "") {
      finalSystemPrompt = `**Contexto Fornecido pelo Usuário:**\n"${context}"\n\nCom base no contexto acima, analise a imagem a seguir, seguindo as instruções abaixo.\n\n---\n\n${BASE_SYSTEM_PROMPT}`;
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
              { type: "text", text: finalSystemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
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

      const result = await model.generateContent([finalSystemPrompt, imagePart]);
      const response = result.response;
      analysisText = response.text();
    }

    if (!analysisText) {
      return NextResponse.json({ error: "Não foi possível obter a análise da IA." }, { status: 500 });
    }

    // A resposta da OpenAI com response_format: "json_object" já é um JSON string.
    // Para o Google, ainda pode vir com markdown.
    const cleanedJsonString = analysisText.replace(/```json\n|```/g, '').trim();

    // Se a resposta da OpenAI for um objeto JSON com uma chave (ex: {"analysis": [...]}), extraímos o array.
    try {
      const parsed = JSON.parse(cleanedJsonString);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
           return NextResponse.json({ analysis: JSON.stringify(parsed[keys[0]]) });
        }
      }
    } catch (e) {
      // Ignora o erro se não for um JSON, e continua para a resposta normal
    }

    return NextResponse.json({ analysis: cleanedJsonString });

  } catch (error: any) {
    console.error("Erro na API de análise:", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: `Erro ao processar a análise: ${errorMessage}` }, { status: 500 });
  }
}