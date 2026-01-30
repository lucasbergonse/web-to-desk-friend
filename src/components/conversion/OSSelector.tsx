import { Monitor, Apple, Laptop } from "lucide-react";
import { OS } from "./types";

interface OSSelectorProps {
  value: OS;
  onChange: (value: OS) => void;
}

const osOptions = [
  { value: "windows" as const, label: "Windows", icon: Monitor },
  { value: "macos" as const, label: "macOS", icon: Apple },
  { value: "linux" as const, label: "Linux", icon: Laptop },
];

export const OSSelector = ({ value, onChange }: OSSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-foreground font-medium">Sistema Operacional *</label>
      <div className="grid grid-cols-3 gap-3">
        {osOptions.map((os) => (
          <button
            key={os.value}
            type="button"
            onClick={() => onChange(os.value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              value === os.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/30"
            }`}
          >
            <os.icon
              className={`w-6 h-6 ${
                value === os.value ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-sm ${
                value === os.value ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {os.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
