import React, { useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { useToast } from '../components/Toast'

function daysUntil(date: string) {
  const target = new Date(date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function CountdownPage({ onBack }: { onBack: () => void }) {
  const data = useStore()
  const toast = useToast()
  const [form, setForm] = useState({ title: '', date: '' })
  const add = () => {
    if (!form.title.trim() || !form.date) return toast('请填写名称和日期')
    store.addCountdownDay({ title: form.title.trim(), date: form.date })
    setForm({ title: '', date: '' })
    toast('已添加倒数日')
  }
  return <div className="page ledger-page">
    <div className="page-head"><button className="t-sub tap" onClick={onBack}>‹ 返回</button><span className="page-head-title">倒数日</span><span style={{ width: 28 }} /></div>
    <div className="card card-pad countdown-add">
      <div className="section-title">新建倒数日</div>
      <input className="tf-input" value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} placeholder="例如：生日、旅行、考试" />
      <input className="tf-input" type="date" value={form.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))} />
      <button className="chip chip-dark tap" onClick={add}>添加</button>
    </div>
    <div className="section"><div className="section-head"><span className="section-title">我的倒数日</span><span className="t-cap">选择一个展示在主页</span></div>
      <div className="card">
        {data.countdownDays.length === 0 && <div className="empty-block"><div className="t-cap">还没有倒数日</div></div>}
        {[...data.countdownDays].sort((a, b) => a.date.localeCompare(b.date)).map(item => { const days = daysUntil(item.date); return <div key={item.id} className="countdown-row">
          <div className="countdown-num">{days >= 0 ? days : Math.abs(days)}<small>{days >= 0 ? ' 天后' : ' 天前'}</small></div>
          <div style={{ flex: 1, minWidth: 0 }}><div className="t-body">{item.title}</div><div className="t-cap">{item.date}{item.showOnHome ? ' · 主页展示中' : ''}</div></div>
          <button className={'chip ' + (item.showOnHome ? 'chip-dark' : 'line') + ' tap'} onClick={() => store.updateCountdownDay(item.id, { showOnHome: true })}>{item.showOnHome ? '主页展示' : '展示到主页'}</button>
          <button className="countdown-delete tap" onClick={() => { store.deleteCountdownDay(item.id); toast('已删除倒数日') }}>删除</button>
        </div> })}
      </div>
    </div>
  </div>
}
