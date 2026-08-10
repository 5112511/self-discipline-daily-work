import React, { useRef, useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_LABEL, type Domain } from '../types'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmSheet'
import {
  IconMail, IconLock, IconRefresh, IconDownload, IconTrash,
  IconChevronRight, IconPlay, IconWallet
} from '../components/Icons'
import { monthMatrix, todayYmd, DOW_MON, MONTH_NAMES, toYmd } from '../calendar'
import { useFocus, useDrawer } from '../App'

function Ring({ value, size = 72, stroke = 6, label, suffix = '%' }: { value: number; size?: number; stroke?: number; label?: string; suffix?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(value, 100) / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--ink)" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="t-h2 mono">{value}{suffix}</span>
        {label && <span className="t-cap">{label}</span>}
      </div>
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return <div className="t-cap">暂无数据</div>
  const w = 120, h = 36, pad = 2
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - pad * 2) + pad, h - pad - ((v - min) / range) * (h - pad * 2)])
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  return (
    <svg width={w} height={h}>
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={1.6} fill="var(--ink)" />)}
    </svg>
  )
}

function Heatmap({ data }: { data: number[] }) {
  const [view, setView] = useState<'month' | 'year'>('month')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // 把 data（从 N 天前到今天，末尾=今天）转成「日期 -> 是否完成」map
  const doneMap: Record<string, boolean> = {}
  if (data && data.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - (data.length - 1))
    const cur = new Date(start)
    let i = 0
    while (cur <= today) {
      doneMap[toYmd(cur)] = !!data[i]
      cur.setDate(cur.getDate() + 1)
      i++
    }
  }
  const today = todayYmd()

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  if (data.length === 0) return <div className="t-cap">暂无数据</div>

  // 月视图
  if (view === 'month') {
    const weeks = monthMatrix(year, month)
    return (
      <div className="cal-heatmap">
        <div className="cal-toolbar">
          <button className="chip line tap" onClick={prevMonth}>‹</button>
          <button className="chip chip-dark tap" onClick={goToday}>{year}年 {MONTH_NAMES[month]}</button>
          <button className="chip line tap" onClick={nextMonth}>›</button>
          <span style={{ flex: 1 }} />
          <button className={'seg-item sm on'} onClick={() => setView('month')}>月</button>
          <button className={'seg-item sm'} onClick={() => setView('year')}>年</button>
        </div>
        <div className="cal-weeknames">
          {DOW_MON.map(n => <div key={n} className="cal-dow">{n}</div>)}
        </div>
        <div className="cal-grid">
          {weeks.map((w, wi) => (
            <div key={wi} className="cal-week">
              {w.map(c => {
                const done = doneMap[c.ymd]
                const future = c.ymd > today
                return (
                  <div key={c.ymd} className={'cal-day' + (c.inMonth ? '' : ' out') + (done ? ' on' : '') + (c.ymd === today ? ' today' : '') + (future ? ' future' : '')} title={`${c.date.getMonth()+1}月${c.day}日${done ? ' · 已完成' : ''}`}>
                    {c.inMonth && <span className="cal-day-num">{c.day}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 年视图：12 个月缩略
  const yearHas = (m: number) => {
    const w = monthMatrix(year, m)
    let cnt = 0, total = 0
    for (const row of w) for (const c of row) {
      if (c.date.getFullYear() === year) {
        total++
        if (doneMap[c.ymd]) cnt++
      }
    }
    return { cnt, total }
  }
  return (
    <div className="cal-heatmap">
      <div className="cal-toolbar">
        <button className="chip line tap" onClick={() => setYear(year - 1)}>‹ {year - 1}</button>
        <span className="t-h3">{year}年</span>
        <button className="chip line tap" onClick={() => setYear(year + 1)}>{year + 1} ›</button>
        <span style={{ flex: 1 }} />
        <button className={'seg-item sm'} onClick={() => setView('month')}>月</button>
        <button className={'seg-item sm on'} onClick={() => setView('year')}>年</button>
      </div>
      <div className="year-grid">
        {MONTH_NAMES.map((mn, m) => {
          const weeks = monthMatrix(year, m)
          const { cnt, total } = yearHas(m)
          const ratio = total > 0 ? Math.round((cnt / total) * 100) : 0
          return (
            <div key={m} className="year-month" onClick={() => { setMonth(m); setView('month') }}>
              <div className="year-month-head"><span className="t-cap">{mn}</span><span className="t-cap mono">{ratio}%</span></div>
              <div className="year-month-grid">
                {weeks.map((w, wi) => (
                  <div key={wi} className="year-week">
                    {w.map(c => (
                      <div key={c.ymd} className={'year-cell' + (doneMap[c.ymd] ? ' on' : '') + (c.ymd === today ? ' today' : '')} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MePage({ auth, onExitOffline }: { auth?: { user: { id: string; email: string } | null; signOut: () => Promise<void>; isConfigured: boolean }; onExitOffline?: () => void }) {
  const data = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const { open: openFocus } = useFocus()
  const { open: openDrawer } = useDrawer()
  const fileRef = useRef<HTMLInputElement>(null)
  const [syncing, setSyncing] = useState(false)

  const tasks = data.tasks
  const doneThisWeek = tasks.filter(t => t.status === 'done').length
  const top3Done = tasks.filter(t => t.inTop3 && t.status === 'done').length
  const top3Total = tasks.filter(t => t.inTop3).length
  const top3Rate = top3Total > 0 ? Math.round((top3Done / top3Total) * 100) : 0
  const focusMin = tasks.reduce((a, t) => a + (t.status === 'done' ? (t.estimatedMinutes || 0) : 0), 0)

  const max = Math.max(...data.weekDist.map(x => x.minutes), 1)

  const resetDemo = async () => {
    const ok = await confirm({ title: '恢复演示数据？', message: '将覆盖当前所有任务、项目、日程与灵感。', confirmText: '恢复' })
    if (ok) { store.resetDemo(); toast('已恢复演示数据') }
  }
  const clearAll = async () => {
    const ok = await confirm({ title: '清除所有数据？', message: '将清空任务、项目、日程、灵感。此操作不可恢复。', confirmText: '清除', danger: true })
    if (ok) { store.clearAll(); toast('已清除全部数据') }
  }
  const exportData = () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `personal-os-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('已导出数据')
  }
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = store.importJSON(String(reader.result))
      toast(ok ? '已导入数据' : '导入失败：格式不正确')
    }
    reader.readAsText(f)
  }

  return (
    <div className="page me-page">
      {/* 个人资料 */}
      <div className="card card-pad me-profile">
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>{data.settings.avatarText}</div>
        <div style={{ flex: 1 }}>
          <div className="t-h2">{data.settings.displayName}</div>
          <div className="t-sub">多重身份 · 内容创作 / AI 学习 / 技能提升</div>
          <div className="t-cap" style={{ marginTop: 4 }}>已连续 {data.meta.streakDays} 天使用 Personal OS</div>
        </div>
        <button className="chip line tap" onClick={() => toast('上传照片功能第三版')}>更换照片</button>
      </div>

      {/* 账户与云同步 */}
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="icn-box dark" style={{ width: 28, height: 28 }}><IconLock size={14} /></span>
          <span className="t-body" style={{ fontWeight: 600 }}>账户与同步</span>
          <span className="chip line" style={{ marginLeft: 'auto' }}>
            {auth?.user ? (syncing ? '同步中…' : '已同步') : '离线'}
          </span>
        </div>
        {auth?.user ? (
          <>
            <div className="t-cap">{auth.user.email} · 数据云端托管</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="tap chip line" style={{ flex: 1, justifyContent: 'center' }} onClick={async () => { setSyncing(true); const { syncFromCloud } = await import('../store'); const r = await syncFromCloud(); setSyncing(false); toast(r.ok ? '已同步' : '同步失败：' + r.error) }}>
                <IconRefresh size={13} /> 立即同步
              </button>
              <button className="tap chip line" style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)' }} onClick={async () => { const ok = await confirm({ title: '退出登录？', message: '退出后数据仍保留在云端，重新登录即可恢复。', confirmText: '退出' }); if (ok) { await auth.signOut(); toast('已退出登录') } }}>退出登录</button>
            </div>
          </>
        ) : (
          <>
            <div className="t-cap">离线模式 · 数据仅存本设备</div>
            <button className="tap chip chip-dark" style={{ justifyContent: 'center' }} onClick={() => onExitOffline?.()}>登录云同步 ›</button>
          </>
        )}
      </div>

      {/* 专注模式入口 */}
      <button className="card card-pad focus-entry tap" onClick={() => openFocus()}>
        <div className="focus-entry-ring"><IconPlay size={20} /></div>
        <div style={{ flex: 1 }}>
          <div className="t-body" style={{ fontWeight: 600 }}>开始专注</div>
          <div className="t-cap">番茄钟 · 今日 {data.focusSessions.filter(s => s.date === todayYmd() && !s.cancelled).reduce((a, s) => a + s.actualMin, 0)}min</div>
        </div>
        <IconChevronRight size={18} />
      </button>

      {/* 核心指标 */}
      <div className="section">
        <div className="section-head"><span className="section-title">本周概览</span></div>
        <div className="me-rings">
          <div className="me-ring-item">
            <Ring value={top3Rate} label="完成率" />
            <div className="t-cap">Top 3 完成率</div>
          </div>
          <div className="me-ring-item">
            <Ring value={doneThisWeek} suffix="个" label="任务" />
            <div className="t-cap">已完成任务</div>
          </div>
          <div className="me-ring-item">
            <Ring value={Math.round(focusMin / 600 * 100)} suffix="h" label="专注" />
            <div className="t-cap">专注 {Math.floor(focusMin/60)}h{focusMin%60}m</div>
          </div>
        </div>
      </div>

      {/* 趋势 */}
      <div className="section">
        <div className="section-head"><span className="section-title">每日完成趋势</span><span className="section-action">近 7 天</span></div>
        <div className="card card-pad me-spark">
          <Sparkline data={data.weekTrend} />
          <div className="t-sub" style={{ marginTop: 6 }}>本周累计完成 <b className="mono">{data.weekTrend.reduce((a,b)=>a+b,0)}</b> 项</div>
        </div>
      </div>

      {/* 热力图 */}
      <div className="section">
        <div className="section-head"><span className="section-title">连续完成热力图</span><span className="section-action">近 3 个月</span></div>
        <div className="card card-pad">
          <Heatmap data={data.heatmap} />
          <div className="heat-legend">
            <span className="t-cap">少</span>
            <div className="heat-cell on" style={{ opacity: .4 }} />
            <div className="heat-cell on" style={{ opacity: .7 }} />
            <div className="heat-cell on" />
            <span className="t-cap">多</span>
          </div>
        </div>
      </div>

      {/* 时间分布 */}
      <div className="section">
        <div className="section-head"><span className="section-title">本周时间分布</span></div>
        <div className="card card-pad">
          {data.weekDist.map(w => (
            <div key={w.domain} className="wd-row">
              <span className="t-sub" style={{ width: 64 }}>{DOMAIN_LABEL[w.domain]}</span>
              <div className="bar" style={{ flex: 1, height: 6 }}><i style={{ width: `${(w.minutes/max)*100}%` }} /></div>
              <span className="t-cap mono" style={{ width: 40, textAlign: 'right' }}>{w.minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* 项目进度 */}
      <div className="section">
        <div className="section-head"><span className="section-title">项目推进</span></div>
        <div className="card card-pad">
          <div className="me-proj">
            {data.projects.map(p => (
              <div key={p.id} className="me-proj-item">
                <span className="t-sub" style={{ width: 64 }}>{p.name}</span>
                <div className="bar"><i style={{ width: `${p.progress}%` }} /></div>
                <span className="t-cap mono">{p.progress}%</span>
              </div>
            ))}
            <div className="me-proj-item"><span className="t-sub" style={{ width: 64 }}>收集箱清空</span><div className="bar"><i style={{ width: `${data.inboxCleared/10*100}%` }} /></div><span className="t-cap mono">{data.inboxCleared}次</span></div>
          </div>
        </div>
      </div>

      {/* 邮箱 */}
      <div className="section">
        <div className="section-head"><span className="section-title">邮箱</span></div>
        <div className="card">
          <div className="me-mail-row b">
            <span className="icn-box"><IconMail size={15} /></span>
            <div style={{ flex: 1 }}>
              <div className="t-body">Gmail</div>
              <div className="t-cap">未连接 · 需后端授权环境</div>
            </div>
            <button className="chip tap" onClick={() => toast('需要后端 Gmail Connector，当前环境暂不支持')}>连接 Gmail</button>
          </div>
          <div className="me-mail-row">
            <span className="icn-box" style={{ opacity: .4 }}><IconLock size={15} /></span>
            <div style={{ flex: 1 }}>
              <div className="t-body" style={{ color: 'var(--ink-3)' }}>QQ 邮箱</div>
              <div className="t-cap">即将支持</div>
            </div>
            <button className="chip line tap" disabled style={{ opacity: .4 }} onClick={() => toast('即将支持')}>连接</button>
          </div>
        </div>
        <div className="t-cap me-mail-note">不在前端保存任何邮箱密码、授权码或 Token。</div>
      </div>

      {/* 数据与设置 */}
      <div className="section">
        <div className="section-head"><span className="section-title">数据与设置</span></div>
        <div className="card">
          <button className="me-set-row b" onClick={resetDemo}><span className="icn-box" style={{ width: 28, height: 28 }}><IconRefresh size={14} /></span><span style={{ flex: 1 }}>恢复演示数据</span><IconChevronRight size={15} /></button>
          <button className="me-set-row b" onClick={exportData}><span className="icn-box" style={{ width: 28, height: 28 }}><IconDownload size={14} /></span><span style={{ flex: 1 }}>导出数据</span><IconChevronRight size={15} /></button>
          <button className="me-set-row b" onClick={() => fileRef.current?.click()}><span className="icn-box" style={{ width: 28, height: 28 }}><IconChevronRight size={14} /></span><span style={{ flex: 1 }}>导入数据</span><IconChevronRight size={15} /></button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
          <button className="me-set-row" onClick={clearAll} style={{ color: 'var(--ink-2)' }}><span className="icn-box" style={{ width: 28, height: 28 }}><IconTrash size={14} /></span><span style={{ flex: 1 }}>清除所有数据</span><IconChevronRight size={15} /></button>
        </div>
        <div className="t-cap me-mail-note">数据保存在本地 LocalStorage · 清除前需二次确认 · 刷新不丢失</div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
