// Project template generators for each framework

interface TemplateParams {
  appName: string
  sanitizedName: string
  sourceUrl: string
  targetOs: string
  wrapperMode: 'webview' | 'pwa'
}

export type ProjectFiles = Record<string, string>

export function generateElectronFiles(params: TemplateParams): ProjectFiles {
  const { appName, sanitizedName, sourceUrl, targetOs, wrapperMode } = params
  const files: ProjectFiles = {}

  const buildTarget =
    targetOs === 'windows' ? 'build:win' :
    targetOs === 'macos' ? 'build:mac' : 'build:linux'

  const buildCmd =
    targetOs === 'windows' ? 'electron-builder --win --x64' :
    targetOs === 'macos' ? 'electron-builder --mac --x64 --arm64' :
    'electron-builder --linux --x64'

  files['package.json'] = JSON.stringify({
    name: sanitizedName,
    version: '1.0.0',
    main: 'main.js',
    scripts: {
      start: 'electron .',
      [buildTarget]: buildCmd,
      build: buildCmd,
    },
    devDependencies: {
      electron: '^28.0.0',
      'electron-builder': '^24.0.0',
    },
    build: {
      appId: `com.web2desk.${sanitizedName}`,
      productName: appName,
      directories: { output: 'dist' },
      win: { target: ['nsis', 'msi'] },
      mac: { target: ['dmg', 'zip'] },
      linux: { target: ['deb', 'AppImage'] },
    },
  }, null, 2)

  if (wrapperMode === 'webview') {
    files['main.js'] = `const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('${sourceUrl}');

  // Remover menu padrão do Electron
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`
  } else {
    files['main.js'] = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, 'web', 'index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`
    files['web/index.html'] = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${appName}</h1>
    <p>Substitua esta pasta "web" pelos arquivos do seu site para modo offline.</p>
  </div>
</body>
</html>`
  }

  const osInstructions = targetOs === 'windows'
    ? 'O instalador será gerado em `dist/` (.exe e .msi).'
    : targetOs === 'macos'
      ? 'O instalador será gerado em `dist/` (.dmg).'
      : 'O instalador será gerado em `dist/` (.deb e .AppImage).'

  files['README.md'] = `# ${appName}

Aplicativo desktop gerado pelo Web2Desktop.

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/) instalado
${targetOs === 'linux' ? '- Pacotes de desenvolvimento: `sudo apt install dpkg fakeroot`\n' : ''}
## Como gerar o instalador

1. Abra o terminal nesta pasta
2. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`
3. Gere o instalador:
   \`\`\`bash
   npm run build
   \`\`\`

${osInstructions}

## Testar localmente

\`\`\`bash
npm start
\`\`\`

## Configuração

- **Framework:** Electron
- **Modo:** ${wrapperMode === 'webview' ? 'WebView (carrega URL online)' : 'PWA Offline (arquivos locais)'}
${wrapperMode === 'webview' ? `- **URL:** ${sourceUrl}` : '- **Arquivos:** Coloque seu site na pasta `web/`'}
- **Plataforma alvo:** ${targetOs}
`

  return files
}

export function generateTauriFiles(params: TemplateParams): ProjectFiles {
  const { appName, sanitizedName, sourceUrl, targetOs, wrapperMode } = params
  const files: ProjectFiles = {}

  const targets =
    targetOs === 'windows' ? '["msi", "nsis"]' :
    targetOs === 'macos' ? '["dmg"]' : '["deb", "appimage"]'

  files['package.json'] = JSON.stringify({
    name: sanitizedName,
    version: '1.0.0',
    scripts: {
      dev: 'tauri dev',
      build: 'tauri build',
    },
    devDependencies: {
      '@tauri-apps/cli': '^1.5.0',
    },
  }, null, 2)

  const windowUrl = wrapperMode === 'webview'
    ? `"url": "${sourceUrl}"`
    : `"distDir": "../src"`

  files['src-tauri/tauri.conf.json'] = JSON.stringify({
    build: {
      ...(wrapperMode === 'webview' ? {} : { distDir: '../src' }),
      beforeBuildCommand: '',
    },
    package: {
      productName: appName,
      version: '1.0.0',
    },
    tauri: {
      bundle: {
        identifier: `com.web2desk.${sanitizedName}`,
        active: true,
        targets: JSON.parse(targets),
      },
      windows: [{
        title: appName,
        width: 1200,
        height: 800,
        ...(wrapperMode === 'webview' ? { url: sourceUrl } : {}),
      }],
      security: { csp: null },
    },
  }, null, 2)

  files['src-tauri/Cargo.toml'] = `[package]
name = "${sanitizedName}"
version = "1.0.0"
edition = "2021"

[dependencies]
tauri = { version = "1", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[build-dependencies]
tauri-build = { version = "1", features = [] }
`

  files['src-tauri/src/main.rs'] = `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`

  files['src-tauri/build.rs'] = `fn main() {
    tauri_build::build()
}
`

  files['src/index.html'] = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: #fafafa; }
    h1 { font-size: 2rem; }
  </style>
</head>
<body>
  <h1>${appName}</h1>
</body>
</html>`

  const linuxDeps = targetOs === 'linux'
    ? '\n- Dependências de sistema:\n  ```bash\n  sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf\n  ```\n'
    : ''

  files['README.md'] = `# ${appName}

Aplicativo desktop gerado pelo Web2Desktop com Tauri (Rust + WebView nativo).

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [Rust](https://rustup.rs/) instalado
${linuxDeps}
## Como gerar o instalador

1. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`
2. Gere o instalador:
   \`\`\`bash
   npx tauri build
   \`\`\`

O instalador será gerado em \`src-tauri/target/release/bundle/\`.

## Testar localmente

\`\`\`bash
npx tauri dev
\`\`\`

## Configuração

- **Framework:** Tauri (Rust + WebView nativo)
- **Modo:** ${wrapperMode === 'webview' ? 'WebView Online' : 'Offline'}
${wrapperMode === 'webview' ? `- **URL:** ${sourceUrl}` : ''}
- **Plataforma alvo:** ${targetOs}
- **Tamanho estimado:** ~8-12 MB
`

  return files
}

export function generateCapacitorFiles(params: TemplateParams): ProjectFiles {
  const { appName, sanitizedName, sourceUrl, targetOs, wrapperMode } = params
  const files: ProjectFiles = {}
  const isAndroid = targetOs === 'android'
  const platform = isAndroid ? 'android' : 'ios'

  files['package.json'] = JSON.stringify({
    name: sanitizedName,
    version: '1.0.0',
    scripts: {
      build: `cap sync ${platform}`,
    },
    dependencies: {
      '@capacitor/core': '^5.0.0',
      [`@capacitor/${platform}`]: '^5.0.0',
      '@capacitor/cli': '^5.0.0',
    },
  }, null, 2)

  const capConfig: Record<string, unknown> = {
    appId: `com.web2desk.${sanitizedName}`,
    appName,
    webDir: 'www',
  }

  if (wrapperMode === 'webview' && sourceUrl) {
    capConfig.server = { url: sourceUrl, cleartext: true }
  }

  files['capacitor.config.json'] = JSON.stringify(capConfig, null, 2)

  files['www/index.html'] = wrapperMode === 'webview'
    ? `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${appName}</title></head>
<body><script>window.location='${sourceUrl}';</script></body>
</html>`
    : `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body { margin: 0; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: #fff; }
    h1 { font-size: 1.5rem; }
  </style>
</head>
<body>
  <h1>${appName}</h1>
  <p>Substitua esta pasta "www" pelos arquivos do seu site.</p>
</body>
</html>`

  const buildInstructions = isAndroid
    ? `3. Adicione a plataforma Android:
   \`\`\`bash
   npx cap add android
   npx cap sync android
   \`\`\`
4. Gere o APK:
   \`\`\`bash
   cd android && ./gradlew assembleRelease
   \`\`\`
   O APK será gerado em \`android/app/build/outputs/apk/release/\`.`
    : `3. Adicione a plataforma iOS:
   \`\`\`bash
   npx cap add ios
   npx cap sync ios
   \`\`\`
4. Abra no Xcode:
   \`\`\`bash
   npx cap open ios
   \`\`\`
   Compile e gere o IPA pelo Xcode (necessário macOS).`

  files['README.md'] = `# ${appName}

Aplicativo mobile gerado pelo Web2Desktop com Capacitor.

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
${isAndroid ? '- [Android Studio](https://developer.android.com/studio) com SDK instalado\n- JDK 17+' : '- macOS com [Xcode](https://developer.apple.com/xcode/) instalado\n- CocoaPods: `sudo gem install cocoapods`'}

## Como gerar o instalador

1. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`
2. Prepare os arquivos web (se necessário):
   Coloque seus arquivos na pasta \`www/\`.
${buildInstructions}

## Configuração

- **Framework:** Capacitor
- **Modo:** ${wrapperMode === 'webview' ? 'WebView Online' : 'Offline'}
${wrapperMode === 'webview' ? `- **URL:** ${sourceUrl}` : ''}
- **Plataforma:** ${isAndroid ? 'Android' : 'iOS'}
`

  return files
}

export function generateReactNativeFiles(params: TemplateParams): ProjectFiles {
  const { appName, sanitizedName, sourceUrl, targetOs } = params
  const files: ProjectFiles = {}
  const isAndroid = targetOs === 'android'

  files['App.tsx'] = `import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" />
    <WebView
      source={{ uri: '${sourceUrl}' }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
    />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});

export default App;
`

  const buildInstructions = isAndroid
    ? `4. Gere o APK:
   \`\`\`bash
   cd android && ./gradlew assembleRelease
   \`\`\`
   O APK será gerado em \`android/app/build/outputs/apk/release/\`.`
    : `4. Instale dependências iOS:
   \`\`\`bash
   cd ios && pod install && cd ..
   \`\`\`
5. Abra no Xcode:
   \`\`\`bash
   npx react-native run-ios
   \`\`\`
   Ou compile pelo Xcode para gerar o IPA.`

  files['README.md'] = `# ${appName}

Aplicativo mobile gerado pelo Web2Desktop com React Native.

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
${isAndroid ? '- [Android Studio](https://developer.android.com/studio) com SDK configurado\n- JDK 17+' : '- macOS com [Xcode](https://developer.apple.com/xcode/) instalado\n- CocoaPods: `sudo gem install cocoapods`'}

## Como configurar

1. Crie o projeto React Native:
   \`\`\`bash
   npx react-native init ${appName.replace(/[^a-zA-Z0-9]/g, '')} --version 0.73.0
   \`\`\`
2. Copie o arquivo \`App.tsx\` deste pacote para a pasta do projeto criado (substituindo o existente).
3. Instale a dependência WebView:
   \`\`\`bash
   cd ${appName.replace(/[^a-zA-Z0-9]/g, '')}
   npm install react-native-webview
   \`\`\`
${buildInstructions}

## Configuração

- **Framework:** React Native
- **URL:** ${sourceUrl}
- **Plataforma:** ${isAndroid ? 'Android' : 'iOS'}
`

  return files
}
