import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Monitor, Apple, Laptop, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";

type OS = "windows" | "macos" | "linux";
type Framework = "electron" | "tauri";
type BuildStatus = "idle" | "queued" | "building" | "completed";

export const ConversionForm = () => {
  const [appName, setAppName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [selectedOS, setSelectedOS] = useState<OS>("windows");
  const [framework, setFramework] = useState<Framework>("electron");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione um arquivo de imagem.");
        return;
      }
      setIconFile(file);
      toast.success("Ícone carregado com sucesso!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName.trim() || !appUrl.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Simulate build process
    setBuildStatus("queued");

    setTimeout(() => setBuildStatus("building"), 2000);
    setTimeout(() => {
      setBuildStatus("completed");
      toast.success("Build concluído! Seu instalador está pronto.");
    }, 6000);
  };

  const osOptions = [
    { value: "windows", label: "Windows", icon: Monitor },
    { value: "macos", label: "macOS", icon: Apple },
    { value: "linux", label: "Linux", icon: Laptop },
  ];

  const frameworkOptions = [
    { value: "electron", label: "Electron", description: "Mais compatível" },
    { value: "tauri", label: "Tauri", description: "Mais leve" },
  ];

  if (buildStatus !== "idle") {
    return <BuildStatusCard status={buildStatus} appName={appName} onReset={() => setBuildStatus("idle")} />;
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
              <Label htmlFor="appName" className="text-foreground">Nome do Aplicativo *</Label>
              <Input
                id="appName"
                placeholder="Meu App Incrível"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            {/* App URL */}
            <div className="space-y-2">
              <Label htmlFor="appUrl" className="text-foreground">URL do App ou Repositório GitHub *</Label>
              <Input
                id="appUrl"
                placeholder="https://meuapp.com ou https://github.com/user/repo"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                O app será carregado via WebView, sem modificação de código.
              </p>
            </div>

            {/* Icon Upload */}
            <div className="space-y-2">
              <Label className="text-foreground">Ícone do App (opcional)</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {iconFile ? (
                  <p className="text-primary text-sm">{iconFile.name}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Clique para fazer upload (PNG, ICO, ICNS)
                  </p>
                )}
              </div>
            </div>

            {/* OS Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">Sistema Operacional *</Label>
              <div className="grid grid-cols-3 gap-3">
                {osOptions.map((os) => (
                  <button
                    key={os.value}
                    type="button"
                    onClick={() => setSelectedOS(os.value as OS)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      selectedOS === os.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <os.icon className={`w-6 h-6 ${selectedOS === os.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${selectedOS === os.value ? "text-foreground" : "text-muted-foreground"}`}>
                      {os.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Framework Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">Framework Desktop</Label>
              <RadioGroup value={framework} onValueChange={(v) => setFramework(v as Framework)}>
                <div className="grid grid-cols-2 gap-3">
                  {frameworkOptions.map((fw) => (
                    <label
                      key={fw.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        framework === fw.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={fw.value} />
                      <div>
                        <p className="font-medium text-foreground">{fw.label}</p>
                        <p className="text-xs text-muted-foreground">{fw.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Gerar Instalador
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

interface BuildStatusCardProps {
  status: BuildStatus;
  appName: string;
  onReset: () => void;
}

const BuildStatusCard = ({ status, appName, onReset }: BuildStatusCardProps) => {
  const statusConfig = {
    queued: {
      title: "Na fila...",
      description: "Seu build está aguardando para iniciar.",
      icon: Loader2,
      iconClass: "animate-spin text-primary",
    },
    building: {
      title: "Gerando build...",
      description: "Estamos encapsulando seu app web em um container desktop.",
      icon: Loader2,
      iconClass: "animate-spin text-primary",
    },
    completed: {
      title: "Build concluído!",
      description: "Seu instalador está pronto para download.",
      icon: CheckCircle2,
      iconClass: "text-green-500",
    },
    idle: {
      title: "",
      description: "",
      icon: Loader2,
      iconClass: "",
    },
  };

  const config = statusConfig[status];

  const handleDownload = () => {
    toast.success("Download iniciado! O instalador será baixado em breve.");
  };

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto glass-card rounded-2xl p-8 text-center"
        >
          <config.icon className={`w-16 h-16 mx-auto mb-6 ${config.iconClass}`} />
          <h3 className="text-2xl font-bold mb-2">{config.title}</h3>
          <p className="text-muted-foreground mb-2">{config.description}</p>
          <p className="text-sm text-primary mb-6">{appName}</p>

          {status === "completed" && (
            <div className="space-y-3">
              <Button variant="hero" size="lg" className="w-full" onClick={handleDownload}>
                Baixar Instalador
              </Button>
              <Button variant="ghost" onClick={onReset} className="w-full">
                Criar outro app
              </Button>
            </div>
          )}

          {status !== "completed" && (
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: status === "building" ? "70%" : "30%" }}
                transition={{ duration: 2 }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
