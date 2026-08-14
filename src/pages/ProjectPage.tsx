import React from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_ICON, CONTENT_STAGE_LABEL, type Project, type ContentStage } from '../types'
import { useToast } from '../components/Toast'
import { IconArrowRight, IconPlus } from '../components/Icons'
import { domainColor } from '../palette'

function ProjectOverviewCard({ p, onJump }: { p: Project; onJump: () => void }) {
  const c = domainColor(p.domain)
  const urgent = p.todoCount > 0
  return (
    <div className="pov-card-v2 tap" id={'pov-' + p.id} onClick={onJump} role="button"
      style={{ '--dc': c.base, '--dc-soft': c.soft, '--dc-ink': c.ink } as React.CSSProperties}>
      <div className="pov-v2-bar" />
      <div className="pov-v2-body">
        <div className="pov-v2-head">
          <span className="pov-v2-icn">{DOMAIN_ICON[p.domain]}</span>
          <div className="pov-v2-name">{p.name}</div>
        </div>
        <div className="pov-v2-ring">
          <Ring value={p.progress} size={46} stroke={4} />
          <div className="pov-v2-ring-info">
            <div className="pov-v2-pct mono">{p.progress}%</div>
            <div className="pov-v2-urgent">
              {urgent ? <span className="pov-v2-tag">待办 {p.todoCount}</span> : <span className="t-cap">无待办</span>}
              {p.countdownDays != null && <span className="pov-v2-tag alt">倒计时 {p.countdownDays}</span>}
            </div>
          </div>
        </div>
        {p.nextAction && (
          <div className="pov-v2-next" title={p.nextAction}>
            <IconArrowRight size={11} /><span>{p.nextAction}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Ring({ value, size = 46, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <svg width={size} height={size} style={{ flex: 'none' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--line-2)" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--dc)" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  )
}

function ProjectSection({ p, onAll, children }: { p: Project; onAll?: () => void; children: React.ReactNode }) {
  const data = useStore()
  // 兼容旧任务：历史任务可能只有 domain 没有 projectId，仍归入对应项目展示
  const tasks = data.tasks.filter(t => !t.deletedAt && (t.projectId === p.id || t.domain === p.domain))
  const doneCount = tasks.filter(t => t.status === 'done').length
  const taskProgress = tasks.length ? Math.round(tasks.reduce((sum, t) => sum + (t.status === 'done' ? 100 : t.progress || 0), 0) / tasks.length) : null
  return (
    <div className="section proj-section" id={'proj-' + p.id} style={{ scrollMarginTop: 12 }}>
      <div className="section-head">
        <span className="section-title"><span style={{ marginRight: 8 }}>{DOMAIN_ICON[p.domain]}</span>{p.name}</span>
        <button className="section-action tap" onClick={() => onAll?.()}>全部 ›</button>
      </div>
      {children}
      {tasks.length > 0 && (
        <div className="card card-pad project-task-preview">
          <div className="project-task-head">
            <span className="t-sub">任务合集 · {doneCount}/{tasks.length} 已完成</span>
            {taskProgress != null && <span className="t-cap mono">任务进度 {taskProgress}%</span>}
          </div>
          <div className="bar" style={{ marginBottom: 6 }}><i style={{ width: `${taskProgress || 0}%` }} /></div>
          {tasks.slice(0, 5).map((task, index) => (
            <div key={task.id} className={'project-task-row' + (index < Math.min(tasks.length, 5) - 1 ? ' b' : '')}>
              <button className={`life-check ${task.status === 'done' ? 'done' : ''}`} onClick={() => store.updateTask(task.id, task.status === 'done' ? { status: 'pending', progress: task.progress || 0, completedAt: undefined } : { status: 'done', progress: 100 })}>
                {task.status === 'done' ? '✓' : '○'}
              </button>
              <span className={`t-body${task.status === 'done' ? ' struck' : ''}`} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
              <span className="t-cap">{task.status === 'done' ? '已完成' : `${task.progress || 0}%`}</span>
            </div>
          ))}
          {tasks.length > 5 && <div className="t-cap" style={{ marginTop: 7, textAlign: 'center' }}>点击「全部」查看其余 {tasks.length - 5} 项任务</div>}
        </div>
      )}
    </div>
  )
}

export function ProjectPage({ onOpenDetail }: { onOpenDetail?: (projectId: string) => void }) {
  const data = useStore()
  const toast = useToast()
  const projects = data.projects
  const content = projects.find(p => p.domain === 'content')
  const ai = projects.find(p => p.domain === 'ai')
  const health = projects.find(p => p.domain === 'health')
  const cls = projects.find(p => p.domain === 'class')
  const work = projects.find(p => p.domain === 'work')
  const life = projects.find(p => p.domain === 'life')

  // 项目骨架不完整时显示空状态（清空数据后兜底，防止硬编码下标崩溃）
  if (!content || !ai || !health || !cls || !work || !life) {
    return (
      <div className="page project-page">
        <div className="page-title">项目</div>
        <div className="page-sub">五条生活主线 · 个人生活地图</div>
        <div className="card card-pad empty-block">
          <div className="emoji">◇</div>
          <div className="t-sub">项目数据为空</div>
          <div className="t-cap" style={{ marginTop: 6 }}>去「我的」恢复演示数据即可重新开始</div>
        </div>
      </div>
    )
  }

  const stageCount = (stage: ContentStage) => content.content?.filter(c => c.stage === stage).length || 0

  return (
    <div className="page project-page">
      <div className="page-title">项目</div>
      <div className="page-sub">五条生活主线 · 个人生活地图</div>

      {/* 总览 */}
      <div className="pov-grid">
        {projects.map(p => <ProjectOverviewCard key={p.id} p={p} onJump={() => onOpenDetail?.(p.id)} />)}
      </div>

      {/* A. 内容创作看板 */}
      <ProjectSection p={content} onAll={() => onOpenDetail?.(content.id)}>
        <div className="card card-pad">
          <div className="content-stats">
            <div><span className="t-h2 mono">{stageCount('idea') + stageCount('topic')}</span><span className="t-cap">选题/灵感</span></div>
            <div><span className="t-h2 mono">{stageCount('script') + stageCount('shoot') + stageCount('edit')}</span><span className="t-cap">制作中</span></div>
            <div><span className="t-h2 mono">{stageCount('publish')}</span><span className="t-cap">待发布</span></div>
            <div><span className="t-h2 mono">{stageCount('published')}</span><span className="t-cap">已发布</span></div>
          </div>
          <div className="divider" />
          <div className="t-sub" style={{ marginBottom: 8 }}>优先处理（制作中 + 待发布）</div>
          {(() => {
            const urgent = (content.content || []).filter(c => ['script','shoot','edit','publish'].includes(c.stage)).slice(0, 3)
            if (!urgent.length) return <div className="t-cap" style={{ padding: 8 }}>暂无紧急内容</div>
            return urgent.map(c => (
              <div key={c.id} className="ai-row b" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div className="t-cap">{CONTENT_STAGE_LABEL[c.stage]} · {c.platform}{c.nextAction ? ` · → ${c.nextAction}` : ''}</div>
                </div>
                <span className="chip">{CONTENT_STAGE_LABEL[c.stage]}</span>
              </div>
            ))
          })()}
          <div className="t-cap" style={{ marginTop: 8, textAlign: 'center' }}>点击「全部」查看全部 {content.content?.length || 0} 条内容</div>
        </div>
      </ProjectSection>

      {/* B. AI 学习 */}
      <ProjectSection p={ai} onAll={() => onOpenDetail?.(ai.id)}>
        <div className="card card-pad">
          <div className="ai-stats">
            <div><span className="t-h2 mono">{ai.ai!.stats.ideas}</span><span className="t-cap">本周灵感</span></div>
            <div><span className="t-h2 mono">{ai.ai!.stats.learning}</span><span className="t-cap">学习中</span></div>
            <div><span className="t-h2 mono">{ai.ai!.stats.practiced}</span><span className="t-cap">已实践</span></div>
            <div><span className="t-h2 mono">{ai.ai!.stats.output}</span><span className="t-cap">已产出</span></div>
          </div>
          <div className="divider" />
          <div className="t-sub" style={{ marginBottom: 8 }}>进行中</div>
          {(ai.ai!.learning.length === 0)
            ? <div className="t-cap" style={{ padding: 8 }}>暂无进行中的学习</div>
            : ai.ai!.learning.slice(0, 3).map(l => (
              <div key={l.id} className="ai-row b">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.topic}</div>
                  <div className="t-cap">{l.source} · 进度 {l.progress}%</div>
                  <div className="bar" style={{ marginTop: 6, height: 3 }}><i style={{ width: `${l.progress}%` }} /></div>
                  {l.nextPractice && <div className="t-sub" style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>下一步实践：{l.nextPractice}</div>}
                </div>
                {l.canToTopic && <button className="chip line tap" onClick={() => { store.addContent(content.id, l.topic, '小红书', 'idea'); toast('已转为内容灵感') }}>转选题</button>}
              </div>
            ))}
          <div className="t-cap" style={{ marginTop: 8, textAlign: 'center' }}>点击「全部」查看全部 {ai.ai!.learning.length} 条学习</div>
        </div>
      </ProjectSection>

      {/* C. 健康项目 */}
      <ProjectSection p={health} onAll={() => onOpenDetail?.(health.id)}>
        <div className="card card-pad">
          <div className="health-goal">
            <div className="t-cap">项目目标</div>
            <div className="t-body">{health.health!.goal}</div>
            <div className="t-cap" style={{ marginTop: 6 }}>阶段：{health.health!.stage} · 本周产出：{health.health!.weekOutput}</div>
          </div>
          <div className="divider" />
          <div className="t-sub" style={{ marginBottom: 8 }}>投资人材料 · 未完成</div>
          {(() => {
            const urgent = health.health!.investorSteps.filter(s => !s.done).slice(0, 3)
            if (!urgent.length) return <div className="t-cap" style={{ padding: 8 }}>投资人材料已全部完成 ✓</div>
            return urgent.map(s => (
              <div key={s.id} className={'is-step'} onClick={() => { store.toggleInvestorStep(health.id, s.id); toast(s.done ? '已取消勾选' : '✓ 已完成') }}>
                <span className="is-check">{s.done ? '✓' : '○'}</span>
                <span>{s.name}</span>
              </div>
            ))
          })()}
          <div className="t-cap" style={{ marginTop: 8, textAlign: 'center' }}>点击「全部」查看里程碑与完整步骤</div>
        </div>
      </ProjectSection>

      {/* D. 技能提升 */}
      <ProjectSection p={cls} onAll={() => onOpenDetail?.(cls.id)}>
        <div className="card card-pad">
          <div className="class-stats">
            <div><span className="t-h2 mono">{cls.classes!.weekCount}</span><span className="t-cap">本周练习</span></div>
            <div><span className="t-h2 mono">{cls.classes!.photosUnsent}</span><span className="t-cap">作品待归档</span></div>
            <div><span className="t-h2 mono">{cls.classes!.sessions.filter(s => s.prepareStatus === 'todo').length}</span><span className="t-cap">需练习</span></div>
          </div>
          <div className="divider" />
          <div className="t-sub" style={{ marginBottom: 8 }}>需练习 / 作品待归档</div>
          {(() => {
            const urgent = cls.classes!.sessions.filter(s => s.prepareStatus === 'todo' || s.photosUnsent > 0).slice(0, 3)
            if (!urgent.length) return <div className="t-cap" style={{ padding: 8 }}>全部准备就绪 ✓</div>
            return urgent.map((s, i) => (
              <div key={s.id} className={'cls-row' + (i < urgent.length - 1 ? ' b' : '')}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name} · {s.weekday} {s.time}</div>
                  <div className="t-cap">{s.place}</div>
                  {s.photosUnsent > 0 && <div className="t-sub" style={{ color: 'var(--ink-2)' }}>→ 整理并归档 {s.photosUnsent} 份练习作品</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  {s.prepareStatus === 'todo' && <button className="chip tap chip-dark" onClick={() => { store.toggleClassPrep(cls.id, s.id); toast(s.prepareStatus === 'todo' ? '已标记练习完成' : '需重新练习') }}>待练习</button>}
                  {s.photosUnsent > 0 && <button className="chip line tap" onClick={() => { store.sendClassPhotos(cls.id, s.id); toast('已归档练习作品 ✓') }}>归档作品</button>}
                </div>
              </div>
            ))
          })()}
          <div className="t-cap" style={{ marginTop: 8, textAlign: 'center' }}>点击「全部」查看全部 {cls.classes!.sessions.length} 项练习</div>
        </div>
      </ProjectSection>

      {/* E. 工作 */}
      <ProjectSection p={work} onAll={() => onOpenDetail?.(work.id)}>
        <div className="card card-pad">
          <div className="t-sub" style={{ marginBottom: 8 }}>工作 DDL / 会议</div>
          {(work.work?.meetings || []).map(m => (
            <div key={m.id} className="life-row b">
              <span className="t-cap mono" style={{ minWidth: 76 }}>{m.date} {m.start}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-body">{m.title}</div>
                <div className="t-cap">{m.contact || '未设置对接人'} · {m.location || '未设置地点'}</div>
              </div>
            </div>
          ))}
          {(work.work?.meetings || []).length === 0 && <div className="t-cap" style={{ padding: 8 }}>暂无工作会议</div>}
          <div className="t-cap" style={{ marginTop: 8, textAlign: 'center' }}>点击「全部」查看工作任务与会议</div>
        </div>
      </ProjectSection>

      {/* F. 个人生活 */}
      <ProjectSection p={life} onAll={() => onOpenDetail?.(life.id)}>
        <div className="card">
          {(() => {
            const urgent = life.life!.items.filter(it => it.status === 'pending' || it.status === 'doing').slice(0, 3)
            if (!urgent.length) return <div className="t-cap" style={{ padding: 14, textAlign: 'center' }}>暂无待办 ✓</div>
            return urgent.map((it, i) => (
              <div key={it.id} className={'life-row' + (i < urgent.length - 1 ? ' b' : '')} onClick={() => { store.toggleLifeItem(life.id, it.id); toast(it.status === 'done' ? '已取消完成' : '✓ 已完成') }}>
                <span className={'life-check ' + it.status} />
                <span className={'t-body' + (it.status === 'done' || it.status === 'cancelled' ? ' struck' : '')}>{it.title}</span>
                <span className="t-cap" style={{ marginLeft: 'auto' }}>
                  {it.status === 'pending' ? '待处理' : '进行中'}
                </span>
              </div>
            ))
          })()}
          <div className="t-cap" style={{ padding: 8, textAlign: 'center' }}>点击「全部」查看全部 {life.life!.items.length} 项</div>
        </div>
      </ProjectSection>

      <div style={{ height: 8 }} />
    </div>
  )
}
