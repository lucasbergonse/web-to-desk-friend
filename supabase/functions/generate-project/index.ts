import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { zipSync } from 'https://esm.sh/fflate@0.8.2?target=deno'
import {
  generateElectronFiles,
  generateTauriFiles,
  generateCapacitorFiles,
  generateReactNativeFiles,
} from './templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  appName: string
  sourceType: 'url' | 'github' | 'zip'
  sourceUrl?: string
  framework: 'electron' | 'tauri' | 'capacitor' | 'react-native'
  targetOs: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  wrapperMode: 'webview' | 'pwa'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { appName, sourceUrl, framework, targetOs, wrapperMode }: GenerateRequest = await req.json()

    if (!appName?.trim()) {
      throw new Error('Nome do aplicativo é obrigatório')
    }

    const sanitizedName = appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'app'

    const templateParams = {
      appName,
      sanitizedName,
      sourceUrl: sourceUrl || '',
      targetOs,
      wrapperMode,
    }

    // Generate project files based on framework
    let projectFiles: Record<string, string>

    switch (framework) {
      case 'electron':
        projectFiles = generateElectronFiles(templateParams)
        break
      case 'tauri':
        projectFiles = generateTauriFiles(templateParams)
        break
      case 'capacitor':
        projectFiles = generateCapacitorFiles(templateParams)
        break
      case 'react-native':
        projectFiles = generateReactNativeFiles(templateParams)
        break
      default:
        throw new Error(`Framework não suportado: ${framework}`)
    }

    // Convert string files to Uint8Array for zip
    const encoder = new TextEncoder()
    const zipInput: Record<string, Uint8Array> = {}

    for (const [filePath, content] of Object.entries(projectFiles)) {
      zipInput[`${sanitizedName}/${filePath}`] = encoder.encode(content)
    }

    // Create zip file
    const zippedData = zipSync(zipInput)

    // Upload to Supabase Storage
    const fileName = `${sanitizedName}-${framework}-${targetOs}.zip`
    const storagePath = `projects/${Date.now()}-${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('installers')
      .upload(storagePath, zippedData, {
        contentType: 'application/zip',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Falha no upload: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('installers')
      .getPublicUrl(storagePath)

    console.log(`Project generated: ${fileName}, uploaded to ${storagePath}`)

    return new Response(
      JSON.stringify({
        downloadUrl: urlData.publicUrl,
        fileName,
        framework,
        targetOs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
