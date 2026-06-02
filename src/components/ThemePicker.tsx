import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette } from 'lucide-react'
import { useDashboard } from '@/store/dashboard'
import type { Background } from '@/store/dashboard'
import { cn } from '@/lib/utils'

const PRESETS = [
  { color: '#7c6af7', name: 'Purple' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#22c55e', name: 'Green' },
  { color: '#f59e0b', name: 'Amber' },
  { color: '#ef4444', name: 'Coral' },
  { color: '#ec4899', name: 'Pink' },
]

const BACKGROUNDS: { value: Background; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dots', label: 'Dots' },
  { value: 'gridlines', label: 'Grid' },
]

export function ThemePicker() {
  const { theme, setTheme } = useDashboard()

  return (
    <Popover>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
        <Palette className="h-4 w-4 mr-2" /> Theme
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Accent Color</Label>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.color}
                title={p.name}
                style={{ background: p.color }}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-all',
                  theme.accent === p.color ? 'border-foreground scale-110' : 'border-transparent'
                )}
                onClick={() => setTheme({ accent: p.color })}
              />
            ))}
          </div>
          <Input
            type="color"
            value={theme.accent}
            onChange={e => setTheme({ accent: e.target.value })}
            className="h-8 w-full cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Background</Label>
          <div className="flex gap-2">
            {BACKGROUNDS.map(bg => (
              <Button
                key={bg.value}
                size="sm"
                variant={theme.background === bg.value ? 'default' : 'outline'}
                className="flex-1 text-xs h-8"
                onClick={() => setTheme({ background: bg.value })}
              >
                {bg.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
