import { Info, Lightbulb, Flame, AlertTriangle, AlertOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION'

interface AlertBlockProps {
  type: AlertType
  children: React.ReactNode
}

const alertConfig: Record<
  AlertType,
  {
    icon: typeof Info
    title: string
    borderClass: string
    bgClass: string
    textClass: string
    iconClass: string
  }
> = {
  NOTE: {
    icon: Info,
    title: 'Note',
    borderClass: 'border-l-blue-500 border-blue-500/20',
    bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
    textClass: 'text-blue-900 dark:text-blue-200',
    iconClass: 'text-blue-500 dark:text-blue-400',
  },
  TIP: {
    icon: Lightbulb,
    title: 'Tip',
    borderClass: 'border-l-emerald-500 border-emerald-500/20',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    textClass: 'text-emerald-900 dark:text-emerald-200',
    iconClass: 'text-emerald-500 dark:text-emerald-400',
  },
  IMPORTANT: {
    icon: Flame,
    title: 'Important',
    borderClass: 'border-l-purple-500 border-purple-500/20',
    bgClass: 'bg-purple-50/50 dark:bg-purple-950/20',
    textClass: 'text-purple-900 dark:text-purple-200',
    iconClass: 'text-purple-500 dark:text-purple-400',
  },
  WARNING: {
    icon: AlertTriangle,
    title: 'Warning',
    borderClass: 'border-l-amber-500 border-amber-500/20',
    bgClass: 'bg-amber-50/50 dark:bg-amber-950/20',
    textClass: 'text-amber-900 dark:text-amber-200',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
  CAUTION: {
    icon: AlertOctagon,
    title: 'Caution',
    borderClass: 'border-l-red-500 border-red-500/20',
    bgClass: 'bg-red-50/50 dark:bg-red-950/20',
    textClass: 'text-red-900 dark:text-red-200',
    iconClass: 'text-red-500 dark:text-red-400',
  },
}

export function AlertBlock({ type, children }: AlertBlockProps): JSX.Element {
  const config = alertConfig[type] || alertConfig.NOTE
  const Icon = config.icon

  return (
    <div
      className={cn(
        'my-5 rounded-r-xl border border-l-4 p-4 transition-all',
        config.borderClass,
        config.bgClass
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
        <Icon className={cn('w-4 h-4 shrink-0', config.iconClass)} />
        <span className={config.iconClass}>{config.title}</span>
      </div>
      <div className={cn('text-sm leading-relaxed [&>p:last-child]:mb-0', config.textClass)}>
        {children}
      </div>
    </div>
  )
}
