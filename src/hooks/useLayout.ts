import { useEffect, useRef } from 'react'
import { useDashboard } from '@/store/dashboard'
import { api } from '@/api/client'

export function useLayout() {
  const { layout, setLayout } = useDashboard()
  const initialized = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from server on first mount; server wins if non-empty
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    api.api.layout.get().then(({ data }) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setLayout(data as Parameters<typeof setLayout>[0])
      }
    })
  }, [setLayout])

  // Debounce-save to server on every layout change (after init)
  useEffect(() => {
    if (!initialized.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.api.layout.put(layout as never)
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [layout])

  return { layout }
}
