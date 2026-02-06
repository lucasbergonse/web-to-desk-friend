import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { BuildStatus, WrapperMode } from '@/components/conversion/types'

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
  wrapperMode: WrapperMode
}

export function useBuild(buildId: string | null) {
  const [build, setBuild] = useState<Build | null>(null)
  const [artifacts, setArtifacts] = useState<BuildArtifact[]>([])
  const [status, setStatus] = useState<BuildStatus>('idle')

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

  const checkBuildStatus = useCallback(async () => {
    if (!buildId) return
    
    try {
      const response = await supabase.functions.invoke('check-build-status', {
        body: { buildId }
      })

      if (response.data) {
        setStatus(response.data.status as BuildStatus)
        if (response.data.artifacts?.length > 0) {
          setArtifacts(response.data.artifacts)
        }
        if (response.data.error_message) {
          setBuild(prev => prev ? { ...prev, error_message: response.data.error_message } : null)
        }
      }
    } catch (error) {
      console.error('Error checking build status:', error)
    }
  }, [buildId])

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

    // Poll status while building
    let pollInterval: NodeJS.Timeout | null = null
    if (status !== 'completed' && status !== 'failed' && status !== 'idle') {
      pollInterval = setInterval(checkBuildStatus, 15000) // Poll every 15 seconds
    }

    return () => {
      supabase.removeChannel(channel)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [buildId, status, fetchArtifacts, checkBuildStatus])

  const startBuild = async (config: BuildConfig): Promise<string | null> => {
    try {
      setStatus('preparing')

      const response = await supabase.functions.invoke('prepare-build', {
        body: {
          appName: config.appName,
          sourceType: config.sourceType,
          sourceUrl: config.sourceUrl,
          framework: config.framework,
          targetOs: config.targetOs,
          wrapperMode: config.wrapperMode,
        },
      })

      if (response.error) {
        console.error('Build error:', response.error)
        setStatus('failed')
        return null
      }

      if (response.data?.error) {
        console.error('Build error:', response.data.error)
        setStatus('failed')
        return null
      }

      return response.data.buildId
    } catch (error) {
      console.error('Error starting build:', error)
      setStatus('failed')
      return null
    }
  }

  const reset = () => {
    setBuild(null)
    setArtifacts([])
    setStatus('idle')
  }

  return {
    build,
    artifacts,
    status,
    startBuild,
    reset,
    errorMessage: build?.error_message || null
  }
}
