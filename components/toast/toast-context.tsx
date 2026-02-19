'use client'

import React, { createContext, useContext, useCallback, useState, useRef } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  message?: string
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (variant: ToastVariant, title: string, message?: string) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      counterRef.current += 1
      const id = `toast-${counterRef.current}-${Date.now()}`
      const newToast: ToastItem = { id, variant, title, message }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        dismissToast(id)
      }, 4000)
    },
    [dismissToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    toasts: ctx.toasts,
    dismiss: ctx.dismissToast,
    success: (title: string, message?: string) => ctx.showToast('success', title, message),
    error: (title: string, message?: string) => ctx.showToast('error', title, message),
    info: (title: string, message?: string) => ctx.showToast('info', title, message),
  }
}
