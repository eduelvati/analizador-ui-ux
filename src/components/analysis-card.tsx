"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, BookCheck } from "lucide-react";

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
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-base font-semibold">{item.issue}</CardTitle>
          <Badge variant={item.category === "UI" ? "default" : "secondary"} className="flex-shrink-0">
            {item.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="flex items-center text-sm font-semibold text-foreground mb-2">
            <Lightbulb className="w-4 h-4 mr-2 text-primary" />
            Sugestão de Melhoria
          </h3>
          <p className="text-sm text-muted-foreground pl-6">{item.suggestion}</p>
        </div>
        <div>
          <h3 className="flex items-center text-sm font-semibold text-foreground mb-2">
            <BookCheck className="w-4 h-4 mr-2 text-primary" />
            Princípio Aplicado
          </h3>
          <p className="text-sm text-muted-foreground pl-6">{item.reference}</p>
        </div>
      </CardContent>
    </Card>
  );
}