import {
  LifeDomain,
  Task,
  Project,
  ScheduleItem,
  Inspiration,
  ContentItem,
  UserProfile,
  DailyBriefing,
  UserStats
} from '@/types';

// 领域颜色
export const DomainColors: Record<LifeDomain, string> = {
  [LifeDomain.CONTENT]: '#C4786A',
  [LifeDomain.AI_LEARNING]: '#6B8BA4',
  [LifeDomain.TRAVEL]: '#B8A688',
  [LifeDomain.HEALTH]: '#7A9B76',
  [LifeDomain.TEACHING]: '#9B8AA3',
  [LifeDomain.PERSONAL]: '#8E8E93'
};

// 当前日期
const today = new Date().toISOString().split('T')[0];
const now = new Date();

// 用户资料
export const mockProfile: UserProfile = {
  id: 'user_1',
  name: '玥莹',
  avatar: undefined,
  greetingText: '今天不需要完成所有事，只需要完成最重要的事。',
  streakDays: 12,
  createdAt: '2024-01-01'
};

// 任务数据
export const mockTasks: Task[] = [
  // ===== Top 3 任务 =====
  {
    id: 'task_001',
    title: '准备健康项目投资人沟通提纲',
    description: '整理项目介绍、核心数据、商业模式，列出希望获得的帮助',
    domain: LifeDomain.HEALTH,
    status: 'in_progress',
    priority: 5,
    isImportant: true,
    isUrgent: true,
    dueDate: today,
    estimatedMinutes: 45,
    progress: 30,
    nextAction: '完成商业模式部分撰写',
    isInToday: true,
    isInTop3: true,
    top3Order: 1,
    createdAt: '2024-07-28'
  },
  {
    id: 'task_002',
    title: '查询并确认泰国往返机票',
    description: '对比航班价格和时间，预订往返曼谷的机票',
    domain: LifeDomain.TRAVEL,
    status: 'pending',
    priority: 5,
    isImportant: true,
    isUrgent: true,
    dueDate: today,
    estimatedMinutes: 30,
    progress: 0,
    nextAction: '打开携程或去哪儿比价',
    isInToday: true,
    isInTop3: true,
    top3Order: 2,
    createdAt: '2024-07-29'
  },
  {
    id: 'task_003',
    title: '完成 Personal OS 教程视频脚本',
    description: '撰写产品介绍脚本，突出核心功能和使用场景',
    domain: LifeDomain.CONTENT,
    status: 'in_progress',
    priority: 4,
    isImportant: true,
    isUrgent: false,
    dueDate: today,
    estimatedMinutes: 60,
    progress: 50,
    nextAction: '补充产品演示部分文案',
    isInToday: true,
    isInTop3: true,
    top3Order: 3,
    createdAt: '2024-07-27'
  },

  // ===== 今日其他任务 =====
  {
    id: 'task_004',
    title: '鞋子送洗',
    description: '把运动鞋送到干洗店',
    domain: LifeDomain.PERSONAL,
    status: 'pending',
    priority: 2,
    isImportant: false,
    isUrgent: false,
    dueDate: today,
    estimatedMinutes: 15,
    progress: 0,
    nextAction: '下班路上顺路送去',
    isInToday: true,
    isInTop3: false,
    createdAt: '2024-07-29'
  },
  {
    id: 'task_005',
    title: '整理上周团课照片',
    description: '筛选和编辑上周团课拍摄的照片',
    domain: LifeDomain.TEACHING,
    status: 'pending',
    priority: 3,
    isImportant: true,
    isUrgent: false,
    dueDate: today,
    estimatedMinutes: 25,
    progress: 0,
    nextAction: '打开相册筛选照片',
    isInToday: true,
    isInTop3: false,
    createdAt: '2024-07-28'
  },
  {
    id: 'task_006',
    title: '将课后照片发送给学员',
    description: '通过微信群发送上周课后照片给学员',
    domain: LifeDomain.TEACHING,
    status: 'waiting',
    priority: 3,
    isImportant: true,
    isUrgent: false,
    dueDate: '2024-07-31',
    estimatedMinutes: 10,
    progress: 0,
    nextAction: '等待照片整理完成',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-28'
  },

  // ===== 内容创作任务 =====
  {
    id: 'task_007',
    title: '学习新的 AI 工作流',
    description: '学习并实践一个 Claude 工作流自动化案例',
    domain: LifeDomain.AI_LEARNING,
    status: 'pending',
    priority: 3,
    isImportant: true,
    isUrgent: false,
    dueDate: '2024-07-31',
    estimatedMinutes: 90,
    progress: 0,
    nextAction: '浏览 Claude 官方文档',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-26'
  },
  {
    id: 'task_008',
    title: '整理三条小红书选题',
    description: '从灵感库中挑选并整理三条可行的选题',
    domain: LifeDomain.CONTENT,
    status: 'in_progress',
    priority: 3,
    isImportant: true,
    isUrgent: false,
    dueDate: '2024-08-01',
    estimatedMinutes: 40,
    progress: 60,
    nextAction: '为选定选题写简要大纲',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-25'
  },
  {
    id: 'task_009',
    title: '安排本周运动计划',
    description: '确定本周运动时间和项目，预约课程',
    domain: LifeDomain.PERSONAL,
    status: 'completed',
    priority: 2,
    isImportant: false,
    isUrgent: false,
    dueDate: today,
    estimatedMinutes: 15,
    progress: 100,
    nextAction: '已完成',
    isInToday: true,
    isInTop3: false,
    createdAt: '2024-07-29',
    completedAt: today
  },

  // ===== 旅行相关任务 =====
  {
    id: 'task_010',
    title: '检查泰国酒店信息',
    description: '确认已选酒店的设施、位置和取消政策',
    domain: LifeDomain.TRAVEL,
    status: 'pending',
    priority: 3,
    isImportant: true,
    isUrgent: false,
    dueDate: '2024-08-02',
    estimatedMinutes: 20,
    progress: 0,
    nextAction: '打开 Booking 查看详情',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-27'
  },
  {
    id: 'task_011',
    title: '办理泰国签证',
    description: '准备签证材料并提交申请',
    domain: LifeDomain.TRAVEL,
    status: 'pending',
    priority: 4,
    isImportant: true,
    isUrgent: true,
    dueDate: '2024-08-05',
    estimatedMinutes: 120,
    progress: 10,
    nextAction: '准备护照复印件',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-25'
  },

  // ===== 健康项目 =====
  {
    id: 'task_012',
    title: '准备健康项目核心数据',
    description: '整理用户反馈数据和增长指标',
    domain: LifeDomain.HEALTH,
    status: 'in_progress',
    priority: 4,
    isImportant: true,
    isUrgent: true,
    dueDate: '2024-07-30',
    estimatedMinutes: 60,
    progress: 45,
    nextAction: '导出最近三个月的用户数据',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-26'
  },

  // ===== 待处理提醒 =====
  {
    id: 'task_013',
    title: '购买维生素补充剂',
    description: '在网上或药店购买复合维生素',
    domain: LifeDomain.PERSONAL,
    status: 'pending',
    priority: 2,
    isImportant: false,
    isUrgent: false,
    dueDate: '2024-08-03',
    estimatedMinutes: 10,
    progress: 0,
    nextAction: '打开京东或天猫搜索',
    isInToday: false,
    isInTop3: false,
    createdAt: '2024-07-24'
  }
];

// 项目数据
export const mockProjects: Project[] = [
  {
    id: 'proj_001',
    name: '内容创作',
    domain: LifeDomain.CONTENT,
    description: '自媒体内容规划与产出',
    deadline: '2024-12-31',
    progress: 35,
    nextAction: '完成 Personal OS 教程脚本',
    taskCount: 8,
    completedCount: 3,
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: today
  },
  {
    id: 'proj_002',
    name: 'AI 学习',
    domain: LifeDomain.AI_LEARNING,
    description: 'AI 工具学习与实践',
    progress: 60,
    nextAction: '学习 Claude 工作流自动化',
    taskCount: 5,
    completedCount: 3,
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: today
  },
  {
    id: 'proj_003',
    name: '泰国旅行',
    domain: LifeDomain.TRAVEL,
    description: '8月泰国旅行准备',
    deadline: '2024-08-17',
    progress: 42,
    nextAction: '确认往返机票预订',
    taskCount: 10,
    completedCount: 4,
    status: 'active',
    createdAt: '2024-06-01',
    updatedAt: today
  },
  {
    id: 'proj_004',
    name: '健康项目',
    domain: LifeDomain.HEALTH,
    description: '个人健康项目与投资人沟通',
    deadline: '2024-08-10',
    progress: 55,
    nextAction: '完成投资人沟通提纲',
    taskCount: 6,
    completedCount: 3,
    status: 'active',
    createdAt: '2024-05-01',
    updatedAt: today
  },
  {
    id: 'proj_005',
    name: '团课教学',
    domain: LifeDomain.TEACHING,
    description: '本周团课安排与课后服务',
    progress: 70,
    nextAction: '整理并发送课后照片',
    taskCount: 7,
    completedCount: 5,
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: today
  },
  {
    id: 'proj_006',
    name: '个人生活',
    domain: LifeDomain.PERSONAL,
    description: '日常生活事务管理',
    progress: 45,
    nextAction: '鞋子送洗',
    taskCount: 5,
    completedCount: 2,
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: today
  }
];

// 日程数据
const getTodaySchedule = (): ScheduleItem[] => {
  const dateStr = today;
  return [
    {
      id: 'sched_001',
      title: '晨间阅读',
      startTime: `${dateStr}T07:00:00`,
      endTime: `${dateStr}T07:30:00`,
      domain: LifeDomain.PERSONAL,
      isRecurring: true,
      completed: true
    },
    {
      id: 'sched_002',
      title: '团课 - 有氧舞蹈',
      startTime: `${dateStr}T10:00:00`,
      endTime: `${dateStr}T11:00:00`,
      domain: LifeDomain.TEACHING,
      isRecurring: true,
      completed: true
    },
    {
      id: 'sched_003',
      title: 'AI 学习时间',
      startTime: `${dateStr}T14:00:00`,
      endTime: `${dateStr}T15:30:00`,
      domain: LifeDomain.AI_LEARNING,
      isRecurring: false,
      completed: false
    },
    {
      id: 'sched_004',
      title: '健康项目工作',
      startTime: `${dateStr}T16:00:00`,
      endTime: `${dateStr}T18:00:00`,
      domain: LifeDomain.HEALTH,
      isRecurring: false,
      completed: false
    },
    {
      id: 'sched_005',
      title: '运动时间',
      startTime: `${dateStr}T19:00:00`,
      endTime: `${dateStr}T20:00:00`,
      domain: LifeDomain.PERSONAL,
      isRecurring: true,
      completed: false
    },
    {
      id: 'sched_006',
      title: '内容创作',
      startTime: `${dateStr}T20:30:00`,
      endTime: `${dateStr}T22:00:00`,
      domain: LifeDomain.CONTENT,
      isRecurring: false,
      completed: false
    }
  ];
};

export const mockSchedule: ScheduleItem[] = getTodaySchedule();

// 灵感数据
export const mockInspirations: Inspiration[] = [
  {
    id: 'insp_001',
    content: '做一个关于「如何用 AI 管理生活」的系列内容，可以从时间管理、任务规划、学习笔记三个角度切入',
    source: 'manual',
    domain: LifeDomain.CONTENT,
    status: 'unprocessed',
    createdAt: '2024-07-29T22:15:00'
  },
  {
    id: 'insp_002',
    content: '泰国旅行可以拍一期「第一次出国自由行准备攻略」，从签证、机票、酒店到行李清单',
    source: 'manual',
    domain: LifeDomain.TRAVEL,
    status: 'unprocessed',
    createdAt: '2024-07-28T21:30:00'
  },
  {
    id: 'insp_003',
    content: '健康项目可以增加一个「用户成功故事」板块，展示真实用户的改变',
    source: 'voice',
    domain: LifeDomain.HEALTH,
    status: 'unprocessed',
    createdAt: '2024-07-27T14:20:00'
  },
  {
    id: 'insp_004',
    content: '尝试用 Claude 的 Computer Use 功能来自动化整理照片',
    source: 'web',
    domain: LifeDomain.AI_LEARNING,
    status: 'unprocessed',
    createdAt: '2024-07-26T10:45:00'
  },
  {
    id: 'insp_005',
    content: '团课可以增加一个「课后 5 分钟拉伸」环节，提升学员体验',
    source: 'manual',
    domain: LifeDomain.TEACHING,
    status: 'unprocessed',
    createdAt: '2024-07-25T19:00:00'
  }
];

// 内容创作数据
export const mockContents: ContentItem[] = [
  { id: 'cont_001', title: 'AI 工作流自动化入门', platform: 'xiaohongshu', type: '图文', stage: 'idea', domain: LifeDomain.CONTENT },
  { id: 'cont_002', title: '我的数字生活管理系统', platform: 'wechat', type: '长文', stage: 'topic', domain: LifeDomain.CONTENT },
  { id: 'cont_003', title: '泰国旅行准备全攻略', platform: 'douyin', type: '视频', stage: 'script', domain: LifeDomain.CONTENT },
  { id: 'cont_004', title: '如何用 AI 做内容选题', platform: 'video', type: '教程', stage: 'to_shoot', domain: LifeDomain.CONTENT },
  { id: 'cont_005', title: '自由职业者的一天', platform: 'xiaohongshu', type: '视频', stage: 'editing', domain: LifeDomain.CONTENT },
  { id: 'cont_006', title: '健康生活方式分享', platform: 'xiaohongshu', type: '图文', stage: 'to_publish', domain: LifeDomain.CONTENT },
  { id: 'cont_007', title: '团课教学心得', platform: 'wechat', type: '长文', stage: 'published', domain: LifeDomain.CONTENT },
  { id: 'cont_008', title: '从零开始学习 AI', platform: 'douyin', type: '视频', stage: 'published', domain: LifeDomain.CONTENT },
  { id: 'cont_009', title: '我的效率工具箱', platform: 'xiaohongshu', type: '图文', stage: 'published', domain: LifeDomain.CONTENT },
  { id: 'cont_010', title: '旅行拍摄技巧', platform: 'video', type: '教程', stage: 'published', domain: LifeDomain.CONTENT }
];

// AI 简报
export const mockBriefing: DailyBriefing = {
  date: today,
  focus: [
    '准备健康项目投资人沟通提纲',
    '查询并确认泰国往返机票',
    '完成 Personal OS 教程视频脚本'
  ],
  warnings: [
    '泰国旅行还有 18 天，机票尚未确认',
    '投资人沟通已经临近，但准备进度较低',
    '有 3 条灵感还未整理，可能遗漏重要想法'
  ],
  suggestions: [
    '建议先用 45 分钟完成投资人沟通提纲，再处理机票',
    '下午团课后可以安排 30 分钟处理旅行事宜',
    '晚上内容创作时间可以推进脚本完成'
  ],
  travelDaysLeft: 18,
  top3Ids: ['task_001', 'task_002', 'task_003']
};

// 统计数据
export const mockStats: UserStats = {
  weekCompletedTasks: 23,
  top3CompletionRate: 78,
  weekFocusTime: 480,
  contentProgress: 35,
  aiLearningHours: 5.5,
  teachingClasses: 4,
  workouts: 3,
  travelProgress: 42,
  healthProjectProgress: 55,
  inboxClearCount: 8
};

// 辅助函数
export const getGreeting = (): string => {
  const hour = now.getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

export const getDomainTasks = (domain: LifeDomain) => {
  return mockTasks.filter(t => t.domain === domain && t.status !== 'completed');
};

export const getTop3Tasks = () => {
  return mockTasks
    .filter(t => t.isInTop3)
    .sort((a, b) => (a.top3Order || 0) - (b.top3Order || 0));
};

export const getTodayTasks = () => {
  return mockTasks.filter(t => t.isInToday && t.status !== 'completed');
};

export const getPendingReminders = () => {
  return mockTasks.filter(t =>
    !t.isInTop3 &&
    t.status !== 'completed' &&
    t.status !== 'cancelled' &&
    (t.isImportant || (t.dueDate && new Date(t.dueDate) <= new Date(today)))
  );
};
