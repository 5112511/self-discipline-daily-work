import type { DemoData } from './types'

// 玥莹的真实演示数据 · 第一阶段可视化原型
export const demoData: DemoData = {
  todayDate: '7月30日',
  weekday: '周四',
  greeting: '下午好，玥莹。',
  mood: '今天不需要完成所有事，只需要完成最重要的事。',
  todayProgress: 38,
  streakDays: 12,
  top3: [
    {
      id: 't1', title: '准备健康项目投资人沟通提纲', domain: 'health',
      priority: 'high', dueDate: '今天', dueTime: '22:00', estimatedMinutes: 45,
      progress: 20, nextAction: '列出沟通目标与希望获得的帮助',
      inToday: true, inTop3: true, top3Order: 0, status: 'doing', createdAt: '2025-07-28',
    },
    {
      id: 't3', title: '完成 Personal OS 教程视频脚本', domain: 'content',
      priority: 'high', dueDate: '今天', dueTime: '23:00', estimatedMinutes: 60,
      progress: 0, nextAction: '先写开头 30 秒钩子',
      inToday: true, inTop3: true, top3Order: 2, status: 'pending', createdAt: '2025-07-29',
    },
  ],
  todayTasks: [],
  overdueTasks: [
    {
      id: 'o1', title: '整理上周技能练习笔记', domain: 'class', priority: 'medium',
      dueDate: '昨天', estimatedMinutes: 20, progress: 0,
      nextAction: '梳理 30 条练习心得', inToday: false, inTop3: false,
      status: 'pending', createdAt: '2025-07-25', overdue: true,
    },
    {
      id: 'o2', title: '学习一个新的 AI 工作流', domain: 'ai', priority: 'medium',
      dueDate: '前天', estimatedMinutes: 40, progress: 30,
      nextAction: '看完 Coze 多智能体案例', inToday: false, inTop3: false,
      status: 'doing', createdAt: '2025-07-26', overdue: true,
    },
  ],
  reminders: [
    { id: 'r1', title: '鞋子需要送洗', domain: 'life', priority: 'low', progress: 0, nextAction: '周六前送到楼下干洗店', inToday: false, inTop3: false, status: 'pending', createdAt: '2025-07-27' },
    { id: 'r3', title: '投资人沟通材料尚未准备', domain: 'health', priority: 'high', progress: 20, nextAction: '整理项目介绍与核心数据', inToday: false, inTop3: false, status: 'doing', createdAt: '2025-07-22' },
    { id: 'r4', title: '3 条灵感还未整理', domain: 'content', priority: 'medium', progress: 0, inToday: false, inTop3: false, status: 'pending', createdAt: '2025-07-28', note: '收集箱中待转化' },
    { id: 'r5', title: '技能练习作品还未归档', domain: 'class', priority: 'medium', progress: 0, nextAction: '整理周二练习录音', inToday: false, inTop3: false, status: 'pending', createdAt: '2025-07-27' },
  ],
  inspirations: [
    { id: 'i1', content: '做一个「个人 OS 主题」的小红书系列，记录从混乱到秩序的过程', source: 'manual', createdAt: '今天 09:12', archived: false },
    { id: 'i2', content: 'AI 工作流可以拆成「场景→工具→产出」三段式讲法', source: 'web', createdAt: '今天 11:30', archived: false },
    { id: 'i4', content: '健康项目投资人沟通要突出「用户增长曲线」而非产品功能', source: 'gmail', createdAt: '昨天 16:05', archived: false },
    { id: 'i5', content: '技能练习过程可以拍成九宫格复盘，质感更高', source: 'image', createdAt: '前天 20:18', archived: false },
  ],
  projects: [
    {
      id: 'p1', domain: 'content', name: '内容创作', progress: 48,
      nextAction: '完成 Personal OS 教程视频脚本',
      todoCount: 6, updatedAt: '今天',
      content: [
        { id: 'c1', title: 'Personal OS 教程视频', platform: '视频号', type: '口播教程', stage: 'script', planDate: '8月1日', nextAction: '写开头 30 秒钩子' },
        { id: 'c3', title: 'AI 工作流三段式', platform: '抖音', type: '短视频', stage: 'topic', nextAction: '列提纲' },
        { id: 'c4', title: '投资人沟通复盘笔记', platform: '公众号', type: '长文', stage: 'publish', planDate: '8月3日', nextAction: '排版' },
        { id: 'c5', title: '技能练习九宫格复盘', platform: '小红书', type: '图文', stage: 'edit', nextAction: '调色统一' },
        { id: 'c6', title: '健康项目选题三连', platform: '小红书', type: '图文', stage: 'script', nextAction: '选首篇' },
        { id: 'c7', title: 'AI 学习笔记 #3', platform: '公众号', type: '长文', stage: 'published' },
        { id: 'c8', title: '日常随手记合集', platform: '小红书', type: '图文', stage: 'published' },
        { id: 'c9', title: '技能练习花絮', platform: '抖音', type: '短视频', stage: 'published' },
        { id: 'c11', title: '健康项目首篇', platform: '小红书', type: '图文', stage: 'published' },
        { id: 'c12', title: '工具收纳小技巧', platform: '小红书', type: '图文', stage: 'published' },
      ],
    },
    {
      id: 'p2', domain: 'ai', name: 'AI 学习', progress: 35,
      nextAction: '看完 Coze 多智能体案例并产出笔记',
      todoCount: 4, updatedAt: '今天',
      ai: {
        learning: [
          { id: 'a1', topic: 'Coze 多智能体工作流', source: '官方文档', progress: 30, nextPractice: '复刻一个选题助手', canToTopic: true },
          { id: 'a2', topic: 'Claude Projects 长文档处理', source: 'YouTube', progress: 60, nextPractice: '用 Personal OS 需求文档测试', canToTopic: true },
          { id: 'a3', topic: '即梦/可灵图生视频', source: '小红书', progress: 100, canToTopic: true },
          { id: 'a4', topic: 'Cursor + Vite 前端速成', source: 'B站', progress: 80, nextPractice: '给本工作台加一个组件', canToTopic: false },
          { id: 'a5', topic: 'RAG 个人知识库搭建', source: '公众号', progress: 0, nextPractice: '先选向量库', canToTopic: true },
        ],
        stats: { ideas: 12, learning: 3, practiced: 1, output: 1 },
      },
    },
    {
      id: 'p4', domain: 'health', name: '健康项目', progress: 30,
      nextAction: '准备投资人沟通材料',
      dueDate: '本周内', todoCount: 4, updatedAt: '今天',
      health: {
        goal: '打造可落地的健康内容与轻量产品',
        stage: '内容沉淀 → 沟通融资阶段',
        weekOutput: '完成选题三连首篇 + 投资人沟通提纲',
        investorSteps: [
          { id: 'h1', name: '明确沟通目标', done: true },
          { id: 'h2', name: '整理项目介绍', done: false },
          { id: 'h3', name: '准备核心数据', done: false },
          { id: 'h4', name: '整理商业模式', done: false },
          { id: 'h5', name: '列出希望获得的帮助', done: false },
          { id: 'h6', name: '预约沟通时间', done: false },
        ],
        milestones: [
          { id: 'm1', name: '选题三连上线', status: 'doing', date: '8月3日' },
          { id: 'm2', name: '投资人首次沟通', status: 'pending', date: '本周内' },
          { id: 'm3', name: '产品 MVP 立项', status: 'pending', date: '9月' },
        ],
      },
    },
    {
      id: 'p5', domain: 'class', name: '技能提升', progress: 55,
      nextAction: '整理周二练习录音并归档', todoCount: 3, updatedAt: '今天',
      classes: {
        weekCount: 4,
        sessions: [
          { id: 's1', name: '口语跟读', weekday: '周二', time: '19:30-20:30', place: '家 · 书桌', prepareStatus: 'ready', photosUntreated: 28, photosUnsent: 28 },
          { id: 's2', name: '键盘进阶', weekday: '周四', time: '19:30-20:30', place: '家 · 书桌', prepareStatus: 'todo', photosUntreated: 0, photosUnsent: 0, nextClass: '需练习：进阶和弦组合' },
          { id: 's3', name: '口语跟读', weekday: '周六', time: '10:00-11:00', place: '咖啡厅', prepareStatus: 'ready', photosUntreated: 0, photosUnsent: 0 },
          { id: 's4', name: '硬笔临帖', weekday: '周日', time: '18:00-19:00', place: '家 · 书桌', prepareStatus: 'ready', photosUntreated: 0, photosUnsent: 0 },
        ],
        photosUntreated: 28,
        photosUnsent: 28,
        nextPrep: '周四键盘进阶需练习',
      },
    },
    {
      id: 'p6', domain: 'work', name: '工作', progress: 35,
      nextAction: '跟进本周会议与工作 DDL', todoCount: 3, updatedAt: '今天',
      work: {
        meetings: [
          { id: 'wm1', title: '项目周会', date: '2025-07-31', start: '10:00', end: '11:00', location: '线上 · 飞书会议', contact: '林老师', note: '确认本周交付与分工', status: 'planned' },
          { id: 'wm2', title: '产品需求对齐', date: '2025-08-01', start: '15:00', end: '16:00', location: 'B 座 302', contact: '产品组 · 小雅', note: '同步需求范围和截止时间', status: 'planned' },
        ],
      },
    },
    {
      id: 'p7', domain: 'life', name: '个人生活', progress: 25,
      nextAction: '鞋子送洗 · 安排本周运动',
      todoCount: 5, updatedAt: '今天',
      life: {
        items: [
          { id: 'l1', title: '鞋子送洗', status: 'pending' },
          { id: 'l2', title: '买护颈枕', status: 'pending' },
          { id: 'l3', title: '预约下周体检', status: 'doing' },
          { id: 'l4', title: '缴 8 月物业费', status: 'pending' },
          { id: 'l5', title: '安排本周 3 次运动', status: 'pending' },
          { id: 'l6', title: '整理书房', status: 'cancelled' },
        ],
      },
    },
  ],
  todayTimeline: [
    { id: 'tl1', title: '晨间整理 · AI 简报', domain: 'ai', date: '', start: '07:30', end: '08:00', done: true },
    { id: 'tl2', title: '内容脚本撰写', domain: 'content', date: '', start: '09:00', end: '10:30', done: true },
    { id: 'tl4', title: '键盘练习 · 进阶和弦', domain: 'class', date: '', start: '16:00', end: '17:00', done: false },
    { id: 'tl5', title: '投资人沟通提纲', domain: 'health', date: '', start: '20:00', end: '20:45', done: false },
    { id: 'tl6', title: '运动 30 分钟', domain: 'life', date: '', start: '21:00', end: '21:30', done: false },
  ],
  weekTimeline: [
    { day: '一', blocks: [{ domain: 'content', minutes: 90, label: '脚本' }, { domain: 'ai', minutes: 60, label: '学习' }, { domain: 'life', minutes: 30, label: '运动' }] },
    { day: '二', blocks: [{ domain: 'class', minutes: 60, label: '练习' }, { domain: 'health', minutes: 45, label: '选题' }] },
    { day: '三', blocks: [{ domain: 'content', minutes: 120, label: '剪辑' }, { domain: 'ai', minutes: 40, label: '工作流' }] },
    { day: '四', blocks: [{ domain: 'class', minutes: 60, label: '练习' }, { domain: 'health', minutes: 45, label: '投资人' }, { domain: 'life', minutes: 30, label: '运动' }] },
    { day: '五', blocks: [{ domain: 'content', minutes: 90, label: '拍摄' }, { domain: 'ai', minutes: 30, label: '复盘' }] },
    { day: '六', blocks: [{ domain: 'class', minutes: 60, label: '练习' }] },
    { day: '日', blocks: [{ domain: 'class', minutes: 60, label: '临帖' }, { domain: 'life', minutes: 90, label: '整理' }] },
  ],
  stats: {
    weekDone: 18,
    top3Rate: 67,
    weekFocusMin: 540,
    contentProgress: 48,
    aiMinutes: 220,
    classCount: 4,
    sportCount: 3,
    healthProgress: 30,
    inboxCleared: 5,
    weekTrend: [3, 4, 2, 5, 3, 4, 5],
    heatmap: [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    weekDist: [
      { domain: 'content', minutes: 300 },
      { domain: 'ai', minutes: 220 },
      { domain: 'class', minutes: 240 },
      { domain: 'health', minutes: 135 },
      { domain: 'life', minutes: 150 },
    ],
  },
  gmailDemo: {
    connected: false,
    items: [
      { id: 'g1', from: '某投资机构 · 林老师', subject: '关于健康项目沟通时间的确认', tag: '需要行动', time: '今天 10:24' },
      { id: 'g3', from: '练习搭子 · 小雅', subject: '上周练习录音可以发我一份吗', tag: '需要行动', time: '昨天 21:40' },
      { id: 'g4', from: 'AI 学习社群', subject: 'Coze 多智能体案例汇总已更新', tag: '等待回复', time: '昨天 15:12' },
    ],
  },
}
