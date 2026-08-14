import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_LABEL, type Domain, type FocusSession, type Schedule } from '../types'
import { useToast } from './Toast'
import { IconClose, IconPlay, IconPause, IconStop, IconTrash, IconCheck, IconPlus } from './Icons'

const DENSITY: Record<Domain, string> = {
  content: '#1a1a1a', ai: '#4a4a4a', health: '#8a8a8a', class: '#a5a5a5', work: '#b56b35', life: '#c4c4c4',
}
const DOMAINS: Domain[] = ['content', 'ai', 'health', 'class', 'work', 'life']

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

// 把 HH:mm 转成当天分钟数
function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}
function minToHm(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
}

type TimerState = 'idle' | 'running' | 'paused' | 'done'
type TimerMode = 'countdown' | 'countup'
const ACTIVE_FOCUS_KEY = 'personal-os-active-focus-v1'

// 以真实时间戳计算，切到后台或关闭专注页后重新打开仍可恢复。
function useFocusTimer(plannedMin: number, mode: TimerMode, onComplete?: () => void) {
  const [state, setState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [remaining, setRemaining] = useState(plannedMin * 60)
  const startRef = useRef(0), accRef = useRef(0), timerRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const save = (nextState: TimerState, start = startRef.current, acc = accRef.current) => localStorage.setItem(ACTIVE_FOCUS_KEY, JSON.stringify({ state: nextState, start, acc, plannedMin, mode }))
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  const tick = useCallback(() => {
    const total = accRef.current + Math.floor((Date.now() - startRef.current) / 1000)
    setElapsed(total)
    if (mode === 'countdown') {
      const rem = plannedMin * 60 - total
      if (rem <= 0) { setRemaining(0); setState('done'); clearTimer(); localStorage.removeItem(ACTIVE_FOCUS_KEY); onCompleteRef.current?.(); return }
      setRemaining(rem)
    }
    save('running')
  }, [plannedMin, mode])
  const start = useCallback(() => {
    if (state === 'running') return
    startRef.current = Date.now(); setState('running'); save('running'); clearTimer(); timerRef.current = window.setInterval(tick, 1000); tick()
  }, [state, tick])
  const pause = useCallback(() => {
    if (state !== 'running') return
    accRef.current += Math.floor((Date.now() - startRef.current) / 1000); setElapsed(accRef.current); setState('paused'); clearTimer(); save('paused', 0, accRef.current)
  }, [state, plannedMin, mode])
  const reset = useCallback(() => { clearTimer(); accRef.current = 0; setElapsed(0); setRemaining(plannedMin * 60); setState('idle'); localStorage.removeItem(ACTIVE_FOCUS_KEY) }, [plannedMin])
  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_FOCUS_KEY)
    if (!saved) return
    try { const v = JSON.parse(saved); if (v.mode === mode && v.plannedMin === plannedMin && v.state !== 'done') { accRef.current = v.acc || 0; startRef.current = v.start || 0; const total = v.state === 'running' ? accRef.current + Math.floor((Date.now() - startRef.current) / 1000) : accRef.current; setElapsed(total); setRemaining(Math.max(0, plannedMin * 60 - total)); setState(v.state); if (v.state === 'running') { timerRef.current = window.setInterval(tick, 1000); tick() } } } catch { localStorage.removeItem(ACTIVE_FOCUS_KEY) }
    return () => clearTimer()
  }, [])
  useEffect(() => { if (state === 'idle') { setElapsed(0); setRemaining(plannedMin * 60) } }, [plannedMin, mode])
  return { state, remaining, elapsed, start, pause, reset }
}

// 一天时间格子：把当天专注会话画成 24h 条
function DayGrid({ sessions }: { sessions: FocusSession[] }) {
  const hourW = 100 / 24 // %
  return (
    <div className="focus-daygrid">
      <div className="focus-daygrid-track">
        {sessions.filter(s => !s.cancelled).map(s => {
          const sm = hmToMin(s.start)
          const em = Math.min(hmToMin(s.end), 24 * 60)
          const left = (sm / (24 * 60)) * 100
          const width = Math.max(((em - sm) / (24 * 60)) * 100, 0.8)
          return <div key={s.id} className="focus-daygrid-bar" style={{ left: left + '%', width: width + '%', background: DENSITY[s.domain] }} title={s.title} />
        })}
      </div>
      <div className="focus-daygrid-hours">
        {[0, 6, 12, 18, 24].map(h => <span key={h} style={{ left: (h / 24) * 100 + '%' }}>{h}</span>)}
      </div>
    </div>
  )
}

// 可滚动时间线（已迁移至双列对照，保留以备复用）

export function FocusOverlay({ open, onClose, presetTaskId }: { open: boolean; onClose: () => void; presetTaskId?: string }) {
  const data = useStore()
  const toast = useToast()
  const settings = data.focusSettings

  // 计时配置
  const savedActive = (() => { try { return JSON.parse(localStorage.getItem(ACTIVE_FOCUS_KEY) || 'null') } catch { return null } })()
  const savedMeta = (() => { try { return JSON.parse(localStorage.getItem('personal-os-active-focus-meta-v1') || 'null') } catch { return null } })()
  const [plannedMin, setPlannedMin] = useState(savedActive?.plannedMin || settings.pomodoroMin)
  const [customMin, setCustomMin] = useState(String(savedActive?.plannedMin || settings.pomodoroMin))
  const [timerMode, setTimerMode] = useState<TimerMode>(savedActive?.mode || 'countdown')
  const [title, setTitle] = useState(savedMeta?.title || '')
  const [domain, setDomain] = useState<Domain>(savedMeta?.domain || 'content')
  const [taskId, setTaskId] = useState<string | undefined>(savedMeta?.taskId || presetTaskId)

// 任务建议：doing/pending 的任务
const suggestions = data.tasks.filter(t => !t.deletedAt && (t.status === 'doing' || t.status === 'pending')).slice(0, 8)

  useEffect(() => {
    if (presetTaskId) {
      const t = data.tasks.find(x => x.id === presetTaskId)
      if (t) { setTaskId(t.id); setTitle(t.title); setDomain(t.domain) }
    }
  }, [presetTaskId, data.tasks])

  // 计时开始时刻
  const startClockRef = useRef<string>('')
  const [editing, setEditing] = useState<FocusSession | null>(null)
  const [showFocusSheet, setShowFocusSheet] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', domain: 'content' as Domain, start: '09:00', end: '10:00', actualMin: 25 })
  const [planForm, setPlanForm] = useState({ title: '', domain: 'content' as Domain, start: '09:00', end: '10:00' })
  const [planEditing, setPlanEditing] = useState<string | null>(null)
  const [showPlanSheet, setShowPlanSheet] = useState(false)

  const onComplete = useCallback(() => {
    // 自动落库一条完成的会话
    const end = new Date()
    const endHm = minToHm(end.getHours() * 60 + end.getMinutes())
    store.addFocusSession({
      title: title || '专注',
      domain,
      taskId,
      start: startClockRef.current || '09:00',
      end: endHm,
      plannedMin,
      actualMin: plannedMin,
      completed: true,
    })
    localStorage.removeItem('personal-os-active-focus-meta-v1')
    toast(timerMode === 'countdown' ? '番茄完成 ✓ 已记录' : '专注已记录')
    if (settings.notification && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('番茄完成', { body: `${title || '专注'} · ${plannedMin} 分钟` })
    }
  }, [title, domain, taskId, plannedMin, timerMode, settings.notification, toast])

  const timer = useFocusTimer(plannedMin, timerMode, onComplete)

  const handleStart = () => {
    const now = new Date()
    startClockRef.current = minToHm(now.getHours() * 60 + now.getMinutes())
    localStorage.setItem('personal-os-active-focus-meta-v1', JSON.stringify({ title, domain, taskId, start: startClockRef.current }))
    timer.start()
  }

  // 停止并记录（提前结束）
  const handleStopLog = () => {
    const actualMin = Math.max(1, Math.round(timer.elapsed / 60))
    const now = new Date()
    store.addFocusSession({
      title: title || '专注',
      domain,
      taskId,
      start: startClockRef.current || '09:00',
      end: minToHm(now.getHours() * 60 + now.getMinutes()),
      plannedMin,
      actualMin,
      completed: false,
    })
    toast(`已停止并记录 ${actualMin} 分钟`)
    localStorage.removeItem('personal-os-active-focus-meta-v1')
    timer.reset()
  }

  // 取消（不记录）
  const handleCancel = () => {
    localStorage.removeItem('personal-os-active-focus-meta-v1')
    timer.reset()
    toast('已取消，未记录')
  }

  // 今日会话
  const today = new Date()
  const todayYmd = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  const hm = today.getHours() * 60 + today.getMinutes()
  const todaySessions = data.focusSessions.filter(s => s.date === todayYmd)
  const todaySchedules = data.schedules.filter(s => s.date === todayYmd).sort((a, b) => hmToMin(a.start) - hmToMin(b.start))
  const validSessions = todaySessions.filter(s => !s.cancelled)
  const totalMin = validSessions.reduce((a, s) => a + s.actualMin, 0)
  const pomoCount = validSessions.filter(s => s.completed).length

  // 按领域分布
  const byDomain: Record<string, number> = {}
  validSessions.forEach(s => { byDomain[s.domain] = (byDomain[s.domain] || 0) + s.actualMin })
  const maxDom = Math.max(...Object.values(byDomain), 1)

  // 打开会话编辑
  const openEdit = (s: FocusSession) => {
    setEditing(s)
    setEditForm({ title: s.title, domain: s.domain, start: s.start, end: s.end, actualMin: s.actualMin })
    setShowFocusSheet(true)
  }
  const saveEdit = () => {
    const actualMin = Math.max(0, Math.min(hmToMin(editForm.end) - hmToMin(editForm.start), editForm.actualMin || 0))
    if (editing) {
      store.updateFocusSession(editing.id, { ...editForm, actualMin })
    } else {
      store.addFocusSession({ ...editForm, date: todayYmd, actualMin: editForm.actualMin || actualMin, completed: true })
    }
    toast(editing ? '已更新' : '已记录')
    setEditing(null)
    setShowFocusSheet(false)
  }
  const deleteEdit = () => {
    if (!editing) return
    store.deleteFocusSession(editing.id)
    toast('已删除')
    setEditing(null)
    setShowFocusSheet(false)
  }

  // 计划日程增删改
  const savePlan = () => {
    if (planEditing) {
      store.updateSchedule(planEditing, planForm)
    } else {
      store.addSchedule({ ...planForm, date: todayYmd })
    }
    toast(planEditing ? '已更新' : '已添加计划')
    setPlanEditing(null)
    setShowPlanSheet(false)
  }
  const deletePlan = () => {
    if (!planEditing) return
    store.deleteSchedule(planEditing)
    toast('已删除')
    setPlanEditing(null)
    setShowPlanSheet(false)
  }

  // 申请通知权限
  useEffect(() => {
    if (settings.notification && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [settings.notification])

  if (!open) return null

  const progress = timerMode === 'countdown' && plannedMin > 0 ? (1 - timer.remaining / (plannedMin * 60)) : Math.min(timer.elapsed / Math.max(plannedMin * 60, 1), 1)
  const R = 120, C = 2 * Math.PI * R

  return (
    <div className="focus-overlay">
      <div className="focus-header">
        <button className="t-sub tap" onClick={onClose}><IconClose size={20} /></button>
        <div className="t-h3">专注模式</div>
        <span className="t-cap mono">{todaySessions.length} 次</span>
      </div>

      <div className="focus-body">
        {/* 计时器 */}
        <div className="focus-timer-card">
          <div className="focus-ring-wrap">
            <svg width="100%" height="100%" viewBox="0 0 260 260" preserveAspectRatio="xMidYMid meet">
              <circle cx="130" cy="130" r={R} stroke="var(--line-2)" strokeWidth="10" fill="none" />
              <circle cx="130" cy="130" r={R} stroke="var(--ink)" strokeWidth="10" fill="none"
                strokeDasharray={C} strokeDashoffset={C * (1 - progress)} strokeLinecap="round"
                transform="rotate(-90 130 130)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="focus-ring-center">
              <span className="focus-clock mono">{fmtClock(timerMode === 'countup' ? timer.elapsed : timer.remaining)}</span>
              <span className="t-cap">{timer.state === 'running' ? '专注中' : timer.state === 'paused' ? '已暂停' : timer.state === 'done' ? '已完成' : '待开始'}</span>
            </div>
          </div>

          {/* 计时方式与时长 */}
          <div className="focus-presets">
            <button className={'chip ' + (timerMode === 'countdown' ? 'chip-dark' : 'line') + ' tap'} disabled={timer.state === 'running' || timer.state === 'paused'} onClick={() => setTimerMode('countdown')}>倒计时</button>
            <button className={'chip ' + (timerMode === 'countup' ? 'chip-dark' : 'line') + ' tap'} disabled={timer.state === 'running' || timer.state === 'paused'} onClick={() => setTimerMode('countup')}>正向计时</button>
            {timerMode === 'countdown' && [15, 25, 50].map(m => (
              <button key={m} className={'chip ' + (plannedMin === m ? 'chip-dark' : 'line') + ' tap'} onClick={() => { if (timer.state === 'idle' || timer.state === 'done') { setPlannedMin(m); setCustomMin(String(m)) } }}>{m}min</button>
            ))}
            {timerMode === 'countdown' && <input className="tf-input mono focus-custom-min" type="number" min="1" max="480" value={customMin} placeholder="分钟"
              onChange={(e) => { const v = e.target.value; setCustomMin(v); const min = Number(v); if ((timer.state === 'idle' || timer.state === 'done') && Number.isFinite(min) && min >= 1 && min <= 480) setPlannedMin(min) }} />}
          </div>

          {/* 控制按钮 */}
          <div className="focus-controls">
            {timer.state === 'idle' && <button className="focus-ctrl primary tap" onClick={handleStart}><IconPlay size={20} /> 开始</button>}
            {timer.state === 'running' && <button className="focus-ctrl tap" onClick={timer.pause}><IconPause size={20} /> 暂停</button>}
            {timer.state === 'paused' && <button className="focus-ctrl primary tap" onClick={timer.start}><IconPlay size={20} /> 继续</button>}
            {(timer.state === 'running' || timer.state === 'paused') && <button className="focus-ctrl tap" onClick={handleStopLog}><IconStop size={18} /> 停止记录</button>}
            {(timer.state === 'running' || timer.state === 'paused') && <button className="focus-ctrl ghost tap" onClick={handleCancel}>取消</button>}
            {timer.state === 'done' && <button className="focus-ctrl primary tap" onClick={timer.reset}>再来一次</button>}
          </div>
        </div>

        {/* 专注目标 */}
        <div className="card card-pad focus-target">
          <div className="section-head"><span className="section-title">本次专注</span></div>
          <input className="tf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="在做什么？" />
          <div className="tf-chips">
            {DOMAINS.map(d => (
              <button key={d} className={'chip ' + (domain === d ? 'chip-dark' : 'line') + ' tap'} onClick={() => setDomain(d)}>{DOMAIN_LABEL[d]}</button>
            ))}
          </div>
        </div>

        {/* 任务建议 */}
        {suggestions.length > 0 && (
          <div className="card card-pad">
            <div className="section-head"><span className="section-title">任务建议</span><span className="section-action">点击选用</span></div>
            <div className="focus-suggestions">
              {suggestions.map(t => (
                <button key={t.id} className={'focus-sug' + (taskId === t.id ? ' on' : '') + ' tap'} onClick={() => { setTaskId(t.id === taskId ? undefined : t.id); setTitle(t.title); setDomain(t.domain) }}>
                  <span className="focus-sug-dot" style={{ background: DENSITY[t.domain] }} />
                  <span className="focus-sug-title">{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 今日仪表盘 */}
        <div className="card card-pad">
          <div className="section-head"><span className="section-title">今日专注</span><span className="section-action mono">{totalMin}m · {pomoCount} 🍅</span></div>
          <div className="focus-stats">
            <div className="focus-stat">
              <div className="t-h2 mono">{Math.floor(totalMin / 60)}h{totalMin % 60}m</div>
              <div className="t-cap">专注时长</div>
            </div>
            <div className="focus-stat">
              <div className="t-h2 mono">{pomoCount}</div>
              <div className="t-cap">番茄数</div>
            </div>
            <div className="focus-stat">
              <div className="t-h2 mono">{validSessions.length}</div>
              <div className="t-cap">会话数</div>
            </div>
          </div>

          {/* 一天时间格子 */}
          <DayGrid sessions={todaySessions} />

          {/* 按领域分布 */}
          {Object.keys(byDomain).length > 0 && (
            <div className="focus-dist">
              {Object.entries(byDomain).map(([d, m]) => (
                <div key={d} className="wd-row">
                  <span className="t-sub" style={{ width: 64 }}>{DOMAIN_LABEL[d as Domain]}</span>
                  <div className="bar" style={{ flex: 1, height: 6 }}><i style={{ width: (m / maxDom) * 100 + '%', background: DENSITY[d as Domain] }} /></div>
                  <span className="t-cap mono" style={{ width: 40, textAlign: 'right' }}>{m}m</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 今日计划 vs 实际 双列 */}
        <div className="card card-pad focus-duo">
          <div className="section-head">
            <span className="section-title">日程对照</span>
            <span className="section-action">计划 · 实际</span>
          </div>
          <div className="focus-duo-cols">
            {/* 左列：计划 */}
            <div className="focus-col">
              <div className="focus-col-head">
                <span className="t-sub">计划</span>
                <button className="t-sub tap" onClick={() => { setPlanForm({ title: '', domain, start: minToHm(hm), end: minToHm(hm + 25) }); setPlanEditing(null); setShowPlanSheet(true) }}><IconPlus size={14} /></button>
              </div>
              <div className="focus-col-list">
                {todaySchedules.length === 0 && <div className="t-cap focus-empty">还没有计划</div>}
                {todaySchedules.map(s => (
                  <div key={s.id} className={'focus-pl' + (s.done ? ' done' : '')} onClick={() => { setPlanForm({ title: s.title, domain: s.domain, start: s.start, end: s.end }); setPlanEditing(s.id); setShowPlanSheet(true) }}>
                    <span className="focus-pl-dot" style={{ background: DENSITY[s.domain] }} />
                    <div className="focus-pl-time mono">{s.start}</div>
                    <div className="focus-pl-body">
                      <div className="focus-pl-title">{s.title}</div>
                      <div className="focus-pl-meta">{DOMAIN_LABEL[s.domain]} · {s.start}-{s.end}</div>
                    </div>
                    <button className="focus-pl-check tap" onClick={(e) => { e.stopPropagation(); store.updateSchedule(s.id, { done: !s.done }) }}><IconCheck size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="focus-col-foot mono">{todaySchedules.filter(s => s.done).length}/{todaySchedules.length} 完成 · {todaySchedules.filter(s => !s.done).reduce((a, s) => a + Math.max(0, hmToMin(s.end) - hmToMin(s.start)), 0)}min 待办</div>
            </div>

            {/* 右列：实际 */}
            <div className="focus-col">
              <div className="focus-col-head">
                <span className="t-sub">实际</span>
                <button className="t-sub tap" onClick={() => { setEditForm({ title: '', domain, start: minToHm(hm), end: minToHm(hm + 25), actualMin: 25 }); setEditing(null); setShowFocusSheet(true) }}><IconPlus size={14} /></button>
              </div>
              <div className="focus-col-list">
                {todaySessions.length === 0 && <div className="t-cap focus-empty">还没有记录</div>}
                {[...todaySessions].sort((a, b) => hmToMin(a.start) - hmToMin(b.start)).map(s => (
                  <div key={s.id} className={'focus-pl' + (s.cancelled ? ' cancelled' : '') + (s.completed ? ' done' : '')} onClick={() => openEdit(s)}>
                    <span className="focus-pl-dot" style={{ background: DENSITY[s.domain] }} />
                    <div className="focus-pl-time mono">{s.start}</div>
                    <div className="focus-pl-body">
                      <div className="focus-pl-title">{s.title}{s.cancelled && <span className="t-cap"> · 取消</span>}</div>
                      <div className="focus-pl-meta">{DOMAIN_LABEL[s.domain]} · {s.actualMin}min{s.completed ? ' · 🍅' : ''}</div>
                    </div>
                    <span className="focus-pl-dur mono">{s.actualMin}m</span>
                  </div>
                ))}
              </div>
              <div className="focus-col-foot mono">{totalMin}min · {validSessions.length} 次</div>
            </div>
          </div>
        </div>
      </div>

      {/* 实际会话编辑弹窗 */}
      {showFocusSheet && (
        <div className="sheet-mask" onClick={() => { setEditing(null); setShowFocusSheet(false) }}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingTop: 8 }}>
            <div className="sheet-handle" />
            <div className="sheet-head"><div className="t-h3">{editing ? '编辑会话' : '记录专注'}</div><button className="t-sub tap" onClick={() => { setEditing(null); setShowFocusSheet(false) }}>取消</button></div>
            <div className="task-form">
              <label className="tf-label">标题</label>
              <input className="tf-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              <label className="tf-label">领域</label>
              <div className="tf-chips">
                {DOMAINS.map(d => (
                  <button key={d} className={'chip ' + (editForm.domain === d ? 'chip-dark' : 'line') + ' tap'} onClick={() => setEditForm({ ...editForm, domain: d })}>{DOMAIN_LABEL[d]}</button>
                ))}
              </div>
              <div className="tf-row2">
                <div>
                  <label className="tf-label">开始</label>
                  <input className="tf-input mono" type="time" value={editForm.start} onChange={(e) => setEditForm({ ...editForm, start: e.target.value })} />
                </div>
                <div>
                  <label className="tf-label">结束</label>
                  <input className="tf-input mono" type="time" value={editForm.end} onChange={(e) => setEditForm({ ...editForm, end: e.target.value })} />
                </div>
              </div>
              <label className="tf-label">实际时长(分钟)</label>
              <input className="tf-input mono" type="number" min="0" value={editForm.actualMin} onChange={(e) => setEditForm({ ...editForm, actualMin: Math.max(0, Number(e.target.value) || 0) })} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="confirm-btn" onClick={saveEdit}>{editing ? '保存' : '记录'}</button>
                {editing && <button className="chip line tap" style={{ color: 'var(--danger)' }} onClick={deleteEdit}><IconTrash size={14} /> 删除</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 计划日程编辑弹窗 */}
      {showPlanSheet && (
        <div className="sheet-mask" onClick={() => { setPlanEditing(null); setShowPlanSheet(false) }}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingTop: 8 }}>
            <div className="sheet-handle" />
            <div className="sheet-head"><div className="t-h3">{planEditing ? '编辑计划' : '添加计划'}</div><button className="t-sub tap" onClick={() => { setPlanEditing(null); setShowPlanSheet(false) }}>取消</button></div>
            <div className="task-form">
              <label className="tf-label">标题</label>
              <input className="tf-input" value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} placeholder="计划做什么？" />
              <label className="tf-label">领域</label>
              <div className="tf-chips">
                {DOMAINS.map(d => (
                  <button key={d} className={'chip ' + (planForm.domain === d ? 'chip-dark' : 'line') + ' tap'} onClick={() => setPlanForm({ ...planForm, domain: d })}>{DOMAIN_LABEL[d]}</button>
                ))}
              </div>
              <div className="tf-row2">
                <div>
                  <label className="tf-label">开始</label>
                  <input className="tf-input mono" type="time" value={planForm.start} onChange={(e) => setPlanForm({ ...planForm, start: e.target.value })} />
                </div>
                <div>
                  <label className="tf-label">结束</label>
                  <input className="tf-input mono" type="time" value={planForm.end} onChange={(e) => setPlanForm({ ...planForm, end: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="confirm-btn" onClick={savePlan}>{planEditing ? '保存' : '添加'}</button>
                {planEditing && <button className="chip line tap" style={{ color: 'var(--danger)' }} onClick={deletePlan}><IconTrash size={14} /> 删除</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
