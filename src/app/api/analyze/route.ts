import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Função para converter o buffer da imagem para base64
function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// O prompt que instrui a IA sobre como analisar a imagem
const SYSTEM_PROMPT = `Você é um especialista sênior em Design de Produto e UX/UI, com um olhar crítico e detalhista. Sua tarefa é analisar a imagem de um protótipo e fornecer uma crítica construtiva e acionável, retornando suas descobertas como um array JSON.

**Formato de Saída Obrigatório:**
Sua resposta DEVE ser um array JSON válido. Cada objeto no array representa um ponto de análise e deve conter os seguintes campos:
- "category": (string) A categoria do problema. Deve ser estritamente "UI" (Interface do Usuário) ou "UX" (Experiência do Usuário).
- "issue": (string) Uma descrição clara e concisa do problema identificado. Seja específico sobre qual componente ou área da tela apresenta o problema.
- "suggestion": (string) Uma sugestão de melhoria **extremamente detalhada e prática**. A sugestão deve ser um guia passo a passo para um designer ou desenvolvedor. **Obrigatoriamente, inclua detalhes sobre:**
    - **Cores:** Sugira cores específicas com códigos hexadecimais (ex: #1A202C para texto, #4A90E2 para botões).
    - **Espaçamento e Layout:** Recomende espaçamentos consistentes (ex: "aumentar o padding vertical para 16px", "usar um espaçamento de 8px entre os ícones").
    - **Tipografia:** Detalhe melhorias na hierarquia (ex: "aumentar o peso da fonte do título para 'semibold'", "definir o corpo do texto com 16px").
    - **Ícones:** Se aplicável, sugira ícones específicos para melhorar a clareza e a usabilidade (ex: "usar o ícone 'check-circle' da biblioteca Lucide para confirmação").
    - **Microinterações:** Descreva pequenas animações ou feedbacks visuais (ex: "ao passar o mouse, o botão deve ter uma leve sombra e transição de cor").
    - Use quebras de linha (\\n) para formatar a sugestão em parágrafos claros e legíveis.
- "reference": (string) Explique detalhadamente o princípio de design ou heurística de usabilidade que fundamenta sua sugestão. Não apenas nomeie o princípio, mas explique **como ele se aplica** ao problema em questão (ex: "Lei de Fitts: Aumentar o tamanho do botão o torna um alvo mais fácil e rápido de clicar, reduzindo o esforço do usuário.").

**Diretrizes:**
- Identifique entre 3 a 5 dos problemas mais impactantes.
- A resposta deve ser em português do Brasil.
- Seja direto, profissional e didático em suas explicações.

**Exemplo de Saída JSON:**
[
  {
    "category": "UI",
    "issue": "O botão de ação principal ('Salvar Alterações') não tem destaque visual suficiente, misturando-se com outros elementos secundários.",
    "suggestion": "Para dar ao botão o destaque que ele merece, devemos aplicar várias melhorias:\\n\\n1. **Cor e Contraste:** Altere a cor de fundo para um azul vibrante, como #4F46E5, e o texto para branco (#FFFFFF). Isso cria um contraste forte que atende às diretrizes de acessibilidade (WCAG AA).\\n2. **Tamanho e Espaçamento:** Aumente o padding vertical para 12px e o horizontal para 24px para criar uma área de clique maior e mais confortável.\\n3. **Ícone:** Adicione um ícone de 'save' (da biblioteca Lucide) à esquerda do texto, com um espaçamento de 8px entre eles, para reforçar visualmente a ação.\\n4. **Microinteração:** Ao passar o mouse, o botão deve ter uma transição suave para uma cor de fundo ligeiramente mais escura (#4338CA) e uma leve elevação com 'box-shadow'.",
    "reference": "Princípio da Hierarquia Visual: Elementos mais importantes em uma interface devem se destacar visualmente. Ao tornar o botão de ação principal mais proeminente, guiamos o usuário para a ação mais desejada, tornando a interface mais intuitiva e eficiente."
  },
  {
    "category": "UX",
    "issue": "O formulário não fornece feedback imediato sobre a validação dos campos, deixando o usuário incerto se os dados estão corretos.",
    "suggestion": "Implemente a validação em tempo real para melhorar a experiência do usuário:\\n\\n1. **Feedback Visual:** Quando o usuário preenche um campo corretamente, exiba um ícone de 'check-circle' verde ao lado do campo. Se houver um erro, mostre um ícone de 'alert-circle' vermelho e uma borda vermelha no campo.\\n2. **Mensagens de Erro Claras:** Abaixo do campo com erro, exiba uma mensagem de texto clara e útil em vermelho (ex: #DC2626), como 'Por favor, insira um e-mail válido.'\\n3. **Desabilitar Botão:** Mantenha o botão 'Salvar' desabilitado até que todos os campos obrigatórios sejam preenchidos corretamente. Isso previne envios inválidos e frustração.",
    "reference": "Visibilidade do Status do Sistema (1ª Heurística de Nielsen): A interface deve sempre manter os usuários informados sobre o que está acontecendo, através de feedback apropriado e em tempo hábil. A validação em tempo real informa o usuário sobre o sucesso ou falha de suas entradas, dando-lhes controle e confiança."
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
        max_tokens: 2000, // Aumentado para permitir respostas mais detalhadas
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