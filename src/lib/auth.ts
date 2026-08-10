import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { setCurrentUserId, syncFromCloud } from '../store'

export interface AuthUser {
  id: string
  email: string
}

const AUTH_KEY = 'personal-os-auth-user'

// 从 localStorage 恢复会话（刷新页面不丢登录）
function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function storeUser(u: AuthUser | null) {
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u))
  else localStorage.removeItem(AUTH_KEY)
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser())
  const [loading, setLoading] = useState(false)

  // 初始化：尝试从 Supabase 恢复会话
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = { id: data.session.user.id, email: data.session.user.email || '' }
        setUser(u)
        storeUser(u)
        setCurrentUserId(u.id)
      }
    }).catch(() => {})

    // 监听认证状态变化
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email || '' }
        setUser(u)
        storeUser(u)
        setCurrentUserId(u.id)
      } else {
        setUser(null)
        storeUser(null)
        setCurrentUserId(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (id: string, email: string) => {
    const u = { id, email }
    setUser(u)
    storeUser(u)
    setCurrentUserId(id)
    // 触发首次同步
    await syncFromCloud()
  }

  const signOut = async () => {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut().catch(() => {})
    setUser(null)
    storeUser(null)
    setCurrentUserId(null)
  }

  return { user, loading, signIn, signOut, isConfigured: isSupabaseConfigured() }
}
