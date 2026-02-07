import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Download, RotateCcw, Package, AlertCircle, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Framework, OS, GeneratorStatus } from "./types";

interface BuildStatusCardProps {
  status: GeneratorStatus;
  appName: string;
  framework: Framework;
  os: OS;
  onReset: () => void;
  downloadUrl?: string | null;
  fileName?: string | null;
  errorMessage?: string | null;
}

export const BuildStatusCard = ({
  status,
  appName,
  framework,
  os,
  onReset,
  downloadUrl,
  fileName,
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

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast.success(`Download iniciado: ${fileName || 'projeto.zip'}`);
    }
  };

  const statusConfig = {
    idle: {
      title: "",
      description: "",
      icon: Loader2,
      iconClass: "",
    },
    generating: {
      title: "Gerando projeto...",
      description: `Preparando o projeto ${getFrameworkName()} para ${getOsName()}. Isso leva apenas alguns segundos.`,
      icon: Loader2,
      iconClass: "animate-spin text-primary",
    },
    ready: {
      title: "Projeto pronto!",
      description: "Seu projeto está pronto para download. Siga as instruções do README para gerar o instalador.",
      icon: CheckCircle2,
      iconClass: "text-green-500",
    },
    failed: {
      title: "Falha na geração",
      description: errorMessage || "Ocorreu um erro ao gerar o projeto.",
      icon: AlertCircle,
      iconClass: "text-destructive",
    },
  };

  const config = statusConfig[status];

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

          {status === "generating" && (
            <div className="space-y-2 mb-6">
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 3, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {status === "ready" && (
            <div className="space-y-4">
              {/* Success notice */}
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-400 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">Projeto Gerado</p>
                    <p className="text-xs text-muted-foreground">
                      Projeto configurado com {getFrameworkName()} para {getOsName()}. 
                      Baixe o .zip, execute <code className="bg-secondary px-1 rounded">npm install</code> e depois <code className="bg-secondary px-1 rounded">npm run build</code>.
                    </p>
                  </div>
                </div>
              </div>

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

              {/* Download card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileArchive className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{fileName || 'projeto.zip'}</p>
                    <p className="text-xs text-muted-foreground">
                      Projeto {getFrameworkName()} pronto para build local
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                  disabled={!downloadUrl}
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
              </motion.div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="hero"
                  className="flex-1 gap-2"
                  onClick={handleDownload}
                  disabled={!downloadUrl}
                >
                  <Download className="w-4 h-4" />
                  Baixar Projeto
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
              {errorMessage && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-destructive mb-1">Detalhes do erro</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
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
