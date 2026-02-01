import { Monitor, Apple, Laptop, Smartphone } from "lucide-react";
import { OS, Framework, frameworkInfo } from "./types";

interface OSSelectorProps {
  value: OS;
  onChange: (value: OS) => void;
  framework: Framework;
}

const osOptions = [
  { value: "windows" as const, label: "Windows", icon: Monitor, platform: "desktop" },
  { value: "macos" as const, label: "macOS", icon: Apple, platform: "desktop" },
  { value: "linux" as const, label: "Linux", icon: Laptop, platform: "desktop" },
  { value: "android" as const, label: "Android", icon: Smartphone, platform: "mobile" },
  { value: "ios" as const, label: "iOS", icon: Apple, platform: "mobile" },
];

export const OSSelector = ({ value, onChange, framework }: OSSelectorProps) => {
  const currentFrameworkInfo = frameworkInfo[framework];
  const supportedPlatforms = currentFrameworkInfo?.platforms || [];
  
  const availableOptions = osOptions.filter(os => 
    supportedPlatforms.includes(os.value as never)
  );

  // Auto-select first available option if current selection is not supported
  const isCurrentValid = availableOptions.some(os => os.value === value);
  if (!isCurrentValid && availableOptions.length > 0) {
    // This will trigger on next render
    setTimeout(() => onChange(availableOptions[0].value), 0);
  }

  return (
    <div className="space-y-3">
      <label className="text-foreground font-medium">Sistema Operacional / Plataforma *</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {availableOptions.map((os) => (
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
            <span className="text-xs text-muted-foreground/60">
              {os.platform === "mobile" ? "Mobile" : "Desktop"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
