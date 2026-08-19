import React, { useState } from 'react'
import { getSupabase, isSupabaseConfigured, SUPABASE_URL } from '../lib/supabase'
import { useToast } from '../components/Toast'

type Mode = 'login' | 'signup'

export function AuthPage({ onAuthed, onOffline }: { onAuthed: (userId: string, email: string, nickname?: string) => void; onOffline: () => void }) {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const configured = isSupabaseConfigured()

  const submit = async () => {
    setError('')
    if (!email || !password) { setError('请填写邮箱和密码'); return }
    if (mode === 'signup' && !nickname.trim()) { setError('请填写你的昵称'); return }
    if (password.length < 6) { setError('密码至少 6 位'); return }

    const sb = getSupabase()
    if (!sb) { setError('云服务未配置，请点击"离线使用"'); return }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          toast('注册成功 ✓')
          onAuthed(data.user.id, data.user.email || email, mode === 'signup' ? nickname.trim() : undefined)
        } else {
          setError('注册成功，请检查邮箱确认（部分情况需要邮箱验证）')
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          toast('登录成功 ✓')
          onAuthed(data.user.id, data.user.email || email)
        }
      }
    } catch (e: any) {
      setError(e?.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="avatar" style={{ width: 64, height: 64, margin: '0 auto 12px', fontSize: 28, background: 'var(--ink)', color: 'var(--bg)' }}>玥</div>
        <div className="t-h2" style={{ fontSize: 22, fontWeight: 700 }}>{mode === 'signup' && nickname.trim() ? `${nickname.trim()} OS` : 'Personal OS'}</div>
        <div className="t-cap" style={{ marginTop: 6 }}>你的个人操作系统 · 账户云同步</div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>
        {/* 模式切换 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--soft)', borderRadius: 10, padding: 3 }}>
          <button
            className={'tap ' + (mode === 'login' ? 'chip chip-dark' : 'chip')}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => { setMode('login'); setError('') }}
          >登录</button>
          <button
            className={'tap ' + (mode === 'signup' ? 'chip chip-dark' : 'chip')}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => { setMode('signup'); setError('') }}
          >注册</button>
        </div>

        {mode === 'signup' && <div style={{ marginBottom: 12 }}>
          <input type="text" placeholder="你的昵称（例如：玥莹）" value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} autoComplete="nickname" />
        </div>}
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
        </div>

        {error && (
          <div className="t-cap" style={{ color: 'var(--danger)', marginBottom: 12, padding: '8px 10px', background: 'var(--soft)', borderRadius: 8 }}>{error}</div>
        )}

        <button
          className="tap"
          style={{ width: '100%', padding: '12px', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 10, fontWeight: 600, opacity: loading ? 0.6 : 1 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
        </button>

        {!configured && (
          <div className="t-cap" style={{ marginTop: 16, padding: 10, background: '#fff8e1', borderRadius: 8, color: '#8a6d3b', lineHeight: 1.5 }}>
            ⚠️ 云同步尚未配置（缺少 Supabase 凭证）。可先离线使用，数据仅存本地。
          </div>
        )}

        <button
          className="tap t-cap"
          style={{ width: '100%', marginTop: 12, padding: 8, color: 'var(--t-sub)' }}
          onClick={onOffline}
        >先离线使用 ›</button>
      </div>

      <div className="t-cap" style={{ textAlign: 'center', marginTop: 24, opacity: 0.6 }}>
        登录后数据自动云同步 · 多设备互通
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 15,
  background: 'var(--bg)',
  color: 'var(--ink)',
  outline: 'none',
}
