import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Zap, Box, Check, X } from "lucide-react";
import { Framework, frameworkInfo } from "./types";

interface FrameworkSelectorProps {
  value: Framework;
  onChange: (value: Framework) => void;
}

export const FrameworkSelector = ({ value, onChange }: FrameworkSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-foreground font-medium">Framework Desktop</label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as Framework)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Electron */}
          <label
            className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
              value === "electron"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="electron" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Box className="w-5 h-5 text-blue-400" />
                  <p className="font-semibold text-foreground">
                    {frameworkInfo.electron.name}
                  </p>
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {frameworkInfo.electron.description}
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {frameworkInfo.electron.pros.map((pro) => (
                      <span key={pro} className="inline-flex items-center gap-1 text-green-400">
                        <Check className="w-3 h-3" />
                        {pro}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {frameworkInfo.electron.cons.map((con) => (
                      <span key={con} className="inline-flex items-center gap-1 text-muted-foreground">
                        <X className="w-3 h-3" />
                        {con}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </label>

          {/* Tauri */}
          <label
            className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
              value === "tauri"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="tauri" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <p className="font-semibold text-foreground">
                    {frameworkInfo.tauri.name}
                  </p>
                  <Badge variant="outline" className="text-xs border-orange-400 text-orange-400">
                    Leve
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {frameworkInfo.tauri.description}
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {frameworkInfo.tauri.pros.map((pro) => (
                      <span key={pro} className="inline-flex items-center gap-1 text-green-400">
                        <Check className="w-3 h-3" />
                        {pro}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {frameworkInfo.tauri.cons.map((con) => (
                      <span key={con} className="inline-flex items-center gap-1 text-muted-foreground">
                        <X className="w-3 h-3" />
                        {con}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>
      </RadioGroup>
    </div>
  );
};
