import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface ClockConfig {
  showSeconds: boolean
  showDate: boolean
  timezone?: string
}

interface Props {
  config: ClockConfig
  onConfigChange: (c: ClockConfig) => void
}

export function Clock({ config }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const opts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(config.showSeconds ? { second: '2-digit' } : {}),
    timeZone: config.timezone || undefined,
    hour12: false,
  }

  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: config.timezone || undefined,
  }

  const timeStr = new Intl.DateTimeFormat('en', opts).format(now)
  const dateStr = new Intl.DateTimeFormat('en', dateOpts).format(now)

  return (
    <Card className="h-full flex items-center justify-center">
      <CardContent className="text-center p-4">
        <p className="text-5xl font-mono font-bold tracking-tight">{timeStr}</p>
        {config.showDate && (
          <p className="text-sm text-muted-foreground mt-2">{dateStr}</p>
        )}
        {config.timezone && (
          <p className="text-xs text-muted-foreground/60 mt-1">{config.timezone}</p>
        )}
      </CardContent>
    </Card>
  )
}
