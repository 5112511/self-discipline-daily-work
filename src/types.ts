// ===== 玥莹的 Personal OS · 数据模型 =====

export type Domain =
  | 'content'  // 内容创作
  | 'ai'       // AI 学习
  | 'health'   // 健康项目
  | 'class'    // 技能提升
  | 'work'     // 工作
  | 'life';    // 个人生活

export const DOMAIN_LABEL: Record<Domain, string> = {
  content: '内容创作',
  ai: 'AI 学习',
  health: '健康项目',
  class: '技能提升',
  work: '工作',
  life: '个人生活',
}

export const DOMAIN_ICON: Record<Domain, string> = {
  content: '✍︎',
  ai: '✺',
  health: '❤︎',
  class: '◎',
  work: '▣',
  life: '◐',
}

export interface CountdownDay {
  id: string
  title: string
  date: string // YYYY-MM-DD
  showOnHome: boolean
  note?: string
  photo?: string
  createdAt: string
}

export type TaskStatus = 'inbox' | 'pending' | 'doing' | 'waiting' | 'done' | 'cancelled'
export type Priority = 'high' | 'medium' | 'low'
export type InspirationSource = 'manual' | 'voice' | 'gmail' | 'image' | 'web' | 'other'

export interface Task {
  id: string
  title: string
  note?: string
  completionNote?: string
  meetingLocation?: string
  meetingContact?: string
  domain: Domain
  projectId?: string
  priority: Priority
  suggestedPriority?: Priority
  dueDate?: string
  dueTime?: string
  estimatedMinutes?: number
  progress: number
  nextAction?: string
  inToday: boolean
  inTop3: boolean
  top3Order?: number
  status: TaskStatus
  links?: string[]
  createdAt: string
  completedAt?: string
  overdue?: boolean
  deletedAt?: string  // 软删除时间戳（ISO），为空表示未删除
  contentId?: string  // 内容流水线条目关联
}

export interface Inspiration {
  id: string
  content: string
  source: InspirationSource
  domain?: Domain
  createdAt: string
  convertedTo?: { type: 'task' | 'topic' | 'note' | 'project'; id: string }
  archived: boolean
  note?: string
}

// 自媒体创作热点选题
export type TrendingCategory = 'flow' | 'life' | 'knowledge' | 'emotion' | 'trend' | 'skill'

export const TRENDING_CATEGORY_LABEL: Record<TrendingCategory, string> = {
  flow: '流量爆款',
  life: '生活方式',
  knowledge: '知识科普',
  emotion: '情绪共鸣',
  trend: '热点追踪',
  skill: '技能干货',
}

export interface TrendingTopic {
  id: string
  title: string            // 选题标题
  angle: string            // 切入角度/拍摄思路
  platform: string         // 推荐平台
  category: TrendingCategory
  heat: number             // 热度 0-100
  keywords: string[]       // 标签关键词
  url?: string             // 原文链接（真实抓取时有）
  source?: 'real' | 'sim'  // 来源标记
  fetchedAt?: string       // 抓取时间 ISO
}

// 热点抓取源配置
export type TrendingPlatform = 'weibo' | 'xhs' | 'douyin' | 'bilibili'

export const TRENDING_PLATFORM_LABEL: Record<TrendingPlatform, string> = {
  weibo: '微博热搜',
  xhs: '小红书',
  douyin: '抖音',
  bilibili: 'B站',
}

export interface BloggerRef {
  id: string
  name: string             // 博主备注名
  url: string              // 主页链接
  platform: TrendingPlatform
}

export interface TrendingSource {
  keywords: string[]       // 关键词列表
  platforms: TrendingPlatform[]  // 抓取平台
  bloggers: BloggerRef[]  // 对标博主
  backendUrl: string      // 本地后端地址
  enabled: boolean        // 是否启用真实抓取（false 则用本地模拟池）
}

export type ContentStage = 'idea' | 'topic' | 'script' | 'shoot' | 'edit' | 'publish' | 'published'
export const CONTENT_STAGE_LABEL: Record<ContentStage, string> = {
  idea: '灵感', topic: '选题', script: '脚本', shoot: '待拍摄', edit: '剪辑中', publish: '待发布', published: '已发布',
}

export type ContentRecordKind = 'script' | 'blocker' | 'reference' | 'insight'
export const CONTENT_RECORD_KIND_LABEL: Record<ContentRecordKind, string> = {
  script: '口播 / 文案', blocker: '创作卡点', reference: '同行观察', insight: '阶段复盘',
}
export interface ContentStageRecord {
  id: string
  kind: ContentRecordKind
  content: string
  createdAt: string
}
export interface CreativeKnowledge {
  id: string
  title: string
  content: string
  sourceContentId: string
  createdAt: string
}
export interface ContentItem {
  id: string
  title: string
  platform: '小红书' | '抖音' | '视频号' | '公众号' | '其他'
  type: string
  stage: ContentStage
  planDate?: string
  cover?: string
  nextAction?: string
  taskId?: string
  archivedAt?: string
  stageRecords?: ContentStageRecord[]
}

export interface ClassSession {
  id: string
  name: string
  weekday: string
  time: string
  place: string
  prepareStatus: 'ready' | 'todo'
  photosUntreated: number
  photosUnsent: number
  nextClass?: string
}

export interface Milestone {
  id: string
  name: string
  status: 'done' | 'doing' | 'pending'
  date?: string
}

export interface Project {
  id: string
  domain: Domain
  name: string
  progress: number
  nextAction?: string
  dueDate?: string
  countdownDays?: number
  todoCount: number
  updatedAt: string
  // 领域子内容
  content?: ContentItem[]
  creativeKnowledge?: CreativeKnowledge[]
  health?: {
    goal: string
    stage: string
    weekOutput: string
    investorSteps: { id: string; name: string; done: boolean }[]
    milestones: Milestone[]
  }
  classes?: {
    weekCount: number
    sessions: ClassSession[]
    photosUntreated: number
    photosUnsent: number
    nextPrep?: string
  }
  ai?: {
    learning: { id: string; topic: string; source: string; progress: number; nextPractice?: string; canToTopic: boolean }[]
    stats: { ideas: number; learning: number; practiced: number; output: number }
  }
  work?: {
    meetings: WorkMeeting[]
  }
  life?: { items: { id: string; title: string; status: TaskStatus }[] }
}

export interface WorkMeeting {
  id: string
  title: string
  date: string
  start: string
  end: string
  location?: string
  contact?: string
  note?: string
  status: 'planned' | 'done' | 'cancelled'
}

export interface Schedule {
  id: string
  title: string
  domain: Domain
  date: string // YYYY-MM-DD
  start: string // HH:mm
  end: string
  repeatRule?: 'none' | 'daily' | 'weekly'
  projectId?: string
  taskId?: string
  contact?: string
  note?: string
  done: boolean
}

// ===== 专注会话（番茄钟记录）=====
export interface FocusSession {
  id: string
  title: string
  domain: Domain
  taskId?: string
  date: string        // YYYY-MM-DD（会话所属日，用于按日聚合）
  start: string       // HH:mm
  end: string         // HH:mm
  plannedMin: number  // 计划时长（番茄钟设定）
  actualMin: number   // 实际专注时长
  completed: boolean  // 是否完成（非手动取消）
  cancelled?: boolean // 是否取消
}

export interface FocusSettings {
  pomodoroMin: number      // 番茄钟时长（分钟）
  categories: Domain[]     // 启用的分类
  sound: boolean           // 结束声音
  notification: boolean    // 系统通知
}

// ===== 账本（参考 WorthBase：账户余额 + 资产估值 + 净资产趋势）=====

export type AccountKind = 'cash' | 'bank' | 'alipay' | 'wechat' | 'card' | 'asset'

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  cash: '现金',
  bank: '银行卡',
  alipay: '支付宝',
  wechat: '微信',
  card: '信用卡',
  asset: '实物资产',
}

export interface LedgerAccount {
  id: string
  name: string
  kind: AccountKind
  balance: number        // 当前余额（资产为估值；信用卡为负数表示欠款）
  note?: string
  updatedAt: string      // YYYY-MM-DD
}

export type TxnType = 'income' | 'expense' | 'adjust'

export interface LedgerTxn {
  id: string
  accountId: string
  type: TxnType
  amount: number
  category: string        // 自由分类：餐饮/交通/工资/估值变动...
  note?: string
  date: string            // YYYY-MM-DD
  time: string            // HH:mm
}

export interface LedgerSnapshot {
  id: string
  date: string            // YYYY-MM-DD
  netWorth: number        // 当日净资产
}

export interface Ledger {
  accounts: LedgerAccount[]
  txns: LedgerTxn[]
  snapshots: LedgerSnapshot[]
}

export interface DemoData {
  todayDate: string
  weekday: string
  greeting: string
  mood: string
  todayProgress: number
  streakDays: number
  top3: Task[]
  todayTasks: Task[]
  overdueTasks: Task[]
  reminders: Task[]
  inspirations: Inspiration[]
  projects: Project[]
  todayTimeline: Schedule[]
  weekTimeline: { day: string; blocks: { domain: Domain; minutes: number; label: string }[] }[]
  stats: {
    weekDone: number
    top3Rate: number
    weekFocusMin: number
    contentProgress: number
    aiMinutes: number
    classCount: number
    sportCount: number
    healthProgress: number
    inboxCleared: number
    weekTrend: number[]
    heatmap: number[]
    weekDist: { domain: Domain; minutes: number }[]
  }
  gmailDemo: {
    connected: false
    items: { id: string; from: string; subject: string; tag: '需要行动' | '等待回复' | '仅供阅读'; time: string }[]
  }
}
