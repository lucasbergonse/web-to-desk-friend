import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  wrapperMode: 'webview' | 'pwa' // webview = online, pwa = offline
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

// Template repo that contains all workflow files
const TEMPLATE_REPO = 'nicholasbergonse/web2desk-builder'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const githubPat = Deno.env.get('GITHUB_PAT')
    if (!githubPat) {
      throw new Error('GITHUB_PAT not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any

    const { appName, sourceType, sourceUrl, framework, targetOs, wrapperMode }: PrepareRequest = await req.json()

    // Validate inputs
    if (!appName?.trim()) {
      throw new Error('Nome do aplicativo é obrigatório')
    }

    if (!sourceUrl?.trim() && sourceType !== 'zip') {
      throw new Error('URL ou repositório é obrigatório')
    }

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

    // Generate wrapper project based on framework
    const projectConfig = await generateProjectConfig({
      appName,
      sourceUrl: sourceUrl || '',
      framework,
      targetOs,
      wrapperMode,
    })

    // Trigger the build on template repo
    const workflowName = getWorkflowName(framework, targetOs)
    
    // Get default branch of template repo
    const defaultBranch = await getDefaultBranch(githubPat, TEMPLATE_REPO)

    // Check if workflow exists
    const workflowExists = await checkWorkflowExists(githubPat, TEMPLATE_REPO, workflowName)
    if (!workflowExists) {
      const msg = `Workflow não encontrado no repositório template: ${workflowName}`
      await supabase
        .from('builds')
        .update({ status: 'failed', error_message: msg })
        .eq('id', build.id)

      return new Response(
        JSON.stringify({ error: msg }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Trigger workflow with all necessary inputs
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
            // Pass the generated config as JSON
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

    await supabase.from('builds').update({ 
      status: 'building'
    }).eq('id', build.id)

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

interface ProjectConfigParams {
  appName: string
  sourceUrl: string
  framework: string
  targetOs: string
  wrapperMode: string
}

async function generateProjectConfig(params: ProjectConfigParams): Promise<object> {
  const { appName, sourceUrl, framework, wrapperMode } = params
  
  const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  
  if (framework === 'electron') {
    return {
      name: sanitizedName,
      productName: appName,
      version: '1.0.0',
      main: 'main.js',
      scripts: {
        start: 'electron .',
        build: 'electron-builder'
      },
      build: {
        appId: `com.web2desk.${sanitizedName}`,
        productName: appName,
        directories: {
          output: 'dist'
        }
      },
      // Configuration for the wrapper
      wrapper: {
        mode: wrapperMode,
        url: sourceUrl,
      }
    }
  }
  
  if (framework === 'tauri') {
    return {
      package: {
        productName: appName,
        version: '1.0.0'
      },
      tauri: {
        bundle: {
          identifier: `com.web2desk.${sanitizedName}`,
          active: true,
          targets: 'all'
        },
        windows: [{
          title: appName,
          width: 1200,
          height: 800,
          resizable: true
        }]
      },
      wrapper: {
        mode: wrapperMode,
        url: sourceUrl,
      }
    }
  }
  
  if (framework === 'capacitor') {
    return {
      appId: `com.web2desk.${sanitizedName}`,
      appName: appName,
      webDir: 'www',
      server: wrapperMode === 'webview' ? {
        url: sourceUrl,
        cleartext: true
      } : undefined,
      wrapper: {
        mode: wrapperMode,
        url: sourceUrl,
      }
    }
  }
  
  // react-native
  return {
    name: sanitizedName,
    displayName: appName,
    wrapper: {
      mode: wrapperMode,
      url: sourceUrl,
    }
  }
}

async function getDefaultBranch(githubPat: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      'Authorization': `Bearer ${githubPat}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    console.warn('Failed to fetch repo info:', await res.text())
    return 'main'
  }
  const data = await res.json()
  return data.default_branch || 'main'
}

async function checkWorkflowExists(githubPat: string, repo: string, workflowName: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${workflowName}`,
    {
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )
  return res.status !== 404
}

function getWorkflowName(framework: string, os: string): string {
  const workflowMap: Record<string, Record<string, string>> = {
    electron: {
      windows: 'build-electron-windows.yml',
      macos: 'build-electron-macos.yml',
      linux: 'build-electron-linux.yml'
    },
    tauri: {
      windows: 'build-tauri-windows.yml',
      macos: 'build-tauri-macos.yml',
      linux: 'build-tauri-linux.yml'
    },
    capacitor: {
      android: 'build-capacitor-android.yml',
      ios: 'build-capacitor-ios.yml'
    },
    'react-native': {
      android: 'build-rn-android.yml',
      ios: 'build-rn-ios.yml'
    }
  }

  return workflowMap[framework]?.[os] || 'build.yml'
}
