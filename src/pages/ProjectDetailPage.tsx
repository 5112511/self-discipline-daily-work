import React, { useRef, useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_LABEL, DOMAIN_ICON, CONTENT_STAGE_LABEL, CONTENT_RECORD_KIND_LABEL, type Project, type ContentStage, type ContentRecordKind } from '../types'
import { useToast } from '../components/Toast'
import { IconPlus, IconTrash } from '../components/Icons'
import { domainColor } from '../palette'

const CONTENT_STAGES: ContentStage[] = ['idea', 'topic', 'script', 'shoot', 'edit', 'publish', 'published']

export function ProjectDetailPage({ projectId, onBack, onEditTask }: { projectId: string; onBack: () => void; onEditTask: (task: import('../types').Task) => void }) {
  const data = useStore()
  const toast = useToast()
  const p = data.projects.find(x => x.id === projectId)
  if (!p) {
    return (
      <div className="page ledger-page">
        <div className="page-head"><button className="t-sub tap" onClick={onBack}>‹ 返回</button></div>
        <div className="t-cap" style={{ padding: 20, textAlign: 'center' }}>项目不存在</div>
      </div>
    )
  }
  const c = domainColor(p.domain)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e: React.TouchEvent) => { const start = swipeStart.current; swipeStart.current = null; if (start && e.changedTouches[0].clientX - start.x > 88 && Math.abs(e.changedTouches[0].clientY - start.y) < 55) onBack() }

  const moveContent = (contentId: string, dir: 1 | -1) => {
    const ct = p.content?.find(x => x.id === contentId)
    if (!ct) return
    const idx = CONTENT_STAGES.indexOf(ct.stage)
    const next = Math.max(0, Math.min(CONTENT_STAGES.length - 1, idx + dir))
    if (next === idx) return
    store.moveContentStage(p.id, contentId, next)
    toast(`已移至「${CONTENT_STAGE_LABEL[CONTENT_STAGES[next]]}」`)
  }

  return (
    <div className="page ledger-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="page-head">
        <button className="t-sub tap" onClick={onBack}>‹ 返回</button>
        <span className="page-head-title">{p.name}</span>
        <span style={{ width: 28 }} />
      </div>

      {/* 项目头部 */}
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <div className="pov-v2-head" style={{ marginBottom: 12 }}>
          <span className="pov-v2-icn" style={{ background: c.soft, color: c.ink, borderColor: c.base }}>{DOMAIN_ICON[p.domain]}</span>
          <div>
            <div className="t-body" style={{ fontWeight: 600 }}>{p.name}</div>
            <div className="t-cap">{DOMAIN_LABEL[p.domain]} · 进度 {p.progress}%{p.countdownDays != null ? ` · 倒计时 ${p.countdownDays} 天` : ''}</div>
          </div>
        </div>
        <div className="bar"><i style={{ width: `${p.progress}%`, background: c.base }} /></div>
        {p.nextAction && <div className="t-sub" style={{ marginTop: 8 }}>下一步：{p.nextAction}</div>}
      </div>

      {/* 各领域完整内容 */}
      {p.domain === 'content' && <ContentDetail p={p} moveContent={moveContent} toast={toast} />}
      {p.domain === 'ai' && <AiDetail p={p} toast={toast} />}
      {p.domain === 'health' && <HealthDetail p={p} toast={toast} />}
      {p.domain === 'class' && <ClassDetail p={p} toast={toast} />}
      {p.domain === 'work' && <WorkDetail p={p} />}
      {p.domain === 'life' && <LifeDetail p={p} toast={toast} />}

      {/* 来自收集箱的任务 */}
      <ProjectTasks p={p} toast={toast} onEditTask={onEditTask} />

      <div style={{ height: 8 }} />
    </div>
  )
}

function ContentDetail({ p, moveContent, toast }: { p: Project; moveContent: (id: string, dir: 1 | -1) => void; toast: (s: string) => void }) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTarget, setAiTarget] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{ titles?: string[]; angle?: string; outline?: string[]; nextAction?: string; advice?: string; knowledgeTitle?: string; knowledgeContent?: string; raw?: string } | null>(null)
  const [recordTarget, setRecordTarget] = useState<string | null>(null)
  const [recordKind, setRecordKind] = useState<ContentRecordKind>('script')
  const [recordText, setRecordText] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newContent, setNewContent] = useState({ title: '', note: '', dueDate: '', meetingContact: '' })
  const activeContent = p.content?.find(c => c.id === selectedId)
  const archivedContent = p.content?.filter(c => c.archivedAt) || []

  const askGemini = async (content: NonNullable<Project['content']>[number]) => {
    setAiLoading(true)
    setAiTarget(content.id)
    setAiResult(null)
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'creative-analysis', title: content.title, platform: content.platform, stage: CONTENT_STAGE_LABEL[content.stage], nextAction: content.nextAction, records: content.stageRecords || [] }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gemini 请求失败')
      setAiResult(result)
      if (result.knowledgeTitle && result.knowledgeContent) {
        store.addCreativeKnowledge(p.id, { title: result.knowledgeTitle, content: result.knowledgeContent, sourceContentId: content.id })
        toast('AI 建议已沉淀到创作知识库')
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Gemini 暂时不可用')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="card card-pad">
      <div className="section-head"><span className="section-title">内容流水线</span>
        <button className="chip chip-dark tap" onClick={() => setShowNew(true)}><IconPlus size={13} /> 新增</button>
      </div>
          <div className="content-pipeline">
        {CONTENT_STAGES.map(s => (
          <div key={s} className="pipe-col">
            <div className="pipe-head">{CONTENT_STAGE_LABEL[s]}</div>
            <div className="pipe-list">
              {p.content?.filter(c => c.stage === s && !c.archivedAt).map(c => (
                <div key={c.id} className="pipe-card" onClick={() => setSelectedId(c.id)}>
                  <div className="pipe-platform">{c.platform}</div>
                  <div className="pipe-title">{c.title}</div>
                  {c.nextAction && <div className="t-cap">→ {c.nextAction}</div>}
                  <button className="pipe-ai-btn tap" onClick={(e) => { e.stopPropagation(); setRecordTarget(recordTarget === c.id ? null : c.id); setRecordText('') }}>记录 {c.stageRecords?.length ? `(${c.stageRecords.length})` : ''}</button>
                  <button className="pipe-ai-btn tap" onClick={(e) => { e.stopPropagation(); askGemini(c) }} disabled={aiLoading}>✦ {aiLoading && aiTarget === c.id ? '分析中' : 'AI建议'}</button>
                  {recordTarget === c.id && <div className="content-record-form"><select value={recordKind} onChange={e => setRecordKind(e.target.value as ContentRecordKind)} className="content-record-select">{(Object.keys(CONTENT_RECORD_KIND_LABEL) as ContentRecordKind[]).map(kind => <option key={kind} value={kind}>{CONTENT_RECORD_KIND_LABEL[kind]}</option>)}</select><textarea value={recordText} onChange={e => setRecordText(e.target.value)} placeholder="记录口播、创作卡点、同行观察或阶段复盘…" rows={3} /><button className="chip chip-dark tap" onClick={() => { if (!recordText.trim()) return toast('先写下一条记录'); store.addContentStageRecord(p.id, c.id, recordKind, recordText.trim()); setRecordText(''); toast('已写入阶段记录') }}>保存记录</button></div>}
                  <div className="pipe-acts">
                    <button className="pipe-arrow tap" disabled={s === 'idea'} onClick={(e) => { e.stopPropagation(); moveContent(c.id, -1) }}>‹</button>
                    <button className="pipe-arrow tap" disabled={s === 'published'} onClick={(e) => { e.stopPropagation(); moveContent(c.id, 1) }}>›</button>
                    {s === 'published' && <button className="pipe-archive-btn tap" onClick={(e) => { e.stopPropagation(); store.archiveContent(p.id, c.id); toast('已完成入库，仅保留在今日已完成与创作档案中') }}>完成入库</button>}
                  </div>
                </div>
              ))}
              {p.content?.filter(c => c.stage === s && !c.archivedAt).length === 0 && <div className="t-cap pipe-empty">—</div>}
            </div>
          </div>
        ))}
      </div>
      {showNew && <div className="content-modal-mask" onClick={() => setShowNew(false)}><div className="content-modal" onClick={e => e.stopPropagation()}><div className="section-head"><span className="section-title">新增创作任务</span><button className="t-cap tap" onClick={() => setShowNew(false)}>关闭</button></div><label>标题 *</label><input value={newContent.title} onChange={e => setNewContent(v => ({ ...v, title: e.target.value }))} placeholder="本次创作的标题" /><label>备注详情</label><textarea value={newContent.note} onChange={e => setNewContent(v => ({ ...v, note: e.target.value }))} placeholder="创作背景、口播要点或准备事项" rows={4} /><div className="content-form-row"><div><label>DDL</label><input type="date" value={newContent.dueDate} onChange={e => setNewContent(v => ({ ...v, dueDate: e.target.value }))} /></div><div><label>对接人</label><input value={newContent.meetingContact} onChange={e => setNewContent(v => ({ ...v, meetingContact: e.target.value }))} placeholder="姓名 / 团队" /></div></div><div className="t-cap">填写 DDL 后会同步到日历；对接人与备注一并保留。</div><button className="chip chip-dark tap" onClick={() => { if (!newContent.title.trim()) return toast('请填写标题'); store.addContent(p.id, newContent.title.trim(), '小红书', 'idea', newContent); setNewContent({ title: '', note: '', dueDate: '', meetingContact: '' }); setShowNew(false); toast('已加入灵感，并创建对应任务') }}>创建并加入灵感</button></div></div>}
      {activeContent && <div className="content-modal-mask" onClick={() => setSelectedId(null)}><div className="content-modal content-detail-modal" onClick={e => e.stopPropagation()}><div className="section-head"><div><span className="section-title">{activeContent.title}</span><div className="t-cap">{activeContent.platform} · {CONTENT_STAGE_LABEL[activeContent.stage]}</div></div><button className="t-cap tap" onClick={() => setSelectedId(null)}>关闭</button></div><div className="t-sub">创作记录</div>{activeContent.stageRecords?.length ? activeContent.stageRecords.map(r => <div className="detail-record" key={r.id}><div className="t-cap">{CONTENT_RECORD_KIND_LABEL[r.kind]} · {new Date(r.createdAt).toLocaleString('zh-CN')}</div><div className="t-body">{r.content}</div></div>) : <div className="t-cap">暂未添加阶段记录</div>}<div className="t-sub" style={{ marginTop: 16 }}>AI 沉淀知识</div>{p.creativeKnowledge?.filter(k => k.sourceContentId === activeContent.id).length ? p.creativeKnowledge.filter(k => k.sourceContentId === activeContent.id).map(k => <div key={k.id} className="knowledge-card"><div className="t-sub">{k.title}</div><div className="t-body">{k.content}</div></div>) : <div className="t-cap">尚未生成，点击该条目的「AI 建议」即可沉淀。</div>}</div></div>}
      {archivedContent.length > 0 && <div className="creative-archive"><div className="section-head"><span className="section-title">已完成入库</span><span className="t-cap">{archivedContent.length} 条</span></div>{archivedContent.map(c => <button key={c.id} className="archive-row tap" onClick={() => setSelectedId(c.id)}><span>✓</span><span>{c.title}</span><span className="t-cap">查看创作详情 ›</span></button>)}</div>}
      {aiResult && (
        <div className="gemini-result">
          <div className="gemini-result-head"><span className="t-sub">Gemini 创作建议</span><button className="t-cap tap" onClick={() => setAiResult(null)}>关闭</button></div>
          {aiResult.titles?.length ? <div className="gemini-block"><span className="t-cap">推荐标题</span><div className="gemini-titles">{aiResult.titles.map(title => <span key={title} className="chip">{title}</span>)}</div></div> : null}
          {aiResult.angle && <div className="gemini-block"><span className="t-cap">切入角度</span><div className="t-body">{aiResult.angle}</div></div>}
          {aiResult.advice && <div className="gemini-block"><span className="t-cap">结合阶段记录的建议</span><div className="t-body">{aiResult.advice}</div></div>}
          {aiResult.outline?.length ? <div className="gemini-block"><span className="t-cap">内容结构</span>{aiResult.outline.map((item, index) => <div key={`${index}-${item}`} className="gemini-outline"><b>{index + 1}</b>{item}</div>)}</div> : null}
          {aiResult.nextAction && <div className="gemini-next">下一步：{aiResult.nextAction}</div>}
          {aiResult.raw && <div className="t-body">{aiResult.raw}</div>}
        </div>
      )}
      {(p.creativeKnowledge?.length || 0) > 0 && <div className="creative-knowledge"><div className="section-head"><span className="section-title">创作知识库</span><span className="t-cap">{p.creativeKnowledge!.length} 条沉淀</span></div>{p.creativeKnowledge!.slice(0, 8).map(k => <div key={k.id} className="knowledge-card"><div className="t-sub">{k.title}</div><div className="t-body">{k.content}</div></div>)}</div>}
    </div>
  )
}

function AiDetail({ p, toast }: { p: Project; toast: (s: string) => void }) {
  const data = useStore()
  return (
    <div className="card card-pad">
      <div className="ai-stats">
        <div><span className="t-h2 mono">{p.ai!.stats.ideas}</span><span className="t-cap">本周灵感</span></div>
        <div><span className="t-h2 mono">{p.ai!.stats.learning}</span><span className="t-cap">学习中</span></div>
        <div><span className="t-h2 mono">{p.ai!.stats.practiced}</span><span className="t-cap">已实践</span></div>
        <div><span className="t-h2 mono">{p.ai!.stats.output}</span><span className="t-cap">已产出</span></div>
      </div>
      <div className="divider" />
      {p.ai!.learning.map(l => (
        <div key={l.id} className="ai-row b">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body">{l.topic}</div>
            <div className="t-cap">{l.source} · 进度 {l.progress}%</div>
            <div className="bar" style={{ marginTop: 6, height: 3 }}><i style={{ width: `${l.progress}%` }} /></div>
            {l.nextPractice && <div className="t-sub" style={{ marginTop: 4 }}>下一步实践：{l.nextPractice}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="chip line tap" onClick={() => { store.advanceLearning(p.id, l.id, -10); toast('进度 -10%') }}>−</button>
              <button className="chip tap chip-dark" onClick={() => { store.advanceLearning(p.id, l.id, 10); toast('进度 +10%') }}>+</button>
            </div>
            {l.canToTopic && <button className="chip line tap" onClick={() => { store.addContent(p.id, l.topic, '小红书', 'idea'); toast('已转为内容灵感') }}>转选题</button>}
          </div>
        </div>
      ))}
      <div className="divider" />
      <div className="section-head"><span className="section-title">来自热点选题</span>
        <button className="chip line tap" onClick={async () => { const r = await store.refreshTrending(); toast(r.real ? `已抓取 ${r.count} 条真实热点` : `已刷新 ${r.count} 条选题`) }}>刷新</button>
      </div>
      {data.trendingTopics.slice(0, 4).map(t => (
        <div key={t.id} className="ai-row b" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
            <div className="t-cap">{t.platform} · 热度 {t.heat} · {t.keywords.slice(0, 2).map(k => '#' + k).join(' ')}</div>
          </div>
          <button className="chip tap chip-dark" onClick={() => { store.addLearningFromTrending(p.id, { title: t.title, platform: t.platform }); toast('已加入学习 ✓') }}>加入</button>
        </div>
      ))}
    </div>
  )
}

function HealthDetail({ p, toast }: { p: Project; toast: (s: string) => void }) {
  return (
    <div className="card card-pad">
      <div className="health-goal">
        <div className="t-cap">项目目标</div>
        <div className="t-body">{p.health!.goal}</div>
        <div className="t-cap" style={{ marginTop: 6 }}>阶段：{p.health!.stage} · 本周产出：{p.health!.weekOutput}</div>
      </div>
      <div className="divider" />
      <div className="health-investor">
        <div className="t-body" style={{ fontWeight: 600 }}>🎯 准备投资人沟通材料</div>
        <div className="investor-steps">
          {p.health!.investorSteps.map(s => (
            <div key={s.id} className={'is-step' + (s.done ? ' done' : '')} onClick={() => { store.toggleInvestorStep(p.id, s.id); toast(s.done ? '已取消勾选' : '✓ 已完成') }}>
              <span className="is-check">{s.done ? '✓' : '○'}</span>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="divider" />
      <div className="health-milestones">
        <div className="t-sub">里程碑</div>
        {p.health!.milestones.map(m => (
          <div key={m.id} className="ms-row">
            <span className={'ms-dot ' + m.status} />
            <span style={{ flex: 1 }}>{m.name}</span>
            {m.date && <span className="t-cap">{m.date}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ClassDetail({ p, toast }: { p: Project; toast: (s: string) => void }) {
  return (
    <div className="card card-pad">
      <div className="class-stats">
        <div><span className="t-h2 mono">{p.classes!.weekCount}</span><span className="t-cap">本周练习</span></div>
        <div><span className="t-h2 mono">{p.classes!.photosUnsent}</span><span className="t-cap">作品待归档</span></div>
        <div><span className="t-h2 mono">{p.classes!.sessions.filter(s => s.prepareStatus === 'todo').length}</span><span className="t-cap">需练习</span></div>
      </div>
      <div className="divider" />
      {p.classes!.sessions.map((s, i) => (
        <div key={s.id} className={'cls-row' + (i < p.classes!.sessions.length - 1 ? ' b' : '')}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body">{s.name} · {s.weekday} {s.time}</div>
            <div className="t-cap">{s.place}</div>
            {s.photosUnsent > 0 && <div className="t-sub" style={{ color: 'var(--ink-2)' }}>→ 整理并归档 {s.photosUnsent} 份练习作品</div>}
            {s.nextClass && <div className="t-sub">→ {s.nextClass}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <button className={'chip tap ' + (s.prepareStatus === 'todo' ? 'chip-dark' : 'line')} onClick={() => { store.toggleClassPrep(p.id, s.id); toast(s.prepareStatus === 'todo' ? '已标记练习完成' : '需重新练习') }}>{s.prepareStatus === 'todo' ? '待练习' : '已练习'}</button>
            {s.photosUnsent > 0 && <button className="chip line tap" onClick={() => { store.sendClassPhotos(p.id, s.id); toast('已归档练习作品 ✓') }}>归档作品</button>}
          </div>
        </div>
      ))}
    </div>
  )
}

function LifeDetail({ p, toast }: { p: Project; toast: (s: string) => void }) {
  return (
    <div className="card">
      {p.life!.items.map((it, i) => (
        <div key={it.id} className={'life-row' + (i < p.life!.items.length - 1 ? ' b' : '')} onClick={() => { store.toggleLifeItem(p.id, it.id); toast(it.status === 'done' ? '已取消完成' : '✓ 已完成') }}>
          <span className={'life-check ' + it.status} />
          <span className={'t-body' + (it.status === 'done' || it.status === 'cancelled' ? ' struck' : '')}>{it.title}</span>
          <span className="t-cap" style={{ marginLeft: 'auto' }}>
            {it.status === 'pending' ? '待处理' : it.status === 'doing' ? '进行中' : it.status === 'cancelled' ? '已取消' : '完成'}
          </span>
        </div>
      ))}
    </div>
  )
}

function WorkDetail({ p }: { p: Project }) {
  return (
    <div className="card card-pad">
      <div className="section-head"><span className="section-title">工作会议</span></div>
      {(p.work?.meetings || []).map(m => (
        <div key={m.id} className="life-row b">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body">{m.title}</div>
            <div className="t-cap">{m.date} {m.start}-{m.end} · {m.location || '未设置地点'}</div>
            <div className="t-cap">对接人：{m.contact || '未设置'}{m.note ? ` · ${m.note}` : ''}</div>
          </div>
        </div>
      ))}
      {(p.work?.meetings || []).length === 0 && <div className="t-cap">暂无工作会议</div>}
    </div>
  )
}

function ProjectTasks({ p, toast, onEditTask }: { p: Project; toast: (s: string) => void; onEditTask: (task: import('../types').Task) => void }) {
  const data = useStore()
  // 兼容旧任务：没有 projectId 但领域一致时，也归入当前项目
  const tasks = data.tasks.filter(t => !t.deletedAt && !t.contentId && (t.projectId === p.id || t.domain === p.domain))
  if (tasks.length === 0) return null

  const toggleStatus = (id: string, status: string) => {
    if (status === 'done') {
      store.updateTask(id, { status: 'pending', completedAt: undefined })
      toast('已取消完成')
    } else {
      store.updateTask(id, { status: 'done', completedAt: new Date().toISOString().slice(0, 10) })
      toast('✓ 已完成')
    }
  }

  const statusIcon = (s: string) => s === 'done' ? '✓' : s === 'doing' ? '→' : s === 'waiting' ? '…' : '○'

  return (
    <div className="card card-pad">
      <div className="section-head">
        <span className="section-title">来自收集箱 · {tasks.length}</span>
      </div>
      {tasks.map((t, i) => (
        <div key={t.id} className={'life-row' + (i < tasks.length - 1 ? ' b' : '')} style={{ cursor: 'pointer' }} onClick={() => toggleStatus(t.id, t.status)}>
          <span className={`life-check ${t.status === 'done' ? 'done' : ''}`}>{statusIcon(t.status)}</span>
          <span className={`t-body${t.status === 'done' ? ' struck' : ''}`} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
          <span className="t-cap" style={{ marginLeft: 8, flex: 'none' }}>
            {t.priority === 'high' ? '高优' : t.priority === 'medium' ? '中优' : ''}
          </span>
          <button className="chip line tap" onClick={(e) => { e.stopPropagation(); onEditTask(t) }}>详情</button>
          {t.note && <div className="t-cap" style={{ width: '100%', paddingLeft: 30 }}>备注：{t.note}</div>}
          {(t.meetingLocation || t.meetingContact || t.completionNote) && <div className="t-cap" style={{ width: '100%', paddingLeft: 30 }}>{t.meetingLocation && `地点：${t.meetingLocation} `}{t.meetingContact && `对接人：${t.meetingContact} `}{t.completionNote && `收获：${t.completionNote}`}</div>}
        </div>
      ))}
    </div>
  )
}
