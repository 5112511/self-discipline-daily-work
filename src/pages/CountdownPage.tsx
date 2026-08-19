import React, { useRef, useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { useToast } from '../components/Toast'
import { COUNTDOWN_CATEGORY_LABEL, type CountdownCategory, type CountdownDay } from '../types'

function daysUntil(date: string) {
  const target = new Date(date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

type CountdownForm = { title: string; date: string; note: string; photo?: string; category: CountdownCategory }
const emptyForm: CountdownForm = { title: '', date: '', note: '', category: 'anniversary' }

export function CountdownPage({ onBack }: { onBack: () => void }) {
  const data = useStore()
  const toast = useToast()
  const photoInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<CountdownForm>(emptyForm)
  const [editing, setEditing] = useState<CountdownDay | null>(null)
  const [sheet, setSheet] = useState(false)

  const readPhoto = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('请选择图片文件')
    if (file.size > 1.5 * 1024 * 1024) return toast('图片请控制在 1.5MB 以内')
    const reader = new FileReader()
    reader.onload = () => setForm(v => ({ ...v, photo: String(reader.result) }))
    reader.readAsDataURL(file)
  }
  const openAdd = () => { setEditing(null); setForm(emptyForm); setSheet(true) }
  const openEdit = (item: CountdownDay) => { setEditing(item); setForm({ title: item.title, date: item.date, note: item.note || '', photo: item.photo, category: item.category || 'anniversary' }); setSheet(true) }
  const save = () => {
    if (!form.title.trim() || !form.date) return toast('请填写名称和日期')
    if (editing) { store.updateCountdownDay(editing.id, { title: form.title.trim(), date: form.date, note: form.note.trim(), photo: form.photo, category: form.category }); toast('已更新倒数日') }
    else { store.addCountdownDay({ title: form.title.trim(), date: form.date, note: form.note.trim(), photo: form.photo, category: form.category }); toast('已添加倒数日') }
    setSheet(false)
  }

  const passed = data.countdownDays.filter(item => daysUntil(item.date) < 0).sort((a, b) => b.date.localeCompare(a.date))
  const todayItems = data.countdownDays.filter(item => daysUntil(item.date) === 0)
  const upcoming = data.countdownDays.filter(item => daysUntil(item.date) > 0).sort((a, b) => a.date.localeCompare(b.date))
  const renderItem = (item: CountdownDay) => { const days = daysUntil(item.date); return <div key={item.id} className="countdown-row">
    {item.photo ? <img className="countdown-photo" src={item.photo} alt="" /> : <div className="countdown-num">{Math.abs(days)}<small>{days > 0 ? ' 天后' : days < 0 ? ' 天前' : ' 就是今天'}</small></div>}
    <button className="countdown-info tap" onClick={() => openEdit(item)}><div className="t-body">{item.title} <span className="countdown-category">{COUNTDOWN_CATEGORY_LABEL[item.category || 'anniversary']}</span></div><div className="t-cap">{item.date}{item.showOnHome ? ' · 主页展示中' : ''}{item.note ? ` · ${item.note}` : ''}</div></button>
    <button className={'chip ' + (item.showOnHome ? 'chip-dark' : 'line') + ' tap'} onClick={() => store.updateCountdownDay(item.id, { showOnHome: true })}>{item.showOnHome ? '主页展示' : '展示到主页'}</button>
    <button className="countdown-delete tap" onClick={() => { store.deleteCountdownDay(item.id); toast('已删除倒数日') }}>删除</button>
  </div> }
  const group = (title: string, items: CountdownDay[]) => <div className="countdown-group"><div className="section-head"><span className="section-title">{title}</span><span className="t-cap">{items.length} 项</span></div><div className="card">{items.length ? items.map(renderItem) : <div className="t-cap countdown-empty">暂无</div>}</div></div>

  return <div className="page ledger-page">
    <div className="page-head"><button className="t-sub tap" onClick={onBack}>‹ 返回</button><span className="page-head-title">倒数日</span><button type="button" className="chip chip-dark tap" onClick={openAdd}>新增</button></div>
    <div className="section"><div className="section-head"><span className="section-title">我的倒数日</span><span className="t-cap">点击条目可编辑</span></div>
      {data.countdownDays.length === 0 ? <div className="card empty-block"><div className="t-cap">还没有倒数日</div></div> : <>{group('正在 · 今天', todayItems)}{group('还没到', upcoming)}{group('已经过了', passed)}</>}
    </div>
    {sheet && <div className="sheet-mask" onClick={() => setSheet(false)}><div className="sheet" onClick={e => e.stopPropagation()} style={{ paddingTop: 8 }}>
      <div className="sheet-handle" /><div className="sheet-head"><div className="t-h3">{editing ? '编辑倒数日' : '新建倒数日'}</div><button className="t-sub tap" onClick={() => setSheet(false)}>取消</button></div>
      <div className="task-form"><label className="tf-label">名称 *</label><input className="tf-input" value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} placeholder="例如：生日、旅行、考试" />
        <label className="tf-label">日期 *</label><input className="tf-input" type="date" value={form.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))} />
        <label className="tf-label">类别</label><div className="tf-chips">{(Object.keys(COUNTDOWN_CATEGORY_LABEL) as CountdownCategory[]).map(category => <button key={category} className={'chip ' + (form.category === category ? 'chip-dark' : 'line') + ' tap'} onClick={() => setForm(v => ({ ...v, category }))}>{COUNTDOWN_CATEGORY_LABEL[category]}</button>)}</div>
        <label className="tf-label">备注</label><textarea className="tf-input tf-area" value={form.note} onChange={e => setForm(v => ({ ...v, note: e.target.value }))} placeholder="写下这一天的意义、计划或提醒" rows={3} />
        <label className="tf-label">照片</label><div className="countdown-photo-edit">{form.photo ? <img src={form.photo} alt="倒数日" /> : <div className="t-cap">尚未添加照片</div>}<div><button type="button" className="chip line tap" onClick={() => photoInput.current?.click()}>选择照片</button>{form.photo && <button className="countdown-delete tap" onClick={() => setForm(v => ({ ...v, photo: undefined }))}>移除</button>}</div></div><input ref={photoInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { readPhoto(e.target.files?.[0]); e.target.value = '' }} />
        <button type="button" className="confirm-btn" onClick={save}>{editing ? '保存修改' : '添加倒数日'}</button>
      </div>
    </div></div>}
  </div>
}
