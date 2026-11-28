import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, Check, HelpCircle, Info, X } from 'lucide-react'
import { AppDialogContext } from './AppDialogContext'

type DialogRequest =
  | { kind: 'alert'; title: string; message: string; resolve: () => void }
  | { kind: 'confirm'; title: string; message: string; confirmLabel: string; cancelLabel: string; resolve: (confirmed: boolean) => void }
  | { kind: 'prompt'; title: string; message: string; placeholder: string; resolve: (value: string | null) => void }

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DialogRequest[]>([])
  const queueRef = useRef<DialogRequest[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeDialog = queue[0]

  const enqueue = useCallback((request: DialogRequest) => {
    queueRef.current = [...queueRef.current, request]
    setQueue(queueRef.current)
  }, [])

  const closeActive = useCallback((result: boolean | string | null) => {
    const closing = queueRef.current[0]
    if (!closing) return
    queueRef.current = queueRef.current.slice(1)
    if (closing.kind === 'alert') closing.resolve()
    if (closing.kind === 'confirm') closing.resolve(result === true)
    if (closing.kind === 'prompt') closing.resolve(typeof result === 'string' ? result : null)
    setQueue(queueRef.current)
  }, [])

  const showAlert = useCallback((message: string, title = 'Thông báo') => new Promise<void>((resolve) => {
    enqueue({ kind: 'alert', title, message, resolve })
  }), [enqueue])

  const showConfirm = useCallback((message: string, title = 'Xác nhận', confirmLabel = 'Đồng ý', cancelLabel = 'Hủy') => new Promise<boolean>((resolve) => {
    enqueue({ kind: 'confirm', title, message, confirmLabel, cancelLabel, resolve })
  }), [enqueue])

  const showPrompt = useCallback((message: string, title = 'Nhập thông tin', placeholder = '') => new Promise<string | null>((resolve) => {
    enqueue({ kind: 'prompt', title, message, placeholder, resolve })
  }), [enqueue])

  useEffect(() => {
    if (activeDialog?.kind === 'prompt') inputRef.current?.focus()
  }, [activeDialog])

  useEffect(() => {
    if (!activeDialog) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeActive(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDialog, closeActive])

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    closeActive(inputRef.current?.value ?? '')
  }

  return (
    <AppDialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {activeDialog && <div className="app-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeActive(null)
      }}>
        <section
          className="app-dialog"
          role={activeDialog.kind === 'alert' ? 'alertdialog' : 'dialog'}
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          aria-describedby="app-dialog-message"
        >
          <div className={`app-dialog-icon app-dialog-icon-${activeDialog.kind}`}>
            {activeDialog.kind === 'alert' ? <Info size={20} /> : activeDialog.kind === 'confirm' ? <HelpCircle size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="app-dialog-content">
            <div className="app-dialog-heading">
              <h2 id="app-dialog-title">{activeDialog.title}</h2>
              <button type="button" className="app-dialog-close" aria-label="Đóng hộp thoại" onClick={() => closeActive(null)}><X size={17} /></button>
            </div>
            <p id="app-dialog-message">{activeDialog.message}</p>
            {activeDialog.kind === 'prompt' && <form className="app-dialog-form" onSubmit={submitPrompt}>
              <textarea ref={inputRef} rows={3} placeholder={activeDialog.placeholder} />
              <div className="app-dialog-actions">
                <button type="button" className="app-dialog-button app-dialog-button-secondary" onClick={() => closeActive(null)}>Hủy</button>
                <button type="submit" className="app-dialog-button app-dialog-button-primary"><Check size={15} /> Gửi</button>
              </div>
            </form>}
            {activeDialog.kind === 'confirm' && <div className="app-dialog-actions">
              <button type="button" className="app-dialog-button app-dialog-button-secondary" onClick={() => closeActive(false)}>{activeDialog.cancelLabel}</button>
              <button type="button" className="app-dialog-button app-dialog-button-primary" onClick={() => closeActive(true)}>{activeDialog.confirmLabel}</button>
            </div>}
            {activeDialog.kind === 'alert' && <div className="app-dialog-actions">
              <button type="button" className="app-dialog-button app-dialog-button-primary" onClick={() => closeActive(true)}>Đã hiểu</button>
            </div>}
          </div>
        </section>
      </div>}
    </AppDialogContext.Provider>
  )
}
