import React, { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext<{ toast: (msg: string) => void }>({ toast: () => {} })
export const useToast = () => useContext(Ctx).toast

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const toast = useCallback((m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 1800)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </Ctx.Provider>
  )
}
