"use client";

import { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScreenCapture } from "@/components/screen-capture";
import { ApiKeyInput } from "@/components/api-key-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AnalysisCard, AnalysisItem } from "@/components/analysis-card";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);

  const [aiProvider, setAiProvider] = useState<'openai' | 'google'>('openai');
  const [openAIKey, setOpenAIKey] = useState<string>("");
  const [googleAIKey, setGoogleAIKey] = useState<string>("");

  const handleCapture = (file: File | null) => {
    setImageFile(file);
    setAnalysis(null); // Limpa a análise anterior ao capturar nova imagem
    if (capturedImagePreview) {
      URL.revokeObjectURL(capturedImagePreview);
    }
    if (file) {
      setCapturedImagePreview(URL.createObjectURL(file));
    } else {
      setCapturedImagePreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      toast.error("Por favor, capture uma imagem da sua tela primeiro.");
      return;
    }
    
    const apiKey = aiProvider === 'openai' ? openAIKey : googleAIKey;
    if (!apiKey) {
      toast.error(`Por favor, insira sua chave de API da ${aiProvider === 'openai' ? 'OpenAI' : 'Google'}.`);
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("provider", aiProvider);
    formData.append("apiKey", apiKey);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro desconhecido.");
      }

      try {
        const cleanedJsonString = result.analysis.replace(/```json\n|```/g, '').trim();
        const parsedAnalysis = JSON.parse(cleanedJsonString);
        setAnalysis(parsedAnalysis);
      } catch (parseError) {
        console.error("Falha ao processar a resposta da IA:", parseError);
        toast.error("A resposta da IA não estava no formato esperado. Tente analisar novamente.");
        setAnalysis(null);
      }

    } catch (error: any) {
      console.error("Falha ao analisar:", error);
      toast.error(`Erro na análise: ${error.message}`);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentApiKey = aiProvider === 'openai' ? openAIKey : googleAIKey;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Analisador de Protótipo com IA</h1>
            <p className="text-muted-foreground mt-2">
              Receba críticas e sugestões de melhoria de UX/UI para seu protótipo em 3 passos.
            </p>
          </header>

          <div className="flex flex-col gap-8">
            {/* --- PASSO 1: CAPTURAR --- */}
            <Card>
              <CardHeader>
                <CardTitle>Passo 1: Compartilhe e Capture</CardTitle>
                <CardDescription>Inicie o compartilhamento e capture a tela do seu protótipo. A imagem não é salva em nenhum lugar.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScreenCapture onCapture={handleCapture} isSharing={isSharing} setIsSharing={setIsSharing} />
              </CardContent>
            </Card>

            {/* --- PASSO 2: CONFIGURAR E ANALISAR (APARECE APÓS CAPTURA) --- */}
            {imageFile && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Imagem Capturada</CardTitle>
                    <CardDescription>Esta imagem será enviada para análise. Para mudar, capture outra tela.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Image
                      src={capturedImagePreview!}
                      alt="Tela capturada para análise"
                      width={800}
                      height={450}
                      className="rounded-md object-contain w-full border"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Passo 2: Configure sua Chave</CardTitle>
                    <CardDescription>
                      Escolha o provedor de IA e insira sua chave de API. Ela fica salva apenas no seu navegador.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={aiProvider} onValueChange={(value) => setAiProvider(value as 'openai' | 'google')} className="mb-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="openai" id="r-openai" />
                        <Label htmlFor="r-openai">OpenAI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="google" id="r-google" />
                        <Label htmlFor="r-google">Google</Label>
                      </div>
                    </RadioGroup>
                    
                    {aiProvider === 'openai' && (
                      <ApiKeyInput value={openAIKey} onChange={setOpenAIKey} storageKey="openai_api_key" placeholder="sk-..." />
                    )}
                    {aiProvider === 'google' && (
                      <ApiKeyInput value={googleAIKey} onChange={setGoogleAIKey} storageKey="google_api_key" placeholder="Chave da API do Google AI..." />
                    )}
                  </CardContent>
                </Card>

                <Button onClick={handleAnalyze} disabled={isLoading || !currentApiKey} size="lg" className="w-full">
                  {isLoading ? "Analisando..." : "Passo 3: Analisar Protótipo"}
                </Button>
              </>
            )}

            {/* --- PASSO 3: RESULTADOS (APARECE APÓS ANÁLISE) --- */}
            <div className="space-y-6">
              {(isLoading || analysis) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Análise e Sugestões
                    </CardTitle>
                    <CardDescription>
                      Aqui estão as críticas e melhorias sugeridas pela IA.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
              
              {isLoading && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><Skeleton className="h-5 w-4/5" /></CardHeader>
                    <CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent>
                  </Card>
                </div>
              )}

              {analysis && !isLoading && (
                <div className="space-y-4">
                  {analysis.map((item, index) => (
                    <AnalysisCard key={index} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
}