import type { DemoData, Task, Inspiration, Project, Schedule, Domain, FocusSession, FocusSettings, Ledger, LedgerAccount, LedgerTxn, LedgerSnapshot, TrendingTopic, TrendingCategory, TrendingSource, BloggerRef, TrendingPlatform, CountdownDay } from './types'
import { demoData as defaultDemo } from './data'
import { pushToCloud, pullFromCloud, mergeData, clearCloudData } from './lib/sync'

// ===== 玥莹的 Personal OS · 数据层（LocalStorage 持久化）=====

const STORAGE_KEY = 'personal-os-data-v1'
const VERSION = 1

function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
}

export interface AppData {
  version: number
  tasks: Task[]
  inspirations: Inspiration[]
  projects: Project[]
  schedules: Schedule[]
  countdownDays: CountdownDay[]
  // 头部与统计中部分"日级"信息仍用 demo 兜底
  meta: {
    todayProgress: number
    streakDays: number
    greeting: string
    mood: string
  }
  settings: {
    avatarText: string
    displayName: string
  }
  inboxCleared: number
  weekTrend: number[]
  heatmap: number[]
  weekDist: { domain: Domain; minutes: number }[]
  focusSessions: FocusSession[]
  focusSettings: FocusSettings
  ledger: Ledger
  trendingTopics: TrendingTopic[]
  trendingSource: TrendingSource
}

// 历史事件类型（用于历史记录页展示）
export type HistoryEventKind = 'task-done' | 'task-deleted' | 'schedule-done' | 'ledger-income' | 'ledger-expense' | 'focus'

export interface HistoryEvent {
  kind: HistoryEventKind
  id: string
  title: string
  domain: Domain
  date: string          // YYYY-MM-DD
  time: string          // HH:mm（可为空）
  detail?: string
  priority?: import('./types').Priority
  deleted?: boolean
  originalStatus?: import('./types').TaskStatus
}

// 把 demoData 转成可编辑的 AppData 初始结构
// 自媒体创作热点选题池（涵盖流量/生活/知识/情绪/热点/技能六类）
const TRENDING_POOL: Omit<TrendingTopic, 'id' | 'heat'>[] = [
  { title: '一个人住的第 30 天，我学会了这件事', angle: '独居 vlog + 情绪转折，结尾给一个生活小顿悟', platform: '小红书', category: 'life', keywords: ['独居', '生活仪式感', '治愈'] },
  { title: '月薪 5k 和 5w 的女生，周末有什么不同', angle: '对比向，两个真实案例 + 价值观讨论', platform: '抖音', category: 'emotion', keywords: ['消费观', '对比', '女性成长'] },
  { title: '我用 AI 做自媒体，月涨粉 1 万', angle: '工具实测 + 数据截图，强干货', platform: 'B站', category: 'skill', keywords: ['AI工具', '涨粉', '效率'] },
  { title: '下班后的 2 小时，决定了你三年后的样子', angle: '成长类情绪共鸣，配日常片段', platform: '抖音', category: 'emotion', keywords: ['自律', '副业', '成长'] },
  { title: '今年夏天最火的 3 个穿搭公式', angle: '趋势盘点 + 上身示范，节奏快', platform: '小红书', category: 'trend', keywords: ['穿搭', '夏日', '趋势'] },
  { title: '为什么年轻人开始流行"City Walk"', angle: '现象解读 + 街采 + 个人观点', platform: 'B站', category: 'trend', keywords: ['CityWalk', '生活方式', '观察'] },
  { title: '我做自媒体一年，赚了多少钱（真实收入公开）', angle: '真诚透明向，收入截图 + 心路历程', platform: '小红书', category: 'flow', keywords: ['收入', '透明', '自媒体'] },
  { title: '一条视频涨粉 10 万，我做对了什么', angle: '爆款拆解，从选题到剪辑逐步复盘', platform: '抖音', category: 'flow', keywords: ['爆款', '拆解', '涨粉'] },
  { title: '每天 10 分钟，我用这个方法记单词', angle: '学习方法实测 + 前后对比', platform: 'B站', category: 'knowledge', keywords: ['学习', '英语', '方法'] },
  { title: '独居女生的一周早餐，简单又出片', angle: '美食 + 摆盘美学，治愈系', platform: '小红书', category: 'life', keywords: ['早餐', '独居', '出片'] },
  { title: '别再被这些"养生常识"骗了', angle: '辟谣向科普，逐条反驳', platform: '抖音', category: 'knowledge', keywords: ['辟谣', '养生', '科普'] },
  { title: '我摆摊一天，赚了多少', angle: '体验式内容，真实记录 + 复盘', platform: '抖音', category: 'flow', keywords: ['摆摊', '体验', '真实'] },
  { title: '如何在镜头前不紧张？3 个方法', angle: '教学干货，面向新手博主', platform: '小红书', category: 'skill', keywords: ['镜头感', '教程', '新手'] },
  { title: '那些让你瞬间破防的瞬间', angle: '情绪共鸣合集，配治愈文案', platform: '抖音', category: 'emotion', keywords: ['破防', '共鸣', '治愈'] },
  { title: '我试着用一周时间戒掉手机', angle: '挑战类 vlog，记录变化', platform: 'B站', category: 'life', keywords: ['戒手机', '挑战', '自律'] },
  { title: '用手机拍出电影感，只要这 4 步', angle: '拍摄教学 + 前后对比', platform: '抖音', category: 'skill', keywords: ['运镜', '手机摄影', '教程'] },
  { title: '当我说"我累了"，其实我在说什么', angle: '深度情绪向，配独白文案', platform: '小红书', category: 'emotion', keywords: ['情绪', '独白', '治愈'] },
  { title: '今年双 11，我劝你别买这些东西', angle: '反消费主义热点 + 避雷清单', platform: '抖音', category: 'trend', keywords: ['双11', '避雷', '消费'] },
  { title: '用 AI 帮我规划了一整周的生活', angle: 'AI 实测 + 效率提升前后对比', platform: 'B站', category: 'knowledge', keywords: ['AI', '规划', '效率'] },
  { title: '一个人吃火锅是什么体验', angle: '孤独美食向，情绪 + 探店', platform: '抖音', category: 'life', keywords: ['一个人', '探店', '治愈'] },
  { title: '我做博主的第一个 10 万粉，送你一份心法', angle: '成长复盘 + 方法论输出', platform: '小红书', category: 'flow', keywords: ['涨粉', '复盘', '心法'] },
  { title: '5 个让你立刻变好看的体态调整', angle: '实用干货，演示 + 对比', platform: '小红书', category: 'skill', keywords: ['体态', '变美', '干货'] },
]

// 从选题池随机抽取 n 条，生成带热度的选题列表（模拟 Agent-Reach 抓取后的轮换）
function pickTrending(n: number): TrendingTopic[] {
  const pool = [...TRENDING_POOL]
  const picked: TrendingTopic[] = []
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    const raw = pool.splice(idx, 1)[0]
    picked.push({
      id: 'tp' + Date.now() + i + Math.floor(Math.random() * 1000),
      ...raw,
      heat: 60 + Math.floor(Math.random() * 41), // 60-100
    })
  }
  return picked.sort((a, b) => b.heat - a.heat)
}

// 按关键词过滤选题池，无关键词或无命中时回退全部
function pickTrendingFiltered(keywords: string[], n: number): TrendingTopic[] {
  const pool = [...TRENDING_POOL]
  const lowKws = (keywords || []).map(k => k.toLowerCase().trim()).filter(Boolean)
  let filtered = pool
  if (lowKws.length) {
    filtered = pool.filter(t =>
      lowKws.some(kw =>
        t.title.toLowerCase().includes(kw) ||
        t.keywords.some(tk => tk.toLowerCase().includes(kw))
      )
    )
    if (!filtered.length) filtered = pool
  }
  const picked: TrendingTopic[] = []
  const working = [...filtered]
  for (let i = 0; i < n && working.length; i++) {
    const idx = Math.floor(Math.random() * working.length)
    const raw = working.splice(idx, 1)[0]
    picked.push({
      id: 'tp' + Date.now() + i + Math.floor(Math.random() * 1000),
      ...raw,
      heat: 60 + Math.floor(Math.random() * 41),
      source: 'sim',
      fetchedAt: new Date().toISOString(),
    })
  }
  return picked.sort((a, b) => b.heat - a.heat)
}

function buildInitialData(): AppData {
  const d = defaultDemo
  const allTasks: Task[] = [
    ...d.top3,
    ...d.overdueTasks,
    ...d.reminders.map(r => ({ ...r })),
  ]
  return {
    version: VERSION,
    tasks: allTasks,
    inspirations: d.inspirations.map(i => ({ ...i })),
    projects: d.projects.map(p => structuredCloneSafe(p)),
      schedules: d.todayTimeline.map(s => ({ ...s, date: todayStr() })),
countdownDays: [],
    meta: {
      todayProgress: d.todayProgress,
      streakDays: d.streakDays,
      greeting: d.greeting,
      mood: d.mood,
    },
    settings: { avatarText: '玥', displayName: '玥莹' },
    inboxCleared: d.stats.inboxCleared,
    weekTrend: [...d.stats.weekTrend],
    heatmap: [...d.stats.heatmap],
    weekDist: d.stats.weekDist.map(w => ({ ...w })),
    focusSessions: [],
    focusSettings: { pomodoroMin: 25, categories: ['content', 'ai', 'health', 'class', 'work', 'life'], sound: true, notification: true },
    ledger: defaultLedger(todayStr()),
    trendingTopics: pickTrending(8),
    trendingSource: defaultTrendingSource(),
  }
}

function defaultTrendingSource(): TrendingSource {
  return {
    keywords: ['AI', '减脂', '独居', '涨粉', '成长'],
    platforms: ['weibo', 'xhs', 'douyin'],
    bloggers: [],
    backendUrl: 'http://127.0.0.1:5174',
    enabled: false,
  }
}

// 简易深拷贝（项目里有嵌套对象）
function structuredCloneSafe<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 账本默认演示数据
function defaultLedger(today: string): Ledger {
  return {
    accounts: [
      { id: 'a1', name: '现金', kind: 'cash', balance: 0, updatedAt: today },
      { id: 'a2', name: '银行卡', kind: 'bank', balance: 0, updatedAt: today },
      { id: 'a3', name: '支付宝', kind: 'alipay', balance: 0, updatedAt: today },
      { id: 'a4', name: '微信零钱', kind: 'wechat', balance: 0, updatedAt: today },
      { id: 'a5', name: '信用卡', kind: 'card', balance: 0, updatedAt: today },
      { id: 'a6', name: '其他资产', kind: 'asset', balance: 0, updatedAt: today },
    ],
    txns: [],
    snapshots: [{ id: 's1', date: today, netWorth: 0 }],
  }
}

// 仅清理旧版本预置的账本演示数据；用户自己新增的账户或流水绝不会被改动。
function migrateDemoLedger(ledger: Ledger | undefined, today: string): Ledger {
  if (!ledger) return defaultLedger(today)
  const demoIds = new Set(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'])
  const onlyDemoAccounts = ledger.accounts.length === 6 && ledger.accounts.every(a => demoIds.has(a.id))
  const onlyDemoTransactions = ledger.txns.length === 3 && ledger.txns.every(t => ['x1', 'x2', 'x3'].includes(t.id))
  if (!onlyDemoAccounts || !onlyDemoTransactions) return ledger
  return defaultLedger(today)
}

// ===== 订阅机制 =====
type Listener = () => void
const listeners = new Set<Listener>()
let cache: AppData | null = null

// ===== 任务完成事件（用于询问"什么时候做的"并录入日历）=====
export type DoneLogEvent = { taskId: string; title: string; domain: Domain }
type DoneLogListener = (e: DoneLogEvent) => void
const doneLogListeners = new Set<DoneLogListener>()
export function onTaskDone(l: DoneLogListener) { doneLogListeners.add(l); return () => doneLogListeners.delete(l) }
function emitTaskDone(e: DoneLogEvent) { doneLogListeners.forEach(l => { try { l(e) } catch {} }) }

// ===== 云同步状态 =====
let currentUserId: string | null = null   // 登录后设置
let syncTimer: ReturnType<typeof setTimeout> | null = null
let isSyncing = false

// 设置当前登录用户（登录/登出时调用）
export function setCurrentUserId(id: string | null) {
  currentUserId = id
  if (id) {
    // 登录后立即拉取云端数据并合并
    syncFromCloud()
  }
}

// 后台异步上传到云端（防抖 2 秒，避免频繁写）
function scheduleCloudPush() {
  if (!currentUserId) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    if (isSyncing || !cache || !currentUserId) return
    isSyncing = true
    try {
      await pushToCloud(cache, currentUserId)
    } catch { /* ignore */ }
    isSyncing = false
  }, 2000)
}

// 从云端拉取并合并到本地
export async function syncFromCloud(): Promise<{ ok: boolean; error?: string }> {
  if (!currentUserId) return { ok: false, error: '未登录' }
  isSyncing = true
  try {
    const local = read()
    const pull = await pullFromCloud(currentUserId)
    if (pull.ok && pull.data) {
      const merged = mergeData(local, pull.data)
      cache = merged
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch { /* ignore */ }
      listeners.forEach(l => l())
    }
    isSyncing = false
    return { ok: pull.ok, error: pull.error }
  } catch (e: any) {
    isSyncing = false
    return { ok: false, error: e?.message || String(e) }
  }
}

function read(): AppData {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      if (parsed.version === VERSION) {
        // 字段兼容：旧数据可能缺新领域/新字段，用演示骨架补齐但保留用户原有数据
        const demo = defaultDemo
        const storedProjects = parsed.projects ?? []
        const workProject = demo.projects.find(p => p.domain === 'work')
        const projects = storedProjects.some(p => p.domain === 'work') || !workProject
          ? storedProjects
          : [...storedProjects, workProject]
        const merged: AppData = {
          version: VERSION,
          tasks: parsed.tasks ?? [],
          inspirations: parsed.inspirations ?? [],
          projects,
          schedules: (parsed.schedules ?? []).map(s => ({ ...s, date: s.date || todayStr() })),
countdownDays: (parsed.countdownDays ?? []).map(d => ({ ...d, category: d.category || 'anniversary' })),
          meta: parsed.meta ?? {
            todayProgress: demo.todayProgress,
            streakDays: demo.streakDays,
            greeting: demo.greeting,
            mood: demo.mood,
          },
          settings: parsed.settings ?? { avatarText: '玥', displayName: '玥莹' },
          inboxCleared: parsed.inboxCleared ?? 0,
          weekTrend: parsed.weekTrend ?? [],
          heatmap: parsed.heatmap ?? [],
          weekDist: parsed.weekDist ?? demo.stats.weekDist.map(w => ({ ...w })),
          focusSessions: parsed.focusSessions ?? [],
          focusSettings: parsed.focusSettings ?? { pomodoroMin: 25, categories: ['content', 'ai', 'health', 'class', 'work', 'life'], sound: true, notification: true },
          ledger: migrateDemoLedger(parsed.ledger, todayStr()),
          trendingTopics: parsed.trendingTopics ?? pickTrending(8),
          trendingSource: parsed.trendingSource ?? defaultTrendingSource(),
        }
        const normalized = { ...merged, projects: merged.projects.map(recomputeProjectProgress) }
        cache = normalized
        write(normalized)
        return cache
      }
    }
  } catch { /* ignore */ }
  const init = buildInitialData()
  write(init)
  return init
}

function write(data: AppData) {
  cache = data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
  listeners.forEach(l => l())
  // 触发后台云同步（已登录才上传）
  scheduleCloudPush()
}

// 根据各领域实际完成情况动态计算项目进度
function recomputeProjectProgress(p: Project): Project {
  let progress = p.progress
  if (p.domain === 'content' && p.content) {
    // 内容标准：灵感 5% → 选题 18% → 脚本 35% → 拍摄 55% → 剪辑 75% → 待发布 90% → 发布 95%，完成入库 100%
    const scores: Record<string, number> = { idea: 5, topic: 18, script: 35, shoot: 55, edit: 75, publish: 90, published: 95 }
    progress = p.content.length ? Math.round(p.content.reduce((sum, c) => sum + (c.archivedAt ? 100 : scores[c.stage]), 0) / p.content.length) : 0
  } else if (p.domain === 'ai' && p.ai?.learning) {
    const list = p.ai.learning
    progress = list.length ? Math.round(list.reduce((s, l) => s + l.progress, 0) / list.length) : 0
  } else if (p.domain === 'health' && p.health) {
    const steps = p.health.investorSteps || [], milestones = p.health.milestones || []
    const stepRate = steps.length ? steps.filter(s => s.done).length / steps.length : 0
    const milestoneRate = milestones.length ? milestones.filter(m => m.status === 'done').length / milestones.length : stepRate
    progress = Math.round((stepRate * 0.6 + milestoneRate * 0.4) * 100)
  } else if (p.domain === 'class' && p.classes) {
    const sessions = p.classes.sessions || []
    const prepared = sessions.length ? sessions.filter(s => s.prepareStatus === 'ready').length / sessions.length : 0
    const photoTotal = p.classes.photosUntreated + p.classes.photosUnsent
    const archiveRate = photoTotal ? Math.max(0, 1 - photoTotal / Math.max(sessions.length * 2, 1)) : 1
    progress = Math.round((prepared * 0.7 + archiveRate * 0.3) * 100)
  } else if (p.domain === 'work' && p.work?.meetings) {
    const meetings = p.work.meetings
    progress = meetings.length ? Math.round(meetings.reduce((sum, m) => sum + (m.status === 'done' ? 100 : m.status === 'planned' ? 50 : 0), 0) / meetings.length) : 0
  } else if (p.domain === 'life' && p.life?.items) {
    const items = p.life.items
    progress = items.length ? Math.round(items.filter(i => i.status === 'done').length / items.length * 100) : 0
  }
  return progress === p.progress ? p : { ...p, progress }
}

export const store = {
  get(): AppData { return read() },

  // 未删除的任务（UI 层应优先用这个）
  activeTasks(): Task[] { return read().tasks.filter(t => !t.deletedAt) },

  subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l) },

  // ===== 演示数据 =====
  resetDemo() { const init = buildInitialData(); write(init) },

  async clearAll() {
    // 生成完整、安全的空数据，每个字段都有兜底，防止任何 undefined 导致渲染白屏
    // projects 保留七大主线骨架（清空的是任务/日程/账本等内容数据，不是项目结构）
    const cur = read()
    const fresh = buildInitialData()
    // 只保留项目骨架，必须从 fresh 生成空结构，不能复制当前项目里的演示内容
    const emptyProjects = fresh.projects.map(p => {
      const base = {
        id: p.id,
        domain: p.domain,
        name: p.name,
        progress: 0,
        todoCount: 0,
        updatedAt: todayStr(),
      }
      if (p.domain === 'content') return { ...base, content: [] }
      if (p.domain === 'ai') return { ...base, ai: { learning: [], stats: { ideas: 0, learning: 0, practiced: 0, output: 0 } } }
      if (p.domain === 'health') return { ...base, health: { goal: '', stage: '', weekOutput: '', investorSteps: [], milestones: [] } }
      if (p.domain === 'class') return { ...base, classes: { weekCount: 0, sessions: [], photosUntreated: 0, photosUnsent: 0 } }
      if (p.domain === 'work') return { ...base, work: { meetings: [] } }
      return { ...base, life: { items: [] } }
    })
    const empty: AppData = {
      version: VERSION,
      tasks: [],
      inspirations: [],
      projects: emptyProjects,
      schedules: [],
      countdownDays: [],
      meta: cur.meta ?? { todayProgress: 0, streakDays: 0, greeting: '全新开始', mood: '○' },
      settings: cur.settings ?? { avatarText: '玥', displayName: '玥莹' },
      inboxCleared: 0,
      weekTrend: [],
      heatmap: [],
      weekDist: [],
      focusSessions: [],
      focusSettings: cur.focusSettings ?? { pomodoroMin: 25, categories: ['content', 'ai', 'health', 'class', 'work', 'life'], sound: true, notification: true },
      // 账户、资产、流水和净资产快照也必须彻底清空，不能沿用当前账本
      ledger: { accounts: [], txns: [], snapshots: [] },
      trendingTopics: pickTrending(8),
      trendingSource: cur.trendingSource ?? defaultTrendingSource(),
    }
    write(empty)
    if (currentUserId) await clearCloudData(currentUserId)
  },

  exportJSON(): string { return JSON.stringify(read(), null, 2) },

  importJSON(text: string): boolean {
    try {
      const parsed = JSON.parse(text) as AppData
      if (parsed.version !== VERSION) return false
      write(parsed)
      return true
    } catch { return false }
  },

  // ===== 任务 =====
  addTask(t: Partial<Task>): Task {
    const data = read()
    const task: Task = {
      id: 't' + Date.now() + Math.floor(Math.random() * 1000),
      title: t.title || '新任务',
      note: t.note,
      completionNote: t.completionNote,
      meetingLocation: t.meetingLocation,
      meetingContact: t.meetingContact,
      domain: t.domain || 'life',
      projectId: t.projectId || data.projects.find(p => p.domain === (t.domain || 'life'))?.id,
      priority: t.priority || 'medium',
      suggestedPriority: t.suggestedPriority,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      estimatedMinutes: t.estimatedMinutes || 30,
      progress: t.progress || 0,
      nextAction: t.nextAction,
      inToday: t.inToday ?? false,
      inTop3: t.inTop3 ?? false,
      top3Order: t.top3Order,
      status: t.status || 'pending',
      links: t.links,
      createdAt: new Date().toISOString().slice(0, 10),
      completedAt: undefined,
    }
    write({ ...data, tasks: [...data.tasks, task] })
    return task
  },
  updateTask(id: string, patch: Partial<Task>) {
    const data = read()
    // 规范化：完成任务时补全 completedAt；取消完成时清空
    let p = { ...patch }
    const wasDone = data.tasks.find(t => t.id === id)?.status === 'done'
    if (patch.status === 'done' && !patch.completedAt) {
      p.completedAt = new Date().toISOString().slice(0, 10)
    }
    if (patch.status && patch.status !== 'done' && patch.completedAt === undefined) {
      // 取消完成时清空 completedAt（显式传 undefined）
    }
    const completedNow = patch.status === 'done' && !wasDone
    const completedAt = p.completedAt || new Date().toISOString().slice(0, 10)
    const now = new Date()
    const start = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
    const endDate = new Date(now.getTime() + 30 * 60 * 1000)
    const end = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0')
    const task = data.tasks.find(t => t.id === id)
    const schedules = completedNow && task
      ? (() => {
          const linked = data.schedules.find(s => s.taskId === id)
          return linked
            ? data.schedules.map(s => s.id === linked.id ? { ...s, done: true } : s)
            : [...data.schedules, { id: 's' + Date.now(), title: task.title, domain: task.domain, date: completedAt, start, end, projectId: task.projectId, taskId: id, done: true }]
        })()
      : data.schedules
    write({ ...data, schedules, tasks: data.tasks.map(t => t.id === id ? { ...t, ...p, completedAt, inTop3: completedNow ? false : t.inTop3, top3Order: completedNow ? undefined : t.top3Order } : t) })
  },
  // 软删除：标记 deletedAt，不真正移除（可在历史中恢复）
  deleteTask(id: string) {
    const data = read()
    write({ ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString(), inTop3: false, inToday: false, top3Order: undefined } : t) })
  },
  // 恢复软删除的任务
  restoreTask(id: string) {
    const data = read()
    write({ ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, deletedAt: undefined } : t) })
  },
  // 永久删除（不可恢复）
  purgeTask(id: string) {
    const data = read()
    write({ ...data, tasks: data.tasks.filter(t => t.id !== id) })
  },
  // 清空所有软删除任务
  purgeAllDeleted() {
    const data = read()
    write({ ...data, tasks: data.tasks.filter(t => !t.deletedAt) })
  },

  // ===== 历史记录聚合 =====
  // 按天聚合历史（完成任务 + 删除任务 + 日程完成），返回按日期倒序的分组
  getHistoryByDay(): { date: string; events: HistoryEvent[] }[] {
    const data = read()
    const events: HistoryEvent[] = []

    // 完成的任务
    data.tasks
      .filter(t => t.status === 'done' && t.completedAt)
      .forEach(t => events.push({
        kind: 'task-done',
        id: t.id,
        title: t.title,
        domain: t.domain,
        date: t.completedAt!,
        time: '',
        detail: t.nextAction,
        priority: t.priority,
        deleted: !!t.deletedAt,
      }))

    // 软删除的任务（误触/调整）
    data.tasks
      .filter(t => t.deletedAt)
      .forEach(t => events.push({
        kind: 'task-deleted',
        id: t.id,
        title: t.title,
        domain: t.domain,
        date: t.deletedAt!.slice(0, 10),
        time: t.deletedAt!.slice(11, 16),
        detail: '已删除',
        priority: t.priority,
        deleted: true,
        originalStatus: t.status,
      }))

    // 完成的日程
    data.schedules
      .filter(s => s.done)
      .forEach(s => events.push({
        kind: 'schedule-done',
        id: s.id,
        title: s.title,
        domain: s.domain,
        date: s.date,
        time: s.start,
        detail: `${s.start}–${s.end}`,
      }))

    // 账本交易（记录每一笔，用于回看）
    data.ledger.txns
      .forEach(x => events.push({
        kind: x.type === 'income' ? 'ledger-income' : 'ledger-expense',
        id: x.id,
        title: x.category,
        domain: 'life',
        date: x.date,
        time: x.time,
        detail: `${x.type === 'income' ? '+' : '-'}¥${x.amount}${x.note ? ' · ' + x.note : ''}`,
      }))

    // 专注会话
    data.focusSessions
      .filter(f => f.completed)
      .forEach(f => events.push({
        kind: 'focus',
        id: f.id,
        title: f.title,
        domain: f.domain,
        date: f.date,
        time: f.start,
        detail: `专注 ${f.actualMin} 分钟`,
      }))

    // 按日期分组（倒序）
    const groups: Record<string, HistoryEvent[]> = {}
    events.forEach(e => {
      if (!groups[e.date]) groups[e.date] = []
      groups[e.date].push(e)
    })
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        date,
        events: groups[date].sort((a, b) => (b.time || '').localeCompare(a.time || '')),
      }))
  },

  // 按分类聚合历史（用于分类统计视图）
  getHistoryByCategory(domain?: import('./types').Domain): { domain: import('./types').Domain; count: number; items: HistoryEvent[] }[] {
    const days = this.getHistoryByDay()
    const all = days.flatMap(d => d.events).filter(e => e.kind !== 'task-deleted')
    const filter = domain ? all.filter(e => e.domain === domain) : all
    const map: Record<string, HistoryEvent[]> = {}
    filter.forEach(e => {
      if (!map[e.domain]) map[e.domain] = []
      map[e.domain].push(e)
    })
    return Object.keys(map).map(d => ({ domain: d as import('./types').Domain, count: map[d].length, items: map[d] }))
  },

  // ===== Top 3 =====
  toggleTop3(id: string) {
    const data = read()
    const t = data.tasks.find(x => x.id === id)
    if (!t) return
    if (t.inTop3) {
      // 移出 top3
      write({ ...data, tasks: data.tasks.map(x => x.id === id ? { ...x, inTop3: false, top3Order: undefined } : x) })
    } else {
      // 加入 top3，序号 = 当前 top3 数量
      const order = data.tasks.filter(x => x.inTop3).length
      if (order >= 3) return // 已满
      write({ ...data, tasks: data.tasks.map(x => x.id === id ? { ...x, inTop3: true, top3Order: order, inToday: true } : x) })
    }
  },
  reorderTop3(orderedIds: string[]) {
    const data = read()
    write({
      ...data,
      tasks: data.tasks.map(t => {
        const idx = orderedIds.indexOf(t.id)
        return idx >= 0 ? { ...t, inTop3: true, top3Order: idx, inToday: true } : { ...t, inTop3: false, top3Order: undefined }
      }),
    })
  },

  // ===== 收集箱 =====
  addInspiration(content: string, source: Inspiration['source'] = 'manual') {
    const data = read()
    const ins: Inspiration = {
      id: 'i' + Date.now(),
      content,
      source,
      createdAt: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      archived: false,
    }
    write({ ...data, inspirations: [ins, ...data.inspirations] })
  },
  deleteInspiration(id: string) {
    const data = read()
    write({ ...data, inspirations: data.inspirations.filter(i => i.id !== id) })
  },
  archiveInspiration(id: string) {
    const data = read()
    const ins = data.inspirations.find(i => i.id === id)
    if (!ins) return
    const willArchive = !ins.archived
    // 归档时若尚未转化为任务，自动转为任务并关联到对应领域项目
    if (willArchive && !ins.convertedTo) {
      const domain = ins.domain || 'content'
      const projectId = data.projects.find(p => p.domain === domain)?.id
      const task = this.addTask({ title: ins.content, domain, status: 'pending', projectId })
      if (domain === 'content') this.addContentFromTask(task.id)
      const data2 = read()
      write({ ...data2, inspirations: data2.inspirations.map(i => i.id === id ? { ...i, archived: true, convertedTo: { type: 'task' as const, id: task.id } } : i), inboxCleared: data2.inboxCleared + 1 })
      return
    }
    const next = data.inspirations.map(i => i.id === id ? { ...i, archived: !i.archived } : i)
    const cleared = !next.find(i => i.id === id)?.archived ? data.inboxCleared : data.inboxCleared + 1
    write({ ...data, inspirations: next, inboxCleared: cleared })
  },
  // 灵感转任务：从收集箱创建任务并归档灵感，自动关联到对应领域项目
  convertInspiration(id: string, domain: Domain, title?: string) {
    const data = read()
    const ins = data.inspirations.find(i => i.id === id)
    if (!ins) return
    const projectId = data.projects.find(p => p.domain === domain)?.id
    const task = this.addTask({ title: title || ins.content, domain, status: 'pending', projectId })
    if (domain === 'content') this.addContentFromTask(task.id)
    const data2 = read()
    write({ ...data2, inspirations: data2.inspirations.map(i => i.id === id ? { ...i, archived: true, domain, convertedTo: { type: 'task', id: task.id } } : i) })
    return task
  },

  // 根据 domain 跳转到对应项目
  projectIdOfDomain(domain: Domain): string | undefined {
    return read().projects.find(p => p.domain === domain)?.id
  },

  // ===== 倒数日 =====
  addCountdownDay(item: Omit<CountdownDay, 'id' | 'createdAt' | 'showOnHome'>) {
    const data = read()
    const showOnHome = data.countdownDays.length === 0
    write({ ...data, countdownDays: [...data.countdownDays.map(d => showOnHome ? { ...d, showOnHome: false } : d), { ...item, id: 'cd' + Date.now(), createdAt: new Date().toISOString(), showOnHome }] })
  },
  updateCountdownDay(id: string, patch: Partial<CountdownDay>) {
    const data = read()
    const makeHome = patch.showOnHome === true
    write({ ...data, countdownDays: data.countdownDays.map(d => d.id === id ? { ...d, ...patch } : makeHome ? { ...d, showOnHome: false } : d) })
  },
  deleteCountdownDay(id: string) {
    const data = read()
    const removed = data.countdownDays.find(d => d.id === id)
    const rest = data.countdownDays.filter(d => d.id !== id)
    write({ ...data, countdownDays: removed?.showOnHome && rest.length ? [{ ...rest[0], showOnHome: true }, ...rest.slice(1)] : rest })
  },

  // ===== 日程 =====
  addSchedule(s: Partial<Schedule>): Schedule {
    const data = read()
    const sch: Schedule = {
      id: 's' + Date.now(),
      title: s.title || '新日程',
      domain: s.domain || 'life',
      date: s.date || todayStr(),
      start: s.start || '09:00',
      end: s.end || '10:00',
      repeatRule: s.repeatRule || 'none',
      projectId: s.projectId,
      taskId: s.taskId,
      done: false,
    }
    write({ ...data, schedules: [...data.schedules, sch] })
    return sch
  },
  updateSchedule(id: string, patch: Partial<Schedule>) {
    const data = read()
    write({ ...data, schedules: data.schedules.map(s => s.id === id ? { ...s, ...patch } : s) })
  },
  deleteSchedule(id: string) {
    const data = read()
    write({ ...data, schedules: data.schedules.filter(s => s.id !== id) })
  },

  // ===== 项目 =====
  updateProject(id: string, patch: Partial<Project>) {
    const data = read()
    write({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, ...patch } : p) })
  },

  // 内容创作：阶段流转
  moveContentStage(projectId: string, contentId: string, toIndex: number) {
    const stages = ['idea', 'topic', 'script', 'shoot', 'edit', 'publish', 'published'] as const
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.content) return p
        const content = p.content.map(c => c.id === contentId ? { ...c, stage: stages[toIndex] } : c)
        return recomputeProjectProgress({ ...p, content })
      }),
    })
  },
  addContentFromTask(taskId: string) {
    const data = read()
    const task = data.tasks.find(t => t.id === taskId)
    if (!task || task.domain !== 'content') return
    const projectId = task.projectId || data.projects.find(p => p.domain === 'content')?.id
    if (!projectId) return
    const contentId = 'c' + Date.now()
    const content = { id: contentId, title: task.title, platform: '小红书' as const, type: '图文', stage: 'idea' as const, nextAction: task.nextAction, taskId, stageRecords: task.note ? [{ id: 'cr' + Date.now(), kind: 'insight' as const, content: task.note, createdAt: new Date().toISOString() }] : [] }
    write({ ...data, tasks: data.tasks.map(t => t.id === taskId ? { ...t, projectId, contentId } : t), projects: data.projects.map(p => p.id === projectId ? recomputeProjectProgress({ ...p, content: [...(p.content || []), content] }) : p) })
    return contentId
  },
  archiveContent(projectId: string, contentId: string) {
    const data = read()
    const now = new Date().toISOString()
    write({ ...data, projects: data.projects.map(p => {
      if (p.id !== projectId || !p.content) return p
      const content = p.content.map(c => c.id === contentId ? { ...c, archivedAt: now } : c)
      return recomputeProjectProgress({ ...p, content })
    }), tasks: data.tasks.map(t => t.contentId === contentId ? { ...t, status: 'done', progress: 100, inToday: true, completedAt: now.slice(0, 10) } : t) })
  },
  addContentStageRecord(projectId: string, contentId: string, kind: import('./types').ContentRecordKind, content: string) {
    const data = read()
    write({ ...data, projects: data.projects.map(p => {
      if (p.id !== projectId || !p.content) return p
      return { ...p, content: p.content.map(c => c.id === contentId ? { ...c, stageRecords: [...(c.stageRecords || []), { id: 'cr' + Date.now(), kind, content, createdAt: new Date().toISOString() }] } : c) }
    }) })
  },
  addCreativeKnowledge(projectId: string, knowledge: Omit<import('./types').CreativeKnowledge, 'id' | 'createdAt'>) {
    const data = read()
    write({ ...data, projects: data.projects.map(p => p.id === projectId ? { ...p, creativeKnowledge: [{ ...knowledge, id: 'ck' + Date.now(), createdAt: new Date().toISOString() }, ...(p.creativeKnowledge || [])] } : p) })
  },
  deleteCreativeKnowledge(projectId: string, knowledgeId: string) {
    const data = read()
    write({ ...data, projects: data.projects.map(p => p.id === projectId ? { ...p, creativeKnowledge: (p.creativeKnowledge || []).filter(k => k.id !== knowledgeId) } : p) })
  },
  addContent(projectId: string, title: string, platform: any = '小红书', stage: any = 'idea', options: { note?: string; dueDate?: string; meetingContact?: string } = {}) {
    const data = read()
    const task = this.addTask({ title, note: options.note, domain: 'content', projectId, dueDate: options.dueDate, meetingContact: options.meetingContact, status: 'pending', nextAction: options.note })
    const data2 = read()
    const contentId = 'c' + Date.now()
    write({ ...data2, tasks: data2.tasks.map(t => t.id === task.id ? { ...t, contentId } : t), projects: data2.projects.map(p => {
      if (p.id !== projectId) return p
      const content = [...(p.content || []), { id: contentId, title, platform, type: '图文', stage, nextAction: options.note, taskId: task.id, stageRecords: options.note ? [{ id: 'cr' + Date.now(), kind: 'insight' as const, content: options.note, createdAt: new Date().toISOString() }] : [] }]
      return recomputeProjectProgress({ ...p, content })
    }) })
    if (options.dueDate) this.addSchedule({ title, domain: 'content', date: options.dueDate, start: '09:00', end: '09:30', projectId, taskId: task.id, contact: options.meetingContact, note: options.note, done: false })
    return contentId
  },
  deleteContent(projectId: string, contentId: string) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.content) return p
        const content = p.content.filter(c => c.id !== contentId)
        return recomputeProjectProgress({ ...p, content })
      }),
    })
  },

  // 健康投资人步骤切换
  toggleInvestorStep(projectId: string, stepId: string) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.health) return p
        const investorSteps = p.health.investorSteps.map(s => s.id === stepId ? { ...s, done: !s.done } : s)
        return recomputeProjectProgress({ ...p, health: { ...p.health, investorSteps } })
      }),
    })
  },

  // 技能练习状态切换
  toggleClassPrep(projectId: string, sessionId: string) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.classes) return p
        const sessions = p.classes.sessions.map(s => s.id === sessionId ? { ...s, prepareStatus: (s.prepareStatus === 'ready' ? 'todo' : 'ready') as 'todo' | 'ready' } : s)
        return recomputeProjectProgress({ ...p, classes: { ...p.classes, sessions } })
      }),
    })
  },
  // 技能练习作品已归档
  sendClassPhotos(projectId: string, sessionId: string) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.classes) return p
        const sessions = p.classes.sessions.map(s => s.id === sessionId ? { ...s, photosUntreated: 0, photosUnsent: 0 } : s)
        const photosUnsent = sessions.reduce((a, s) => a + s.photosUnsent, 0)
        const photosUntreated = sessions.reduce((a, s) => a + s.photosUntreated, 0)
        return { ...p, classes: { ...p.classes, sessions, photosUnsent, photosUntreated } }
      }),
    })
  },

  // 生活杂事切换状态
  toggleLifeItem(projectId: string, itemId: string) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.life) return p
        const items = p.life.items.map(it => it.id === itemId ? { ...it, status: it.status === 'done' ? 'pending' as const : 'done' as const } : it)
        return recomputeProjectProgress({ ...p, life: { items } })
      }),
    })
  },

  // AI 学习进度推进
  advanceLearning(projectId: string, learningId: string, delta: number) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.ai) return p
        const learning = p.ai.learning.map(l => l.id === learningId ? { ...l, progress: Math.max(0, Math.min(100, (l.progress || 0) + delta)) } : l)
        return recomputeProjectProgress({ ...p, ai: { ...p.ai, learning } })
      }),
    })
  },

  // 刷新热点选题：优先调用本地后端真实抓取，失败则用本地模拟池
  async refreshTrending(): Promise<{ real: boolean; count: number }> {
    const data = read()
    const src = data.trendingSource
    // 未启用真实抓取或后端未配置：走本地模拟池
    if (!src.enabled || !src.backendUrl) {
      const picked = pickTrendingFiltered(src.keywords, 8)
      write({ ...data, trendingTopics: picked })
      return { real: false, count: picked.length }
    }
    try {
      const params = new URLSearchParams({
        keywords: src.keywords.join(','),
        platforms: src.platforms.join(','),
        fallback: '1',
      })
      const res = await fetch(`${src.backendUrl}/api/trending?${params.toString()}`, { method: 'GET' })
      if (!res.ok) throw new Error('backend ' + res.status)
      const json = await res.json()
      const items: TrendingTopic[] = (json.items || []).map((x: any) => ({
        id: 't' + Date.now() + Math.floor(Math.random() * 10000),
        title: x.title,
        angle: x.angle || '结构化拆解',
        platform: x.platform || '',
        category: (x.category as TrendingCategory) || 'flow',
        heat: Number(x.heat) || 50,
        keywords: x.keywords || [],
        url: x.url || '',
        source: x.source === 'real' ? 'real' : 'sim',
        fetchedAt: new Date().toISOString(),
      }))
      const picked = items.length ? items : pickTrendingFiltered(src.keywords, 8)
      write({ ...data, trendingTopics: picked })
      return { real: items.length > 0 && items[0].source === 'real', count: picked.length }
    } catch (e) {
      const picked = pickTrendingFiltered(src.keywords, 8)
      write({ ...data, trendingTopics: picked })
      return { real: false, count: picked.length }
    }
  },

  // 更新热点抓取源配置
  updateTrendingSource(patch: Partial<TrendingSource>) {
    const data = read()
    write({ ...data, trendingSource: { ...data.trendingSource, ...patch } })
  },

  // 新增对标博主
  addBlogger(b: Omit<BloggerRef, 'id'>) {
    const data = read()
    const blogger: BloggerRef = { ...b, id: 'b' + Date.now() + Math.floor(Math.random() * 1000) }
    write({ ...data, trendingSource: { ...data.trendingSource, bloggers: [...data.trendingSource.bloggers, blogger] } })
    return blogger
  },

  removeBlogger(id: string) {
    const data = read()
    write({ ...data, trendingSource: { ...data.trendingSource, bloggers: data.trendingSource.bloggers.filter(b => b.id !== id) } })
  },

  // 把热点选题加入 AI 学习列表
  addLearningFromTrending(projectId: string, topic: { title: string; platform: string }) {
    const data = read()
    write({
      ...data,
      projects: data.projects.map(p => {
        if (p.id !== projectId || !p.ai) return p
        const learning = [...p.ai.learning, { id: 'l' + Date.now() + Math.floor(Math.random() * 1000), topic: topic.title, source: topic.platform, progress: 0, canToTopic: true }]
        const stats = { ...p.ai.stats, learning: learning.length }
        return recomputeProjectProgress({ ...p, ai: { ...p.ai, learning, stats } })
      }),
    })
  },

  // ===== 设置 =====
  updateSettings(patch: Partial<AppData['settings']>) {
    const data = read()
    write({ ...data, settings: { ...data.settings, ...patch } })
  },

  // ===== 专注会话 =====
  addFocusSession(s: Partial<FocusSession>): FocusSession {
    const data = read()
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const sess: FocusSession = {
      id: 'f' + Date.now(),
      title: s.title || '专注',
      domain: s.domain || 'content',
      taskId: s.taskId,
      date: s.date || todayStr(),
      start: s.start || hh + ':' + mm,
      end: s.end || hh + ':' + mm,
      plannedMin: s.plannedMin ?? data.focusSettings.pomodoroMin,
      actualMin: s.actualMin ?? 0,
      completed: s.completed ?? false,
      cancelled: s.cancelled ?? false,
    }
    write({ ...data, focusSessions: [...data.focusSessions, sess] })
    return sess
  },
  updateFocusSession(id: string, patch: Partial<FocusSession>) {
    const data = read()
    write({ ...data, focusSessions: data.focusSessions.map(f => f.id === id ? { ...f, ...patch } : f) })
  },
  deleteFocusSession(id: string) {
    const data = read()
    write({ ...data, focusSessions: data.focusSessions.filter(f => f.id !== id) })
  },
  updateFocusSettings(patch: Partial<FocusSettings>) {
    const data = read()
    write({ ...data, focusSettings: { ...data.focusSettings, ...patch } })
  },

  // ===== 账本 =====
  resetLedger(): Ledger {
    const data = read()
    const cleared: Ledger = { accounts: data.ledger.accounts.map(a => ({ ...a, balance: 0, updatedAt: todayStr() })), txns: [], snapshots: [{ id: 's' + Date.now(), date: todayStr(), netWorth: 0 }] }
    write({ ...data, ledger: cleared })
    return data.ledger
  },
  restoreLedger(ledger: Ledger) {
    const data = read()
    write({ ...data, ledger })
  },
  addLedgerAccount(a: Partial<LedgerAccount>): LedgerAccount {
    const data = read()
    const acc: LedgerAccount = {
      id: 'a' + Date.now(),
      name: a.name || '新账户',
      kind: a.kind || 'cash',
      balance: a.balance ?? 0,
      note: a.note,
      updatedAt: a.updatedAt || todayStr(),
    }
    write({ ...data, ledger: { ...data.ledger, accounts: [...data.ledger.accounts, acc] } })
    return acc
  },
  updateLedgerAccount(id: string, patch: Partial<LedgerAccount>) {
    const data = read()
    const accounts = data.ledger.accounts.map(a => a.id === id ? { ...a, ...patch, updatedAt: todayStr() } : a)
    write({ ...data, ledger: { ...data.ledger, accounts } })
  },
  deleteLedgerAccount(id: string) {
    const data = read()
    write({ ...data, ledger: { ...data.ledger, accounts: data.ledger.accounts.filter(a => a.id !== id), txns: data.ledger.txns.filter(t => t.accountId !== id) } })
  },
  addLedgerTxn(t: Partial<LedgerTxn>): LedgerTxn {
    const data = read()
    const today = todayStr()
    const now = new Date()
    const txn: LedgerTxn = {
      id: 'x' + Date.now(),
      accountId: t.accountId || '',
      type: t.type || 'expense',
      amount: Math.abs(t.amount ?? 0),
      category: t.category || '其他',
      note: t.note,
      date: t.date || today,
      time: t.time || String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
    }
    // 同步账户余额
    const accounts = data.ledger.accounts.map(a => {
      if (a.id !== txn.accountId) return a
      const delta = txn.type === 'expense' ? -txn.amount : txn.type === 'income' ? txn.amount : txn.amount
      return { ...a, balance: a.balance + delta, updatedAt: today }
    })
    write({ ...data, ledger: { ...data.ledger, accounts, txns: [txn, ...data.ledger.txns] } })
    return txn
  },
  deleteLedgerTxn(id: string) {
    const data = read()
    // 回滚余额
    const txn = data.ledger.txns.find(t => t.id === id)
    let accounts = data.ledger.accounts
    if (txn) {
      accounts = accounts.map(a => {
        if (a.id !== txn.accountId) return a
        const delta = txn.type === 'expense' ? txn.amount : txn.type === 'income' ? -txn.amount : -txn.amount
        return { ...a, balance: a.balance + delta }
      })
    }
    write({ ...data, ledger: { ...data.ledger, accounts, txns: data.ledger.txns.filter(t => t.id !== id) } })
  },
  saveLedgerSnapshot() {
    const data = read()
    const today = todayStr()
    const netWorth = data.ledger.accounts.reduce((a, x) => a + x.balance, 0)
    const existing = data.ledger.snapshots.find(s => s.date === today)
    const snapshots = existing
      ? data.ledger.snapshots.map(s => s.date === today ? { ...s, netWorth } : s)
      : [...data.ledger.snapshots, { id: 's' + Date.now(), date: today, netWorth }]
    write({ ...data, ledger: { ...data.ledger, snapshots } })
  },
}
