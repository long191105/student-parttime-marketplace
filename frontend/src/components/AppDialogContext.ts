import { createContext, useContext } from 'react'

export interface AppDialogContextValue {
  showAlert: (message: string, title?: string) => Promise<void>
  showConfirm: (message: string, title?: string, confirmLabel?: string) => Promise<boolean>
  showPrompt: (message: string, title?: string, placeholder?: string) => Promise<string | null>
}

export const AppDialogContext = createContext<AppDialogContextValue | null>(null)

export function useAppDialog(): AppDialogContextValue {
  const context = useContext(AppDialogContext)
  if (!context) throw new Error('useAppDialog phải được dùng bên trong AppDialogProvider.')
  return context
}
