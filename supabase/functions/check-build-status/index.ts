import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { unzipSync } from 'https://esm.sh/fflate@0.8.2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusRequest {
  buildId: string
  githubRepo: string
}

interface Build {
  id: string
  app_name: string
  status: string
  error_message: string | null
}

interface Artifact {
  id: string
  file_type: string
  file_name: string
  file_size: string
  download_url: string | null
}

interface GitHubRun {
  id: number
  status: string
  conclusion: string | null
  html_url: string
  inputs?: { build_id?: string }
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

    const { buildId, githubRepo }: StatusRequest = await req.json()

    const { data: build, error: buildError } = await supabase
      .from('builds')
      .select('*')
      .eq('id', buildId)
      .single() as { data: Build | null, error: Error | null }

    if (buildError || !build) {
      throw new Error('Build not found')
    }

    if (build.status === 'completed' || build.status === 'failed') {
      const { data: artifacts } = await supabase
        .from('build_artifacts')
        .select('*')
        .eq('build_id', buildId) as { data: Artifact[] | null }

      return new Response(
        JSON.stringify({ 
          status: build.status, 
          artifacts: artifacts || [],
          error_message: build.error_message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const runsResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/runs?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    if (!runsResponse.ok) {
      throw new Error('Failed to fetch workflow runs')
    }

    const runsData = await runsResponse.json()
    
    const matchingRun: GitHubRun | undefined = runsData.workflow_runs?.find((run: GitHubRun) => 
      run.inputs?.build_id === buildId
    ) || runsData.workflow_runs?.[0]

    if (!matchingRun) {
      return new Response(
        JSON.stringify({ status: 'building', message: 'Workflow starting...' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let newStatus = build.status
    if (matchingRun.status === 'completed') {
      if (matchingRun.conclusion === 'success') {
        newStatus = 'completed'
        
        await fetchAndStoreArtifacts(
          supabase, 
          githubPat, 
          githubRepo, 
          matchingRun.id, 
          buildId,
          build.app_name
        )
      } else {
        newStatus = 'failed'
        await supabase.from('builds').update({ 
          status: 'failed',
          error_message: `Workflow failed: ${matchingRun.conclusion}`
        }).eq('id', buildId)
      }
    } else if (matchingRun.status === 'in_progress') {
      newStatus = 'building'
    }

    if (newStatus !== build.status) {
      await supabase.from('builds').update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }).eq('id', buildId)
    }

    let artifacts: Artifact[] = []
    if (newStatus === 'completed') {
      const { data: arts } = await supabase
        .from('build_artifacts')
        .select('*')
        .eq('build_id', buildId) as { data: Artifact[] | null }
      artifacts = arts || []
    }

    return new Response(
      JSON.stringify({ 
        status: newStatus, 
        artifacts,
        github_run_id: matchingRun.id,
        github_run_url: matchingRun.html_url
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAndStoreArtifacts(
  supabase: any,
  githubPat: string,
  githubRepo: string,
  runId: number,
  buildId: string,
  appName: string
) {
  const artifactsResponse = await fetch(
    `https://api.github.com/repos/${githubRepo}/actions/runs/${runId}/artifacts`,
    {
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )

  if (!artifactsResponse.ok) {
    console.error('Failed to fetch artifacts')
    return
  }

  const artifactsData = await artifactsResponse.json()

  // Avoid duplicating artifacts if status polling calls this multiple times
  const { data: existingArtifacts } = await supabase
    .from('build_artifacts')
    .select('file_name')
    .eq('build_id', buildId)

  const existingNames = new Set<string>((existingArtifacts || []).map((a: { file_name: string }) => a.file_name))

  for (const artifact of artifactsData.artifacts || []) {
    const downloadResponse = await fetch(artifact.archive_download_url, {
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    if (!downloadResponse.ok) {
      console.error(`Failed to download artifact: ${artifact.name}`)
      continue
    }

    const artifactBytes = new Uint8Array(await downloadResponse.arrayBuffer())

    // GitHub artifacts are always ZIPs. We must unzip and store the real installers.
    let files: Record<string, Uint8Array>
    try {
      files = unzipSync(artifactBytes)
    } catch (e) {
      console.error(`Failed to unzip artifact: ${artifact.name}`, e)
      continue
    }

    for (const [zipPath, fileBytes] of Object.entries(files)) {
      // Skip directories
      if (!fileBytes || fileBytes.length === 0) continue

      const baseName = zipPath.split('/').pop() || zipPath
      const ext = getExt(baseName)
      if (!ext) continue

      // Only keep the actual installer-like outputs (avoid logs, metadata, etc.)
      if (!isInstallerExtension(ext)) continue

      const safeApp = slugify(appName)
      const fileName = `${safeApp}-${artifact.name}-${baseName}`
      if (existingNames.has(fileName)) continue

      const storagePath = `${buildId}/${fileName}`
      const contentType = getContentTypeForExt(ext)

      const arrayBuffer = fileBytes.buffer.slice(
        fileBytes.byteOffset,
        fileBytes.byteOffset + fileBytes.byteLength,
      ) as ArrayBuffer

      const { error: uploadError } = await supabase.storage
        .from('installers')
        .upload(storagePath, new Blob([arrayBuffer], { type: contentType }), {
          contentType,
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('installers')
        .getPublicUrl(storagePath)

      await supabase.from('build_artifacts').insert({
        build_id: buildId,
        file_type: ext,
        file_name: fileName,
        file_size: formatBytes(fileBytes.length),
        storage_path: storagePath,
        download_url: urlData.publicUrl,
      })

      existingNames.add(fileName)
    }
  }
}

function slugify(s: string): string {
  return (s || 'app')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getExt(fileName: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(fileName)
  return m ? m[1].toLowerCase() : ''
}

function isInstallerExtension(ext: string): boolean {
  // Windows
  if (['exe', 'msi', 'bat'].includes(ext)) return true
  // macOS
  if (['dmg', 'zip'].includes(ext)) return true
  // Linux
  if (['deb', 'rpm', 'appimage'].includes(ext)) return true
  // Mobile
  if (['apk', 'aab', 'ipa'].includes(ext)) return true
  return false
}

function getContentTypeForExt(ext: string): string {
  const map: Record<string, string> = {
    exe: 'application/vnd.microsoft.portable-executable',
    msi: 'application/x-msi',
    bat: 'application/octet-stream',
    dmg: 'application/x-apple-diskimage',
    appimage: 'application/octet-stream',
    deb: 'application/vnd.debian.binary-package',
    rpm: 'application/x-rpm',
    apk: 'application/vnd.android.package-archive',
    aab: 'application/octet-stream',
    ipa: 'application/octet-stream',
    zip: 'application/zip',
  }
  return map[ext] || 'application/octet-stream'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
