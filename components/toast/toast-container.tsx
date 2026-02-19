'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToast, type ToastItem, type ToastVariant } from './toast-context'

const variantConfig: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2
    borderColor: string
    bgColor: string
    iconColor: string
  }
> = {
  success: {
    icon: CheckCircle2,
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-500',
  },
  info: {
    icon: Info,
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
}

function SingleToast({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const config = variantConfig[item.variant]
  const Icon = config.icon

  // Slide-in on mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(item.id), 200)
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-border border-l-4 ${config.borderColor} ${config.bgColor} bg-card/95 backdrop-blur-sm shadow-lg transition-all duration-200 ease-out ${
        visible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {item.title}
          </p>
          {item.message && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {item.message}
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
