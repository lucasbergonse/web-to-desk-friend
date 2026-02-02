import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BuildRequest {
  appName: string
  sourceType: 'url' | 'github' | 'zip'
  sourceUrl?: string
  framework: 'electron' | 'tauri' | 'capacitor' | 'react-native'
  targetOs: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  githubRepo: string
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

    const { appName, sourceType, sourceUrl, framework, targetOs, githubRepo }: BuildRequest = await req.json()

    if (!githubRepo || !githubRepo.includes('/')) {
      throw new Error('Invalid GitHub repository format. Use owner/repo')
    }

    const { data: build, error: buildError } = await supabase
      .from('builds')
      .insert({
        app_name: appName,
        source_type: sourceType,
        source_url: sourceUrl || githubRepo,
        framework,
        target_os: targetOs,
        status: 'queued'
      })
      .select()
      .single() as { data: Build | null, error: Error | null }

    if (buildError || !build) throw buildError || new Error('Failed to create build')

    const workflowName = getWorkflowName(framework, targetOs)
    
    const triggerResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowName}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            app_name: appName,
            source_url: sourceUrl || githubRepo,
            build_id: build.id
          }
        })
      }
    )

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text()
      console.error('GitHub API error:', errorText)
      
      await supabase.from('builds').update({ 
        status: 'failed',
        error_message: `Failed to trigger workflow: ${triggerResponse.status} - ${errorText}`
      }).eq('id', build.id)
      
      throw new Error(`Failed to trigger GitHub workflow: ${triggerResponse.status}`)
    }

    await supabase.from('builds').update({ 
      status: 'building'
    }).eq('id', build.id)

    return new Response(
      JSON.stringify({ 
        buildId: build.id, 
        status: 'building',
        message: 'GitHub Actions workflow triggered successfully'
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

function getWorkflowName(framework: string, os: string): string {
  const workflowMap: Record<string, Record<string, string>> = {
    electron: {
      windows: 'electron-windows.yml',
      macos: 'electron-macos.yml',
      linux: 'electron-linux.yml'
    },
    tauri: {
      windows: 'tauri-windows.yml',
      macos: 'tauri-macos.yml',
      linux: 'tauri-linux.yml'
    },
    capacitor: {
      android: 'capacitor-android.yml',
      ios: 'capacitor-ios.yml'
    },
    'react-native': {
      android: 'react-native-android.yml',
      ios: 'react-native-ios.yml'
    }
  }

  return workflowMap[framework]?.[os] || 'build.yml'
}
