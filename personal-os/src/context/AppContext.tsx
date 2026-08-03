'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, Project, ScheduleItem, Inspiration, UserProfile, AppSettings, LifeDomain } from '@/types';
import * as storage from '@/lib/storage';

interface AppContextType {
  // 数据
  tasks: Task[];
  projects: Project[];
  schedule: ScheduleItem[];
  inspirations: Inspiration[];
  profile: UserProfile;
  settings: AppSettings;
  isLoaded: boolean;

  // 任务操作
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string, completed: boolean) => void;
  setTaskTop3: (taskId: string, isTop3: boolean, order?: number) => void;
  setTaskToday: (taskId: string, isToday: boolean) => void;

  // 项目操作
  updateProject: (projectId: string, updates: Partial<Project>) => void;

  // 日程操作
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => ScheduleItem;
  updateScheduleItem: (itemId: string, updates: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (itemId: string) => void;

  // 灵感操作
  addInspiration: (content: string, source?: Inspiration['source'], domain?: LifeDomain) => Inspiration;
  updateInspiration: (inspirationId: string, updates: Partial<Inspiration>) => void;
  convertInspiration: (inspirationId: string, targetType: 'task' | 'project' | 'note' | 'content', targetId: string) => void;
  deleteInspiration: (inspirationId: string) => void;

  // 用户资料
  updateProfile: (updates: Partial<UserProfile>) => void;

  // 设置
  updateSettings: (updates: Partial<AppSettings>) => void;

  // 数据管理
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  resetToDemoData: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [profile, setProfile] = useState<UserProfile>({} as UserProfile);
  const [settings, setSettings] = useState<AppSettings>({} as AppSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载数据
  const refreshData = useCallback(() => {
    setTasks(storage.getTasks());
    setProjects(storage.getProjects());
    setSchedule(storage.getSchedule());
    setInspirations(storage.getInspirations());
    setProfile(storage.getProfile());
    setSettings(storage.getSettings());
  }, []);

  useEffect(() => {
    refreshData();
    setIsLoaded(true);
  }, [refreshData]);

  // ===== 任务操作 =====
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask = storage.addTask(task);
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updated = storage.updateTask(taskId, updates);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      // 如果任务状态变化，更新项目进度
      if (updates.status || updates.progress !== undefined) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          storage.updateProjectProgress(task.projectId || task.domain);
          setProjects(storage.getProjects());
        }
      }
    }
  }, [tasks]);

  const deleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (storage.deleteTask(taskId)) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      // 更新项目进度
      if (task) {
        storage.updateProjectProgress(task.projectId || task.domain);
        setProjects(storage.getProjects());
      }
    }
  }, [tasks]);

  const completeTask = useCallback((taskId: string, completed: boolean) => {
    const updated = storage.completeTask(taskId, completed);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      // 更新项目进度
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        storage.updateProjectProgress(task.projectId || task.domain);
        setProjects(storage.getProjects());
      }
    }
  }, [tasks]);

  const setTaskTop3 = useCallback((taskId: string, isTop3: boolean, order?: number) => {
    const updated = storage.setTaskTop3(taskId, isTop3, order);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    }
  }, []);

  const setTaskToday = useCallback((taskId: string, isToday: boolean) => {
    const updated = storage.setTaskToday(taskId, isToday);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    }
  }, []);

  // ===== 项目操作 =====
  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    const updated = storage.updateProject(projectId, updates);
    if (updated) {
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
    }
  }, []);

  // ===== 日程操作 =====
  const addScheduleItem = useCallback((item: Omit<ScheduleItem, 'id'>) => {
    const newItem = storage.addScheduleItem(item);
    setSchedule(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateScheduleItem = useCallback((itemId: string, updates: Partial<ScheduleItem>) => {
    const updated = storage.updateScheduleItem(itemId, updates);
    if (updated) {
      setSchedule(prev => prev.map(s => s.id === itemId ? updated : s));
    }
  }, []);

  const deleteScheduleItem = useCallback((itemId: string) => {
    if (storage.deleteScheduleItem(itemId)) {
      setSchedule(prev => prev.filter(s => s.id !== itemId));
    }
  }, []);

  // ===== 灵感操作 =====
  const addInspiration = useCallback((content: string, source: Inspiration['source'] = 'manual', domain?: LifeDomain) => {
    const newInspiration = storage.addInspiration(content, source, domain);
    setInspirations(prev => [newInspiration, ...prev]);
    return newInspiration;
  }, []);

  const updateInspiration = useCallback((inspirationId: string, updates: Partial<Inspiration>) => {
    const updated = storage.updateInspiration(inspirationId, updates);
    if (updated) {
      setInspirations(prev => prev.map(i => i.id === inspirationId ? updated : i));
    }
  }, []);

  const convertInspiration = useCallback((inspirationId: string, targetType: 'task' | 'project' | 'note' | 'content', targetId: string) => {
    const updated = storage.convertInspiration(inspirationId, targetType, targetId);
    if (updated) {
      setInspirations(prev => prev.map(i => i.id === inspirationId ? updated : i));
    }
  }, []);

  const deleteInspiration = useCallback((inspirationId: string) => {
    if (storage.deleteInspiration(inspirationId)) {
      setInspirations(prev => prev.filter(i => i.id !== inspirationId));
    }
  }, []);

  // ===== 用户资料 =====
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = storage.updateProfile(updates);
    setProfile(updated);
  }, []);

  // ===== 设置 =====
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const updated = storage.updateSettings(updates);
    setSettings(updated);
  }, []);

  // ===== 数据管理 =====
  const exportData = useCallback(() => {
    return storage.exportData();
  }, []);

  const importData = useCallback((jsonString: string) => {
    const success = storage.importData(jsonString);
    if (success) {
      refreshData();
    }
    return success;
  }, [refreshData]);

  const resetToDemoData = useCallback(() => {
    storage.resetToDemoData();
    refreshData();
  }, [refreshData]);

  const value: AppContextType = {
    tasks,
    projects,
    schedule,
    inspirations,
    profile,
    settings,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    setTaskTop3,
    setTaskToday,
    updateProject,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    addInspiration,
    updateInspiration,
    convertInspiration,
    deleteInspiration,
    updateProfile,
    updateSettings,
    exportData,
    importData,
    resetToDemoData,
    refreshData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
