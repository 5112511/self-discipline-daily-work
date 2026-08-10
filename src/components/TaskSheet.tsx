import React, { useState } from 'react'
import type { Task, Domain, Priority, TaskStatus } from '../types'
import { DOMAIN_LABEL, DOMAIN_ICON } from '../types'
import { store } from '../store'
import { useToast } from './Toast'
import { useStore } from '../useStore'

const DOMAINS: Domain[] = ['content', 'ai', 'health', 'class', 'work', 'life']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const STATUSES: TaskStatus[] = ['inbox', 'pending', 'doing', 'waiting', 'done', 'cancelled']

export function TaskSheet({ open, task, onClose }: { open: boolean; task: Task | null; onClose: () => void }) {
  const toast = useToast()
  const data = useStore()
  const isEdit = !!task
  const [form, setForm] = useState<Partial<Task>>(
    task || { title: '', domain: 'life', priority: 'medium', status: 'pending', estimatedMinutes: 30, progress: 0, dueDate: '今天', nextAction: '' }
  )

  // 当 task 变化时重置表单（编辑不同任务）
  React.useEffect(() => {
    setForm(task || { title: '', domain: 'life', priority: 'medium', status: 'pending', estimatedMinutes: 30, progress: 0, dueDate: '今天', nextAction: '' })
  }, [task, open])

  if (!open) return null

  const set = (k: keyof Task, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.title?.trim()) { toast('请填写任务标题'); return }
    if (isEdit && task) {
      store.updateTask(task.id, form)
      toast('已更新任务')
    } else {
      const projectId = form.projectId || data.projects.find(p => p.domain === form.domain)?.id
      store.addTask({ ...form, projectId })
      toast('已新建任务')
    }
    onClose()
  }

  const del = () => {
    if (!task) return
    store.deleteTask(task.id)
    toast('已删除任务')
    onClose()
  }

  const complete = () => {
    if (!task) return
    store.updateTask(task.id, { status: 'done', progress: 100, completedAt: new Date().toISOString().slice(0, 10), completionNote: form.completionNote })
    toast('已完成 ✓')
    onClose()
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet task-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <button className="t-sub tap" onClick={onClose}>取消</button>
          <div className="t-h3">{isEdit ? '编辑任务' : '新建任务'}</div>
          <button className="t-sub tap" style={{ color: 'var(--ink)', fontWeight: 600 }} onClick={save}>保存</button>
        </div>

        <div className="task-form">
          <label className="tf-label">标题 *</label>
          <input className="tf-input" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="一个明确的下一步行动" />

          <label className="tf-label">备注 / 会议记录</label>
          <textarea className="tf-input tf-area" value={form.note || ''} onChange={(e) => set('note', e.target.value)} placeholder="地点、会议议题、执行说明等" rows={3} />

          <div className="tf-row2">
            <div>
              <label className="tf-label">会议地点</label>
              <input className="tf-input" value={form.meetingLocation || ''} onChange={(e) => set('meetingLocation', e.target.value)} placeholder="线上 / 会议室" />
            </div>
            <div>
              <label className="tf-label">对接人</label>
              <input className="tf-input" value={form.meetingContact || ''} onChange={(e) => set('meetingContact', e.target.value)} placeholder="姓名 / 团队" />
            </div>
          </div>

          {isEdit && (
            <>
              <label className="tf-label">完成收获 / 感想</label>
              <textarea className="tf-input tf-area" value={form.completionNote || ''} onChange={(e) => set('completionNote', e.target.value)} placeholder="完成后记录收获、结论和下一步" rows={3} />
            </>
          )}

          <label className="tf-label">所属领域</label>
          <div className="tf-chips">
            {DOMAINS.map(d => (
              <button key={d} className={'chip ' + (form.domain === d ? 'chip-dark' : 'line') + ' tap'} onClick={() => set('domain', d)}>
                {DOMAIN_ICON[d]} {DOMAIN_LABEL[d]}
              </button>
            ))}
          </div>

          <label className="tf-label">所属项目</label>
          <select className="tf-input" value={form.projectId || ''} onChange={(e) => set('projectId', e.target.value || undefined)}>
            <option value="">按领域自动归属</option>
            {data.projects.filter(p => p.domain === form.domain).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="tf-row2">
            <div>
              <label className="tf-label">优先级</label>
              <div className="tf-chips">
                {PRIORITIES.map(p => (
                  <button key={p} className={'chip ' + (form.priority === p ? 'chip-dark' : 'line') + ' tap'} onClick={() => set('priority', p)}>
                    {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="tf-label">状态</label>
              <div className="tf-chips">
                {STATUSES.map(s => (
                  <button key={s} className={'chip ' + (form.status === s ? 'chip-dark' : 'line') + ' tap'} onClick={() => set('status', s)}>
                    {s === 'inbox' ? '收集箱' : s === 'pending' ? '待处理' : s === 'doing' ? '进行中' : s === 'waiting' ? '等待中' : s === 'done' ? '已完成' : '已取消'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="tf-row2">
            <div>
              <label className="tf-label">截止日期</label>
              <input className="tf-input" value={form.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} placeholder="今天/8月5日" />
            </div>
            <div>
              <label className="tf-label">截止时间</label>
              <input className="tf-input" value={form.dueTime || ''} onChange={(e) => set('dueTime', e.target.value)} placeholder="18:00" />
            </div>
          </div>

          <div className="tf-row2">
            <div>
              <label className="tf-label">预计用时（分钟）</label>
              <input className="tf-input mono" type="number" value={form.estimatedMinutes ?? 30} onChange={(e) => set('estimatedMinutes', +e.target.value)} />
            </div>
            <div>
              <label className="tf-label">进度（%）</label>
              <input className="tf-input mono" type="number" min={0} max={100} value={form.progress ?? 0} onChange={(e) => set('progress', Math.max(0, Math.min(100, +e.target.value)))} />
            </div>
          </div>

          <label className="tf-label">下一步行动</label>
          <input className="tf-input" value={form.nextAction || ''} onChange={(e) => set('nextAction', e.target.value)} placeholder="拆成清晰可执行的下一步" />

          <div className="tf-row2">
            <button className="chip line tap" onClick={() => set('inToday', !form.inToday)} style={form.inToday ? { background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' } : {}}>
              {form.inToday ? '✓ 加入今日' : '加入今日'}
            </button>
            <button className="chip line tap" onClick={() => set('inTop3', !form.inTop3)} style={form.inTop3 ? { background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' } : {}}>
              {form.inTop3 ? '✓ 加入 Top 3' : '加入 Top 3'}
            </button>
          </div>
        </div>

        {isEdit && (
          <div className="task-form-actions">
            <button className="confirm-btn" onClick={complete}>标记完成</button>
            <button className="confirm-btn danger ghost" onClick={del}>删除</button>
          </div>
        )}
      </div>
    </div>
  )
}
