import { useEffect } from 'react'
import { useDashboard } from '@/store/dashboard'
import { Grid } from '@/components/Grid'
import { EditBar } from '@/components/EditBar'
import { useLayout } from '@/hooks/useLayout'

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

export default function App() {
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
