import React, { useState } from 'react'
import { useStore } from '../useStore'
import { store } from '../store'
import { DOMAIN_LABEL, TRENDING_CATEGORY_LABEL, type Domain, type TrendingCategory, type TrendingTopic } from '../types'
import { IconBolt, IconPlus, IconRefresh, IconArrowRight, IconSparkle } from '../components/Icons'
import { useToast } from '../components/Toast'
import { domainColor } from '../palette'

const DOMAIN_COLOR: Record<Domain, string> = Object.fromEntries(
  (['content', 'ai', 'health', 'class', 'work', 'life'] as Domain[]).map(d => [d, domainColor(d).ink])
) as Record<Domain, string>

const CATEGORY_COLOR: Record<TrendingCategory, string> = {
  flow: '#E8915C',      // 暖橙 - 流量爆款
  life: '#7CA98C',      // 复古绿 - 生活方式
  knowledge: '#5B8DB8', // 雾霾蓝 - 知识科普
  emotion: '#C97B7B',  // 豆沙红 - 情绪共鸣
  trend: '#9B7FB8',     // 雾紫 - 热点追踪
  skill: '#D4A574',     // 燕麦金 - 技能干货
}

export function TrendingPage({ onBack }: { onBack: () => void }) {
  const data = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<TrendingCategory | 'all'>('all')
  const [aiLoading, setAiLoading] = useState(false)
  // 均为真实数据：近 7 天完成趋势 / 近 35 天活跃度 / 本周专注时长分布
  const trend = data.weekTrend
  const maxTrend = Math.max(...trend, 1)
  const heatmap = data.heatmap
  const weekDist = data.weekDist
  const maxDist = Math.max(...weekDist.map(w => w.minutes), 1)

  // 本周热点任务
  const hot = data.tasks
    .filter(t => t.status === 'doing' || t.status === 'pending')
    .sort((a, b) => (a.priority === 'high' ? -1 : 0) - (b.priority === 'high' ? -1 : 0))
    .slice(0, 5)

  // 内容创作项目（用于转选题）
  const contentProject = data.projects.find(p => p.domain === 'content')
  const aiProject = data.projects.find(p => p.domain === 'ai')

  // 过滤后的选题
  const topics = filter === 'all' ? data.trendingTopics : data.trendingTopics.filter(t => t.category === filter)

  const handleToContent = (t: TrendingTopic) => {
    if (contentProject) {
      store.addContent(contentProject.id, t.title, t.platform, 'idea')
      toast(`已加入「内容灵感」：${t.title}`)
    } else {
      store.addInspiration(t.title, 'web')
      toast('已加入灵感')
    }
  }

  const handleAiTrending = async () => {
    setAiLoading(true)
    try {
      const result = await store.refreshTrendingWithAI(filter)
      if (result.ok) toast(`AI 已生成 ${result.count} 条选题 ✓`)
      else toast(result.error || 'AI 选题生成失败')
    } finally {
      setAiLoading(false)
    }
  }

  const handleToLearning = (t: TrendingTopic) => {
    if (aiProject) {
      store.addLearningFromTrending(aiProject.id, { title: t.title, platform: t.platform })
      toast(`已加入「AI 学习」：${t.title}`)
    } else {
      toast('未找到 AI 学习项目')
    }
  }

  return (
    <div className="page ledger-page">
      <div className="page-head">
        <button className="t-sub tap" onClick={onBack}>‹</button>
        <div className="t-h3">热点简报</div>
        <IconBolt size={18} />
      </div>

      {/* 周趋势 */}
      <div className="card card-pad">
        <div className="section-head"><span className="section-title">本周趋势</span></div>
        <div className="trend-bars">
          {trend.map((v, i) => (
            <div key={i} className="tb-col">
              <div className="tb-bar" style={{ height: Math.max(4, v / maxTrend * 80) + 'px' }} />
              <span className="t-cap">{['一', '二', '三', '四', '五', '六', '日'][i % 7]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 创作热点选题 */}
      <div className="card card-pad">
        <div className="section-head">
          <span className="section-title">创作热点选题</span>
          <button className="chip line tap" onClick={() => { store.refreshTrending(); toast('已刷新热点 ✓') }} style={{ gap: 4 }}>
            <IconRefresh size={12} /> 本地刷新
          </button>
          <button className="chip chip-dark tap" onClick={handleAiTrending} disabled={aiLoading} style={{ gap: 4 }}>
            <IconSparkle size={12} /> {aiLoading ? 'AI 生成中…' : 'AI 跑选题'}
          </button>
        </div>
        <div className="t-sub" style={{ marginBottom: 8 }}>Agent-Reach 抓取 · 小红书/抖音/B站 · 共 {data.trendingTopics.length} 条</div>

        {/* 分类筛选 */}
        <div className="trend-filter">
          {(['all', 'flow', 'life', 'knowledge', 'emotion', 'trend', 'skill'] as const).map(cat => (
            <button key={cat} className={'chip tap' + (filter === cat ? ' chip-dark' : ' line')} onClick={() => setFilter(cat)}>
              {cat === 'all' ? '全部' : TRENDING_CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        <div className="trend-list">
          {topics.length === 0 && <div className="t-cap" style={{ padding: 16, textAlign: 'center' }}>暂无选题，点击「刷新」</div>}
          {topics.map((t, i) => (
            <div key={t.id} className="trend-card">
              <div className="trend-card-head">
                <span className="trend-rank mono">{i + 1}</span>
                <span className="trend-heat" style={{ color: CATEGORY_COLOR[t.category] }}>
                  <IconBolt size={11} /> {t.heat}
                  {t.source === 'real' && <span className="t-cap" style={{ marginLeft: 4, fontSize: 10 }}>真实</span>}
                  {t.source === 'ai' && <span className="t-cap" style={{ marginLeft: 4, fontSize: 10 }}>AI 生成</span>}
                </span>
              </div>
              <div className="trend-title">{t.title}</div>
              <div className="trend-angle">→ {t.angle}</div>
              <div className="trend-tags">
                <span className="chip" style={{ background: CATEGORY_COLOR[t.category] + '22', color: CATEGORY_COLOR[t.category], borderColor: 'transparent' }}>
                  {TRENDING_CATEGORY_LABEL[t.category]}
                </span>
                <span className="chip line">{t.platform}</span>
                {t.keywords.slice(0, 3).map(k => <span key={k} className="t-cap" style={{ padding: '2px 6px' }}>#{k}</span>)}
                {t.url && <a className="t-cap" href={t.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: 'var(--t-sub)' }}>原文 ›</a>}
              </div>
              <div className="trend-acts">
                <button className="chip line tap" onClick={() => handleToContent(t)} style={{ gap: 4 }}>
                  <IconPlus size={12} /> 转选题
                </button>
                <button className="chip tap chip-dark" onClick={() => handleToLearning(t)} style={{ gap: 4 }}>
                  加入学习 <IconArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 领域分布 */}
      {weekDist.length > 0 && (
        <div className="card card-pad">
          <div className="section-head"><span className="section-title">本周领域分布</span></div>
          <div className="focus-dist">
            {weekDist.map(w => (
              <div key={w.domain} className="wd-row">
                <span className="t-sub" style={{ width: 64 }}>{DOMAIN_LABEL[w.domain]}</span>
                <div className="bar" style={{ flex: 1, height: 6 }}><i style={{ width: (w.minutes / maxDist) * 100 + '%', background: DOMAIN_COLOR[w.domain] }} /></div>
                <span className="t-cap mono" style={{ width: 40, textAlign: 'right' }}>{w.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 热力图 */}
      <div className="card card-pad">
        <div className="section-head"><span className="section-title">近 5 周活跃度</span></div>
        <div className="heatmap-grid">
          {heatmap.slice(0, 35).map((v, i) => (
            <div key={i} className="hm-cell" style={{ opacity: 0.15 + (v / 5) * 0.85, background: v > 0 ? 'var(--ink)' : 'var(--line)' }} />
          ))}
        </div>
      </div>

      {/* 热点任务 */}
      <div className="card card-pad">
        <div className="section-head"><span className="section-title">重点关注</span></div>
        <div className="hot-list">
          {hot.length === 0 && <div className="t-cap" style={{ padding: 12, textAlign: 'center' }}>暂无进行中任务</div>}
          {hot.map((t, i) => (
            <div key={t.id} className="hot-item">
              <span className="hot-rank mono">{i + 1}</span>
              <div className="hot-body">
                <div className="hot-title">{t.title}</div>
                <div className="hot-meta">{DOMAIN_LABEL[t.domain]} · {t.priority === 'high' ? '高优' : t.priority === 'medium' ? '中优' : '低优'}</div>
              </div>
              <span className="hot-dot" style={{ background: DOMAIN_COLOR[t.domain] }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
