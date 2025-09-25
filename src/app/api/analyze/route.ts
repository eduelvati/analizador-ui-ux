import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Função para converter o buffer da imagem para base64
function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// O prompt base que instrui a IA sobre como analisar a imagem
const BASE_SYSTEM_PROMPT = `Você é um especialista sênior em Design de Produto e UX/UI com 10+ anos de experiência, especializado em Design Systems, Acessibilidade (WCAG 2.1 AA/AAA) e Metodologias Ágeis. Sua expertise abrange desde Research até implementação técnica.

**CONTEXTO DE ANÁLISE:**
Analise a imagem considerando:
- Persona primária e jornada do usuário
- Contexto de uso (mobile-first, desktop, PWA)
- Objetivos de negócio vs. necessidades do usuário
- Padrões de design system e consistência
- Acessibilidade e inclusão digital
- Performance e carregamento
- Escalabilidade da solução

**METODOLOGIA DE AVALIAÇÃO:**
Utilize um framework híbrido baseado em:
1. **Heurísticas de Nielsen** (10 princípios fundamentais)
2. **Princípios de Gestalt** (percepção visual)
3. **Leis de UX** (Fitts, Miller, Hick, etc.)
4. **WCAG Guidelines** (acessibilidade)
5. **Material Design 3** e **Human Interface Guidelines**
6. **Atomic Design** (consistência de componentes)

**FORMATO DE SAÍDA OBRIGATÓRIO:**
Array JSON com 3-7 insights priorizados por impacto. Estrutura por objeto:

{
  "priority": (number) 1-5 (5 = crítico, impacto imediato no usuário)
  "category": (string) "UI" | "UX" | "Accessibility" | "Performance" | "Business"
  "component": (string) Componente específico analisado (ex: "Header Navigation", "CTA Button", "Form Validation")
  "issue": (string) Descrição técnica e precisa do problema identificado
  "impact": (string) Consequência direta para o usuário e métricas de negócio
  "suggestion": (string) Solução detalhada com implementação técnica:
    • **Design Tokens:** Cores (#hex), tipografia (font-family, size, weight, line-height), espaçamentos (4px grid), elevações
    • **Implementação:** CSS properties, HTML semântico, ARIA labels
    • **Microinterações:** Estados (hover, focus, active, disabled), transições (duration, easing)
    • **Responsividade:** Breakpoints, adaptações mobile/tablet/desktop
    • **Acessibilidade:** Contraste mínimo (4.5:1), foco visível, navegação por teclado
    • **Performance:** Lazy loading, otimização de imagens, critical CSS
  "reference": (string) Fundamentação teórica com aplicação prática específica
  "metrics": (array) KPIs afetados: ["conversion_rate", "task_completion", "error_rate", "time_to_complete", "satisfaction_score"]
  "effort": (string) "Low" | "Medium" | "High" - estimativa de esforço para implementação
}

**DIRETRIZES AVANÇADAS:**

🎯 **Priorização Inteligente:**
- Problemas críticos que impedem conclusão de tarefas
- Oportunidades de quick wins com alto impacto
- Melhorias que afetam múltiplas personas

🧠 **Análise Cognitiva:**
- Carga cognitiva e mental models
- Padrões de scanning (F-pattern, Z-pattern)
- Affordances e signifiers

♿ **Inclusão por Design:**
- Usuários com deficiências visuais, motoras, cognitivas
- Diferentes contextos de uso (luz solar, movimento, distrações)
- Devices e conexões variadas

📊 **Orientação por Dados:**
- Conecte sugestões com métricas mensuráveis
- Considere impacto em funil de conversão
- Pense em testes A/B validáveis

🔄 **Pensamento Sistêmico:**
- Como mudanças afetam outros componentes
- Escalabilidade para múltiplas telas
- Manutenibilidade do design system

**EXEMPLO DE SAÍDA APRIMORADA:**
[
  {
    "priority": 5,
    "category": "UX",
    "component": "Primary CTA Button",
    "issue": "Botão 'Finalizar Compra' possui baixo contraste (2.8:1) e área de toque insuficiente (32px) para usuários mobile, violando WCAG AA e aumentando taxa de abandono",
    "impact": "Redução estimada de 15-25% na conversão mobile devido à dificuldade de interação. Usuários com deficiência visual não conseguem identificar o botão principal.",
    "suggestion": "**Design System Update:**\\n• Cor: Background #2563EB (contraste 4.8:1), texto #FFFFFF\\n• Dimensões: min-height 44px, padding 16px 24px (touch target 44x44px)\\n• Typography: font-weight 600, font-size 16px, line-height 1.5\\n\\n**Implementação CSS:**\\n css\\n.btn-primary {\\n  background: #2563EB;\\n  color: #FFFFFF;\\n  min-height: 44px;\\n  padding: 16px 24px;\\n  border-radius: 8px;\\n  transition: all 0.15s ease-in-out;\\n}\\n.btn-primary:hover { background: #1D4ED8; transform: translateY(-1px); }\\n.btn-primary:focus { outline: 3px solid #93C5FD; outline-offset: 2px; }\\n\\n\\n**Microinterações:**\\n• Hover: Darkening + subtle lift (1px translateY)\\n• Focus: Blue ring 3px, visible para navegação por teclado\\n• Loading: Spinner + disabled state com opacity 0.6\\n\\n**Responsivo:**\\n• Mobile: Full width com margin 16px\\n• Tablet+: Max-width 280px, centered ou aligned",
    "reference": "Lei de Fitts: Tempo para alcançar um alvo é função do tamanho e distância. Botões maiores (44px+) reduzem erro motor e tempo de interação. WCAG 2.1 Success Criterion 2.5.5 exige targets mínimos de 44x44px. Estudos mostram que cada ponto de contraste adicional aumenta conversão em 3-7%.",
    "metrics": ["conversion_rate", "error_rate", "accessibility_score"],
    "effort": "Low"
  }
]

**INSTRUÇÕES FINAIS:**
- Retorne APENAS o array JSON válido
- Priorize problemas com maior ROI (esforço vs. impacto)
- Use linguagem técnica precisa mas acessível
- Cada sugestão deve ser imediatamente implementável
- Considere o contexto de produto digital moderno (2024-2025)

Analise a imagem fornecida aplicando esta metodologia avançada.`;

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

    return NextResponse.json({ analysis: analysisText });

  } catch (error: any) {
    console.error("Erro na API de análise:", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: `Erro ao processar a análise: ${errorMessage}` }, { status: 500 });
  }
}