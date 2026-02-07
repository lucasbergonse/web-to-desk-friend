export type OS = "windows" | "macos" | "linux" | "android" | "ios";
export type Framework = "electron" | "tauri" | "capacitor" | "react-native";
export type SourceType = "url" | "github" | "zip";
export type BuildStatus = "idle" | "preparing" | "extracting" | "queued" | "building" | "completed" | "failed";
export type GeneratorStatus = "idle" | "generating" | "ready" | "failed";
export type WrapperMode = "webview" | "pwa";

export interface BuildConfig {
  appName: string;
  sourceType: SourceType;
  appUrl: string;
  zipFile: File | null;
  selectedOS: OS;
  framework: Framework;
  iconFile: File | null;
  wrapperMode: WrapperMode;
}

export interface DownloadOption {
  type: "exe" | "bat" | "msi" | "dmg" | "app" | "deb" | "appimage" | "apk" | "aab" | "ipa";
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
    platforms: ["windows", "macos", "linux"] as const,
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
    platforms: ["windows", "macos", "linux"] as const,
    outputFormats: {
      windows: ["exe", "msi"] as const,
      macos: ["dmg", "app"] as const,
      linux: ["deb", "appimage"] as const,
    },
  },
  capacitor: {
    name: "Capacitor",
    description: "Framework híbrido da Ionic para mobile",
    pros: ["Usa código web existente", "Plugins nativos", "Fácil integração"],
    cons: ["Performance menor que nativo", "Dependência de WebView"],
    platforms: ["android", "ios"] as const,
    outputFormats: {
      android: ["apk", "aab"] as const,
      ios: ["ipa"] as const,
    },
  },
  "react-native": {
    name: "React Native",
    description: "Framework nativo do Facebook/Meta",
    pros: ["Performance nativa", "Grande comunidade", "Hot reload"],
    cons: ["Curva de aprendizado", "Configuração complexa"],
    platforms: ["android", "ios"] as const,
    outputFormats: {
      android: ["apk", "aab"] as const,
      ios: ["ipa"] as const,
    },
  },
};

export const getDownloadOptions = (os: OS, framework: Framework): DownloadOption[] => {
  const isElectron = framework === "electron";
  const isCapacitor = framework === "capacitor";
  
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
    android: [
      {
        type: "apk",
        label: "APK",
        description: isCapacitor 
          ? "Instalador Android (Capacitor)" 
          : "Instalador Android (React Native)",
        size: isCapacitor ? "~15 MB" : "~20 MB",
      },
      {
        type: "aab",
        label: "Android App Bundle",
        description: "Para publicação na Play Store",
        size: isCapacitor ? "~12 MB" : "~18 MB",
      },
    ],
    ios: [
      {
        type: "ipa",
        label: "Arquivo .ipa",
        description: isCapacitor 
          ? "Aplicativo iOS (Capacitor)" 
          : "Aplicativo iOS (React Native)",
        size: isCapacitor ? "~20 MB" : "~25 MB",
      },
    ],
  };

  return options[os];
};
