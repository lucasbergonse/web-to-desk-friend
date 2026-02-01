export type OS = "windows" | "macos" | "linux";
export type Framework = "electron" | "tauri";
export type SourceType = "url" | "github" | "zip";
export type BuildStatus = "idle" | "extracting" | "queued" | "building" | "completed" | "failed";

export interface BuildConfig {
  appName: string;
  sourceType: SourceType;
  appUrl: string;
  zipFile: File | null;
  selectedOS: OS;
  framework: Framework;
  iconFile: File | null;
}

export interface DownloadOption {
  type: "exe" | "bat" | "msi" | "dmg" | "app" | "deb" | "appimage";
  label: string;
  description: string;
  size: string;
}

export const frameworkInfo = {
  electron: {
    name: "Electron",
    description: "Mais compatível, baseado em Chromium",
    pros: ["Alta compatibilidade", "Grande comunidade", "APIs nativas completas"],
    cons: ["Maior tamanho (~150MB)", "Maior uso de memória"],
    outputFormats: {
      windows: ["exe", "msi"] as const,
      macos: ["dmg", "app"] as const,
      linux: ["deb", "appimage"] as const,
    },
  },
  tauri: {
    name: "Tauri",
    description: "Mais leve, baseado em Rust + WebView nativo",
    pros: ["Muito leve (~10MB)", "Melhor performance", "Mais seguro"],
    cons: ["Menor compatibilidade", "Comunidade menor"],
    outputFormats: {
      windows: ["exe", "msi"] as const,
      macos: ["dmg", "app"] as const,
      linux: ["deb", "appimage"] as const,
    },
  },
};

export const getDownloadOptions = (os: OS, framework: Framework): DownloadOption[] => {
  const isElectron = framework === "electron";
  
  const options: Record<OS, DownloadOption[]> = {
    windows: [
      {
        type: "exe",
        label: "Instalador .exe",
        description: isElectron 
          ? "Instalador padrão Windows (Electron)" 
          : "Instalador compacto Windows (Tauri)",
        size: isElectron ? "~85 MB" : "~8 MB",
      },
      {
        type: "bat",
        label: "Script .bat",
        description: "Script de inicialização rápida",
        size: "~1 KB",
      },
      {
        type: "msi",
        label: "Instalador .msi",
        description: "Instalador empresarial Windows",
        size: isElectron ? "~90 MB" : "~10 MB",
      },
    ],
    macos: [
      {
        type: "dmg",
        label: "Instalador .dmg",
        description: isElectron 
          ? "Imagem de disco macOS (Electron)" 
          : "Imagem de disco compacta (Tauri)",
        size: isElectron ? "~120 MB" : "~12 MB",
      },
      {
        type: "app",
        label: "Aplicativo .app",
        description: "Bundle de aplicativo macOS",
        size: isElectron ? "~110 MB" : "~10 MB",
      },
    ],
    linux: [
      {
        type: "deb",
        label: "Pacote .deb",
        description: "Para Ubuntu/Debian",
        size: isElectron ? "~80 MB" : "~7 MB",
      },
      {
        type: "appimage",
        label: "AppImage",
        description: "Executável universal Linux",
        size: isElectron ? "~85 MB" : "~9 MB",
      },
    ],
  };

  return options[os];
};
