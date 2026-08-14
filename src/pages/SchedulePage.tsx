import React, { useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_LABEL, type Domain } from '../types'
import { useToast } from '../components/Toast'
import { IconPlus } from '../components/Icons'
import { monthMatrix, weekMatrix, todayYmd, DOW_MON, MONTH_NAMES, exportICS, importICS, parseDueDate } from '../calendar'
import { domainColor } from '../palette'

// 日程分类色：软背景 + 深字 + 边框主色
const DENSITY: Record<Domain, string> = Object.fromEntries(
  (['content', 'ai', 'health', 'class', 'work', 'life'] as Domain[]).map(d => [d, domainColor(d).soft])
) as Record<Domain, string>
const DENSITY_FG: Record<Domain, string> = Object.fromEntries(
  (['content', 'ai', 'health', 'class', 'work', 'life'] as Domain[]).map(d => [d, domainColor(d).ink])
) as Record<Domain, string>
const DENSITY_BORDER: Record<Domain, string> = Object.fromEntries(
  (['content', 'ai', 'health', 'class', 'work', 'life'] as Domain[]).map(d => [d, domainColor(d).base])
) as Record<Domain, string>
const DOMAINS: Domain[] = ['content', 'ai', 'health', 'class', 'work', 'life']

// 把未删除任务的 dueDate 解析后按日期聚合（用于日历标记）
function tasksByDate(tasks: { dueDate?: string; id: string; title: string; domain: any; status: string; dueTime?: string }[]): Record<string, { id: string; title: string; domain: Domain; done: boolean; dueTime?: string }[]> {
  const m: Record<string, { id: string; title: string; domain: Domain; done: boolean; dueTime?: string }[]> = {}
  for (const t of tasks) {
    const ymd = parseDueDate(t.dueDate)
    if (!ymd) continue
    (m[ymd] ||= []).push({ id: t.id, title: t.title, domain: t.domain as Domain, done: t.status === 'done', dueTime: t.dueTime })
  }
  return m
}

function DayView({ selectedDate, onJump }: { selectedDate: string; onJump?: (ymd: string) => void }) {
  const data = useStore()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', domain: 'life' as Domain, date: selectedDate, start: '09:00', end: '10:00' })

  // 该日日程
  const daySchedules = data.schedules.filter(s => s.date === selectedDate)
  // 该日截止的任务（用 dueDate 解析）
  const tByDate = tasksByDate(data.tasks)
  const dayTasks = tByDate[selectedDate] || []
  const startHour = 7, endHour = 23
  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)
  const hourH = 56

  // 当前时间指示线（仅当选中今天时显示）
  const now = new Date()
  const isToday = selectedDate === todayYmd()
  const nowTop = isToday ? (now.getHours() - startHour) * hourH + (now.getMinutes() / 60) * hourH : null

  const save = () => {
    if (!form.title.trim()) { toast('请填写标题'); return }
    store.addSchedule(form)
    toast('已添加日程')
    setAdding(false)
    setForm({ ...form, title: '' })
  }

  const selDate = new Date(selectedDate + 'T00:00:00')

  return (
    <>
      <div className="card card-pad day-view">
        <div className="day-head">
          <div>
            <div className="t-h3">{selDate.getMonth() + 1}月{selDate.getDate()}日</div>
            <div className="t-cap">周{DOW_MON[(selDate.getDay() + 6) % 7]} · {daySchedules.length} 项日程{dayTasks.length > 0 ? ` · ${dayTasks.length} 项任务截止` : ''}</div>
          </div>
          {isToday ? <span className="chip chip-dark">今天</span> : <button className="chip line tap" onClick={() => onJump?.(todayYmd())}>回今天</button>}
        </div>
        <div className="day-body" style={{ position: 'relative' }}>
          {nowTop !== null && (
            <div className="day-now" style={{ top: nowTop }}>
              <span className="day-now-line" />
              <span className="day-now-time">{now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}</span>
            </div>
          )}
          {hours.map(h => {
            const evts = daySchedules.filter(s => parseInt(s.start.split(':')[0]) === h)
            return (
              <div key={h} className="day-hour">
                <div className="day-hour-label">{String(h).padStart(2, '0')}:00</div>
                <div className="day-hour-body" style={{ height: hourH }}>
                  {evts.map(e => {
                    const startMin = parseInt(e.start.split(':')[1])
                    const dur = (parseInt(e.end.split(':')[0]) - parseInt(e.start.split(':')[0])) * 60 + parseInt(e.end.split(':')[1]) - startMin
                    const top = (startMin / 60) * hourH
                    const height = Math.max((dur / 60) * hourH, 30)
                    const done = e.done
                    return (
                      <div key={e.id} className={'day-evt' + (done ? ' done' : '')} style={{
                        top, height,
                        background: done ? 'var(--bg-soft)' : DENSITY[e.domain],
                        color: done ? 'var(--ink-3)' : DENSITY_FG[e.domain],
                        border: '1px solid ' + (done ? 'var(--line)' : DENSITY_BORDER[e.domain]),
                      }} onClick={() => { store.updateSchedule(e.id, { done: !done }); toast(done ? '已取消完成' : '✓ 已完成') }}>
                        <div className="day-evt-time">{e.start}-{e.end}</div>
                        <div className="day-evt-title">{e.title}</div>
                      </div>
                    )
                  })}
                  <div className="day-hour-empty" onClick={() => { setForm({ ...form, date: selectedDate, start: String(h).padStart(2, '0') + ':00', end: String(h + 1).padStart(2, '0') + ':00' }); setAdding(true) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {dayTasks.length > 0 && (
        <div className="card card-pad" style={{ marginTop: 10 }}>
          <div className="t-sub" style={{ marginBottom: 8 }}>今日截止任务</div>
          {dayTasks.map(t => (
            <div key={t.id} className="day-task-row">
              <span className="day-task-time">{t.dueTime || 'DDL'}</span>
              <span className={'day-task-title' + (t.done ? ' done' : '')}>{t.title}</span>
              {t.done ? <span className="chip">✓</span> : <span className="chip line">待完成</span>}
            </div>
          ))}
        </div>
      )}
      <button className="chip chip-dark tap" style={{ marginTop: 10 }} onClick={() => { setForm({ ...form, date: selectedDate }); setAdding(true) }}><IconPlus size={14} /> 新建日程</button>

      {adding && (
        <div className="sheet-mask" onClick={() => setAdding(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingTop: 8 }}>
            <div className="sheet-handle" />
            <div className="sheet-head"><div className="t-h3">新建日程</div><button className="t-sub tap" onClick={() => setAdding(false)}>取消</button></div>
            <div className="task-form">
              <label className="tf-label">标题</label>
              <input className="tf-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如：内容拍摄" autoFocus />
              <label className="tf-label">日期</label>
              <input className="tf-input mono" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <label className="tf-label">所属领域</label>
              <div className="tf-chips">
                {DOMAINS.map(d => {
                  const c = domainColor(d)
                  const on = form.domain === d
                  return (
                    <button key={d} className={'chip ' + (on ? '' : 'line') + ' tap'} style={on ? { background: c.base, color: '#fff', borderColor: c.base } : { color: c.ink, borderColor: c.base + '66' }} onClick={() => setForm({ ...form, domain: d })}>{DOMAIN_LABEL[d]}</button>
                  )
                })}
              </div>
              <div className="tf-row2">
                <div>
                  <label className="tf-label">开始</label>
                  <input className="tf-input mono" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                </div>
                <div>
                  <label className="tf-label">结束</label>
                  <input className="tf-input mono" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                </div>
              </div>
              <button className="confirm-btn" onClick={save}>保存日程</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function WeekView({ year, weekIdx, onJump }: { year: number; weekIdx: number; onJump: (ymd: string) => void }) {
  const data = useStore()
  const days = weekMatrix(year, weekIdx)
  const byDate: Record<string, typeof data.schedules> = {}
  data.schedules.forEach(s => { (byDate[s.date] ||= []).push(s) })
  const tByDate = tasksByDate(data.tasks)
  return (
    <div className="card card-pad week-view">
      <div className="week-days-row">
        {days.map(d => {
          const evts = byDate[d.ymd] || []
          const tasks = tByDate[d.ymd] || []
          const dotColor = evts[0] ? domainColor(evts[0].domain).base : (tasks[0] ? domainColor(tasks[0].domain).base : 'var(--ink-3)')
          const hasTask = tasks.length > 0
          const undoneTasks = tasks.filter(t => !t.done).length
          return (
          <button key={d.ymd} className={'week-day-cell tap' + (d.isToday ? ' today' : '')} onClick={() => onJump(d.ymd)}>
            <div className="week-day-dow">周{DOW_MON[(d.weekday + 6) % 7]}</div>
            <div className="week-day-num">{d.day}</div>
            <div className="week-day-dots">
              {evts.length > 0 && <span className="week-day-dot" style={{ background: dotColor }} />}
              {hasTask && <span className={'cal-day-task' + (undoneTasks > 0 ? ' todo' : '')} title={`${tasks.length} 个任务截止`} />}
            </div>
          </button>
          )
        })}
      </div>
      <div className="divider" />
      <div className="week-evt-list">
        {days.map(d => {
          const evts = data.schedules.filter(s => s.date === d.ymd)
          const tasks = tByDate[d.ymd] || []
          if (evts.length === 0 && tasks.length === 0) return null
          return (
            <div key={d.ymd} className="week-evt-group">
              <div className="week-evt-date">{(d.date.getMonth() + 1)}/{d.day}</div>
              <div className="week-evt-items">
                {evts.map(e => (
                  <div key={e.id} className={'week-evt-item' + (e.done ? ' done' : '')} style={{ background: DENSITY[e.domain], color: DENSITY_FG[e.domain] }}>
                    <span className="week-evt-time">{e.start}</span>
                    <span className="week-evt-title">{e.title}</span>
                  </div>
                ))}
                {tasks.map(t => (
                  <div key={t.id} className="week-evt-item task" style={{ background: t.done ? 'var(--bg-soft)' : 'transparent', color: t.done ? 'var(--ink-3)' : DENSITY_FG[t.domain], borderColor: DENSITY_BORDER[t.domain] }}>
                    <span className="week-evt-time">{t.dueTime || 'DDL'}</span>
                    <span className="week-evt-title">{t.title}{t.done ? ' ✓' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {days.every(d => (data.schedules.filter(s => s.date === d.ymd).length === 0 && (tByDate[d.ymd] || []).length === 0)) && <div className="t-cap" style={{ padding: 12, textAlign: 'center' }}>本周暂无日程与任务</div>}
      </div>
    </div>
  )
}

function MonthView({ year, month, onJump }: { year: number; month: number; onJump: (ymd: string) => void }) {
  const data = useStore()
  const weeks = monthMatrix(year, month)
  const byDate: Record<string, typeof data.schedules> = {}
  data.schedules.forEach(s => { (byDate[s.date] ||= []).push(s) })
  const tByDate = tasksByDate(data.tasks)
  const today = todayYmd()
  const legendDomains = DOMAINS.filter(domain => data.schedules.some(s => s.domain === domain) || data.tasks.some(t => t.domain === domain))

  return (
    <div className="card card-pad month-view">
      <div className="month-legend" aria-label="日程分类">
        {(legendDomains.length > 0 ? legendDomains : DOMAINS).map(domain => (
          <span key={domain} className="month-legend-item">
            <span className="month-legend-dot" style={{ background: domainColor(domain).base }} />
            {DOMAIN_LABEL[domain]}
          </span>
        ))}
      </div>
      <div className="cal-weeknames">
        {DOW_MON.map(n => <div key={n} className="cal-dow">{n}</div>)}
      </div>
      <div className="cal-grid month-task-grid">
        {weeks.map((w, wi) => (
          <div key={wi} className="cal-week">
            {w.map(c => {
              const evts = byDate[c.ymd] || []
              const tasks = tByDate[c.ymd] || []
              const items = [
                ...evts.map(e => ({ id: e.id, title: e.title, domain: e.domain as Domain, done: e.done, time: e.start })),
                ...tasks.map(t => ({ id: t.id, title: t.title, domain: t.domain, done: t.done, time: t.dueTime || 'DDL' })),
              ]
              const visibleItems = items.slice(0, 3)
              const extraCount = Math.max(items.length - visibleItems.length, 0)
              return (
                <button key={c.ymd} className={'cal-day month-task-day' + (c.inMonth ? '' : ' out') + (items.length > 0 ? ' has' : '') + (c.ymd === today ? ' today' : '')} onClick={() => onJump(c.ymd)}>
                  <span className="cal-day-num">{c.day}</span>
                  <span className="month-day-items">
                    {visibleItems.map(item => (
                      <span key={`${item.id}-${item.time}`} className={'month-task-item' + (item.done ? ' done' : '')} style={{ background: DENSITY[item.domain], borderLeftColor: DENSITY_BORDER[item.domain], color: DENSITY_FG[item.domain] }} title={item.title}>
                        {item.title}
                      </span>
                    ))}
                    {extraCount > 0 && <span className="month-more">+{extraCount} 更多</span>}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SchedulePage() {
  const data = useStore()
  const toast = useToast()
  const [view, setView] = useState<'day' | 'week' | 'month'>('month')

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-based
  const [weekIdx, setWeekIdx] = useState(() => {
    // 当前是第几周（粗略：1月1号起算）
    const jan1 = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000)
    return Math.floor((days + ((jan1.getDay() + 6) % 7)) / 7)
  })
  const [selectedDate, setSelectedDate] = useState(todayYmd())

  const max = Math.max(...data.weekDist.map(x => x.minutes), 1)

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDate(todayYmd()); setWeekIdx(Math.floor((Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + ((new Date(now.getFullYear(), 0, 1).getDay() + 6) % 7)) / 7)) }

  const jumpToDate = (ymd: string) => {
    setSelectedDate(ymd)
    const d = new Date(ymd + 'T00:00:00')
    setYear(d.getFullYear()); setMonth(d.getMonth())
    setView('day')
  }

  // ics 导出
  const handleExportICS = () => {
    const ics = exportICS(data.schedules.map(s => ({ title: s.title, date: s.date, start: s.start, end: s.end, domain: s.domain, done: s.done })))
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `schedules-${todayYmd()}.ics`
    a.click()
    URL.revokeObjectURL(url)
    toast('已导出 .ics，可用系统日历打开')
  }

  // ics 导入
  const fileRef = React.useRef<HTMLInputElement>(null)
  const handleImportICS = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const parsed = importICS(text)
        if (parsed.length === 0) { toast('未解析到日程'); return }
        let n = 0
        for (const p of parsed) {
          store.addSchedule({ title: p.title, date: p.date, start: p.start, end: p.end, domain: (p.domain as Domain) || 'life', done: p.done })
          n++
        }
        toast(`已导入 ${n} 项日程`)
      } catch {
        toast('导入失败')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page schedule-page">
      <div className="page-title">日程</div>
      <div className="page-sub">{year}年 · {MONTH_NAMES[month]} · 共 {data.schedules.length} 项</div>

      <div className="seg seg-3">
        <button className={'seg-item' + (view === 'day' ? ' on' : '')} onClick={() => setView('day')}>日</button>
        <button className={'seg-item' + (view === 'week' ? ' on' : '')} onClick={() => setView('week')}>周</button>
        <button className={'seg-item' + (view === 'month' ? ' on' : '')} onClick={() => setView('month')}>月</button>
      </div>

      {(view === 'month' || view === 'week') && (
        <div className="cal-nav">
          <button className="chip line tap" onClick={() => view === 'month' ? prevMonth() : setWeekIdx(Math.max(0, weekIdx - 1))}>‹ 上{view === 'month' ? '月' : '周'}</button>
          <button className="chip chip-dark tap" onClick={goToday}>今天</button>
          <button className="chip line tap" onClick={() => view === 'month' ? nextMonth() : setWeekIdx(weekIdx + 1)}>{view === 'month' ? '下月' : '下周'} ›</button>
        </div>
      )}

      {view === 'day' && <DayView selectedDate={selectedDate} onJump={jumpToDate} />}
      {view === 'week' && <WeekView year={year} weekIdx={weekIdx} onJump={jumpToDate} />}
      {view === 'month' && <MonthView year={year} month={month} onJump={jumpToDate} />}

      <div className="section">
        <div className="section-head">
          <span className="section-title">本周时间分布</span>
          <span className="section-action">共 {data.weekDist.reduce((a, b) => a + b.minutes, 0)}m</span>
        </div>
        <div className="card card-pad">
          {data.weekDist.map(w => (
            <div key={w.domain} className="wd-row">
              <span className="t-sub" style={{ width: 64 }}>{DOMAIN_LABEL[w.domain]}</span>
              <div className="bar" style={{ flex: 1, height: 6 }}><i style={{ width: `${(w.minutes / max) * 100}%`, background: DENSITY[w.domain] }} /></div>
              <span className="t-cap mono" style={{ width: 40, textAlign: 'right' }}>{w.minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="section-title">与系统日历互通</span>
          <span className="section-action">.ics</span>
        </div>
        <div className="card card-pad">
          <div className="t-cap" style={{ marginBottom: 10 }}>Web 应用无法直连系统日历，可用 .ics 文件做"准关联"：导出后用系统日历打开即可同步到 iPhone。</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="chip chip-dark tap" onClick={handleExportICS}>导出 .ics</button>
            <button className="chip line tap" onClick={() => fileRef.current?.click()}>导入 .ics</button>
            <input ref={fileRef} type="file" accept=".ics,text/calendar" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportICS(f); e.target.value = '' }} />
          </div>
        </div>
      </div>
      <div style={{ height: 8 }} />
    </div>
  )
}
