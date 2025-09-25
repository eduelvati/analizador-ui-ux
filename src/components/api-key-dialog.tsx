"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApiKeyInput } from "./api-key-input";
import { Cog } from "lucide-react";

const AI_PROVIDER_STORAGE_KEY = "ai_provider";

export function ApiKeyDialog() {
  const [openAIKey, setOpenAIKey] = useState("");
  const [googleAIKey, setGoogleAIKey] = useState("");
  const [aiProvider, setAiProvider] = useState<'openai' | 'google'>('openai');

  useEffect(() => {
    const storedProvider = localStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    if (storedProvider === 'openai' || storedProvider === 'google') {
      setAiProvider(storedProvider);
    }
  }, []);

  const handleProviderChange = (value: 'openai' | 'google') => {
    setAiProvider(value);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, value);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Cog className="h-4 w-4" />
          <span className="sr-only">Configurações</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações da Chave de API</DialogTitle>
          <DialogDescription>
            Escolha o provedor de IA e insira sua chave de API. Ela fica salva apenas no seu navegador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Provedor de IA</Label>
            <RadioGroup
              value={aiProvider}
              onValueChange={handleProviderChange}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="r-openai-dialog" />
                <Label htmlFor="r-openai-dialog">OpenAI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google" id="r-google-dialog" />
                <Label htmlFor="r-google-dialog">Google</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="openai-key">Chave de API da OpenAI (GPT-4o)</Label>
            <ApiKeyInput
              value={openAIKey}
              onChange={setOpenAIKey}
              storageKey="openai_api_key"
              placeholder="sk-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-key">Chave de API do Google (Gemini)</Label>
            <ApiKeyInput
              value={googleAIKey}
              onChange={setGoogleAIKey}
              storageKey="google_api_key"
              placeholder="Chave da API do Google AI..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}