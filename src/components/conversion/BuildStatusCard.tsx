import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Download, RotateCcw, FileDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BuildStatus, Framework, OS } from "./types";

interface BuildArtifact {
  id: string;
  file_type: string;
  file_name: string;
  file_size: string;
  download_url: string | null;
}

interface BuildStatusCardProps {
  status: BuildStatus;
  appName: string;
  framework: Framework;
  os: OS;
  onReset: () => void;
  artifacts?: BuildArtifact[];
  isRealBuild?: boolean;
  errorMessage?: string | null;
}

export const BuildStatusCard = ({
  status,
  appName,
  framework,
  os,
  onReset,
  artifacts = [],
  isRealBuild = false,
  errorMessage,
}: BuildStatusCardProps) => {
  const getFrameworkName = () => {
    switch (framework) {
      case "electron": return "Electron";
      case "tauri": return "Tauri";
      case "capacitor": return "Capacitor";
      case "react-native": return "React Native";
      default: return framework;
    }
  };

  const statusConfig = {
    extracting: {
      title: "Extraindo código...",
      description: "Baixando e extraindo os arquivos do projeto.",
      icon: Loader2,
      iconClass: "animate-spin text-primary",
      progress: 20,
    },
    queued: {
      title: "Na fila...",
      description: isRealBuild 
        ? "Aguardando GitHub Actions iniciar o workflow..." 
        : "Seu build está aguardando para iniciar.",
      icon: Loader2,
      iconClass: "animate-spin text-primary",
      progress: 40,
    },
    building: {
      title: `Gerando build ${getFrameworkName()}...`,
      description: isRealBuild
        ? "Compilando via GitHub Actions. Isso pode levar alguns minutos..."
        : framework === "electron"
          ? "Empacotando com Chromium e Node.js..."
          : framework === "tauri"
            ? "Compilando com Rust e WebView nativo..."
            : "Compilando aplicativo mobile...",
      icon: Loader2,
      iconClass: "animate-spin text-primary",
      progress: 70,
    },
    completed: {
      title: "Build concluído!",
      description: "Seus instaladores estão prontos para download.",
      icon: CheckCircle2,
      iconClass: "text-green-500",
      progress: 100,
    },
    failed: {
      title: "Falha no build",
      description: errorMessage || "Ocorreu um erro durante o processo de build.",
      icon: CheckCircle2,
      iconClass: "text-destructive",
      progress: 0,
    },
    idle: {
      title: "",
      description: "",
      icon: Loader2,
      iconClass: "",
      progress: 0,
    },
  };

  const config = statusConfig[status];

  const handleDownload = (artifact: BuildArtifact) => {
    if (artifact.download_url) {
      window.open(artifact.download_url, '_blank');
      toast.success(`Download iniciado: ${artifact.file_name}`);
    } else {
      toast.error("URL de download não disponível");
    }
  };

  const handleDownloadAll = () => {
    toast.success("Baixando todos os instaladores...");
    artifacts.forEach((artifact, index) => {
      setTimeout(() => {
        if (artifact.download_url) {
          window.open(artifact.download_url, '_blank');
        }
      }, index * 500);
    });
  };

  const getFileTypeLabel = (fileType: string): string => {
    const labels: Record<string, string> = {
      exe: "Instalador .exe",
      bat: "Script .bat",
      msi: "Instalador .msi",
      dmg: "Instalador .dmg",
      app: "Aplicativo .app",
      deb: "Pacote .deb",
      appimage: "AppImage",
      apk: "APK Android",
      aab: "Android App Bundle",
      ipa: "Arquivo .ipa",
      zip: "Arquivo ZIP",
    };
    return labels[fileType] || fileType.toUpperCase();
  };

  const getFileTypeDescription = (fileType: string): string => {
    const isElectron = framework === "electron";
    const isCapacitor = framework === "capacitor";
    const descriptions: Record<string, string> = {
      exe: isElectron ? "Instalador padrão Windows (Electron)" : "Instalador compacto Windows (Tauri)",
      bat: "Script de inicialização rápida",
      msi: "Instalador empresarial Windows",
      dmg: isElectron ? "Imagem de disco macOS (Electron)" : "Imagem de disco compacta (Tauri)",
      app: "Bundle de aplicativo macOS",
      deb: "Para Ubuntu/Debian",
      appimage: "Executável universal Linux",
      apk: isCapacitor ? "Instalador Android (Capacitor)" : "Instalador Android (React Native)",
      aab: "Para publicação na Play Store",
      ipa: isCapacitor ? "Aplicativo iOS (Capacitor)" : "Aplicativo iOS (React Native)",
      zip: "Arquivo compactado com instaladores",
    };
    return descriptions[fileType] || `Arquivo ${fileType}`;
  };

  const getOsName = () => {
    switch (os) {
      case "windows": return "Windows";
      case "macos": return "macOS";
      case "linux": return "Linux";
      case "android": return "Android";
      case "ios": return "iOS";
      default: return os;
    }
  };

  const getFrameworkColorClass = () => {
    switch (framework) {
      case "electron": return "bg-blue-500/20 text-blue-400";
      case "tauri": return "bg-orange-500/20 text-orange-400";
      case "capacitor": return "bg-cyan-500/20 text-cyan-400";
      case "react-native": return "bg-purple-500/20 text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto glass-card rounded-2xl p-8"
        >
          <div className="text-center mb-6">
            <config.icon className={`w-16 h-16 mx-auto mb-6 ${config.iconClass}`} />
            <h3 className="text-2xl font-bold mb-2">{config.title}</h3>
            <p className="text-muted-foreground mb-2">{config.description}</p>
            <p className="text-sm text-primary font-medium">{appName}</p>
          </div>

          {status !== "completed" && status !== "failed" && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{config.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${config.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="space-y-4">
              {/* Demo notice - only show if not real build */}
              {!isRealBuild && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-400 text-sm">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-400 mb-1">Modo Demonstração</p>
                      <p className="text-xs text-muted-foreground">
                        Este é um protótipo. Os arquivos gerados são simulações para demonstrar o fluxo. 
                        Ative "Build Real com GitHub Actions" para gerar instaladores funcionais.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Real build success notice */}
              {isRealBuild && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-400 mb-1">Build Real Concluído</p>
                      <p className="text-xs text-muted-foreground">
                        Instaladores reais compilados com {getFrameworkName()} via GitHub Actions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Framework badge */}
              <div className="flex justify-center gap-2 mb-4 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFrameworkColorClass()}`}>
                  <Package className="w-3 h-3 inline mr-1" />
                  {getFrameworkName()}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {getOsName()}
                </span>
              </div>

              {/* Download options from real artifacts */}
              <div className="space-y-3">
                {artifacts.length > 0 ? (
                  artifacts.map((artifact) => (
                    <motion.div
                      key={artifact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileDown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{getFileTypeLabel(artifact.file_type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getFileTypeDescription(artifact.file_type)} • {artifact.file_size}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(artifact)}
                        className="gap-2"
                        disabled={!artifact.download_url}
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    Carregando arquivos...
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="hero"
                  className="flex-1 gap-2"
                  onClick={handleDownloadAll}
                  disabled={artifacts.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Baixar Todos
                </Button>
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Criar Outro App
                </Button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              {/* Error details */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-destructive mb-1">Detalhes do erro</p>
                      <p className="text-xs text-muted-foreground">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
              <Button
                variant="outline"
                onClick={onReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
