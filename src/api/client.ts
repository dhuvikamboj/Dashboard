import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/index'
import { getPb } from '@/lib/pb'

export const api = treaty<App>(
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:2019',
  {
    headers: () => {
      const token = getPb().authStore.token
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
  }
)
