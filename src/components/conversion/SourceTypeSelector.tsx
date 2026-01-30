import { Globe, Github, FileArchive } from "lucide-react";
import { SourceType } from "./types";

interface SourceTypeSelectorProps {
  value: SourceType;
  onChange: (value: SourceType) => void;
}

const sourceOptions = [
  { value: "url" as const, label: "URL Web", icon: Globe, description: "Site online" },
  { value: "github" as const, label: "GitHub", icon: Github, description: "Repositório" },
  { value: "zip" as const, label: "Arquivo ZIP", icon: FileArchive, description: "Projeto local" },
];

export const SourceTypeSelector = ({ value, onChange }: SourceTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-foreground font-medium">Fonte do Projeto *</label>
      <div className="grid grid-cols-3 gap-3">
        {sourceOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              value === option.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/30"
            }`}
          >
            <option.icon
              className={`w-6 h-6 ${
                value === option.value ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <div className="text-center">
              <span
                className={`text-sm font-medium block ${
                  value === option.value ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
