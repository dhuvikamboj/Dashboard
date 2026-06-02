import type { ComponentType } from 'react'
import { Server, Monitor, ScrollText, Globe, Clock as ClockIcon, Link, StickyNote, Clipboard } from 'lucide-react'
import { ServiceCard } from './ServiceCard'
import { SystemStats } from './SystemStats'
import { LogsViewer } from './LogsViewer'
import { CaddyEditor } from './CaddyEditor'
import { Clock } from './Clock'
import { QuickLink } from './QuickLink'
import { Notes } from './Notes'
import { ClipboardBucket } from './ClipboardBucket'

export interface WidgetRegistryEntry {
  component: ComponentType<{ config: Record<string, unknown>; onConfigChange: (c: Record<string, unknown>) => void }>
  defaultConfig: Record<string, unknown>
  defaultSize: { w: number; h: number }
  label: string
  icon: ComponentType<{ className?: string }>
}

export const widgetRegistry: Record<string, WidgetRegistryEntry> = {
  serviceCard: {
    component: ServiceCard as WidgetRegistryEntry['component'],
    defaultConfig: { serviceName: '' },
    defaultSize: { w: 3, h: 3 },
    label: 'Service Card',
    icon: Server,
  },
  systemStats: {
    component: SystemStats,
    defaultConfig: {},
    defaultSize: { w: 3, h: 4 },
    label: 'System Stats',
    icon: Monitor,
  },
  logsViewer: {
    component: LogsViewer as WidgetRegistryEntry['component'],
    defaultConfig: { serviceName: '', lines: 100 },
    defaultSize: { w: 4, h: 4 },
    label: 'Logs Viewer',
    icon: ScrollText,
  },
  caddyEditor: {
    component: CaddyEditor,
    defaultConfig: {},
    defaultSize: { w: 5, h: 5 },
    label: 'Caddy Editor',
    icon: Globe,
  },
  clock: {
    component: Clock as WidgetRegistryEntry['component'],
    defaultConfig: { showSeconds: true, showDate: true },
    defaultSize: { w: 3, h: 2 },
    label: 'Clock',
    icon: ClockIcon,
  },
  quickLink: {
    component: QuickLink as WidgetRegistryEntry['component'],
    defaultConfig: { label: 'Link', url: '', icon: '🔗', description: '' },
    defaultSize: { w: 2, h: 2 },
    label: 'Quick Link',
    icon: Link,
  },
  notes: {
    component: Notes as WidgetRegistryEntry['component'],
    defaultConfig: { title: 'Notes', content: '' },
    defaultSize: { w: 3, h: 3 },
    label: 'Notes',
    icon: StickyNote,
  },
  clipboardBucket: {
    component: ClipboardBucket as WidgetRegistryEntry['component'],
    defaultConfig: { maxItems: 20 },
    defaultSize: { w: 4, h: 5 },
    label: 'Clipboard Bucket',
    icon: Clipboard,
  },
}
