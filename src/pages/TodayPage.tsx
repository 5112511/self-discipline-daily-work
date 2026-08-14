import React, { useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_LABEL, DOMAIN_ICON, type Task, type Schedule, type Project, type Domain } from '../types'
import { useTaskSheet, useFocus } from '../App'
import { useConfirm } from '../components/ConfirmSheet'
import { useToast } from '../components/Toast'
import {
  IconFlame, IconClock, IconBolt, IconChevronRight, IconArrowRight,
  IconPlay, IconDots, IconMail, IconBulb, IconPlus, IconCheck
} from '../components/Icons'
import type { TabKey } from '../components/TabBar'
import { domainColor } from '../palette'

function domainChip(d: Task['domain']): React.CSSProperties {
  const c = domainColor(d)
  return { background: c.soft, color: c.ink, borderColor: c.base + '55' }
}

function Ring({ value, size = 56, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <svg width={size} height={size} style={{ flex: 'none' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--ink)" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="700" fill="var(--ink)">{value}%</text>
    </svg>
  )
}

const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' } as const

function Top3Card({ task, onChanged }: { task: Task; onChanged?: () => void }) {
  const { openEdit } = useTaskSheet()
  const { open: openFocus } = useFocus()
  const toast = useToast()
  const confirm = useConfirm()
  const done = task.status === 'done' || task.progress >= 100

  const toggleDone = () => {
    if (done) {
      store.updateTask(task.id, { status: 'pending', progress: 0, completedAt: undefined })
      toast('已取消完成')
    } else {
      store.updateTask(task.id, { status: 'done', progress: 100 })
      toast('已完成 ✓')
    }
    onChanged?.()
  }
  const delay = async () => {
    const ok = await confirm({ title: '延期这项任务？', message: '将从今日移出，回到待处理。', confirmText: '延期' })
    if (!ok) return
    store.updateTask(task.id, { inToday: false, inTop3: false, top3Order: undefined })
    // 重排剩余 top3
    const data = store.get()
    const rest = data.tasks.filter(t => t.inTop3 && t.id !== task.id).sort((a,b) => (a.top3Order??0)-(b.top3Order??0)).map(t => t.id)
    store.reorderTop3(rest)
    toast('已延期')
    onChanged?.()
  }
  const remove = () => {
    store.updateTask(task.id, { inTop3: false, top3Order: undefined })
    const data = store.get()
    const rest = data.tasks.filter(t => t.inTop3).sort((a,b) => (a.top3Order??0)-(b.top3Order??0)).map(t => t.id)
    store.reorderTop3(rest)
    toast('已移出 Top 3')
    onChanged?.()
  }
  const del = async () => {
    const ok = await confirm({ title: '删除这项任务？', message: '删除后可在历史记录中恢复。', confirmText: '删除' })
    if (!ok) return
    store.deleteTask(task.id)
    toast('已删除')
    onChanged?.()
  }

  return (
    <div className="card card-pad top3-card">
      <div className="top3-head">
        <span className="chip chip-dark">Top {(task.top3Order ?? 0) + 1}</span>
        <span className="chip" style={domainChip(task.domain)}>{DOMAIN_LABEL[task.domain]}</span>
        <span className="chip">{PRIORITY_LABEL[task.priority]}优先</span>
        <button className="tap top3-more" onClick={() => openEdit(task)}><IconDots size={18} /></button>
      </div>
      <div className="top3-title" onClick={() => openEdit(task)}>{task.title}</div>
      <div className="top3-meta">
        <span><IconClock size={13} /> {task.estimatedMinutes}分钟</span>
        <span>·</span>
        <span>截止 {task.dueTime || '今天'}</span>
        <span>·</span>
        <span>进度 {task.progress}%</span>
      </div>
      <div className="bar" style={{ margin: '10px 0 10px' }}><i style={{ width: `${task.progress}%` }} /></div>
      <div className="top3-next">
        <span className="icn-box" style={{ width: 24, height: 24 }}><IconArrowRight size={13} /></span>
        <span className="t-sub" style={{ flex: 1 }}>下一步：{task.nextAction || '（未设置）'}</span>
      </div>
      <div className="top3-actions">
        <button className="tap top3-act" onClick={() => openFocus(task.id)}><IconPlay size={14} /> 专注</button>
        <button className="tap top3-act" onClick={toggleDone}>{done ? '✓ 已完成' : '完成'}</button>
        <button className="tap top3-act" onClick={delay}>延期</button>
        <button className="tap top3-act" onClick={remove}>移出</button>
        <button className="tap top3-act" onClick={del} style={{ color: 'var(--danger)' }}>删除</button>
      </div>
    </div>
  )
}

function TimelineRow({ s }: { s: Schedule }) {
  const now = '14:30'
  const state = s.done ? 'done' : s.start <= now && s.end > now ? 'now' : 'next'
  const dc = domainColor(s.domain)
  return (
    <div className={'tl-row ' + state}>
      <div className="tl-rail">
        <div className="tl-dot" style={{ background: dc.base, borderColor: dc.base }} />
        {state === 'now' && <div className="tl-now-line" style={{ background: dc.base }} />}
      </div>
      <div className="tl-body">
        <div className="tl-time">{s.start} – {s.end}
          {state === 'done' && <span className="chip" style={{ marginLeft: 8, background: 'transparent' }}>已完成</span>}
          {state === 'now' && <span className="chip" style={{ marginLeft: 8, background: dc.soft, color: dc.ink, borderColor: dc.base + '66' }}>进行中</span>}
        </div>
        <div className="tl-title">{s.title}</div>
        <div className="t-cap" style={{ color: dc.ink }}>{DOMAIN_LABEL[s.domain]}</div>
      </div>
    </div>
  )
}

function DomainCard({ p }: { p: Project }) {
  return (
    <div className="card card-pad domain-card" style={{ flex: '0 0 240px' }}>
      <div className="domain-head">
        <span className="icn-box" style={{ width: 30, height: 30, fontSize: 15, background: domainColor(p.domain).soft, color: domainColor(p.domain).ink, borderColor: domainColor(p.domain).base }}>{DOMAIN_ICON[p.domain]}</span>
        <div className="domain-name">{DOMAIN_LABEL[p.domain]}</div>
      </div>
      <div className="domain-progress">
        <div className="bar"><i style={{ width: `${p.progress}%` }} /></div>
        <span className="t-cap">{p.progress}%</span>
      </div>
      <div className="t-sub" style={{ marginTop: 10, minHeight: 38 }}>下一步：{p.nextAction}</div>
      <div className="domain-foot">
        <span className="t-cap">待办 {p.todoCount}</span>
        {p.countdownDays != null && <span className="chip">还有 {p.countdownDays} 天</span>}
        <span className="t-cap" style={{ marginLeft: 'auto' }}>{p.updatedAt}</span>
      </div>
    </div>
  )
}

const SOURCE_ICON: Record<string, string> = { voice: '🎙', gmail: '✉', image: '▦', web: '⌘', manual: '✎', other: '•' }
const SOURCE_LABEL: Record<string, string> = { manual: '手动', voice: '语音', gmail: 'Gmail', image: '图片', web: '网页', other: '其他' }

export function TodayPage({ onSwitchTab, onOpenHistory }: { onSwitchTab?: (t: TabKey) => void; onOpenHistory?: () => void }) {
  const data = useStore()
  const { openNew } = useTaskSheet()
  const toast = useToast()
  const confirm = useConfirm()
  const now = '14:30'
  const [showDone, setShowDone] = useState(true)
  const [aiBrief, setAiBrief] = useState<{ summary?: string; focus?: string; risks?: string[]; steps?: string[]; efficiency?: string; raw?: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false)

  // 从 store 数据派生首页各模块（统一过滤已软删除）
  const allTasks = data.tasks.filter(t => !t.deletedAt)
  const top3 = allTasks.filter(t => t.inTop3 && t.status !== 'done').sort((a, b) => (a.top3Order ?? 99) - (b.top3Order ?? 99)).slice(0, 3)
  const overdueTasks = allTasks.filter(t => t.overdue && t.status !== 'done')
  const reminders = allTasks.filter(t => !t.inTop3 && t.status !== 'done' && t.status !== 'cancelled').slice(0, 8)
  const doneTasks = allTasks.filter(t => t.status === 'done').sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
  const totalToday = allTasks.filter(t => t.inToday || t.inTop3 || t.status === 'done').length
  const todayProgress = totalToday > 0 ? Math.round((doneTasks.length / totalToday) * 100) : 0
  const inspirations = data.inspirations.filter(i => !i.archived).slice(0, 5)
  const todayTimeline = data.schedules.filter(s => s.date === new Date().toISOString().slice(0, 10)).sort((a, b) => a.start.localeCompare(b.start))

  const greeting = data.meta.greeting
  const streak = data.meta.streakDays

  const completeReminder = (id: string) => {
    store.updateTask(id, { status: 'done', progress: 100 })
    toast('已完成 ✓')
  }
  const delayReminder = (id: string) => {
    store.updateTask(id, { inToday: false })
    toast('已延期')
  }
  const deleteReminder = async (id: string) => {
    const ok = await confirm({ title: '删除这条任务？', message: '删除后可在历史记录中恢复。', confirmText: '删除' })
    if (ok) { store.deleteTask(id); toast('已删除') }
  }
  const ignoreReminder = async (id: string) => {
    const ok = await confirm({ title: '忽略这条提醒？', message: '将从提醒列表移除（不删除任务）。', confirmText: '忽略' })
    if (ok) { store.updateTask(id, { inToday: false }); toast('已忽略') }
  }
  const addInspirationToTask = (content: string) => {
    const task = store.addTask({ title: content, domain: 'content', status: 'pending' })
    store.addContentFromTask(task.id)
    toast('已加入内容流水线「灵感」')
  }
  const analyzeProductivity = async (deep = false) => {
    setAiLoading(true)
    try {
      const snapshot = {
        todayProgress,
        completedCount: doneTasks.length,
        activeCount: allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length,
        overdueCount: overdueTasks.length,
        reminderCount: reminders.length,
        top3: top3.map(t => ({ title: t.title, progress: t.progress, estimatedMinutes: t.estimatedMinutes, nextAction: t.nextAction, status: t.status })),
        completedToday: doneTasks.slice(0, 8).map(t => ({ title: t.title, estimatedMinutes: t.estimatedMinutes, domain: DOMAIN_LABEL[t.domain] })),
        plannedMinutes: top3.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
        scheduledMinutes: todayTimeline.reduce((sum, s) => {
          const [sh, sm] = s.start.split(':').map(Number); const [eh, em] = s.end.split(':').map(Number)
          return sum + Math.max(0, eh * 60 + em - sh * 60 - sm)
        }, 0),
        deep,
      }
      const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'productivity', snapshot }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'AI 分析失败')
      setAiBrief(result)
      if (deep) setShowDeepAnalysis(true)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'AI 分析暂不可用')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="page today-page">
      {/* 1. 顶部 */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-date">{data.meta.greeting.includes('下午') ? '周四 · 7月30日' : '今日'}</div>
          <div className="hero-hello">{greeting}</div>
          <div className="hero-mood">{data.meta.mood}</div>
          <div className="hero-streak">
            <IconFlame size={14} /> 已连续 {streak} 天 · 今日完成 {todayProgress}%
          </div>
        </div>
        <div className="hero-right">
          <Ring value={todayProgress} />
          <button className="avatar hero-avatar tap" style={{ marginTop: 10, width: 40, height: 40 }} onClick={() => onSwitchTab?.('me')} aria-label="我的">{data.settings.avatarText}</button>
        </div>
      </div>

      {/* 2. AI 简报（规则版，基于真实数据） */}
      <div className="card card-pad brief">
        <div className="brief-head">
          <span className="icn-box dark" style={{ width: 26, height: 26 }}><IconBolt size={14} /></span>
          <span className="t-h3">AI 今日简报</span>
          <button className="chip line tap" style={{ marginLeft: 'auto' }} onClick={() => analyzeProductivity()} disabled={aiLoading}>{aiLoading ? '分析中' : aiBrief ? '更新简报' : '生成简报'}</button>
        </div>
        <div className="brief-block">
          <div className="brief-label">今天的重点</div>
          <div className="brief-text">{aiBrief?.summary || (top3.length > 0 ? top3.map(t => t.title).join('、') : '今日还没有安排 Top 3，先加入最重要的事。')}</div>
        </div>
        <div className="brief-block">
          <div className="brief-label">需要注意</div>
          <div className="brief-text">
            {aiBrief?.risks?.length ? aiBrief.risks.join('；') : <>{overdueTasks.length > 0 && `有 ${overdueTasks.length} 项逾期未完成；`}{reminders.length > 0 && `${reminders.length} 项待处理提醒待整理；`}{!overdueTasks.length && !reminders.length && '当前一切就绪，无逾期与积压。'}</>} 
          </div>
        </div>
        <div className="brief-block">
          <div className="brief-label">建议下一步</div>
          <div className="brief-text">{aiBrief?.focus || (top3[0] ? `先用 ${top3[0].estimatedMinutes || 30} 分钟完成「${top3[0].nextAction || top3[0].title}」` : '从收集箱挑一件最重要的事加入 Top 3。')}</div>
        </div>
        <div className="brief-foot">
          <span className="t-cap">基于任务、进度、日程与完成情况</span>
          <button className="tap chip line" onClick={() => analyzeProductivity(true)} disabled={aiLoading}>AI 深度分析</button>
        </div>
      </div>
      {showDeepAnalysis && aiBrief && (
        <div className="card card-pad ai-deep-analysis">
          <div className="section-head"><span className="section-title">AI 深度分析</span><button className="t-cap tap" onClick={() => setShowDeepAnalysis(false)}>收起</button></div>
          {aiBrief.efficiency && <div className="ai-analysis-summary">效率观察：{aiBrief.efficiency}</div>}
          {aiBrief.steps?.length ? <><div className="t-sub" style={{ marginTop: 12 }}>接下来这样做</div><div className="ai-analysis-steps">{aiBrief.steps.map((step, index) => <div key={`${index}-${step}`} className="ai-analysis-step"><b>{index + 1}</b><span>{step}</span></div>)}</div></> : null}
          {aiBrief.raw && <div className="t-body" style={{ marginTop: 10 }}>{aiBrief.raw}</div>}
        </div>
      )}

      {/* 3. Top 3 */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">今日聚焦 · Top 3</span>
          <button className="section-action" onClick={() => openNew()}>＋ 添加</button>
        </div>
        {top3.length > 0 ? (
          <div className="top3-list">
            {top3.map(t => <Top3Card key={t.id} task={t} />)}
          </div>
        ) : (
          <div className="card card-pad empty-block">
            <div className="emoji">✦</div>
            <div className="t-sub">今日还没有聚焦</div>
            <button className="chip chip-dark tap" style={{ marginTop: 12 }} onClick={() => openNew()}>加入第一件事</button>
          </div>
        )}
      </div>

      {/* 3.5 今日已完成（不消失，可折叠） */}
      {doneTasks.length > 0 && (
        <div className="section">
          <div className="section-head">
            <span className="section-title">今日已完成 · {doneTasks.length}</span>
            <button className="section-action" onClick={() => setShowDone(v => !v)}>{showDone ? '收起' : '展开'}</button>
          </div>
          {showDone && (
            <div className="card reminder-list">
              {doneTasks.map((t, i) => (
                <div key={t.id} className={'reminder-row' + (i < doneTasks.length - 1 ? ' b' : '')} style={{ opacity: 0.72 }}>
                  <span className="icn-box" style={{ width: 28, height: 28, background: 'var(--soft)', color: 'var(--ink)' }}><IconCheck size={14} /></span>
                  <div style={{ flex: 1 }}>
                    <div className="t-body" style={{ textDecoration: 'line-through' }}>{t.title}</div>
                    <div className="t-cap">{DOMAIN_LABEL[t.domain]} · {t.completedAt}</div>
                  </div>
                  <div className="reminder-acts">
                    <button className="tap t-cap" onClick={() => { store.updateTask(t.id, { status: 'pending', progress: 0, completedAt: undefined }); toast('已恢复') }}>恢复</button>
                    <button className="tap t-cap" style={{ color: 'var(--danger)' }} onClick={async () => { const ok = await confirm({ title: '删除这项任务？', message: '删除后可在历史记录中恢复。', confirmText: '删除' }); if (ok) { store.deleteTask(t.id); toast('已删除') } }}>删除</button>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 14px 4px' }}>
                <button className="tap chip line" style={{ width: '100%' }} onClick={() => onOpenHistory?.()}>查看全部历史 ›</button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* 4. 时间轴 */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">今日时间轴</span>
          <span className="section-action">{now} 当前</span>
        </div>
        <div className="card card-pad tl-wrap">
          {todayTimeline.length > 0 ? todayTimeline.map(s => <TimelineRow key={s.id} s={s} />) : (
            <div className="t-cap" style={{ textAlign: 'center', padding: 16 }}>今日尚无日程</div>
          )}
          <div className="tl-empty">
            <button className="tap chip" onClick={() => onSwitchTab?.('schedule')}>＋ 到日程页新增安排</button>
          </div>
        </div>
      </div>

      {/* 5. 六大主线 */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">六大生活主线</span>
          <button className="section-action" onClick={() => onSwitchTab?.('project')}>查看项目 ›</button>
        </div>
        <div className="scroll-x">
          {data.projects.map(p => <DomainCard key={p.id} p={p} />)}
        </div>
      </div>

      {/* 6. 待处理提醒 */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">待处理提醒</span>
          <span className="section-action">{reminders.length} 项</span>
        </div>
        {reminders.length > 0 ? (
          <div className="card reminder-list">
            {reminders.map((r, i) => (
              <div key={r.id} className={'reminder-row' + (i < reminders.length - 1 ? ' b' : '')}>
                <span className="icn-box" style={{ width: 28, height: 28 }}><IconChevronRight size={14} /></span>
                <div style={{ flex: 1 }}>
                  <div className="t-body">{r.title}</div>
                  {r.nextAction && <div className="t-cap">{r.nextAction}</div>}
                </div>
                <div className="reminder-acts">
                  <button className="tap t-cap" onClick={() => { store.updateTask(r.id, { inToday: true, inTop3: r.inTop3 }); toast('已加入今日') }}>加入今日</button>
                  <button className="tap t-cap" onClick={() => delayReminder(r.id)}>延期</button>
                  <button className="tap t-cap" onClick={() => completeReminder(r.id)}>完成</button>
                  <button className="tap t-cap" onClick={() => ignoreReminder(r.id)}>忽略</button>
                  <button className="tap t-cap" style={{ color: 'var(--danger)' }} onClick={() => deleteReminder(r.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card card-pad empty-block">
            <div className="emoji">○</div>
            <div className="t-sub">暂无待处理提醒</div>
          </div>
        )}
      </div>

      {/* 7. 最近灵感 */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">最近灵感</span>
          <button className="section-action" onClick={() => onSwitchTab?.('inbox')}>收集箱 ›</button>
        </div>
        {inspirations.length > 0 ? (
          <div className="card">
            {inspirations.map((it, i) => (
              <div key={it.id} className={'insp-row' + (i < inspirations.length - 1 ? ' b' : '')}>
                <span className="icn-box" style={{ width: 28, height: 28 }}>{SOURCE_ICON[it.source] || '•'}</span>
                <div style={{ flex: 1 }}>
                  <div className="t-body insp-text">{it.content}</div>
                  <div className="t-cap">{it.createdAt} · {SOURCE_LABEL[it.source] || '其他'}</div>
                </div>
                <div className="insp-acts">
                  <button className="chip line tap" onClick={() => addInspirationToTask(it.content)}>转任务</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card card-pad empty-block">
            <div className="emoji">✎</div>
            <div className="t-sub">还没有灵感，去收集箱记一笔</div>
          </div>
        )}
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
