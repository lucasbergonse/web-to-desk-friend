import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Github, AlertCircle } from "lucide-react";

interface GitHubRepoInputProps {
  value: string;
  onChange: (value: string) => void;
  useRealBuild: boolean;
  onUseRealBuildChange: (value: boolean) => void;
}

export const GitHubRepoInput = ({
  value,
  onChange,
  useRealBuild,
  onUseRealBuildChange,
}: GitHubRepoInputProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Github className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Build Real com GitHub Actions</p>
            <p className="text-xs text-muted-foreground">
              Compila instaladores reais usando GitHub Actions
            </p>
          </div>
        </div>
        <Switch
          checked={useRealBuild}
          onCheckedChange={onUseRealBuildChange}
        />
      </div>

      {useRealBuild && (
        <div className="space-y-2">
          <Label htmlFor="githubRepo" className="text-foreground">
            Repositório GitHub com Workflows *
          </Label>
          <Input
            id="githubRepo"
            placeholder="usuario/repositorio"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-secondary/50 border-border focus:border-primary"
          />
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-amber-400 mb-1">Pré-requisitos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>O repositório deve conter os workflows de build na pasta <code className="bg-secondary/50 px-1 rounded">.github/workflows/</code></li>
                  <li>O GitHub PAT configurado deve ter permissão para disparar workflows</li>
                  <li>O projeto deve estar configurado para o framework selecionado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
