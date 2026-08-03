// 生活领域（六条主线）
export enum LifeDomain {
  CONTENT = 'content',      // 内容创作
  AI_LEARNING = 'ai',       // AI 学习
  TRAVEL = 'travel',        // 泰国旅行
  HEALTH = 'health',        // 健康项目
  TEACHING = 'teaching',    // 团课教学
  PERSONAL = 'personal'     // 个人生活
}

export const DomainLabels: Record<LifeDomain, string> = {
  [LifeDomain.CONTENT]: '内容创作',
  [LifeDomain.AI_LEARNING]: 'AI 学习',
  [LifeDomain.TRAVEL]: '泰国旅行',
  [LifeDomain.HEALTH]: '健康项目',
  [LifeDomain.TEACHING]: '团课教学',
  [LifeDomain.PERSONAL]: '个人生活'
};

export const DomainColors: Record<LifeDomain, string> = {
  [LifeDomain.CONTENT]: '#C4786A',
  [LifeDomain.AI_LEARNING]: '#6B8BA4',
  [LifeDomain.TRAVEL]: '#B8A688',
  [LifeDomain.HEALTH]: '#7A9B76',
  [LifeDomain.TEACHING]: '#9B8AA3',
  [LifeDomain.PERSONAL]: '#8E8E93'
};

// 任务状态
export type TaskStatus = 'inbox' | 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

export const TaskStatusLabels: Record<TaskStatus, string> = {
  inbox: '收集箱',
  pending: '待处理',
  in_progress: '进行中',
  waiting: '等待中',
  completed: '已完成',
  cancelled: '已取消'
};

// 任务
export interface Task {
  id: string;
  title: string;
  description?: string;
  domain: LifeDomain;
  projectId?: string;
  status: TaskStatus;
  priority: number; // 1-5
  isImportant: boolean;
  isUrgent: boolean;
  dueDate?: string;
  estimatedMinutes?: number;
  progress: number; // 0-100
  nextAction?: string;
  isInToday: boolean;
  isInTop3: boolean;
  top3Order?: number;
  createdAt: string;
  completedAt?: string;
  links?: string[];
  attachments?: Attachment[];
}

// 项目
export interface Project {
  id: string;
  name: string;
  domain: LifeDomain;
  description?: string;
  coverImage?: string;
  deadline?: string;
  progress: number;
  nextAction?: string;
  taskCount: number;
  completedCount: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// 日程/时间块
export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  domain: LifeDomain;
  taskId?: string;
  isRecurring: boolean;
  completed: boolean;
}

// 灵感/收集箱项
export type InspirationSource = 'manual' | 'voice' | 'gmail' | 'image' | 'web' | 'other';

export interface Inspiration {
  id: string;
  content: string;
  source: InspirationSource;
  domain?: LifeDomain;
  status: 'unprocessed' | 'converted' | 'archived';
  convertedTo?: { type: 'task' | 'project' | 'note' | 'content'; id: string };
  createdAt: string;
}

// 附件
export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
}

// 内容创作
export type ContentPlatform = 'xiaohongshu' | 'douyin' | 'video' | 'wechat' | 'other';
export type ContentStage = 'idea' | 'topic' | 'script' | 'to_shoot' | 'editing' | 'to_publish' | 'published';

export interface ContentItem {
  id: string;
  title: string;
  platform: ContentPlatform;
  type: string;
  stage: ContentStage;
  plannedDate?: string;
  coverImage?: string;
  domain: LifeDomain.CONTENT;
}

// 旅行准备
export interface TravelPrep {
  id: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed';
  deadline?: string;
  budget?: number;
  bookingInfo?: string;
  attachments?: Attachment[];
}

// AI 简报
export interface DailyBriefing {
  date: string;
  focus: string[];
  warnings: string[];
  suggestions: string[];
  travelDaysLeft?: number;
  top3Ids: string[];
}

// 用户配置
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  greetingText?: string;
  streakDays: number;
  createdAt: string;
}

// 应用数据
export interface AppData {
  version: number;
  profile: UserProfile;
  tasks: Task[];
  projects: Project[];
  schedule: ScheduleItem[];
  inspirations: Inspiration[];
  contents: ContentItem[];
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  showGmail: boolean;
  gmailConnected: boolean;
  dailyReminder: boolean;
  reminderTime: string;
}

// 统计数据
export interface UserStats {
  weekCompletedTasks: number;
  top3CompletionRate: number;
  weekFocusTime: number; // minutes
  contentProgress: number;
  aiLearningHours: number;
  teachingClasses: number;
  workouts: number;
  travelProgress: number;
  healthProjectProgress: number;
  inboxClearCount: number;
}

// Tab 类型
export type TabType = 'today' | 'projects' | 'calendar' | 'inbox' | 'profile';
