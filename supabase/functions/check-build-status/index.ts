import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const artifactBlob = await downloadResponse.blob()
    const fileName = `${appName.replace(/\s+/g, '-').toLowerCase()}-${artifact.name}.zip`
    const storagePath = `${buildId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('installers')
      .upload(storagePath, artifactBlob, {
        contentType: 'application/zip'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      continue
    }

    const { data: urlData } = supabase.storage
      .from('installers')
      .getPublicUrl(storagePath)

    const fileType = getFileTypeFromArtifactName(artifact.name)

    await supabase.from('build_artifacts').insert({
      build_id: buildId,
      file_type: fileType,
      file_name: fileName,
      file_size: formatBytes(artifact.size_in_bytes),
      storage_path: storagePath,
      download_url: urlData.publicUrl
    })
  }
}

function getFileTypeFromArtifactName(name: string): string {
  if (name.includes('windows')) return 'exe'
  if (name.includes('macos') || name.includes('mac')) return 'dmg'
  if (name.includes('linux')) return 'deb'
  if (name.includes('android')) return 'apk'
  if (name.includes('ios')) return 'ipa'
  return 'zip'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
