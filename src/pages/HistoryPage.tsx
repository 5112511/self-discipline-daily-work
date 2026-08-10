import React, { useState, useMemo } from 'react'
import { useStore } from '../useStore'
import { store, type HistoryEvent } from '../store'
import { DOMAIN_LABEL, DOMAIN_ICON, type Domain, type Task } from '../types'
import { useConfirm } from '../components/ConfirmSheet'
import { useToast } from '../components/Toast'
import { useTaskSheet } from '../App'
import {
  IconCheck, IconClock, IconTrash, IconArrowRight, IconChevronRight, IconRefresh, IconBolt, IconWallet
} from '../components/Icons'
import { domainColor } from '../palette'

// ===== 日期工具 =====
function todayStr(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function fmtDateCN(date: string): string {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  const dt = new Date(+y, +m - 1, +d)
  const wd = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
  const today = todayStr()
  const yest = new Date(); yest.setDate(yest.getDate() - 1)
  const yestStr = yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0')
  if (date === today) return '今天 · 周' + wd
  if (date === yestStr) return '昨天 · 周' + wd
  return `${+m}月${+d}日 · 周${wd}`
}

// 事件类型样式
const KIND_META: Record<HistoryEvent['kind'], { icon: string; label: string; color: string }> = {
  'task-done': { icon: '✓', label: '完成', color: 'var(--ink)' },
  'task-deleted': { icon: '✕', label: '删除', color: 'var(--danger)' },
  'schedule-done': { icon: '◐', label: '日程', color: 'var(--t-sub)' },
  'ledger-income': { icon: '↑', label: '收入', color: '#2b8a3e' },
  'ledger-expense': { icon: '↓', label: '支出', color: '#c92a2a' },
  'focus': { icon: '◉', label: '专注', color: 'var(--t-sub)' },
}

function domainChip(d: Domain): React.CSSProperties {
  const c = domainColor(d)
  return { background: c.soft, color: c.ink, borderColor: c.base + '55' }
}

// 单条历史事件
function EventRow({ ev }: { ev: HistoryEvent }) {
  const { openEdit } = useTaskSheet()
  const meta = KIND_META[ev.kind]
  const dc = domainColor(ev.domain)

  const onClick = () => {
    // 点击完成任务可编辑
    if (ev.kind === 'task-done') {
      const t = store.get().tasks.find(x => x.id === ev.id)
      if (t) openEdit(t)
    }
  }

  return (
    <div className="reminder-row b" onClick={onClick} style={{ cursor: ev.kind === 'task-done' ? 'pointer' : 'default' }}>
      <span className="icn-box" style={{ width: 30, height: 30, background: dc.soft, color: meta.color }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{
          textDecoration: ev.kind === 'task-done' ? 'line-through' : 'none',
          opacity: ev.kind === 'task-done' ? 0.78 : 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{ev.title}</div>
        <div className="t-cap" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ ...domainChip(ev.domain) }} className="chip">{DOMAIN_LABEL[ev.domain]}</span>
          {ev.time && <span>{ev.time}</span>}
          {ev.detail && <span style={{ opacity: 0.7 }}>{ev.detail}</span>}
        </div>
      </div>
      <span className="t-cap" style={{ color: meta.color }}>{meta.label}</span>
    </div>
  )
}

// 一天的分组
function DayGroup({ date, events, showLedger }: { date: string; events: HistoryEvent[]; showLedger: boolean }) {
  const doneCount = events.filter(e => e.kind === 'task-done').length
  const focusMin = events.filter(e => e.kind === 'focus').reduce((s, e) => s + (parseInt(e.detail || '0') || 0), 0)
  const ledgerEvts = events.filter(e => e.kind === 'ledger-income' || e.kind === 'ledger-expense')
  const expense = ledgerEvts.filter(e => e.kind === 'ledger-expense').reduce((s, e) => s + (parseFloat((e.detail || '').replace(/[^0-9.]/g, '')) || 0), 0)
  const income = ledgerEvts.filter(e => e.kind === 'ledger-income').reduce((s, e) => s + (parseFloat((e.detail || '').replace(/[^0-9.]/g, '')) || 0), 0)

  // 非记账事件始终展示；记账事件受开关控制
  const visibleEvents = showLedger ? events : events.filter(e => e.kind !== 'ledger-income' && e.kind !== 'ledger-expense')

  return (
    <div className="section">
      <div className="section-head">
        <span className="section-title">{fmtDateCN(date)}</span>
        <span className="section-action">
          {doneCount > 0 && <span style={{ marginRight: 10 }}>完成 {doneCount}</span>}
          {focusMin > 0 && <span style={{ marginRight: 10 }}>专注 {focusMin}min</span>}
          {expense > 0 && <span style={{ marginRight: 10, color: '#c92a2a' }}>支 ¥{expense}</span>}
          {income > 0 && <span style={{ color: '#2b8a3e' }}>收 ¥{income}</span>}
        </span>
      </div>
      <div className="card reminder-list">
        {visibleEvents.length > 0 ? visibleEvents.map((ev, i) => (
          <div key={ev.id + i} className={i < visibleEvents.length - 1 ? '' : ''}>
            <EventRow ev={ev} />
          </div>
        )) : (
          <div className="t-cap" style={{ padding: 12, textAlign: 'center', opacity: 0.6 }}>这一天没有成长记录</div>
        )}
      </div>
    </div>
  )
}

// 分类统计视图
function CategoryView({ onBack, showLedger }: { onBack: () => void; showLedger: boolean }) {
  const data = useStore()
  const cats = store.getHistoryByCategory()

  // 记账事件在关闭时排除
  const isLedgerKind = (k: HistoryEvent['kind']) => k === 'ledger-income' || k === 'ledger-expense'

  // 按分类聚合
  const allDomains: Domain[] = ['content', 'ai', 'health', 'class', 'work', 'life']
  const stats = allDomains.map(d => {
    const c = cats.find(x => x.domain === d)
    const items = (c?.items || []).filter(e => showLedger || !isLedgerKind(e.kind))
    return {
      domain: d,
      count: items.length,
      items,
    }
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

  const total = stats.reduce((s, x) => s + x.count, 0)

  return (
    <div className="page" style={{ paddingTop: 12 }}>
      <div className="section">
        <div className="section-head">
          <span className="section-title">分类统计 · 共 {total} 条</span>
          <button className="section-action" onClick={onBack}>← 返回</button>
        </div>
        <div className="card reminder-list">
          {stats.map((s, i) => (
            <div key={s.domain} className={'reminder-row' + (i < stats.length - 1 ? ' b' : '')}>
              <span className="icn-box" style={{ width: 30, height: 30, background: domainColor(s.domain).soft, color: domainColor(s.domain).ink }}>{DOMAIN_ICON[s.domain]}</span>
              <div style={{ flex: 1 }}>
                <div className="t-body">{DOMAIN_LABEL[s.domain]}</div>
                <div className="t-cap">{s.count} 条记录</div>
              </div>
              <div className="bar" style={{ width: 60, height: 6 }}><i style={{ width: `${total ? (s.count / total * 100) : 0}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      {stats.map(s => (
        <div className="section" key={s.domain}>
          <div className="section-head">
            <span className="section-title">{DOMAIN_ICON[s.domain]} {DOMAIN_LABEL[s.domain]} · {s.count}</span>
          </div>
          <div className="card reminder-list">
            {s.items.slice(0, 20).map((ev, i) => <EventRow key={ev.id + i} ev={ev} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ===== 主页面 =====
export function HistoryPage({ onBack }: { onBack: () => void }) {
  const data = useStore()
  const confirm = useConfirm()
  const toast = useToast()
  const [mode, setMode] = useState<'timeline' | 'category'>('timeline')
  const [tab, setTab] = useState<'past' | 'today' | 'future'>('today')
  // 记账默认隐藏，可手动展开
  const [showLedger, setShowLedger] = useState(false)

  const today = todayStr()

  // 三态数据
  const { pastGroups, todayGroup, futureTasks, deletedTasks } = useMemo(() => {
    const groups = store.getHistoryByDay()
    const pastGroups = groups.filter(g => g.date < today)
    const todayGroup = groups.find(g => g.date === today)
    const allTasks = data.tasks.filter((t: Task) => !t.deletedAt)
    const futureTasks = allTasks.filter(t => t.dueDate && t.dueDate > today && t.status !== 'done' && t.status !== 'cancelled')
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    const deletedTasks = data.tasks.filter((t: Task) => t.deletedAt)
    return { pastGroups, todayGroup, futureTasks, deletedTasks }
  }, [data, today])

  const restoreTask = async (id: string) => {
    const ok = await confirm({ title: '恢复这项任务？', message: '将任务恢复到待处理列表。', confirmText: '恢复' })
    if (ok) { store.restoreTask(id); toast('已恢复') }
  }
  const purgeTask = async (id: string) => {
    const ok = await confirm({ title: '永久删除？', message: '永久删除后不可恢复。', confirmText: '永久删除' })
    if (ok) { store.purgeTask(id); toast('已永久删除') }
  }
  const purgeAll = async () => {
    const ok = await confirm({ title: '清空回收站？', message: `将永久删除 ${deletedTasks.length} 项任务，不可恢复。`, confirmText: '清空' })
    if (ok) { store.purgeAllDeleted(); toast('已清空') }
  }

  // 分类视图
  if (mode === 'category') {
    return (
      <div className="page" style={{ paddingTop: 12 }}>
        <div className="section-head" style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="tap chip" onClick={onBack}>← 返回</button>
          <span className="t-h3" style={{ flex: 1 }}>历史 · 分类统计</span>
          <button className={'tap chip ' + (showLedger ? 'chip-dark' : 'line')} onClick={() => setShowLedger(v => !v)} title="显示/隐藏记账">
            <IconWallet size={13} /> 记账
          </button>
          <button className="tap chip line" onClick={() => setMode('timeline')}>时间轴</button>
        </div>
        <CategoryView onBack={() => setMode('timeline')} showLedger={showLedger} />
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingTop: 12 }}>
      {/* 顶部导航 */}
      <div className="section-head" style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="tap chip" onClick={onBack}>← 返回</button>
        <span className="t-h3" style={{ flex: 1 }}>成长历史</span>
        <button className={'tap chip ' + (showLedger ? 'chip-dark' : 'line')} onClick={() => setShowLedger(v => !v)} title="显示/隐藏记账">
          <IconWallet size={13} /> 记账
        </button>
        <button className="tap chip line" onClick={() => setMode('category')}>分类</button>
      </div>

      {/* 三态 Tab */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
        <button
          className={'chip tap ' + (tab === 'past' ? 'chip-dark' : 'line')}
          onClick={() => setTab('past')}
        >过去 · {pastGroups.length}天</button>
        <button
          className={'chip tap ' + (tab === 'today' ? 'chip-dark' : 'line')}
          onClick={() => setTab('today')}
        >今天</button>
        <button
          className={'chip tap ' + (tab === 'future' ? 'chip-dark' : 'line')}
          onClick={() => setTab('future')}
        >未来 · {futureTasks.length}项</button>
      </div>

      {/* 过去：时间轴日记 */}
      {tab === 'past' && (
        <>
          {pastGroups.length > 0 ? pastGroups.map(g => (
            <DayGroup key={g.date} date={g.date} events={g.events} showLedger={showLedger} />
          )) : (
            <div className="card card-pad empty-block">
              <div className="emoji">◇</div>
              <div className="t-sub">还没有历史记录</div>
              <div className="t-cap" style={{ marginTop: 6 }}>完成任务后会在这里沉淀</div>
            </div>
          )}
        </>
      )}

      {/* 今天 */}
      {tab === 'today' && (
        <>
          {todayGroup ? (
            <DayGroup date={todayGroup.date} events={todayGroup.events} showLedger={showLedger} />
          ) : (
            <div className="card card-pad empty-block">
              <div className="emoji">○</div>
              <div className="t-sub">今天还没有记录</div>
              <div className="t-cap" style={{ marginTop: 6 }}>完成一项任务试试</div>
            </div>
          )}
        </>
      )}

      {/* 未来：待办日程 */}
      {tab === 'future' && (
        <div className="section">
          <div className="section-head">
            <span className="section-title">即将到来</span>
            <span className="section-action">{futureTasks.length} 项</span>
          </div>
          {futureTasks.length > 0 ? (
            <div className="card reminder-list">
              {futureTasks.map((t, i) => (
                <div key={t.id} className={'reminder-row' + (i < futureTasks.length - 1 ? ' b' : '')}>
                  <span className="icn-box" style={{ width: 30, height: 30, background: domainColor(t.domain).soft, color: domainColor(t.domain).ink }}>{DOMAIN_ICON[t.domain]}</span>
                  <div style={{ flex: 1 }}>
                    <div className="t-body">{t.title}</div>
                    <div className="t-cap">截止 {t.dueDate}{t.dueTime ? ' ' + t.dueTime : ''} · {DOMAIN_LABEL[t.domain]}</div>
                  </div>
                  <span className="chip" style={{ ...domainChip(t.domain) }}>{t.priority}优先</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card card-pad empty-block">
              <div className="emoji">→</div>
              <div className="t-sub">没有未来的安排</div>
              <div className="t-cap" style={{ marginTop: 6 }}>去日程页添加新安排</div>
            </div>
          )}
        </div>
      )}

      {/* 回收站（软删除任务恢复） */}
      {deletedTasks.length > 0 && (
        <div className="section">
          <div className="section-head">
            <span className="section-title" style={{ color: 'var(--danger)' }}>回收站 · {deletedTasks.length}</span>
            <button className="section-action" style={{ color: 'var(--danger)' }} onClick={purgeAll}>清空</button>
          </div>
          <div className="card reminder-list">
            {deletedTasks.map((t, i) => (
              <div key={t.id} className={'reminder-row' + (i < deletedTasks.length - 1 ? ' b' : '')} style={{ opacity: 0.7 }}>
                <span className="icn-box" style={{ width: 30, height: 30, background: 'var(--soft)', color: 'var(--danger)' }}><IconTrash size={14} /></span>
                <div style={{ flex: 1 }}>
                  <div className="t-body">{t.title}</div>
                  <div className="t-cap">删除于 {t.deletedAt?.slice(0, 16).replace('T', ' ')}</div>
                </div>
                <div className="reminder-acts">
                  <button className="tap t-cap" onClick={() => restoreTask(t.id)}>恢复</button>
                  <button className="tap t-cap" style={{ color: 'var(--danger)' }} onClick={() => purgeTask(t.id)}>永久删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 12 }} />
    </div>
  )
}
