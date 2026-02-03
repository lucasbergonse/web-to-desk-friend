import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { BuildStatus } from '@/components/conversion/types'

interface BuildArtifact {
  id: string
  file_type: string
  file_name: string
  file_size: string
  download_url: string | null
}

interface Build {
  id: string
  status: string
  app_name: string
  framework: string
  target_os: string
  error_message: string | null
}

interface BuildConfig {
  appName: string
  sourceType: 'url' | 'github' | 'zip'
  sourceUrl?: string
  framework: 'electron' | 'tauri' | 'capacitor' | 'react-native'
  targetOs: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  githubRepo?: string
}

export function useBuild(buildId: string | null) {
  const [build, setBuild] = useState<Build | null>(null)
  const [artifacts, setArtifacts] = useState<BuildArtifact[]>([])
  const [status, setStatus] = useState<BuildStatus>('idle')
  const [githubRepo, setGithubRepo] = useState<string | null>(null)

  const fetchArtifacts = useCallback(async () => {
    if (!buildId) return
    const { data, error } = await supabase
      .from('build_artifacts')
      .select('*')
      .eq('build_id', buildId)

    if (data && !error) {
      setArtifacts(data)
    }
  }, [buildId])

  const checkGitHubStatus = useCallback(async () => {
    if (!buildId || !githubRepo) return
    
    try {
      const response = await supabase.functions.invoke('check-build-status', {
        body: { buildId, githubRepo }
      })

      if (response.data) {
        setStatus(response.data.status as BuildStatus)
        if (response.data.artifacts?.length > 0) {
          setArtifacts(response.data.artifacts)
        }
      }
    } catch (error) {
      console.error('Error checking build status:', error)
    }
  }, [buildId, githubRepo])

  useEffect(() => {
    if (!buildId) return

    const fetchBuild = async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*')
        .eq('id', buildId)
        .single()

      if (data && !error) {
        setBuild(data)
        setStatus(data.status as BuildStatus)

        if (data.status === 'completed') {
          fetchArtifacts()
        }
      }
    }

    fetchBuild()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`build-${buildId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'builds',
          filter: `id=eq.${buildId}`
        },
        (payload) => {
          const newBuild = payload.new as Build
          setBuild(newBuild)
          setStatus(newBuild.status as BuildStatus)

          if (newBuild.status === 'completed') {
            fetchArtifacts()
          }
        }
      )
      .subscribe()

    // Poll GitHub status if we have a repo (for real builds)
    let pollInterval: NodeJS.Timeout | null = null
    if (githubRepo && status !== 'completed' && status !== 'failed' && status !== 'idle') {
      pollInterval = setInterval(checkGitHubStatus, 10000) // Poll every 10 seconds
    }

    return () => {
      supabase.removeChannel(channel)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [buildId, githubRepo, status, fetchArtifacts, checkGitHubStatus])

  const startBuild = async (config: BuildConfig): Promise<string | null> => {
    try {
      setStatus('queued')

      // Real builds only (GitHub Actions)
      if (!config.githubRepo) {
        throw new Error('GitHub repo obrigatório para build real')
      }

      setGithubRepo(config.githubRepo)

      const response = await supabase.functions.invoke('trigger-github-build', {
        body: {
          appName: config.appName,
          sourceType: config.sourceType,
          sourceUrl: config.sourceUrl,
          framework: config.framework,
          targetOs: config.targetOs,
          githubRepo: config.githubRepo,
        },
      })

      if (response.error) throw response.error
      return response.data.buildId
    } catch (error) {
      console.error('Error starting build:', error)
      setStatus('idle')
      return null
    }
  }

  const reset = () => {
    setBuild(null)
    setArtifacts([])
    setStatus('idle')
    setGithubRepo(null)
  }

  return {
    build,
    artifacts,
    status,
    startBuild,
    reset
  }
}
