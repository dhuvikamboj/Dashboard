import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPb, getPbUrl, setPbUrl } from '@/lib/pb'

interface AuthUser {
  id: string
  email: string
  name?: string
}

interface AuthStore {
  user: AuthUser | null
  pbUrl: string
  loading: boolean
  error: string | null

  login: (email: string, password: string, url?: string) => Promise<void>
  logout: () => void
  setError: (e: string | null) => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      pbUrl: getPbUrl(),
      loading: false,
      error: null,

      login: async (email, password, url) => {
        set({ loading: true, error: null })
        try {
          if (url) setPbUrl(url)
          const pb = getPb()
          const auth = await pb.collection('users').authWithPassword(email, password)
          set({
            user: {
              id: auth.record.id,
              email: auth.record.email as string,
              name: auth.record.name as string | undefined,
            },
            pbUrl: getPbUrl(),
            loading: false,
            error: null,
          })
        } catch (e: unknown) {
          const msg = (e as { message?: string })?.message ?? String(e)
          set({ loading: false, error: msg, user: null })
        }
      },

      logout: () => {
        getPb().authStore.clear()
        set({ user: null, error: null })
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'launchpad-auth',
      partialize: (s) => ({ user: s.user, pbUrl: s.pbUrl }),
    }
  )
)
