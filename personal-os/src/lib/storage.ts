import { AppData, Task, Project, ScheduleItem, Inspiration, UserProfile, AppSettings } from '@/types';
import { mockProfile, mockTasks, mockProjects, mockSchedule, mockInspirations } from '@/data/mockData';

const STORAGE_KEY = 'personal_os_data_v1';

// 默认初始数据
const getDefaultData = (): AppData => ({
  version: 1,
  profile: mockProfile,
  tasks: mockTasks,
  projects: mockProjects,
  schedule: mockSchedule,
  inspirations: mockInspirations,
  contents: [],
  settings: {
    theme: 'light',
    showGmail: false,
    gmailConnected: false,
    dailyReminder: true,
    reminderTime: '09:00'
  }
});

// 从 LocalStorage 读取数据
export const loadData = (): AppData => {
  if (typeof window === 'undefined') {
    return getDefaultData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppData;
      // 数据迁移：确保新字段存在
      return migrateData(parsed);
    }
  } catch (error) {
    console.error('Failed to load data from LocalStorage:', error);
  }

  // 首次使用，保存默认数据
  const defaultData = getDefaultData();
  saveData(defaultData);
  return defaultData;
};

// 保存数据到 LocalStorage
export const saveData = (data: AppData): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to LocalStorage:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      alert('存储空间不足，请导出并清理部分数据');
    }
  }
};

// 数据迁移
const migrateData = (data: AppData): AppData => {
  const defaultData = getDefaultData();

  return {
    version: data.version || 1,
    profile: { ...defaultData.profile, ...data.profile },
    tasks: data.tasks || defaultData.tasks,
    projects: data.projects || defaultData.projects,
    schedule: data.schedule || defaultData.schedule,
    inspirations: data.inspirations || defaultData.inspirations,
    contents: data.contents || [],
    settings: { ...defaultData.settings, ...data.settings }
  };
};

// ===== 任务操作 =====

export const getTasks = (): Task[] => {
  return loadData().tasks;
};

export const addTask = (task: Omit<Task, 'id' | 'createdAt'>): Task => {
  const data = loadData();
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  };

  data.tasks = [newTask, ...data.tasks];
  saveData(data);
  return newTask;
};

export const updateTask = (taskId: string, updates: Partial<Task>): Task | null => {
  const data = loadData();
  const taskIndex = data.tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) return null;

  data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
  saveData(data);
  return data.tasks[taskIndex];
};

export const deleteTask = (taskId: string): boolean => {
  const data = loadData();
  const initialLength = data.tasks.length;
  data.tasks = data.tasks.filter(t => t.id !== taskId);

  if (data.tasks.length < initialLength) {
    saveData(data);
    return true;
  }
  return false;
};

export const completeTask = (taskId: string, completed: boolean): Task | null => {
  const updates: Partial<Task> = {
    status: completed ? 'completed' : 'pending',
    progress: completed ? 100 : 0,
    completedAt: completed ? new Date().toISOString() : undefined
  };
  return updateTask(taskId, updates);
};

export const setTaskTop3 = (taskId: string, isTop3: boolean, order?: number): Task | null => {
  const updates: Partial<Task> = {
    isInTop3: isTop3,
    top3Order: isTop3 ? order : undefined,
    isInToday: isTop3 ? true : undefined
  };
  return updateTask(taskId, updates);
};

export const setTaskToday = (taskId: string, isToday: boolean): Task | null => {
  return updateTask(taskId, { isInToday: isToday });
};

// ===== 项目操作 =====

export const getProjects = (): Project[] => {
  return loadData().projects;
};

export const updateProject = (projectId: string, updates: Partial<Project>): Project | null => {
  const data = loadData();
  const projectIndex = data.projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) return null;

  data.projects[projectIndex] = {
    ...data.projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
  return data.projects[projectIndex];
};

export const updateProjectProgress = (projectId: string): void => {
  const data = loadData();
  const project = data.projects.find(p => p.id === projectId);

  if (!project) return;

  const projectTasks = data.tasks.filter(t =>
    t.domain === project.domain && t.status !== 'cancelled'
  );
  const total = projectTasks.length;
  const completed = projectTasks.filter(t => t.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  updateProject(projectId, {
    progress,
    taskCount: total,
    completedCount: completed
  });
};

// ===== 日程操作 =====

export const getSchedule = (): ScheduleItem[] => {
  return loadData().schedule;
};

export const addScheduleItem = (item: Omit<ScheduleItem, 'id'>): ScheduleItem => {
  const data = loadData();
  const newItem: ScheduleItem = {
    ...item,
    id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  data.schedule = [...data.schedule, newItem];
  saveData(data);
  return newItem;
};

export const updateScheduleItem = (itemId: string, updates: Partial<ScheduleItem>): ScheduleItem | null => {
  const data = loadData();
  const itemIndex = data.schedule.findIndex(s => s.id === itemId);

  if (itemIndex === -1) return null;

  data.schedule[itemIndex] = { ...data.schedule[itemIndex], ...updates };
  saveData(data);
  return data.schedule[itemIndex];
};

export const deleteScheduleItem = (itemId: string): boolean => {
  const data = loadData();
  const initialLength = data.schedule.length;
  data.schedule = data.schedule.filter(s => s.id !== itemId);

  if (data.schedule.length < initialLength) {
    saveData(data);
    return true;
  }
  return false;
};

// ===== 灵感/收集箱操作 =====

export const getInspirations = (): Inspiration[] => {
  return loadData().inspirations;
};

export const addInspiration = (content: string, source: Inspiration['source'] = 'manual', domain?: Inspiration['domain']): Inspiration => {
  const data = loadData();
  const newInspiration: Inspiration = {
    id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    source,
    domain,
    status: 'unprocessed',
    createdAt: new Date().toISOString()
  };

  data.inspirations = [newInspiration, ...data.inspirations];
  saveData(data);
  return newInspiration;
};

export const updateInspiration = (inspirationId: string, updates: Partial<Inspiration>): Inspiration | null => {
  const data = loadData();
  const index = data.inspirations.findIndex(i => i.id === inspirationId);

  if (index === -1) return null;

  data.inspirations[index] = { ...data.inspirations[index], ...updates };
  saveData(data);
  return data.inspirations[index];
};

export const convertInspiration = (
  inspirationId: string,
  targetType: 'task' | 'project' | 'note' | 'content',
  targetId: string
): Inspiration | null => {
  return updateInspiration(inspirationId, {
    status: 'converted',
    convertedTo: { type: targetType, id: targetId }
  });
};

export const deleteInspiration = (inspirationId: string): boolean => {
  const data = loadData();
  const initialLength = data.inspirations.length;
  data.inspirations = data.inspirations.filter(i => i.id !== inspirationId);

  if (data.inspirations.length < initialLength) {
    saveData(data);
    return true;
  }
  return false;
};

// ===== 用户资料操作 =====

export const getProfile = (): UserProfile => {
  return loadData().profile;
};

export const updateProfile = (updates: Partial<UserProfile>): UserProfile => {
  const data = loadData();
  data.profile = { ...data.profile, ...updates };
  saveData(data);
  return data.profile;
};

// ===== 设置操作 =====

export const getSettings = (): AppSettings => {
  return loadData().settings;
};

export const updateSettings = (updates: Partial<AppSettings>): AppSettings => {
  const data = loadData();
  data.settings = { ...data.settings, ...updates };
  saveData(data);
  return data.settings;
};

// ===== 数据管理 =====

export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString) as AppData;
    // 验证数据结构
    if (!data.tasks || !data.projects || !data.inspirations) {
      throw new Error('Invalid data structure');
    }
    saveData(data);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

export const resetToDemoData = (): void => {
  const defaultData = getDefaultData();
  saveData(defaultData);
};

export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

// ===== 钩子（用于 React 组件）=====

import { useState, useEffect, useCallback } from 'react';

export const useStorage = <T,>(
  getter: () => T,
  dependencies: unknown[] = []
): T => {
  const [value, setValue] = useState<T>(getter);

  useEffect(() => {
    setValue(getter());
  }, dependencies);

  return value;
};
