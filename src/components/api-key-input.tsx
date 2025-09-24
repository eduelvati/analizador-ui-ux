"use client";

import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  storageKey: string;
  placeholder?: string;
}

export function ApiKeyInput({ value, onChange, storageKey, placeholder }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem(storageKey);
    if (storedKey) {
      onChange(storedKey);
    }
  }, [onChange, storageKey]);

  const handleSaveKey = () => {
    localStorage.setItem(storageKey, value);
    toast.success("Chave de API salva no seu navegador!");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-grow">
        <Input
          type={showKey ? "text" : "password"}
          placeholder={placeholder || "sk-..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <Button onClick={handleSaveKey} disabled={!value}>
        Salvar
      </Button>
    </div>
  );
}