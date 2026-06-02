import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'

export interface Service {
  name: string
  status: string
  cpu: number
  memory: number
  pid: number | null
  uptime: number
  restarts: number
}

export function useServices(pollMs = 5000) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const { data, error: err } = await api.api.services.get()
    if (err) { setError(String(err)); setLoading(false); return }
    if (data) setServices(data as Service[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, pollMs)
    return () => clearInterval(id)
  }, [fetch, pollMs])

  const control = useCallback(async (name: string, action: 'start' | 'stop' | 'restart') => {
    if (action === 'start') await api.api.services[':name'].start.post(undefined, { params: { name } })
    if (action === 'stop') await api.api.services[':name'].stop.post(undefined, { params: { name } })
    if (action === 'restart') await api.api.services[':name'].restart.post(undefined, { params: { name } })
    fetch()
  }, [fetch])

  return { services, loading, error, refetch: fetch, control }
}
