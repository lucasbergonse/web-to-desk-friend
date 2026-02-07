import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateWorkflowContent } from './workflow-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrepareRequest {
  appName: string
  sourceType: 'url' | 'github' | 'zip'
  sourceUrl?: string
  framework: 'electron' | 'tauri' | 'capacitor' | 'react-native'
  targetOs: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  wrapperMode: 'webview' | 'pwa'
}

interface Build {
  id: string
  app_name: string
  source_type: string
  source_url: string | null
  framework: string
  target_os: string
  status: string
  error_message: string | null
}

const TEMPLATE_REPO = 'nicholasbergonse/web2desk-builder'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const githubPat = Deno.env.get('GITHUB_PAT')
    if (!githubPat) throw new Error('GITHUB_PAT not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any

    const { appName, sourceType, sourceUrl, framework, targetOs, wrapperMode }: PrepareRequest = await req.json()

    if (!appName?.trim()) throw new Error('Nome do aplicativo é obrigatório')
    if (!sourceUrl?.trim() && sourceType !== 'zip') throw new Error('URL ou repositório é obrigatório')

    // Create build record
    const { data: build, error: buildError } = await supabase
      .from('builds')
      .insert({
        app_name: appName,
        source_type: sourceType,
        source_url: sourceUrl || null,
        framework,
        target_os: targetOs,
        status: 'preparing'
      })
      .select()
      .single() as { data: Build | null, error: Error | null }

    if (buildError || !build) throw buildError || new Error('Failed to create build')

    // Generate project config
    const projectConfig = generateProjectConfig({ appName, sourceUrl: sourceUrl || '', framework, targetOs, wrapperMode })

    const workflowName = getWorkflowName(framework, targetOs)
    const defaultBranch = await getDefaultBranch(githubPat, TEMPLATE_REPO)

    // Ensure workflow exists — create it if missing
    const workflowExists = await checkWorkflowExists(githubPat, TEMPLATE_REPO, workflowName)
    if (!workflowExists) {
      console.log(`Workflow ${workflowName} not found, creating it...`)
      await createWorkflowFile(githubPat, TEMPLATE_REPO, workflowName, framework, targetOs, appName, defaultBranch)
      // Wait a moment for GitHub to process the new file
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Trigger workflow
    const triggerResponse = await fetch(
      `https://api.github.com/repos/${TEMPLATE_REPO}/actions/workflows/${workflowName}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          ref: defaultBranch,
          inputs: {
            app_name: appName,
            source_url: sourceUrl || '',
            source_type: sourceType,
            build_id: build.id,
            wrapper_mode: wrapperMode,
            project_config: JSON.stringify(projectConfig),
          }
        })
      }
    )

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text()
      console.error('GitHub API error:', errorText)
      await supabase.from('builds').update({
        status: 'failed',
        error_message: `Falha ao iniciar workflow: ${triggerResponse.status}`
      }).eq('id', build.id)
      throw new Error(`Failed to trigger workflow: ${triggerResponse.status}`)
    }

    await supabase.from('builds').update({ status: 'building' }).eq('id', build.id)

    return new Response(
      JSON.stringify({
        buildId: build.id,
        status: 'building',
        message: 'Build iniciado com sucesso! O processamento pode levar alguns minutos.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// --- Helper Functions ---

interface ProjectConfigParams {
  appName: string
  sourceUrl: string
  framework: string
  targetOs: string
  wrapperMode: string
}

function generateProjectConfig(params: ProjectConfigParams): object {
  const { appName, sourceUrl, framework, wrapperMode } = params
  const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')

  if (framework === 'electron') {
    return {
      name: sanitizedName, productName: appName, version: '1.0.0', main: 'main.js',
      build: { appId: `com.web2desk.${sanitizedName}`, productName: appName },
      wrapper: { mode: wrapperMode, url: sourceUrl }
    }
  }
  if (framework === 'tauri') {
    return {
      package: { productName: appName, version: '1.0.0' },
      tauri: {
        bundle: { identifier: `com.web2desk.${sanitizedName}`, active: true },
        windows: [{ title: appName, width: 1200, height: 800, resizable: true }]
      },
      wrapper: { mode: wrapperMode, url: sourceUrl }
    }
  }
  if (framework === 'capacitor') {
    return {
      appId: `com.web2desk.${sanitizedName}`, appName,
      webDir: 'www',
      server: wrapperMode === 'webview' ? { url: sourceUrl, cleartext: true } : undefined,
      wrapper: { mode: wrapperMode, url: sourceUrl }
    }
  }
  return { name: sanitizedName, displayName: appName, wrapper: { mode: wrapperMode, url: sourceUrl } }
}

async function getDefaultBranch(githubPat: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { 'Authorization': `Bearer ${githubPat}`, 'Accept': 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' },
  })
  if (!res.ok) { console.warn('Failed to fetch repo info:', await res.text()); return 'main' }
  const data = await res.json()
  return data.default_branch || 'main'
}

async function checkWorkflowExists(githubPat: string, repo: string, workflowName: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/.github/workflows/${workflowName}`,
    { headers: { 'Authorization': `Bearer ${githubPat}`, 'Accept': 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' } }
  )
  return res.ok
}

async function createWorkflowFile(
  githubPat: string, repo: string, workflowName: string,
  framework: string, os: string, appName: string, branch: string
): Promise<void> {
  const content = generateWorkflowContent(framework, os, appName)
  const encoded = btoa(unescape(encodeURIComponent(content)))

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/.github/workflows/${workflowName}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        message: `Add ${workflowName} workflow`,
        content: encoded,
        branch,
      })
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`Failed to create workflow ${workflowName}:`, errorText)
    throw new Error(`Falha ao criar workflow: ${res.status}`)
  }

  console.log(`Workflow ${workflowName} created successfully`)
}

function getWorkflowName(framework: string, os: string): string {
  const workflowMap: Record<string, Record<string, string>> = {
    electron: { windows: 'build-electron-windows.yml', macos: 'build-electron-macos.yml', linux: 'build-electron-linux.yml' },
    tauri: { windows: 'build-tauri-windows.yml', macos: 'build-tauri-macos.yml', linux: 'build-tauri-linux.yml' },
    capacitor: { android: 'build-capacitor-android.yml', ios: 'build-capacitor-ios.yml' },
    'react-native': { android: 'build-rn-android.yml', ios: 'build-rn-ios.yml' }
  }
  return workflowMap[framework]?.[os] || 'build.yml'
}
