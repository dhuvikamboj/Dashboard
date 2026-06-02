import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface QuickLinkConfig {
  label: string
  url: string
  icon?: string
  description?: string
}

interface Props {
  config: QuickLinkConfig
  onConfigChange: (c: QuickLinkConfig) => void
}

export function QuickLink({ config }: Props) {
  const isEmoji = config.icon && /\p{Emoji}/u.test(config.icon)

  return (
    <Card
      className="h-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
      onClick={() => config.url && window.open(config.url, '_blank', 'noopener')}
    >
      <CardContent className="h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
        <div className="text-3xl">
          {isEmoji ? config.icon : <ExternalLink className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
        <p className="font-medium text-sm leading-tight">{config.label || 'Quick Link'}</p>
        {config.description && (
          <p className="text-xs text-muted-foreground">{config.description}</p>
        )}
      </CardContent>
    </Card>
  )
}
