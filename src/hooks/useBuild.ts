import { useState, useEffect } from 'react'
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

export function useBuild(buildId: string | null) {
  const [build, setBuild] = useState<Build | null>(null)
  const [artifacts, setArtifacts] = useState<BuildArtifact[]>([])
  const [status, setStatus] = useState<BuildStatus>('idle')

  useEffect(() => {
    if (!buildId) return

    // Fetch initial build status
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

    // Fetch artifacts when build is completed
    const fetchArtifacts = async () => {
      const { data, error } = await supabase
        .from('build_artifacts')
        .select('*')
        .eq('build_id', buildId)

      if (data && !error) {
        setArtifacts(data)
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [buildId])

  const startBuild = async (config: {
    appName: string
    sourceType: 'url' | 'github' | 'zip'
    sourceUrl?: string
    framework: 'electron' | 'tauri'
    targetOs: 'windows' | 'macos' | 'linux'
  }): Promise<string | null> => {
    try {
      setStatus('queued')
      
      const response = await supabase.functions.invoke('process-build', {
        body: {
          appName: config.appName,
          sourceType: config.sourceType,
          sourceUrl: config.sourceUrl,
          framework: config.framework,
          targetOs: config.targetOs
        }
      })

      if (response.error) throw response.error

      return response.data.buildId
    } catch (error) {
      console.error('Error starting build:', error)
      setStatus('idle')
      return null
    }
  }

  return {
    build,
    artifacts,
    status,
    startBuild
  }
}
