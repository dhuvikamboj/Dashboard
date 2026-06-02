import { useEffect } from 'react'
import { useDashboard } from '@/store/dashboard'
import { useAuth } from '@/store/auth'
import { Grid } from '@/components/Grid'
import { EditBar } from '@/components/EditBar'
import { Auth } from '@/components/Auth'
import { useLayout } from '@/hooks/useLayout'
import { getPb } from '@/lib/pb'

function backgroundStyle(bg: string, accent: string) {
  if (bg === 'dots') {
    return {
      backgroundImage: `radial-gradient(circle, ${accent}33 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }
  }
  if (bg === 'gridlines') {
    return {
      backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }
  }
  return {}
}

function Dashboard() {
  const { theme } = useDashboard()
  useLayout()

  useEffect(() => {
    document.documentElement.style.setProperty('--launchpad-accent', theme.accent)
  }, [theme.accent])

  return (
    <div
      className="min-h-screen dark bg-background text-foreground"
      style={backgroundStyle(theme.background, theme.accent)}
    >
      <EditBar />
      <div className="p-4">
        <Grid />
      </div>
    </div>
  )
}

export default function App() {
  const { user, logout } = useAuth()

  // Verify PB token still valid on mount
  useEffect(() => {
    const pb = getPb()
    if (pb.authStore.isValid) return
    if (user) logout() // token expired, force re-login
  }, [user, logout])

  if (!user) return <Auth />
  return <Dashboard />
}
