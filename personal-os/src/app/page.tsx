'use client';

import { useApp } from '@/context/AppContext';
import { DomainLabels, Task, LifeDomain } from '@/types';
import { MapPin, ChevronRight, AlertCircle, Lightbulb, Zap, Briefcase, Plane, Heart, Users, Sparkles, Check } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import BottomTabBar from '@/components/BottomTabBar';
import FloatingActionButton from '@/components/FloatingActionButton';
import TaskModal from '@/components/TaskModal';
import { useState, useMemo } from 'react';
import { DomainColors } from '@/data/mockData';

// 领域图标映射
const domainIcons: Record<LifeDomain, React.ElementType> = {
  [LifeDomain.CONTENT]: Briefcase,
  [LifeDomain.AI_LEARNING]: Sparkles,
  [LifeDomain.TRAVEL]: Plane,
  [LifeDomain.HEALTH]: Heart,
  [LifeDomain.TEACHING]: Users,
  [LifeDomain.PERSONAL]: MapPin,
};

// 问候语
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

export default function TodayPage() {
  const { tasks, projects, schedule, inspirations, profile, completeTask, setTaskToday, addTask, updateTask, isLoaded } = useApp();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 等待数据加载
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </main>
    );
  }

  // 计算今日任务
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t =>
      t.isInToday ||
      t.status === 'pending' ||
      t.status === 'in_progress'
    );
  }, [tasks]);

  // Top 3 任务
  const top3Tasks = useMemo(() => {
    return tasks
      .filter(t => t.isInTop3)
      .sort((a, b) => (a.top3Order || 0) - (b.top3Order || 0));
  }, [tasks]);

  // 待处理提醒
  const pendingReminders = useMemo(() => {
    return tasks.filter(t =>
      !t.isInTop3 &&
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (t.isImportant || t.isUrgent)
    ).slice(0, 3);
  }, [tasks]);

  // 最近灵感
  const recentInspirations = useMemo(() => {
    return inspirations
      .filter(i => i.status === 'unprocessed')
      .slice(0, 4);
  }, [inspirations]);

  // 计算今日完成进度
  const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
  const todayTotal = todayTasks.length || 1;
  const todayProgress = Math.round((todayCompleted / todayTotal) * 100);

  // 格式化日期
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 处理完成任务
  const handleCompleteTask = (taskId: string, currentStatus: string) => {
    setCompletingTaskId(taskId);
    const newCompleted = currentStatus !== 'completed';
    completeTask(taskId, newCompleted);
    setTimeout(() => setCompletingTaskId(null), 300);
  };

  // 处理加入今日
  const handleAddToToday = (taskId: string) => {
    setTaskToday(taskId, true);
  };

  // 处理编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // 处理保存任务
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData as Omit<Task, 'id' | 'createdAt'>);
    }
    setEditingTask(null);
  };

  // 处理打开新增任务弹窗
  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // 计算旅行倒计时
  const travelProject = projects.find(p => p.domain === LifeDomain.TRAVEL);
  const travelDaysLeft = travelProject?.deadline ?
    Math.ceil((new Date(travelProject.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
    18;

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* 顶部区域 */}
      <header className="pt-12 px-5 pb-4 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[13px] text-gray-500 font-medium mb-1">{dateStr}</p>
            <h1 className="text-[28px] font-bold text-black tracking-tight">
              {getGreeting()}，{profile.name}。
            </h1>
            <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
              {profile.greetingText || '今天不需要完成所有事，只需要完成最重要的事。'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ProgressRing progress={todayProgress} size={56} strokeWidth={4} color="#000000">
              <span className="text-[13px] font-semibold text-black">{todayProgress}%</span>
            </ProgressRing>
            <span className="text-[11px] text-gray-400 font-medium">{profile.streakDays || 0} 天</span>
          </div>
        </div>
      </header>

      <div className="px-5 space-y-5">
        {/* AI 今日简报 */}
        <section className="ios-card-elevated p-5 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <h2 className="text-[17px] font-semibold text-black">今日简报</h2>
            <span className="ml-auto text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">AI 生成</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wide mb-2">今天的重点</p>
              <p className="text-[15px] text-black leading-relaxed">
                今天最重要的是准备投资人沟通材料、确认泰国机票，并完成健康项目选题。
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-amber-700 font-medium mb-1">需要注意</p>
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    泰国旅行还有 <span className="font-semibold">{travelDaysLeft} 天</span>，机票尚未确认；投资人沟通已经临近，但准备进度较低。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
              <p className="text-[13px] text-gray-600 leading-relaxed">
                建议先用 45 分钟完成投资人沟通提纲，再处理机票。
              </p>
            </div>
          </div>

          <button className="mt-4 w-full py-3 bg-gray-50 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            AI 深度分析
          </button>
        </section>

        {/* 今日聚焦 Top 3 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-bold text-black">今日聚焦</h2>
            <span className="text-[13px] text-gray-400">Top {top3Tasks.length}</span>
          </div>

          {top3Tasks.length === 0 ? (
            <div className="ios-card p-6 text-center">
              <p className="text-[14px] text-gray-400">还没有设置今日 Top 3</p>
              <button
                onClick={handleAddTask}
                className="mt-3 text-[14px] font-medium text-black bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                从任务中选择
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {top3Tasks.map((task, index) => (
                <div
                  key={task.id}
                  onClick={() => handleEditTask(task)}
                  className={`ios-card p-4 flex items-start gap-3 transition-all cursor-pointer ${
                    completingTaskId === task.id ? 'scale-95' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteTask(task.id, task.status);
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      task.status === 'completed'
                        ? 'bg-black border-black'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {task.status === 'completed' && <Check size={14} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-[16px] font-medium leading-snug ${
                        task.status === 'completed' ? 'text-gray-400 line-through' : 'text-black'
                      }`}>
                        {task.title}
                      </h3>
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: DomainColors[task.domain] }}
                      />
                    </div>
                    <p className="text-[13px] text-gray-500 mt-1">
                      {DomainLabels[task.domain]} · {task.estimatedMinutes || '-'} 分钟
                    </p>
                    {task.nextAction && (
                      <p className="text-[12px] text-gray-400 mt-2">下一步: {task.nextAction}</p>
                    )}
                  </div>
                  <span className="text-[20px] font-light text-gray-300">{index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 今日时间轴 */}
        <section>
          <h2 className="text-[20px] font-bold text-black mb-3">今日时间轴</h2>
          <div className="ios-card p-4">
            {schedule.length === 0 ? (
              <p className="text-[14px] text-gray-400 text-center py-4">今天还没有安排</p>
            ) : (
              <div className="space-y-0">
                {schedule
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((item, index, arr) => {
                    const startTime = new Date(item.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    const endTime = new Date(item.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    const Icon = domainIcons[item.domain];

                    return (
                      <div key={item.id} className="flex items-start gap-4 relative">
                        {/* 时间线 */}
                        {index !== arr.length - 1 && (
                          <div className="absolute left-[52px] top-8 w-px h-[calc(100%-16px)] bg-gray-100" />
                        )}

                        {/* 时间 */}
                        <div className="w-11 flex-shrink-0 text-right">
                          <p className={`text-[13px] font-medium ${item.completed ? 'text-gray-400' : 'text-black'}`}>
                            {startTime}
                          </p>
                          <p className="text-[11px] text-gray-400">{endTime}</p>
                        </div>

                        {/* 节点 */}
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                          item.completed ? 'bg-gray-300' : 'bg-black'
                        }`} />

                        {/* 内容 */}
                        <div className={`flex-1 pb-5 ${item.completed ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-gray-400" />
                            <span className="text-[11px] text-gray-400">{DomainLabels[item.domain]}</span>
                          </div>
                          <p className={`text-[15px] font-medium mt-0.5 ${item.completed ? 'text-gray-400 line-through' : 'text-black'}`}>
                            {item.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        {/* 六大生活主线 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-bold text-black">生活主线</h2>
            <span className="text-[13px] text-gray-400">{projects.length} 个领域</span>
          </div>

          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {projects.map((project) => {
              const Icon = domainIcons[project.domain];
              const isTravel = project.domain === LifeDomain.TRAVEL;

              return (
                <div
                  key={project.id}
                  className="flex-shrink-0 w-40 ios-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${DomainColors[project.domain]}15` }}
                    >
                      <Icon size={18} style={{ color: DomainColors[project.domain] }} />
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>

                  <h3 className="text-[15px] font-semibold text-black mb-1">{project.name}</h3>

                  {isTravel && (
                    <p className="text-[12px] text-gray-500 mb-2">还有 {travelDaysLeft} 天出发</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: DomainColors[project.domain]
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">{project.progress}%</span>
                  </div>

                  {project.nextAction && (
                    <p className="text-[11px] text-gray-400 mt-2 truncate">{project.nextAction}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 待处理提醒 */}
        {pendingReminders.length > 0 && (
          <section>
            <h2 className="text-[20px] font-bold text-black mb-3">待处理提醒</h2>
            <div className="ios-card divide-y divide-gray-50">
              {pendingReminders.map((task) => (
                <div key={task.id} className="p-4 flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DomainColors[task.domain] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-black truncate">{task.title}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{DomainLabels[task.domain]}</p>
                  </div>
                  <button
                    onClick={() => handleAddToToday(task.id)}
                    className="text-[12px] font-medium text-black bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    加入今日
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 最近灵感 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-bold text-black">最近灵感</h2>
            <span className="text-[13px] text-gray-400">
              {inspirations.filter(i => i.status === 'unprocessed').length} 条待整理
            </span>
          </div>

          {recentInspirations.length === 0 ? (
            <div className="ios-card p-6 text-center">
              <p className="text-[14px] text-gray-400">收集箱是空的</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInspirations.map((inspiration) => (
                <div key={inspiration.id} className="ios-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-black leading-relaxed line-clamp-2">
                        {inspiration.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-gray-400">
                          {new Date(inspiration.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </span>
                        {inspiration.domain && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${DomainColors[inspiration.domain]}15`,
                              color: DomainColors[inspiration.domain]
                            }}
                          >
                            {DomainLabels[inspiration.domain]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button className="flex-1 py-2 text-[12px] font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      转任务
                    </button>
                    <button className="flex-1 py-2 text-[12px] font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      转选题
                    </button>
                    <button className="flex-1 py-2 text-[12px] font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      归档
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomTabBar />
      <FloatingActionButton onAddTask={handleAddTask} />

      {/* 任务弹窗 */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </main>
  );
}
