import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { BuildConfig, BuildStatus } from "./conversion/types";
import { SourceTypeSelector } from "./conversion/SourceTypeSelector";
import { ZipUploader } from "./conversion/ZipUploader";
import { GitHubInput } from "./conversion/GitHubInput";
import { OSSelector } from "./conversion/OSSelector";
import { FrameworkSelector } from "./conversion/FrameworkSelector";
import { IconUploader } from "./conversion/IconUploader";
import { BuildStatusCard } from "./conversion/BuildStatusCard";

export const ConversionForm = () => {
  const [config, setConfig] = useState<BuildConfig>({
    appName: "",
    sourceType: "url",
    appUrl: "",
    zipFile: null,
    selectedOS: "windows",
    framework: "electron",
    iconFile: null,
  });
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");

  const updateConfig = <K extends keyof BuildConfig>(key: K, value: BuildConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = () => {
    if (!config.appName.trim()) return false;
    
    switch (config.sourceType) {
      case "url":
        return config.appUrl.trim().length > 0;
      case "github":
        return config.appUrl.trim().length > 0 && config.appUrl.includes("/");
      case "zip":
        return config.zipFile !== null;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Start build process simulation
    if (config.sourceType === "github" || config.sourceType === "zip") {
      setBuildStatus("extracting");
      setTimeout(() => setBuildStatus("queued"), 2000);
    } else {
      setBuildStatus("queued");
    }

    setTimeout(() => setBuildStatus("building"), config.sourceType === "url" ? 2000 : 4000);
    setTimeout(() => {
      setBuildStatus("completed");
      toast.success("Build concluído! Seus instaladores estão prontos.");
    }, config.sourceType === "url" ? 6000 : 8000);
  };

  const handleReset = () => {
    setBuildStatus("idle");
    setConfig({
      appName: "",
      sourceType: "url",
      appUrl: "",
      zipFile: null,
      selectedOS: "windows",
      framework: "electron",
      iconFile: null,
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

            {/* Icon Upload */}
            <IconUploader
              file={config.iconFile}
              onChange={(file) => updateConfig("iconFile", file)}
            />

            {/* OS Selection */}
            <OSSelector
              value={config.selectedOS}
              onChange={(value) => updateConfig("selectedOS", value)}
            />

            {/* Framework Selection */}
            <FrameworkSelector
              value={config.framework}
              onChange={(value) => updateConfig("framework", value)}
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
