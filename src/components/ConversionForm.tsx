import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { BuildConfig } from "./conversion/types";
import { SourceTypeSelector } from "./conversion/SourceTypeSelector";
import { ZipUploader } from "./conversion/ZipUploader";
import { GitHubInput } from "./conversion/GitHubInput";
import { OSSelector } from "./conversion/OSSelector";
import { FrameworkSelector } from "./conversion/FrameworkSelector";
import { IconUploader } from "./conversion/IconUploader";
import { BuildStatusCard } from "./conversion/BuildStatusCard";
import { useBuild } from "@/hooks/useBuild";

export const ConversionForm = () => {
  const [buildId, setBuildId] = useState<string | null>(null);
  const { artifacts, status: buildStatus, startBuild, reset: resetBuild, errorMessage } = useBuild(buildId);
  const [config, setConfig] = useState<BuildConfig>({
    appName: "",
    sourceType: "url",
    appUrl: "",
    zipFile: null,
    selectedOS: "windows",
    framework: "electron",
    iconFile: null,
    githubRepo: "",
    useRealBuild: true,
  });

  const updateConfig = <K extends keyof BuildConfig>(key: K, value: BuildConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeRepo = (value: string) =>
    value
      .trim()
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "")

  const isFormValid = () => {
    if (!config.appName.trim()) return false;

    // Builds reais exigem repositório GitHub (owner/repo)
    const repo = normalizeRepo(config.githubRepo || config.appUrl);
    if (!repo || !repo.includes("/")) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Builds reais apenas (GitHub Actions)
    const repo = normalizeRepo(config.githubRepo || config.appUrl);

    const newBuildId = await startBuild({
      appName: config.appName,
      sourceType: config.sourceType,
      sourceUrl: normalizeRepo(config.appUrl) || undefined,
      framework: config.framework,
      targetOs: config.selectedOS,
      githubRepo: repo,
    });

    if (newBuildId) {
      setBuildId(newBuildId);
      toast.success("Build real iniciado! Acompanhe o progresso no GitHub Actions.");
    } else {
      toast.error("Erro ao iniciar o build. Tente novamente.");
    }
  };

  const handleReset = () => {
    setBuildId(null);
    resetBuild();
    setConfig({
      appName: "",
      sourceType: "url",
      appUrl: "",
      zipFile: null,
      selectedOS: "windows",
      framework: "electron",
      iconFile: null,
      githubRepo: "",
      useRealBuild: true,
    });
  };

  if (buildStatus !== "idle") {
    return (
      <BuildStatusCard
        status={buildStatus}
        appName={config.appName}
        framework={config.framework}
        os={config.selectedOS}
        onReset={handleReset}
        artifacts={artifacts}
        isRealBuild={config.useRealBuild}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <section id="converter" className="py-24 relative">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Crie seu <span className="gradient-text">app desktop</span>
            </h2>
            <p className="text-muted-foreground">
              Preencha as informações abaixo e receba seu instalador em minutos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
            {/* App Name */}
            <div className="space-y-2">
              <Label htmlFor="appName" className="text-foreground">
                Nome do Aplicativo *
              </Label>
              <Input
                id="appName"
                placeholder="Meu App Incrível"
                value={config.appName}
                onChange={(e) => updateConfig("appName", e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            {/* Source Type Selector */}
            <SourceTypeSelector
              value={config.sourceType}
              onChange={(value) => updateConfig("sourceType", value)}
            />

            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <p className="text-xs text-muted-foreground">
                Builds reais exigem um repositório GitHub com os workflows na pasta{' '}
                <code className="bg-secondary/50 px-1 rounded">.github/workflows</code>. Arquivos demonstrativos foram desativados.
              </p>
            </div>

            {/* Conditional Source Input */}
            {config.sourceType === "url" && (
              <div className="space-y-2">
                <Label htmlFor="appUrl" className="text-foreground">
                  URL do App *
                </Label>
                <Input
                  id="appUrl"
                  placeholder="https://meuapp.com"
                  value={config.appUrl}
                  onChange={(e) => updateConfig("appUrl", e.target.value)}
                  className="bg-secondary/50 border-border focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  O site será carregado via WebView no app desktop.
                </p>
              </div>
            )}

            {config.sourceType === "github" && (
              <GitHubInput
                value={config.appUrl}
                onChange={(value) => updateConfig("appUrl", value)}
              />
            )}

            {config.sourceType === "zip" && (
              <ZipUploader
                file={config.zipFile}
                onChange={(file) => updateConfig("zipFile", file)}
              />
            )}

            {/* Repo com workflows (sempre obrigatório) */}
            <div className="space-y-2">
              <Label htmlFor="githubRepo" className="text-foreground">
                Repositório GitHub com Workflows *
              </Label>
              <Input
                id="githubRepo"
                placeholder="usuario/repositorio"
                value={config.githubRepo}
                onChange={(e) => updateConfig("githubRepo", e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Este repositório será usado para disparar o GitHub Actions e gerar os instaladores reais.
              </p>
            </div>

            {/* Icon Upload */}
            <IconUploader
              file={config.iconFile}
              onChange={(file) => updateConfig("iconFile", file)}
            />

            {/* Framework Selection - moved before OS */}
            <FrameworkSelector
              value={config.framework}
              onChange={(value) => updateConfig("framework", value)}
            />

            {/* OS Selection */}
            <OSSelector
              value={config.selectedOS}
              onChange={(value) => updateConfig("selectedOS", value)}
              framework={config.framework}
            />

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={!isFormValid()}
            >
              Gerar Instaladores
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
