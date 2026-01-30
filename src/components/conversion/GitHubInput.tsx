import { useState } from "react";
import { Github, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GitHubInputProps {
  value: string;
  onChange: (value: string) => void;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export const GitHubInput = ({ value, onChange }: GitHubInputProps) => {
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [repoInfo, setRepoInfo] = useState<{ name: string; stars: number; language: string } | null>(null);

  const extractRepoPath = (url: string): string | null => {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+\/[^\/]+)/,
      /^([^\/]+\/[^\/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.replace(/\.git$/, "").match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const validateRepo = async (url: string) => {
    if (!url.trim()) {
      setValidation("idle");
      setRepoInfo(null);
      return;
    }

    const repoPath = extractRepoPath(url);
    if (!repoPath) {
      setValidation("invalid");
      setRepoInfo(null);
      return;
    }

    setValidation("validating");

    try {
      // Simulate API call to validate repository
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would call GitHub API
      // For demo, we'll simulate a successful validation
      if (repoPath.includes("/")) {
        setValidation("valid");
        setRepoInfo({
          name: repoPath.split("/")[1],
          stars: Math.floor(Math.random() * 1000),
          language: ["TypeScript", "JavaScript", "React", "Vue"][Math.floor(Math.random() * 4)],
        });
      } else {
        setValidation("invalid");
        setRepoInfo(null);
      }
    } catch {
      setValidation("invalid");
      setRepoInfo(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounce validation
    const timeoutId = setTimeout(() => validateRepo(newValue), 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="space-y-2">
      <label className="text-foreground font-medium">Repositório GitHub *</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Github className="w-5 h-5 text-muted-foreground" />
        </div>
        <Input
          placeholder="https://github.com/usuario/repositorio"
          value={value}
          onChange={handleChange}
          onBlur={() => validateRepo(value)}
          className={`pl-10 pr-10 bg-secondary/50 border-border focus:border-primary ${
            validation === "valid" ? "border-green-500/50" : 
            validation === "invalid" ? "border-destructive/50" : ""
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validation === "validating" && (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
          {validation === "valid" && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {validation === "invalid" && (
            <AlertCircle className="w-5 h-5 text-destructive" />
          )}
        </div>
      </div>

      {validation === "valid" && repoInfo && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div className="text-sm">
            <p className="text-foreground font-medium">
              Repositório encontrado: {repoInfo.name}
            </p>
            <p className="text-muted-foreground">
              {repoInfo.language} • ⭐ {repoInfo.stars} stars
            </p>
          </div>
        </div>
      )}

      {validation === "invalid" && value.trim() && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="text-sm">
            <p className="text-foreground font-medium">Repositório não encontrado</p>
            <p className="text-muted-foreground">
              Verifique se o URL está correto e o repositório é público
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 O código-fonte será extraído e empacotado como um app desktop nativo.
        <br />
        Formatos suportados: React, Vue, Angular, HTML/CSS/JS
      </p>
    </div>
  );
};
