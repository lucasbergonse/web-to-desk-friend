import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Download } from "lucide-react";
import type { WrapperMode } from "./types";

interface WrapperModeSelectorProps {
  value: WrapperMode;
  onChange: (value: WrapperMode) => void;
}

export const WrapperModeSelector = ({ value, onChange }: WrapperModeSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-foreground">Modo de Funcionamento</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as WrapperMode)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="relative">
          <RadioGroupItem
            value="webview"
            id="webview"
            className="peer sr-only"
          />
          <label
            htmlFor="webview"
            className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border bg-secondary/30 cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-medium">WebView Online</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Carrega o site em tempo real. Requer conexão com internet.
            </p>
          </label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="pwa"
            id="pwa"
            className="peer sr-only"
          />
          <label
            htmlFor="pwa"
            className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border bg-secondary/30 cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
          >
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <span className="font-medium">PWA Offline</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Baixa e empacota o site. Funciona sem internet.
            </p>
          </label>
        </div>
      </RadioGroup>
    </div>
  );
};
