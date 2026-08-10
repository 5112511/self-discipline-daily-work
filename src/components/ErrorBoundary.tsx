import React from 'react'

interface Props {
  children: React.ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
}

// 全局错误边界：任何子组件渲染抛错都不会白屏，而是显示恢复 UI
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 输出到控制台便于排查
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  hardReset = () => {
    // 清空本地数据后重载（用于数据损坏导致持续崩溃的情况）
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('personal-os')) localStorage.removeItem(k)
      })
    } catch { /* ignore */ }
    location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24, background: 'var(--bg)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😵</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>页面出了点问题</div>
          <div style={{ fontSize: 13, color: 'var(--t-sub)', maxWidth: 320, lineHeight: 1.6, marginBottom: 20, wordBreak: 'break-all' }}>
            {this.state.error?.message || '未知错误'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="tap"
              style={{ padding: '10px 20px', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 10, fontWeight: 600, border: 'none' }}
              onClick={this.reset}
            >重试</button>
            <button
              className="tap"
              style={{ padding: '10px 20px', background: 'var(--bg)', color: 'var(--ink)', borderRadius: 10, fontWeight: 600, border: '1px solid var(--line)' }}
              onClick={this.hardReset}
            >清空数据并重载</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t-sub)', marginTop: 16, opacity: 0.7 }}>
            清空数据会清除本地存储的所有任务、日程、账本等，不可恢复。
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
