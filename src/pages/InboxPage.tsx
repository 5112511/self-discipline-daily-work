import React, { useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import type { InspirationSource, Domain } from '../types'
import { DOMAIN_LABEL, DOMAIN_ICON } from '../types'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmSheet'
import { IconCheck, IconTrash } from '../components/Icons'

const SOURCE_LABEL: Record<InspirationSource, string> = {
  manual: '手动', voice: '语音', gmail: 'Gmail', image: '图片', web: '网页', other: '其他',
}
const SOURCE_ICON: Record<InspirationSource, string> = {
  manual: '✎', voice: '🎙', gmail: '✉', image: '▦', web: '⌘', other: '•',
}
const DOMAINS: Domain[] = ['content', 'ai', 'health', 'class', 'work', 'life']

export function InboxPage({ onOpenProject }: { onOpenProject?: (projectId: string) => void } = {}) {
  const data = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const list = data.inspirations.filter(i => !i.archived)
  const archived = data.inspirations.filter(i => i.archived)
  const [content, setContent] = useState('')
  const [source, setSource] = useState<InspirationSource>('manual')
  const [converting, setConverting] = useState<string | null>(null)
  const [convertDomain, setConvertDomain] = useState<Domain | null>(null)

  const add = () => {
    if (!content.trim()) { toast('请先写一句话灵感'); return }
    store.addInspiration(content.trim(), source)
    setContent('')
    toast('已收入收集箱')
  }

  const del = async (id: string) => {
    const ok = await confirm({ title: '删除这条灵感？', message: '删除后无法恢复。', confirmText: '删除', danger: true })
    if (ok) { store.deleteInspiration(id); toast('已删除') }
  }

  const doConvert = (id: string, domain: Domain) => {
    const task = store.convertInspiration(id, domain)
    toast(`已转为${DOMAIN_LABEL[domain]}任务`)
    setConverting(null)
    setConvertDomain(null)
    return task
  }

  // 跳转到对应领域的项目
  const jumpToDomain = (domain: Domain) => {
    const pid = store.projectIdOfDomain(domain)
    if (pid) { onOpenProject?.(pid) } else { toast('未找到对应项目') }
  }

  // 跳转到灵感已转化的任务所在项目
  const jumpToInspiration = (it: typeof list[number]) => {
    if (it.convertedTo?.type === 'task') {
      // 查找任务所在 domain
      const task = data.tasks.find(t => t.id === it.convertedTo!.id)
      if (task) { jumpToDomain(task.domain); return }
    }
    // 没有转化则按灵感自带 domain 或默认 content
    jumpToDomain(it.domain || 'content')
  }

  const earliest = list.length > 0 ? list[list.length - 1].createdAt : '—'

  return (
    <div className="page inbox-page">
      <div className="page-title">收集箱</div>
      <div className="page-sub">先收进来，再慢慢整理</div>

      {/* 摘要 */}
      <div className="inbox-summary">
        <div className="isum-card">
          <div className="t-h2 mono">{list.length}</div>
          <div className="t-cap">未整理</div>
        </div>
        <div className="isum-card">
          <div className="t-h2 mono">{list.filter(i => i.createdAt.includes('今天') || i.createdAt.includes(new Date().getDate().toString())).length}</div>
          <div className="t-cap">今日新增</div>
        </div>
        <div className="isum-card">
          <div className="t-h2 mono" style={{ fontSize: 15 }}>{earliest}</div>
          <div className="t-cap">最早未整理</div>
        </div>
      </div>

      {/* 快速记录 */}
      <div className="card card-pad inbox-quick">
        <div className="t-sub" style={{ fontWeight: 600 }}>快速记一笔</div>
        <textarea
          className="inbox-quick-input"
          style={{ background: 'var(--bg-soft)', color: 'var(--ink)' }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="一句话灵感，先记下来…"
          rows={3}
        />
        <div className="tf-chips" style={{ marginTop: 8 }}>
          {(['manual', 'voice', 'web', 'image', 'gmail', 'other'] as InspirationSource[]).map(s => (
            <button key={s} className={'chip ' + (source === s ? 'chip-dark' : 'line') + ' tap'} onClick={() => setSource(s)}>
              {SOURCE_ICON[s]} {SOURCE_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="inbox-quick-foot">
          <span className="t-cap">降低阻力 · 仅内容必填</span>
          <button className="chip chip-dark tap" onClick={add}>收进收集箱</button>
        </div>
      </div>

      {/* 建议优先整理 */}
      <div className="card card-pad inbox-suggest">
        <div className="t-sub" style={{ fontWeight: 600 }}>建议先整理</div>
        <div className="t-cap" style={{ marginTop: 4 }}>来自 Gmail 与语音的灵感更值得先处理</div>
      </div>

      {/* 列表 */}
      <div className="section">
        <div className="section-head">
          <span className="section-title">未整理内容</span>
          <button className="section-action tap" onClick={() => { list.forEach(it => store.archiveInspiration(it.id)); toast(`已归档 ${list.length} 项`) }}>全部归档 ›</button>
        </div>
        {list.length > 0 ? (
          <div className="card">
            {list.map((it, i) => (
              <div key={it.id} className={'inbox-row' + (i < list.length - 1 ? ' b' : '')}>
                <div className="inbox-row-main">
                  <span className="icn-box" style={{ width: 28, height: 28 }}>{SOURCE_ICON[it.source]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-body inbox-text">{it.content}</div>
                    <div className="t-cap">{it.createdAt} · {SOURCE_LABEL[it.source]}</div>
                  </div>
                  <button className="tap inbox-check" onClick={() => { store.archiveInspiration(it.id); toast('已归档') }}><IconCheck size={14} /></button>
                  <button className="tap inbox-check" onClick={() => del(it.id)}><IconTrash size={14} /></button>
                </div>
                {converting === it.id ? (
                  <div className="inbox-convert">
                    <span className="t-cap" style={{ marginRight: 4 }}>转为：</span>
                    {DOMAINS.map(d => (
                      <button key={d} className={'chip ' + (convertDomain === d ? 'chip-dark' : 'line') + ' tap ic-c'}
                        onClick={() => { const t = doConvert(it.id, d); if (t) jumpToDomain(d) }}>{DOMAIN_ICON[d]} {DOMAIN_LABEL[d]}</button>
                    ))}
                    <button className="chip line tap ic-c" onClick={() => setConverting(null)}>取消</button>
                  </div>
                ) : (
                  <div className="inbox-convert">
                    <button className="chip line tap ic-c" onClick={() => setConverting(it.id)}>整理为 →</button>
                    <button className="chip line tap ic-c" onClick={() => doConvert(it.id, 'content')}>转内容任务</button>
                    <button className="chip line tap ic-c" onClick={() => doConvert(it.id, 'life')}>转生活任务</button>
                    {onOpenProject && <button className="chip chip-dark tap ic-c" onClick={() => jumpToInspiration(it)}>跳转项目 ›</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card card-pad empty-block">
            <div className="emoji">✦</div>
            <div className="t-sub">收集箱已清空，干得漂亮</div>
            <div className="t-cap" style={{ marginTop: 4 }}>已清空 {data.inboxCleared} 次</div>
          </div>
        )}
      </div>

      {/* 今日已归档 */}
      {archived.length > 0 && (
        <div className="section">
          <div className="section-head">
            <span className="section-title">已归档 · {archived.length}</span>
            <span className="t-cap" style={{ opacity: 0.6 }}>点击跳转对应项目</span>
          </div>
          <div className="card">
            {archived.slice(0, 20).map((it, i) => {
              const task = it.convertedTo?.type === 'task' ? data.tasks.find(t => t.id === it.convertedTo!.id) : undefined
              const domain = task?.domain || 'content'
              return (
                <div key={it.id} className={'inbox-row' + (i < Math.min(archived.length, 20) - 1 ? ' b' : '') + ' tap'}
                  onClick={() => jumpToDomain(domain)} style={{ cursor: 'pointer' }}>
                  <div className="inbox-row-main">
                    <span className="icn-box" style={{ width: 28, height: 28, background: 'var(--bg-soft)', color: 'var(--ink-3)' }}>{SOURCE_ICON[it.source]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-body inbox-text struck" style={{ opacity: 0.7 }}>{it.content}</div>
                      <div className="t-cap">{it.createdAt} · {DOMAIN_LABEL[domain]}{task ? ' · 已转任务' : ' · 已归档'}</div>
                    </div>
                    <span className="chip line" style={{ flex: 'none' }}>{DOMAIN_ICON[domain]} ›</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}
