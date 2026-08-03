import React, { useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { ACCOUNT_KIND_LABEL, type AccountKind, type LedgerAccount, type TxnType } from '../types'
import { useToast } from '../components/Toast'
import { IconWallet, IconPlus, IconTrash, IconArrowUp, IconArrowDown } from '../components/Icons'
import { monthMatrix, todayYmd, DOW_MON, MONTH_NAMES, toYmd } from '../calendar'
import { colorOf, accountKindColor } from '../palette'

const KINDS: AccountKind[] = ['cash', 'bank', 'alipay', 'wechat', 'card', 'asset']

function fmtMoney(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  return sign + '¥' + abs.toLocaleString('zh-CN', { minimumFractionDigits: abs % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

// 按分类名取色（用于扇形图/流水圆点/账户标签）
function catColor(key: string): string { return colorOf(key).base }

export function LedgerPage({ onBack }: { onBack: () => void }) {
  const data = useStore()
  const toast = useToast()
  const ledger = data.ledger

  const [view, setView] = useState<'overview' | 'txns'>('overview')
  const [calView, setCalView] = useState<'month' | 'year'>('month')
  const [selYm, setSelYm] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() })
  const [selYear, setSelYear] = useState(new Date().getFullYear())
  const [pieMode, setPieMode] = useState<'expense' | 'income'>('expense')
  const [pieRange, setPieRange] = useState<'month' | 'week' | 'day'>('month')
  const [selDate, setSelDate] = useState(todayYmd())
  const [acctSheet, setAcctSheet] = useState(false)
  const [acctForm, setAcctForm] = useState({ id: '', name: '', kind: 'cash' as AccountKind, balance: 0, note: '' })
  const [txnSheet, setTxnSheet] = useState(false)
  const [txnForm, setTxnForm] = useState({ id: '', accountId: '', type: 'expense' as TxnType, amount: 0, category: '', note: '' })

  const netWorth = ledger.accounts.reduce((a, x) => a + x.balance, 0)
  const assets = ledger.accounts.filter(a => a.kind === 'asset').reduce((a, x) => a + x.balance, 0)
  const liabilities = ledger.accounts.filter(a => a.balance < 0).reduce((a, x) => a + x.balance, 0)

  const now = new Date()
  const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
  const monthTxns = ledger.txns.filter(t => t.date.startsWith(ym))
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)

  const trend = [...ledger.snapshots].sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
  const maxTrend = Math.max(...trend.map(s => Math.abs(s.netWorth)), 1)

  // ===== 日历视图：每日支出金额 =====
  const calGrid = monthMatrix(selYm.y, selYm.m)
  const today = todayYmd()
  // 当月每日支出
  const dayExpense: Record<string, number> = {}
  const dayIncome: Record<string, number> = {}
  const ymStr = selYm.y + '-' + String(selYm.m + 1).padStart(2, '0')
  ledger.txns.filter(t => t.date.startsWith(ymStr)).forEach(t => {
    if (t.type === 'expense') dayExpense[t.date] = (dayExpense[t.date] || 0) + t.amount
    else if (t.type === 'income') dayIncome[t.date] = (dayIncome[t.date] || 0) + t.amount
  })
  const monthTotalExp = Object.values(dayExpense).reduce((a, b) => a + b, 0)
  const monthTotalInc = Object.values(dayIncome).reduce((a, b) => a + b, 0)
  const maxDayExp = Math.max(...Object.values(dayExpense), 1)

  // 年视图：每月支出
  const yearMonthExp: number[] = new Array(12).fill(0)
  const yearMonthInc: number[] = new Array(12).fill(0)
  ledger.txns.filter(t => t.date.startsWith(String(selYear))).forEach(t => {
    const m = Number(t.date.slice(5, 7)) - 1
    if (t.type === 'expense') yearMonthExp[m] += t.amount
    else if (t.type === 'income') yearMonthInc[m] += t.amount
  })
  const maxYm = Math.max(...yearMonthExp, ...yearMonthInc, 1)

  // ===== 扇形图数据：按类别聚合 =====
  const pieTxns = pieRange === 'day'
    ? ledger.txns.filter(t => t.date === selDate)
    : pieRange === 'week'
      ? ledger.txns.filter(t => { const d = new Date(t.date); const wk = Math.floor((d.getDate() - 1) / 7); return d.getFullYear() === selYm.y && d.getMonth() === selYm.m && Math.floor((d.getDate() - 1) / 7) === wk })
      : ledger.txns.filter(t => t.date.startsWith(ymStr))
  const pieByCat: Record<string, number> = {}
  pieTxns.filter(t => t.type === pieMode).forEach(t => { pieByCat[t.category] = (pieByCat[t.category] || 0) + t.amount })
  const pieTotal = Object.values(pieByCat).reduce((a, b) => a + b, 0) || 1
  const pieData = Object.entries(pieByCat).sort((a, b) => b[1] - a[1])

  const openAddAcct = () => { setAcctForm({ id: '', name: '', kind: 'cash', balance: 0, note: '' }); setAcctSheet(true) }
  const openEditAcct = (a: LedgerAccount) => { setAcctForm({ id: a.id, name: a.name, kind: a.kind, balance: a.balance, note: a.note || '' }); setAcctSheet(true) }
  const saveAcct = () => {
    if (!acctForm.name.trim()) { toast('请填写名称'); return }
    if (acctForm.id) { store.updateLedgerAccount(acctForm.id, { name: acctForm.name, kind: acctForm.kind, balance: acctForm.balance, note: acctForm.note }); toast('已更新') }
    else { store.addLedgerAccount({ name: acctForm.name, kind: acctForm.kind, balance: acctForm.balance, note: acctForm.note }); toast('已添加账户') }
    setAcctSheet(false)
  }
  const delAcct = () => { if (!acctForm.id) return; store.deleteLedgerAccount(acctForm.id); toast('已删除'); setAcctSheet(false) }

  const openAddTxn = () => { setTxnForm({ id: '', accountId: ledger.accounts[0]?.id || '', type: 'expense', amount: 0, category: '', note: '' }); setTxnSheet(true) }
  const saveTxn = () => {
    if (!txnForm.accountId) { toast('请选择账户'); return }
    if (txnForm.amount <= 0) { toast('金额需大于 0'); return }
    store.addLedgerTxn({ accountId: txnForm.accountId, type: txnForm.type, amount: txnForm.amount, category: txnForm.category || '其他', note: txnForm.note })
    store.saveLedgerSnapshot(); toast('已记一笔'); setTxnSheet(false)
  }
  const delTxn = (id: string) => { store.deleteLedgerTxn(id); store.saveLedgerSnapshot(); toast('已删除') }
  const acctName = (id: string) => ledger.accounts.find(a => a.id === id)?.name || '未知'

  return (
    <div className="page ledger-page">
      <div className="page-head">
        <button className="t-sub tap" onClick={onBack}>‹</button>
        <div className="t-h3">账本</div>
        <button className="t-sub tap" onClick={openAddTxn}><IconPlus size={18} /></button>
      </div>

      {/* 净资产卡 */}
      <div className="card card-pad ledger-hero">
        <div className="t-cap">净资产</div>
        <div className={'t-h1 mono ' + (netWorth < 0 ? 'neg' : '')}>{fmtMoney(netWorth)}</div>
        <div className="ledger-hero-row">
          <div><span className="t-cap">资产估值</span><span className="t-body mono">{fmtMoney(assets)}</span></div>
          <div><span className="t-cap">负债</span><span className="t-body mono neg">{fmtMoney(liabilities)}</span></div>
        </div>
        {trend.length > 1 && (
          <div className="ledger-trend">
            {trend.map(s => (
              <div key={s.id} className="ld-bar" style={{ height: Math.max(6, Math.abs(s.netWorth) / maxTrend * 36) + 'px' }} title={s.date + ' · ' + fmtMoney(s.netWorth)} />
            ))}
          </div>
        )}
      </div>

      {/* 月度收支 */}
      <div className="card card-pad ledger-month">
        <div className="section-head"><span className="section-title">本月</span><span className="section-action mono">{fmtMoney(monthIncome - monthExpense)}</span></div>
        <div className="ledger-month-grid">
          <div className="lm-cell"><IconArrowDown size={16} /><div><div className="t-cap">收入</div><div className="t-body mono">{fmtMoney(monthIncome)}</div></div></div>
          <div className="lm-cell"><IconArrowUp size={16} /><div><div className="t-cap">支出</div><div className="t-body mono">{fmtMoney(monthExpense)}</div></div></div>
        </div>
      </div>

      {/* 日历视图：月/年 */}
      <div className="card card-pad">
        <div className="section-head">
          <span className="section-title">花销日历</span>
          <div className="seg seg-2">
            <button className={'seg-item sm' + (calView === 'month' ? ' on' : '') + ' tap'} onClick={() => setCalView('month')}>月</button>
            <button className={'seg-item sm' + (calView === 'year' ? ' on' : '') + ' tap'} onClick={() => setCalView('year')}>年</button>
          </div>
        </div>

        {/* 月历导航 */}
        {calView === 'month' && (
          <>
            <div className="cal-nav">
              <button className="chip line tap" onClick={() => setSelYm(p => ({ y: p.m === 0 ? p.y - 1 : p.y, m: p.m === 0 ? 11 : p.m - 1 }))}>‹</button>
              <div className="t-body" style={{ fontWeight: 600 }}>{selYm.y}年{MONTH_NAMES[selYm.m]}</div>
              <button className="chip line tap" onClick={() => setSelYm(p => ({ y: p.m === 11 ? p.y + 1 : p.y, m: p.m === 11 ? 0 : p.m + 1 }))}>›</button>
            </div>
            <div className="seg seg-2" style={{ alignSelf: 'center', marginBottom: 8 }}>
              <span className={'seg-item sm' + (pieMode === 'expense' ? ' on' : '')} style={{ cursor: 'default' }}>支 {fmtMoney(monthTotalExp)}</span>
              <span className={'seg-item sm' + (pieMode === 'income' ? ' on' : '')} style={{ cursor: 'default' }}>收 {fmtMoney(monthTotalInc)}</span>
            </div>
            <div className="cal-weeknames">
              {DOW_MON.map(n => <div key={n} className="cal-dow">{n}</div>)}
            </div>
            <div className="cal-grid">
              {calGrid.map((w, wi) => (
                <div key={wi} className="cal-week">
                  {w.map(c => {
                    const exp = dayExpense[c.ymd] || 0
                    const inc = dayIncome[c.ymd] || 0
                    const sel = c.ymd === selDate
                    return (
                      <button key={c.ymd} className={'cal-day ld-cal' + (c.inMonth ? '' : ' out') + (sel ? ' on' : '') + (c.ymd === today ? ' today' : '')}
                        onClick={() => { setSelDate(c.ymd); setPieRange('day') }}>
                        <span className="cal-day-num">{c.day}</span>
                        {exp > 0 && <span className="ld-cal-amt neg">-{Math.round(exp)}</span>}
                        {inc > 0 && !exp && <span className="ld-cal-amt">+{Math.round(inc)}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="t-cap" style={{ textAlign: 'center', marginTop: 6 }}>点击日期看当日明细</div>
          </>
        )}

        {/* 年视图：12 月柱状 */}
        {calView === 'year' && (
          <>
            <div className="cal-nav">
              <button className="chip line tap" onClick={() => setSelYear(y => y - 1)}>‹</button>
              <div className="t-body" style={{ fontWeight: 600 }}>{selYear}年</div>
              <button className="chip line tap" onClick={() => setSelYear(y => y + 1)}>›</button>
            </div>
            <div className="ld-year-bars">
              {yearMonthExp.map((v, i) => (
                <div key={i} className="lyb-col" onClick={() => { setSelYm({ y: selYear, m: i }); setCalView('month') }}>
                  <div className="lyb-bar exp" style={{ height: Math.max(3, v / maxYm * 60) + 'px' }} title={MONTH_NAMES[i] + ' 支出 ' + fmtMoney(v)} />
                  <div className="lyb-bar inc" style={{ height: Math.max(3, yearMonthInc[i] / maxYm * 60) + 'px' }} title={MONTH_NAMES[i] + ' 收入 ' + fmtMoney(yearMonthInc[i])} />
                  <span className="t-cap">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="ld-legend"><span className="ld-dot exp" />支出 <span className="ld-dot inc" />收入</div>
          </>
        )}
      </div>

      {/* 扇形图：按类别 */}
      <div className="card card-pad">
        <div className="section-head">
          <span className="section-title">类别分布</span>
          <div className="seg seg-2">
            <button className={'seg-item sm' + (pieMode === 'expense' ? ' on' : '') + ' tap'} onClick={() => setPieMode('expense')}>支出</button>
            <button className={'seg-item sm' + (pieMode === 'income' ? ' on' : '') + ' tap'} onClick={() => setPieMode('income')}>收入</button>
          </div>
        </div>
        <div className="seg seg-3" style={{ alignSelf: 'center', marginBottom: 10 }}>
          <button className={'seg-item sm' + (pieRange === 'day' ? ' on' : '') + ' tap'} onClick={() => setPieRange('day')}>日</button>
          <button className={'seg-item sm' + (pieRange === 'week' ? ' on' : '') + ' tap'} onClick={() => setPieRange('week')}>周</button>
          <button className={'seg-item sm' + (pieRange === 'month' ? ' on' : '') + ' tap'} onClick={() => setPieRange('month')}>月</button>
        </div>
        {pieData.length === 0 ? (
          <div className="t-cap" style={{ padding: 20, textAlign: 'center' }}>该区间无{pieMode === 'expense' ? '支出' : '收入'}记录</div>
        ) : (
          <div className="ld-pie-wrap">
            <svg viewBox="0 0 42 42" className="ld-pie">
              {(() => {
                let acc = 0
                return pieData.map(([cat, amt]) => {
                  const frac = amt / pieTotal
                  const start = acc
                  acc += frac
                  const a0 = start * 2 * Math.PI - Math.PI / 2
                  const a1 = acc * 2 * Math.PI - Math.PI / 2
                  const large = frac > 0.5 ? 1 : 0
                  const x0 = 21 + 15.9 * Math.cos(a0), y0 = 21 + 15.9 * Math.sin(a0)
                  const x1 = 21 + 15.9 * Math.cos(a1), y1 = 21 + 15.9 * Math.sin(a1)
                  return <path key={cat} d={`M21 21 L${x0} ${y0} A15.9 15.9 0 ${large} 1 ${x1} ${y1} Z`} fill={catColor(cat)} stroke="var(--bg)" strokeWidth="0.5" />
                })
              })()}
              <circle cx="21" cy="21" r="9" fill="var(--bg)" />
            </svg>
            <div className="ld-pie-center">
              <span className="t-cap">{pieMode === 'expense' ? '支出' : '收入'}</span>
              <span className="t-body mono" style={{ fontWeight: 600 }}>{fmtMoney(pieTotal)}</span>
            </div>
            <div className="ld-pie-legend">
              {pieData.map(([cat, amt]) => (
                <div key={cat} className="ld-pl-row">
                  <span className="ld-pl-dot" style={{ background: catColor(cat) }} />
                  <span className="ld-pl-cat">{cat}</span>
                  <span className="ld-pl-amt mono">{fmtMoney(amt)}</span>
                  <span className="t-cap mono">{Math.round(amt / pieTotal * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 视图切换 */}
      <div className="drawer-tabs">
        <button className={'dt' + (view === 'overview' ? ' on' : '') + ' tap'} onClick={() => setView('overview')}>账户</button>
        <button className={'dt' + (view === 'txns' ? ' on' : '') + ' tap'} onClick={() => setView('txns')}>流水</button>
      </div>

      {view === 'overview' && (
        <div className="card card-pad">
          <div className="section-head"><span className="section-title">账户列表</span><button className="t-sub tap" onClick={openAddAcct}><IconPlus size={14} /></button></div>
          <div className="ledger-accts">
            {ledger.accounts.length === 0 && <div className="t-cap" style={{ padding: 12, textAlign: 'center' }}>还没有账户</div>}
            {ledger.accounts.map(a => (
              <button key={a.id} className="ld-acc tap" onClick={() => openEditAcct(a)}>
                <span className="ld-acc-kind" style={{ background: accountKindColor(a.kind).soft, color: accountKindColor(a.kind).ink }}>{ACCOUNT_KIND_LABEL[a.kind]}</span>
                <div className="ld-acc-body"><div className="ld-acc-name">{a.name}</div>{a.note && <div className="ld-acc-note">{a.note}</div>}</div>
                <div className={'ld-acc-bal mono ' + (a.balance < 0 ? 'neg' : '')}>{fmtMoney(a.balance)}</div>
                <span className="t-cap">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'txns' && (
        <div className="card card-pad">
          <div className="section-head"><span className="section-title">最近流水</span><button className="t-sub tap" onClick={openAddTxn}><IconPlus size={14} /></button></div>
          <div className="ledger-txns">
            {ledger.txns.length === 0 && <div className="t-cap" style={{ padding: 12, textAlign: 'center' }}>还没有记录</div>}
            {ledger.txns.slice(0, 50).map(t => (
              <div key={t.id} className="ld-txn">
                <div className={'ld-txn-dot ' + t.type} style={{ background: t.type === 'adjust' ? 'var(--ink-4)' : catColor(t.category) }} />
                <div className="ld-txn-body">
                  <div className="ld-txn-title">{t.category}{t.note && <span className="t-cap"> · {t.note}</span>}</div>
                  <div className="ld-txn-meta">{t.date} {t.time} · {acctName(t.accountId)}</div>
                </div>
                <div className={'ld-txn-amt mono ' + t.type}>{t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '±'}{fmtMoney(t.amount)}</div>
                <button className="t-sub tap ld-txn-del" onClick={() => delTxn(t.id)}><IconTrash size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 账户弹窗 */}
      {acctSheet && (
        <div className="sheet-mask" onClick={() => setAcctSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingTop: 8 }}>
            <div className="sheet-handle" />
            <div className="sheet-head"><div className="t-h3">{acctForm.id ? '编辑账户' : '添加账户'}</div><button className="t-sub tap" onClick={() => setAcctSheet(false)}>取消</button></div>
            <div className="task-form">
              <label className="tf-label">名称</label>
              <input className="tf-input" value={acctForm.name} onChange={(e) => setAcctForm({ ...acctForm, name: e.target.value })} placeholder="如 招行储蓄" />
              <label className="tf-label">类型</label>
              <div className="tf-chips">{KINDS.map(k => <button key={k} className={'chip ' + (acctForm.kind === k ? 'chip-dark' : 'line') + ' tap'} onClick={() => setAcctForm({ ...acctForm, kind: k })}>{ACCOUNT_KIND_LABEL[k]}</button>)}</div>
              <label className="tf-label">余额（资产填估值，信用卡欠款填负数）</label>
              <input className="tf-input mono" type="number" step="0.01" value={acctForm.balance} onChange={(e) => setAcctForm({ ...acctForm, balance: Number(e.target.value) || 0 })} />
              <label className="tf-label">备注</label>
              <input className="tf-input" value={acctForm.note} onChange={(e) => setAcctForm({ ...acctForm, note: e.target.value })} placeholder="选填" />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="confirm-btn" onClick={saveAcct}>{acctForm.id ? '保存' : '添加'}</button>
                {acctForm.id && <button className="chip line tap" style={{ color: 'var(--danger)' }} onClick={delAcct}><IconTrash size={14} /> 删除</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 记一笔弹窗 */}
      {txnSheet && (
        <div className="sheet-mask" onClick={() => setTxnSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingTop: 8 }}>
            <div className="sheet-handle" />
            <div className="sheet-head"><div className="t-h3">记一笔</div><button className="t-sub tap" onClick={() => setTxnSheet(false)}>取消</button></div>
            <div className="task-form">
              <label className="tf-label">类型</label>
              <div className="tf-chips">{(['expense', 'income', 'adjust'] as TxnType[]).map(tp => <button key={tp} className={'chip ' + (txnForm.type === tp ? 'chip-dark' : 'line') + ' tap'} onClick={() => setTxnForm({ ...txnForm, type: tp })}>{tp === 'expense' ? '支出' : tp === 'income' ? '收入' : '调整'}</button>)}</div>
              <label className="tf-label">账户</label>
              <select className="tf-input" value={txnForm.accountId} onChange={(e) => setTxnForm({ ...txnForm, accountId: e.target.value })}>{ledger.accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {ACCOUNT_KIND_LABEL[a.kind]}</option>)}</select>
              <label className="tf-label">金额</label>
              <input className="tf-input mono" type="number" step="0.01" min="0" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: Number(e.target.value) || 0 })} />
              <label className="tf-label">分类</label>
              <input className="tf-input" value={txnForm.category} onChange={(e) => setTxnForm({ ...txnForm, category: e.target.value })} placeholder="餐饮/交通/工资/估值变动..." />
              <label className="tf-label">备注</label>
              <input className="tf-input" value={txnForm.note} onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })} placeholder="选填" />
              <div style={{ marginTop: 12 }}><button className="confirm-btn" onClick={saveTxn}>记录</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
