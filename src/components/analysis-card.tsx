"use client";

import { useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Lightbulb, BookCheck, ChevronsUpDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AnalysisItem {
  category: "UI" | "UX";
  issue: string;
  suggestion: string;
  reference: string;
}

interface AnalysisCardProps {
  item: AnalysisItem;
}

export function AnalysisCard({ item }: AnalysisCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopyImage = async () => {
    const elementToCapture = cardRef.current;
    if (!elementToCapture) {
      toast.error("Não foi possível encontrar o elemento do card para capturar.");
      return;
    }

    // Dynamically import the library only when needed
    const html2canvas = (await import("html2canvas")).default;

    const copyPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const canvas = await html2canvas(elementToCapture, {
          backgroundColor: null, // Mantém o fundo transparente se houver
          scale: 2, // Aumenta a resolução para melhor qualidade
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]).then(resolve).catch(reject);
          } else {
            reject(new Error("Não foi possível converter o card para imagem."));
          }
        }, 'image/png');

      } catch (error) {
        reject(error);
      }
    });

    toast.promise(copyPromise, {
      loading: 'Gerando imagem do card...',
      success: 'Card copiado como imagem!',
      error: 'Falha ao copiar a imagem do card.',
    });
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "border-l-4",
        item.category === "UI" ? "border-chart-1" : "border-chart-2"
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-base font-semibold flex-1">{item.issue}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={item.category === "UI" ? "default" : "secondary"}>
              {item.category}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyImage}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copiar como imagem</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <Collapsible>
        <div className="px-6 pb-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full flex justify-between items-center text-muted-foreground">
              <span>Ver Sugestão Detalhada</span>
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div>
              <h3 className="flex items-center text-sm font-semibold text-foreground mb-2">
                <Lightbulb className="w-4 h-4 mr-2 text-primary" />
                Sugestão de Melhoria
              </h3>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{item.suggestion}</p>
            </div>
            <div>
              <h3 className="flex items-center text-sm font-semibold text-foreground mb-2">
                <BookCheck className="w-4 h-4 mr-2 text-primary" />
                Princípio Aplicado
              </h3>
              <p className="text-sm text-muted-foreground pl-6">{item.reference}</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}