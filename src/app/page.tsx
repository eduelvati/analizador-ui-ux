"use client";

import { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/image-uploader";
import { ApiKeyInput } from "@/components/api-key-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAnalyze = async () => {
    if (!imageFile) {
      alert("Por favor, envie uma imagem primeiro.");
      return;
    }
    if (!apiKey) {
      alert("Por favor, insira sua chave de API da OpenAI.");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    // Placeholder for actual API call logic
    setTimeout(() => {
      setAnalysis("Esta é uma análise de exemplo. A integração com a API da OpenAI será feita a seguir.\n\nO protótipo parece bom, mas o contraste do botão principal poderia ser melhorado para aumentar a acessibilidade. Considere também aumentar o tamanho da fonte do cabeçalho para melhor legibilidade em dispositivos menores.");
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Analisador de Protótipo com IA</h1>
            <p className="text-muted-foreground mt-2">
              Envie um print do seu protótipo e receba críticas e sugestões de melhoria de UX/UI.
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Envie seu Protótipo</CardTitle>
                  <CardDescription>Arraste ou selecione a imagem da sua tela.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader onFileChange={setImageFile} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Configure sua Chave</CardTitle>
                  <CardDescription>
                    Sua chave de API da OpenAI é necessária para a análise. Ela fica salva apenas no seu navegador.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApiKeyInput value={apiKey} onChange={setApiKey} />
                </CardContent>
              </Card>

              <Button onClick={handleAnalyze} disabled={isLoading || !imageFile || !apiKey} size="lg" className="w-full">
                {isLoading ? "Analisando..." : "Analisar Protótipo"}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Análise e Sugestões
                </CardTitle>
                <CardDescription>
                  Aqui aparecerão as críticas e melhorias sugeridas pela IA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                )}
                {analysis && !isLoading && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {analysis.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
                {!analysis && !isLoading && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aguardando análise...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
}