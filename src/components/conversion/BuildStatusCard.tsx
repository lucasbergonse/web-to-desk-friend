import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Download, RotateCcw, FileDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BuildStatus, Framework, OS, getDownloadOptions, DownloadOption } from "./types";

interface BuildStatusCardProps {
  status: BuildStatus;
  appName: string;
  framework: Framework;
  os: OS;
  onReset: () => void;
}

export const BuildStatusCard = ({
  status,
  appName,
  framework,
  os,
  onReset,
}: BuildStatusCardProps) => {
  const downloadOptions = getDownloadOptions(os, framework);

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
      description: "Seu build está aguardando para iniciar.",
      icon: Loader2,
      iconClass: "animate-spin text-primary",
      progress: 40,
    },
    building: {
      title: `Gerando build ${framework === "electron" ? "Electron" : "Tauri"}...`,
      description: framework === "electron"
        ? "Empacotando com Chromium e Node.js..."
        : "Compilando com Rust e WebView nativo...",
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
    idle: {
      title: "",
      description: "",
      icon: Loader2,
      iconClass: "",
      progress: 0,
    },
  };

  const config = statusConfig[status];

  const handleDownload = (option: DownloadOption) => {
    toast.success(`Download iniciado: ${appName}.${option.type}`);
    // In a real app, this would trigger the actual download
  };

  const handleDownloadAll = () => {
    toast.success("Baixando todos os instaladores...");
    downloadOptions.forEach((option, index) => {
      setTimeout(() => {
        toast.info(`Preparando: ${appName}.${option.type}`);
      }, index * 500);
    });
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

          {status !== "completed" && (
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
              {/* Framework badge */}
              <div className="flex justify-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  framework === "electron" 
                    ? "bg-blue-500/20 text-blue-400" 
                    : "bg-orange-500/20 text-orange-400"
                }`}>
                  <Package className="w-3 h-3 inline mr-1" />
                  {framework === "electron" ? "Electron" : "Tauri"}
                </span>
              </div>

              {/* Download options */}
              <div className="space-y-3">
                {downloadOptions.map((option) => (
                  <motion.div
                    key={option.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.description} • {option.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(option)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="hero"
                  className="flex-1 gap-2"
                  onClick={handleDownloadAll}
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
        </motion.div>
      </div>
    </section>
  );
};
