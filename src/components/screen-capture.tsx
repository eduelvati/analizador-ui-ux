"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { MonitorPlay, Camera, MonitorStop } from "lucide-react";
import { toast } from "sonner";

interface ScreenCaptureProps {
  onCapture: (file: File | null) => void;
  isSharing: boolean;
  setIsSharing: (isSharing: boolean) => void;
}

export function ScreenCapture({ onCapture, isSharing, setIsSharing }: ScreenCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsSharing(true);
      onCapture(null); // Limpa a captura anterior

      // Ouve o evento de quando o usuário para de compartilhar pela UI do navegador
      mediaStream.getVideoTracks()[0].addEventListener('ended', stopScreenShare);

    } catch (err) {
      console.error("Erro ao iniciar compartilhamento de tela:", err);
      toast.error("Não foi possível iniciar o compartilhamento de tela. Verifique as permissões do navegador.");
      setIsSharing(false);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsSharing(false);
  };

  const captureScreenshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "screenshot.png", { type: "image/png" });
            onCapture(file);
            toast.success("Tela capturada! Agora você pode clicar em 'Analisar'.");
          }
        }, "image/png");
      }
    }
  };

  return (
    <div className="w-full">
      {!isSharing ? (
        <div
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary/50"
          onClick={startScreenShare}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <MonitorPlay className="w-8 h-8 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Clique para compartilhar sua tela</span>
            </p>
            <p className="text-xs text-muted-foreground">Sua tela será exibida aqui</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-contain"></video>
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={captureScreenshot}>
              <Camera className="mr-2 h-4 w-4" />
              Capturar para Análise
            </Button>
            <Button variant="outline" onClick={stopScreenShare}>
              <MonitorStop className="mr-2 h-4 w-4" />
              Parar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}