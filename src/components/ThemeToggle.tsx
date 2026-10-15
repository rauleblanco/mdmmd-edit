import { Sun, Moon, Monitor } from 'lucide-react'
import { useAppStore, type Theme } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export function ThemeToggle(): JSX.Element {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <div className="flex items-center rounded-lg bg-muted/50 p-0.5 gap-0.5" role="radiogroup" aria-label="Theme">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={`${label} theme`}
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-200',
            'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  )
}
