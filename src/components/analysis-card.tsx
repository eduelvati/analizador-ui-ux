"use client";

import { useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
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
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyImage = async () => {
    const elementToCapture = cardRef.current;
    if (!elementToCapture) {
      toast.error("Não foi possível encontrar o elemento do card para capturar.");
      return;
    }

    // Força a abertura do conteúdo para que ele seja incluído na imagem
    const wasOpen = isOpen;
    if (!wasOpen) {
      setIsOpen(true);
      // Aguarda o próximo ciclo de renderização para o conteúdo aparecer
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const html2canvas = (await import("html2canvas")).default;

    const copyPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const canvas = await html2canvas(elementToCapture, {
          backgroundColor: null,
          scale: 2,
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]).then(resolve).catch(reject);
          } else {
            reject(new Error("Não foi possível converter o card para imagem."));
          }
        }, 'image/png');

      } catch (error) {
        reject(error);
      } finally {
        // Restaura o estado original do card
        if (!wasOpen) {
          setIsOpen(false);
        }
      }
    });

    toast.promise(copyPromise, {
      loading: 'Gerando imagem do card...',
      success: 'Card copiado como imagem!',
      error: 'Falha ao copiar a imagem do card.',
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card
        ref={cardRef}
        className={cn(
          "border-l-4 transition-all",
          item.category === "UI" ? "border-chart-1" : "border-chart-2"
        )}
      >
        <CollapsibleTrigger className="w-full text-left p-6 cursor-pointer">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-2">
              <Badge variant={item.category === "UI" ? "default" : "secondary"}>
                {item.category}
              </Badge>
              <CardTitle className="text-base font-semibold">{item.issue}</CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 -mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyImage();
                }}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copiar como imagem</span>
              </Button>
              <div className="p-2">
                <ChevronsUpDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 pt-0">
            <Separator className="mb-4" />
            <div className="space-y-6">
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
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}