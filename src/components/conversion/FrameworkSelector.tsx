import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Zap, Box, Check, X, Smartphone, Layers } from "lucide-react";
import { Framework, frameworkInfo } from "./types";

interface FrameworkSelectorProps {
  value: Framework;
  onChange: (value: Framework) => void;
}

const frameworkIcons: Record<Framework, React.ComponentType<{ className?: string }>> = {
  electron: Box,
  tauri: Zap,
  capacitor: Layers,
  "react-native": Smartphone,
};

const frameworkBadges: Record<Framework, { label: string; variant: "secondary" | "outline"; color?: string }> = {
  electron: { label: "Popular", variant: "secondary" },
  tauri: { label: "Leve", variant: "outline", color: "orange" },
  capacitor: { label: "Híbrido", variant: "outline", color: "cyan" },
  "react-native": { label: "Nativo", variant: "outline", color: "purple" },
};

const frameworkIconColors: Record<Framework, string> = {
  electron: "text-blue-400",
  tauri: "text-orange-400",
  capacitor: "text-cyan-400",
  "react-native": "text-purple-400",
};

export const FrameworkSelector = ({ value, onChange }: FrameworkSelectorProps) => {
  const frameworks: Framework[] = ["electron", "tauri", "capacitor", "react-native"];
  
  return (
    <div className="space-y-3">
      <label className="text-foreground font-medium">Framework</label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as Framework)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frameworks.map((fw) => {
            const info = frameworkInfo[fw];
            const Icon = frameworkIcons[fw];
            const badge = frameworkBadges[fw];
            const iconColor = frameworkIconColors[fw];
            const isDesktop = fw === "electron" || fw === "tauri";
            
            return (
              <label
                key={fw}
                className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  value === fw
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={fw} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                      <p className="font-semibold text-foreground">
                        {info.name}
                      </p>
                      <Badge 
                        variant={badge.variant} 
                        className={`text-xs ${badge.color ? `border-${badge.color}-400 text-${badge.color}-400` : ''}`}
                      >
                        {badge.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {isDesktop ? "Desktop" : "Mobile"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {info.description}
                    </p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {info.pros.map((pro) => (
                          <span key={pro} className="inline-flex items-center gap-1 text-green-400">
                            <Check className="w-3 h-3" />
                            {pro}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {info.cons.map((con) => (
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
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};
