"use client";

import { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScreenCapture } from "@/components/screen-capture";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, FileQuestion } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { AnalysisCard, AnalysisItem } from "@/components/analysis-card";
import { ApiKeyDialog } from "@/components/api-key-dialog";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);

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
    
    const aiProvider = localStorage.getItem('ai_provider') || 'openai';
    const apiKey = localStorage.getItem(aiProvider === 'openai' ? 'openai_api_key' : 'google_api_key');

    if (!apiKey) {
      toast.error(`Por favor, configure sua chave de API da ${aiProvider === 'openai' ? 'OpenAI' : 'Google'} nas configurações.`);
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12 relative">
            <div className="absolute top-0 right-0">
              <ApiKeyDialog />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Analisador de Protótipo com IA</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Receba críticas e sugestões de melhoria de UX/UI para seu protótipo em 2 passos simples.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* --- COLUNA ESQUERDA: CONTROLES --- */}
            <div className="flex flex-col gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Passo 1: Compartilhe e Capture</CardTitle>
                  <CardDescription>Inicie o compartilhamento e capture a tela do seu protótipo. A imagem não é salva em nenhum lugar.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScreenCapture onCapture={handleCapture} isSharing={isSharing} setIsSharing={setIsSharing} />
                </CardContent>
              </Card>

              {imageFile && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Imagem Capturada</CardTitle>
                      <CardDescription>Esta imagem será enviada para análise.</CardDescription>
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

                  <Button onClick={handleAnalyze} disabled={isLoading} size="lg" className="w-full">
                    {isLoading ? "Analisando..." : "Passo 2: Analisar Protótipo"}
                  </Button>
                </>
              )}
            </div>

            {/* --- COLUNA DIREITA: RESULTADOS --- */}
            <div className="space-y-6 md:sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Análise e Sugestões
                  </CardTitle>
                  <CardDescription>
                    {analysis ? "Aqui estão as críticas e melhorias sugeridas." : "Os resultados da análise aparecerão aqui."}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              {isLoading && (
                <div className="space-y-4">
                  <Card><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></CardContent></Card>
                  <Card><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                </div>
              )}

              {analysis && !isLoading && (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                  {analysis.map((item, index) => (
                    <AnalysisCard key={index} item={item} />
                  ))}
                </div>
              )}

              {!analysis && !isLoading && (
                <Card className="flex items-center justify-center h-64 border-dashed">
                  <CardContent className="text-center text-muted-foreground pt-6">
                    <FileQuestion className="mx-auto h-12 w-12 mb-4" />
                    <p className="font-medium">Aguardando análise</p>
                    <p className="text-sm">Complete os passos ao lado para ver os resultados.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
     Made for DevEduu
    </div>
  );
}