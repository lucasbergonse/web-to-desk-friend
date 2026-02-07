import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { WrapperMode } from '@/components/conversion/types'

export type GeneratorStatus = 'idle' | 'generating' | 'ready' | 'failed'

interface GenerateConfig {
  appName: string
  sourceType: 'url' | 'github' | 'zip'
  sourceUrl?: string
  framework: 'electron' | 'tauri' | 'capacitor' | 'react-native'
  targetOs: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  wrapperMode: WrapperMode
}

interface GenerateResult {
  downloadUrl: string
  fileName: string
}

export function useProjectGenerator() {
  const [status, setStatus] = useState<GeneratorStatus>('idle')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const generate = async (config: GenerateConfig): Promise<boolean> => {
    try {
      setStatus('generating')
      setErrorMessage(null)
      setResult(null)

      const response = await supabase.functions.invoke('generate-project', {
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
        console.error('Generate error:', response.error)
        setErrorMessage(response.error.message || 'Erro ao gerar projeto')
        setStatus('failed')
        return false
      }

      if (response.data?.error) {
        console.error('Generate error:', response.data.error)
        setErrorMessage(response.data.error)
        setStatus('failed')
        return false
      }

      setResult({
        downloadUrl: response.data.downloadUrl,
        fileName: response.data.fileName,
      })
      setStatus('ready')
      return true
    } catch (error) {
      console.error('Error generating project:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido')
      setStatus('failed')
      return false
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setErrorMessage(null)
  }

  return {
    status,
    result,
    errorMessage,
    generate,
    reset,
  }
}
