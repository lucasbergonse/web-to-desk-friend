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
import { WrapperModeSelector } from "./conversion/WrapperModeSelector";
import { BuildStatusCard } from "./conversion/BuildStatusCard";
import { useProjectGenerator } from "@/hooks/useProjectGenerator";

export const ConversionForm = () => {
  const { status, result, errorMessage, generate, reset: resetGenerator } = useProjectGenerator();
  const [config, setConfig] = useState<BuildConfig>({
    appName: "",
    sourceType: "url",
    appUrl: "",
    zipFile: null,
    selectedOS: "windows",
    framework: "electron",
    iconFile: null,
    wrapperMode: "webview",
  });

  const updateConfig = <K extends keyof BuildConfig>(key: K, value: BuildConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeGithubUrl = (value: string) =>
    value
      .trim()
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "");

  const isFormValid = () => {
    if (!config.appName.trim()) return false;
    if (config.sourceType === "url" || config.sourceType === "github") {
      if (!config.appUrl.trim()) return false;
    }
    if (config.sourceType === "zip" && !config.zipFile) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    let sourceUrl = config.appUrl;
    if (config.sourceType === "github") {
      sourceUrl = normalizeGithubUrl(config.appUrl);
    }

    const success = await generate({
      appName: config.appName,
      sourceType: config.sourceType,
      sourceUrl: sourceUrl || undefined,
      framework: config.framework,
      targetOs: config.selectedOS,
      wrapperMode: config.wrapperMode,
    });

    if (success) {
      toast.success("Projeto gerado com sucesso! Baixe o .zip abaixo.");
    } else {
      toast.error("Erro ao gerar o projeto. Tente novamente.");
    }
  };

  const handleReset = () => {
    resetGenerator();
    setConfig({
      appName: "",
      sourceType: "url",
      appUrl: "",
      zipFile: null,
      selectedOS: "windows",
      framework: "electron",
      iconFile: null,
      wrapperMode: "webview",
    });
  };

  if (status !== "idle") {
    return (
      <BuildStatusCard
        status={status}
        appName={config.appName}
        framework={config.framework}
        os={config.selectedOS}
        onReset={handleReset}
        downloadUrl={result?.downloadUrl}
        fileName={result?.fileName}
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
              Preencha as informações abaixo e receba seu projeto pronto para build.
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

            {/* Wrapper Mode - only show for URL source type */}
            {config.sourceType === "url" && (
              <WrapperModeSelector
                value={config.wrapperMode}
                onChange={(value) => updateConfig("wrapperMode", value)}
              />
            )}

            {/* Icon Upload */}
            <IconUploader
              file={config.iconFile}
              onChange={(file) => updateConfig("iconFile", file)}
            />

            {/* Framework Selection */}
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
              Gerar Projeto
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
