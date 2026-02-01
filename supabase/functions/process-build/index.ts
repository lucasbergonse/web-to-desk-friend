import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as SupabaseClient<any>

    const { appName, sourceType, sourceUrl, framework, targetOs }: BuildRequest = await req.json()

    // Create build record
    const { data: build, error: buildError } = await supabase
      .from('builds')
      .insert({
        app_name: appName,
        source_type: sourceType,
        source_url: sourceUrl,
        framework,
        target_os: targetOs,
        status: 'queued'
      })
      .select()
      .single()

    if (buildError) throw buildError

    // Process build synchronously (edge functions have limited runtime)
    await processBuild(supabase, build.id, appName, framework, targetOs)

    return new Response(
      JSON.stringify({ buildId: build.id, status: 'queued' }),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processBuild(
  supabase: SupabaseClient<any>,
  buildId: string,
  appName: string,
  framework: 'electron' | 'tauri' | 'capacitor' | 'react-native',
  targetOs: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
) {
  try {
    // Update to extracting
    await supabase.from('builds').update({ status: 'extracting' }).eq('id', buildId)
    await delay(1000)

    // Update to building
    await supabase.from('builds').update({ status: 'building' }).eq('id', buildId)
    await delay(2000)

    // Generate artifacts based on OS and framework
    const artifacts = getArtifacts(framework, targetOs)
    
    for (const artifact of artifacts) {
      // Create a simple placeholder file for the artifact
      const content = generatePlaceholderContent(appName, artifact.type, framework)
      const fileName = `${appName.replace(/\s+/g, '-').toLowerCase()}.${artifact.type}`
      const storagePath = `${buildId}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('installers')
        .upload(storagePath, new Blob([content], { type: 'application/octet-stream' }))

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('installers')
        .getPublicUrl(storagePath)

      // Create artifact record
      await supabase.from('build_artifacts').insert({
        build_id: buildId,
        file_type: artifact.type,
        file_name: fileName,
        file_size: artifact.size,
        storage_path: storagePath,
        download_url: urlData.publicUrl
      })
    }

    // Mark as completed
    await supabase.from('builds').update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', buildId)

  } catch (err) {
    console.error('Build process error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await supabase.from('builds').update({ 
      status: 'failed',
      error_message: errorMessage
    }).eq('id', buildId)
  }
}

function getArtifacts(framework: 'electron' | 'tauri' | 'capacitor' | 'react-native', os: 'windows' | 'macos' | 'linux' | 'android' | 'ios') {
  const isElectron = framework === 'electron'
  const isCapacitor = framework === 'capacitor'
  
  const artifacts: Record<string, { type: string; size: string }[]> = {
    windows: [
      { type: 'exe', size: isElectron ? '~85 MB' : '~8 MB' },
      { type: 'bat', size: '~1 KB' },
      { type: 'msi', size: isElectron ? '~90 MB' : '~10 MB' },
    ],
    macos: [
      { type: 'dmg', size: isElectron ? '~120 MB' : '~12 MB' },
      { type: 'app', size: isElectron ? '~110 MB' : '~10 MB' },
    ],
    linux: [
      { type: 'deb', size: isElectron ? '~80 MB' : '~7 MB' },
      { type: 'appimage', size: isElectron ? '~85 MB' : '~9 MB' },
    ],
    android: [
      { type: 'apk', size: isCapacitor ? '~15 MB' : '~20 MB' },
      { type: 'aab', size: isCapacitor ? '~12 MB' : '~18 MB' },
    ],
    ios: [
      { type: 'ipa', size: isCapacitor ? '~20 MB' : '~25 MB' },
    ],
  }

  return artifacts[os] || []
}

function generatePlaceholderContent(appName: string, fileType: string, framework: string): string {
  if (fileType === 'bat') {
    return `@echo off
REM ${appName} Launcher
REM Generated with ${framework}
echo Starting ${appName}...
start "" "%~dp0${appName}.exe"
`
  }

  // For other file types, generate a simple placeholder
  return `${appName} - ${framework} Application
File Type: ${fileType}
Generated: ${new Date().toISOString()}

This is a demo installer file.
In a production environment, this would be the actual compiled application.
`
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
