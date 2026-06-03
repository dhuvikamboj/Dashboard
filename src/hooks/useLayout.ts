import { useEffect, useRef } from 'react'
import { useDashboard } from '@/store/dashboard'
import { getPb } from '@/lib/pb'
import type { LayoutItem } from '@/store/dashboard'

const COLLECTION = 'dashboard_layout'

interface LayoutRecord {
  id: string
  widgets: LayoutItem[]
}

async function readLayout(): Promise<LayoutItem[]> {
  try {
    const res = await getPb().collection(COLLECTION).getList<LayoutRecord>(1, 1)
    const record = res.items[0]
    return Array.isArray(record?.widgets) ? record.widgets : []
  } catch {
    return []
  }
}

async function writeLayout(widgets: LayoutItem[]): Promise<void> {
  try {
    const res = await getPb().collection(COLLECTION).getList<LayoutRecord>(1, 1)
    if (res.items.length === 0) {
      await getPb().collection(COLLECTION).create({ widgets })
    } else {
      await getPb().collection(COLLECTION).update(res.items[0]!.id, { widgets })
    }
  } catch (e) {
    console.error('[useLayout] write error:', e)
  }
}

export function useLayout() {
  const { layout, setLayout } = useDashboard()
  const initialized = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from PocketBase on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    readLayout().then(data => {
      if (data.length > 0) setLayout(data)
    })
  }, [setLayout])

  // Debounce-save on every layout change
  useEffect(() => {
    if (!initialized.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      writeLayout(layout)
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [layout])

  return { layout }
}
