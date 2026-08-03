import React, { useState, useCallback, createContext, useContext } from 'react'

type ConfirmOpts = { title: string; message?: string; confirmText?: string; danger?: boolean }
type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>

const Ctx = createContext<{ confirm: ConfirmFn }>({ confirm: async () => false })

export function useConfirm() { return useContext(Ctx).confirm }

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null)
  const [resolve, setResolve] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o)
    return new Promise<boolean>((res) => setResolve(() => res))
  }, [])

  const close = (v: boolean) => {
    resolve?.(v)
    setOpts(null)
    setResolve(null)
  }

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      {opts && (
        <div className="sheet-mask" onClick={() => close(false)}>
          <div className="confirm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="t-h3" style={{ textAlign: 'center' }}>{opts.title}</div>
            {opts.message && <div className="t-sub" style={{ textAlign: 'center', marginTop: 6 }}>{opts.message}</div>}
            <div style={{ marginTop: 16 }}>
              <button className={'confirm-btn ' + (opts.danger ? 'danger' : '')} onClick={() => close(true)}>{opts.confirmText || '确认'}</button>
              <button className="confirm-btn ghost" onClick={() => close(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
