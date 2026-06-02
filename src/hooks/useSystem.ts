import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'

export interface SystemStats {
  cpu: number
  memory: { used: number; total: number }
  disk: { used: string; total: string; percent: number }
  uptime: number
  hostname: string
  ip: string
}

export function useSystem(pollMs = 3000) {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const { data, error: err } = await api.api.system.get()
    if (err) { setError(String(err)); setLoading(false); return }
    if (data) { setStats(data as unknown as SystemStats); setLoading(false) }
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, pollMs)
    return () => clearInterval(id)
  }, [fetch, pollMs])

  return { stats, loading, error }
}
