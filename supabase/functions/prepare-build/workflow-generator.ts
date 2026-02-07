// Generates GitHub Actions workflow YAML content based on framework and OS

export function generateWorkflowContent(framework: string, os: string, appName: string): string {
  const commonInputs = `
    inputs:
      app_name:
        description: 'Application name'
        required: true
      source_url:
        description: 'Source URL or GitHub repo'
        required: true
      source_type:
        description: 'Source type (url, github, zip)'
        required: true
      build_id:
        description: 'Build ID for callback'
        required: true
      wrapper_mode:
        description: 'Wrapper mode (webview or pwa)'
        required: true
      project_config:
        description: 'JSON project configuration'
        required: true`

  const envBlock = `
env:
  SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_KEY: \${{ secrets.SUPABASE_SERVICE_KEY }}`

  const notifyStep = `
      - name: Notify build complete
        if: always()
        shell: bash
        run: |
          STATUS="completed"
          if [ "\${{ job.status }}" != "success" ]; then STATUS="failed"; fi
          curl -s -X PATCH \\
            "\${{ env.SUPABASE_URL }}/rest/v1/builds?id=eq.\${{ github.event.inputs.build_id }}" \\
            -H "apikey: \${{ env.SUPABASE_SERVICE_KEY }}" \\
            -H "Authorization: Bearer \${{ env.SUPABASE_SERVICE_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d "{\\"status\\": \\"$STATUS\\", \\"completed_at\\": \\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\"}"`;

  if (framework === 'electron') {
    return generateElectronWorkflow(os, commonInputs, envBlock, notifyStep)
  }
  if (framework === 'tauri') {
    return generateTauriWorkflow(os, commonInputs, envBlock, notifyStep)
  }
  if (framework === 'capacitor') {
    return generateCapacitorWorkflow(os, commonInputs, envBlock, notifyStep)
  }
  if (framework === 'react-native') {
    return generateReactNativeWorkflow(os, commonInputs, envBlock, notifyStep)
  }

  throw new Error(`Framework não suportado: ${framework}`)
}

function getRunnerOs(os: string): string {
  const map: Record<string, string> = {
    windows: 'windows-latest',
    macos: 'macos-latest',
    linux: 'ubuntu-latest',
    android: 'ubuntu-latest',
    ios: 'macos-latest',
  }
  return map[os] || 'ubuntu-latest'
}

function electronTarget(os: string): string {
  if (os === 'windows') return '--win --x64'
  if (os === 'macos') return '--mac --x64 --arm64'
  return '--linux --x64'
}

function electronArtifactPaths(os: string): string {
  if (os === 'windows') return 'app-build/dist/*.exe\n            app-build/dist/*.msi'
  if (os === 'macos') return 'app-build/dist/*.dmg\n            app-build/dist/*.zip'
  return 'app-build/dist/*.deb\n            app-build/dist/*.AppImage'
}

function generateElectronWorkflow(os: string, inputs: string, env: string, notify: string): string {
  const runner = getRunnerOs(os)
  const target = electronTarget(os)
  const artifacts = electronArtifactPaths(os)
  const shell = os === 'windows' ? '\n        shell: bash' : ''

  return `name: Build Electron ${os.charAt(0).toUpperCase() + os.slice(1)}

on:
  workflow_dispatch:${inputs}
${env}

jobs:
  build:
    runs-on: ${runner}

    steps:
      - name: Checkout template
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Prepare Electron wrapper${shell}
        run: |
          mkdir -p app-build && cd app-build
          cat > package.json << EOF
          {
            "name": "\${{ github.event.inputs.app_name }}",
            "version": "1.0.0",
            "main": "main.js",
            "scripts": { "start": "electron .", "build": "electron-builder ${target}" },
            "devDependencies": { "electron": "^28.0.0", "electron-builder": "^24.0.0" },
            "build": {
              "appId": "com.web2desk.\${{ github.event.inputs.app_name }}",
              "productName": "\${{ github.event.inputs.app_name }}",
              "directories": { "output": "dist" }
            }
          }
          EOF

          if [ "\${{ github.event.inputs.wrapper_mode }}" = "webview" ]; then
            cat > main.js << 'MAINJS'
          const { app, BrowserWindow } = require('electron');
          function createWindow() {
            const win = new BrowserWindow({ width: 1200, height: 800, webPreferences: { nodeIntegration: false, contextIsolation: true } });
            win.loadURL('PLACEHOLDER_URL');
          }
          app.whenReady().then(createWindow);
          app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
          MAINJS
            sed -i${os === 'macos' ? " ''" : ''} "s|PLACEHOLDER_URL|\${{ github.event.inputs.source_url }}|g" main.js
          else
            cat > main.js << 'MAINJS'
          const { app, BrowserWindow } = require('electron');
          const path = require('path');
          function createWindow() {
            const win = new BrowserWindow({ width: 1200, height: 800, webPreferences: { nodeIntegration: false, contextIsolation: true } });
            win.loadFile(path.join(__dirname, 'web', 'index.html'));
          }
          app.whenReady().then(createWindow);
          app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
          MAINJS
          fi

      - name: Install dependencies
        working-directory: app-build
        run: npm install

      - name: Build Electron app
        working-directory: app-build
        run: npm run build
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${os}-installers
          path: |
            ${artifacts}
          retention-days: 7
${notify}`
}

function tauriTargets(os: string): string {
  if (os === 'windows') return '["msi", "nsis"]'
  if (os === 'macos') return '["dmg"]'
  return '["deb", "appimage"]'
}

function tauriArtifactPaths(os: string): string {
  if (os === 'windows') return 'app-build/src-tauri/target/release/bundle/msi/*.msi\n            app-build/src-tauri/target/release/bundle/nsis/*.exe'
  if (os === 'macos') return 'app-build/src-tauri/target/release/bundle/dmg/*.dmg'
  return 'app-build/src-tauri/target/release/bundle/deb/*.deb\n            app-build/src-tauri/target/release/bundle/appimage/*.AppImage'
}

function generateTauriWorkflow(os: string, inputs: string, env: string, notify: string): string {
  const runner = getRunnerOs(os)
  const targets = tauriTargets(os)
  const artifacts = tauriArtifactPaths(os)
  const shell = os === 'windows' ? '\n        shell: bash' : ''

  const linuxDeps = os === 'linux' ? `
      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
` : ''

  return `name: Build Tauri ${os.charAt(0).toUpperCase() + os.slice(1)}

on:
  workflow_dispatch:${inputs}
${env}

jobs:
  build:
    runs-on: ${runner}

    steps:
      - name: Checkout template
        uses: actions/checkout@v4
${linuxDeps}
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Prepare Tauri wrapper${shell}
        run: |
          mkdir -p app-build/src app-build/src-tauri/src
          cd app-build
          echo "<html><body><h1>\${{ github.event.inputs.app_name }}</h1></body></html>" > src/index.html
          echo '{ "name": "web2desk-app", "version": "1.0.0", "scripts": {} }' > package.json

          cat > src-tauri/tauri.conf.json << EOF
          {
            "build": { "distDir": "../src", "beforeBuildCommand": "" },
            "package": { "productName": "\${{ github.event.inputs.app_name }}", "version": "1.0.0" },
            "tauri": {
              "bundle": { "identifier": "com.web2desk.app", "active": true, "targets": ${targets} },
              "windows": [{ "title": "\${{ github.event.inputs.app_name }}", "width": 1200, "height": 800 }],
              "security": { "csp": null }
            }
          }
          EOF

          cat > src-tauri/src/main.rs << 'EOF'
          #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
          fn main() { tauri::Builder::default().run(tauri::generate_context!()).expect("error running app"); }
          EOF

          cat > src-tauri/Cargo.toml << 'EOF'
          [package]
          name = "web2desk-app"
          version = "1.0.0"
          edition = "2021"
          [dependencies]
          tauri = { version = "1", features = ["shell-open"] }
          serde = { version = "1", features = ["derive"] }
          serde_json = "1"
          [build-dependencies]
          tauri-build = { version = "1", features = [] }
          EOF

          cat > src-tauri/build.rs << 'EOF'
          fn main() { tauri_build::build() }
          EOF

      - name: Build Tauri app
        working-directory: app-build
        run: npx @tauri-apps/cli@1 build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${os}-installers
          path: |
            ${artifacts}
          retention-days: 7
${notify}`
}

function generateCapacitorWorkflow(os: string, inputs: string, env: string, notify: string): string {
  const runner = getRunnerOs(os)
  const isAndroid = os === 'android'

  const platformSetup = isAndroid ? `
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3` : `
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode.app`

  const platformDep = isAndroid ? '@capacitor/android' : '@capacitor/ios'
  const platformName = isAndroid ? 'android' : 'ios'

  const buildSteps = isAndroid ? `
      - name: Build APK
        working-directory: app-build/android
        run: ./gradlew assembleRelease

      - name: Build AAB
        working-directory: app-build/android
        run: ./gradlew bundleRelease` : `
      - name: Install CocoaPods
        working-directory: app-build/ios/App
        run: pod install

      - name: Build IPA (unsigned)
        working-directory: app-build
        run: |
          xcodebuild -workspace ios/App/App.xcworkspace \\
            -scheme App -configuration Release \\
            -archivePath build/App.xcarchive archive \\
            CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

      - name: Create IPA
        working-directory: app-build
        run: |
          mkdir -p build/Payload
          cp -r build/App.xcarchive/Products/Applications/App.app build/Payload/
          cd build && zip -r App.ipa Payload`

  const artifacts = isAndroid
    ? 'app-build/android/app/build/outputs/apk/release/*.apk\n            app-build/android/app/build/outputs/bundle/release/*.aab'
    : 'app-build/build/*.ipa'

  return `name: Build Capacitor ${os.charAt(0).toUpperCase() + os.slice(1)}

on:
  workflow_dispatch:${inputs}
${env}

jobs:
  build:
    runs-on: ${runner}

    steps:
      - name: Checkout template
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
${platformSetup}

      - name: Prepare Capacitor wrapper
        run: |
          mkdir -p app-build/www && cd app-build
          cat > www/index.html << HTML
          <!DOCTYPE html>
          <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
          <title>\${{ github.event.inputs.app_name }}</title></head>
          <body><script>window.location='\${{ github.event.inputs.source_url }}';</script></body></html>
          HTML
          echo '\${{ github.event.inputs.project_config }}' > capacitor.config.json
          cat > package.json << 'EOF'
          { "name": "capacitor-app", "version": "1.0.0", "dependencies": { "@capacitor/core": "^5.0.0", "${platformDep}": "^5.0.0", "@capacitor/cli": "^5.0.0" } }
          EOF

      - name: Install dependencies
        working-directory: app-build
        run: npm install

      - name: Add platform
        working-directory: app-build
        run: npx cap add ${platformName}

      - name: Sync Capacitor
        working-directory: app-build
        run: npx cap sync ${platformName}
${buildSteps}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${os}-installers
          path: |
            ${artifacts}
          retention-days: 7
${notify}`
}

function generateReactNativeWorkflow(os: string, inputs: string, env: string, notify: string): string {
  const runner = getRunnerOs(os)
  const isAndroid = os === 'android'

  const platformSetup = isAndroid ? `
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3` : `
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode.app`

  const buildSteps = isAndroid ? `
      - name: Build APK
        working-directory: WebViewApp/android
        run: ./gradlew assembleRelease

      - name: Build AAB
        working-directory: WebViewApp/android
        run: ./gradlew bundleRelease` : `
      - name: Install CocoaPods
        working-directory: WebViewApp/ios
        run: pod install

      - name: Build IPA (unsigned)
        working-directory: WebViewApp
        run: |
          xcodebuild -workspace ios/WebViewApp.xcworkspace \\
            -scheme WebViewApp -configuration Release \\
            -archivePath build/App.xcarchive archive \\
            CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

      - name: Create IPA
        working-directory: WebViewApp
        run: |
          mkdir -p build/Payload
          cp -r build/App.xcarchive/Products/Applications/WebViewApp.app build/Payload/
          cd build && zip -r App.ipa Payload`

  const artifacts = isAndroid
    ? 'WebViewApp/android/app/build/outputs/apk/release/*.apk\n            WebViewApp/android/app/build/outputs/bundle/release/*.aab'
    : 'WebViewApp/build/*.ipa'

  const sedCmd = isAndroid ? 'sed -i' : "sed -i ''"

  return `name: Build React Native ${os.charAt(0).toUpperCase() + os.slice(1)}

on:
  workflow_dispatch:${inputs}
${env}

jobs:
  build:
    runs-on: ${runner}

    steps:
      - name: Checkout template
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
${platformSetup}

      - name: Create React Native WebView app
        run: |
          npx react-native init WebViewApp --version 0.73.0
          cd WebViewApp
          npm install react-native-webview
          cat > App.tsx << 'EOF'
          import React from 'react';
          import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
          import { WebView } from 'react-native-webview';
          const App = () => (
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="dark-content" />
              <WebView source={{ uri: 'PLACEHOLDER_URL' }} style={styles.webview} javaScriptEnabled domStorageEnabled />
            </SafeAreaView>
          );
          const styles = StyleSheet.create({ container: { flex: 1 }, webview: { flex: 1 } });
          export default App;
          EOF
          ${sedCmd} "s|PLACEHOLDER_URL|\${{ github.event.inputs.source_url }}|g" App.tsx
${buildSteps}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${os}-installers
          path: |
            ${artifacts}
          retention-days: 7
${notify}`
}
