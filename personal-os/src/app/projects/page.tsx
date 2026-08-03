import { mockProjects, mockTasks, DomainColors } from '@/data/mockData';
import { LifeDomain, DomainLabels } from '@/types';
import { Briefcase, Sparkles, Plane, Heart, Users, MapPin, ChevronRight, Plus, MoreHorizontal } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import FloatingActionButton from '@/components/FloatingActionButton';

const domainIcons: Record<LifeDomain, React.ElementType> = {
  [LifeDomain.CONTENT]: Briefcase,
  [LifeDomain.AI_LEARNING]: Sparkles,
  [LifeDomain.TRAVEL]: Plane,
  [LifeDomain.HEALTH]: Heart,
  [LifeDomain.TEACHING]: Users,
  [LifeDomain.PERSONAL]: MapPin,
};

export default function ProjectsPage() {
  // 获取每个项目的任务统计
  const getProjectStats = (projectId: string) => {
    const projectTasks = mockTasks.filter(t => t.projectId === projectId || t.domain === mockProjects.find(p => p.id === projectId)?.domain);
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return { total, completed };
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部标题 */}
      <header className="pt-12 px-5 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-black tracking-tight">项目中心</h1>
            <p className="text-[15px] text-gray-500 mt-1">管理你的六条生活主线</p>
          </div>
          <button className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* 项目统计概览 */}
      <div className="px-5 py-4 bg-white border-b border-gray-100">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          <div className="flex-shrink-0 bg-black rounded-2xl p-4 w-32">
            <p className="text-[11px] text-gray-400 font-medium uppercase">进行中</p>
            <p className="text-[28px] font-bold text-white mt-1">{mockProjects.length}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">个项目</p>
          </div>
          <div className="flex-shrink-0 bg-gray-100 rounded-2xl p-4 w-32">
            <p className="text-[11px] text-gray-500 font-medium uppercase">本周完成</p>
            <p className="text-[28px] font-bold text-black mt-1">12</p>
            <p className="text-[12px] text-gray-500 mt-0.5">个任务</p>
          </div>
          <div className="flex-shrink-0 bg-gray-100 rounded-2xl p-4 w-32">
            <p className="text-[11px] text-gray-500 font-medium uppercase">平均进度</p>
            <p className="text-[28px] font-bold text-black mt-1">
              {Math.round(mockProjects.reduce((acc, p) => acc + p.progress, 0) / mockProjects.length)}%
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5">总进度</p>
          </div>
        </div>
      </div>

      {/* 六大项目卡片 */}
      <div className="px-5 py-5 space-y-4">
        {mockProjects.map((project) => {
          const Icon = domainIcons[project.domain];
          const stats = getProjectStats(project.id);

          return (
            <div
              key={project.id}
              className="ios-card bg-white p-5"
            >
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${DomainColors[project.domain]}15` }}
                  >
                    <Icon size={24} style={{ color: DomainColors[project.domain] }} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-black">{project.name}</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      {stats.completed}/{stats.total} 任务完成
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <MoreHorizontal size={18} className="text-gray-400" />
                </button>
              </div>

              {/* 进度条 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-gray-500">项目进度</span>
                  <span className="text-[13px] font-semibold text-black">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: DomainColors[project.domain]
                    }}
                  />
                </div>
              </div>

              {/* 下一步行动 */}
              {project.nextAction && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-[11px] text-gray-400 font-medium uppercase mb-1">下一步行动</p>
                  <p className="text-[14px] text-black">{project.nextAction}</p>
                </div>
              )}

              {/* 截止日期/倒计时 */}
              {project.deadline && (
                <div className="flex items-center gap-2 text-[13px] text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  {project.domain === LifeDomain.TRAVEL ? (
                    <span>还有 18 天出发</span>
                  ) : (
                    <span>截止: {new Date(project.deadline).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              )}

              {/* 进入项目按钮 */}
              <button className="mt-4 w-full py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-black flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                进入项目
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 已完成项目 */}
      <div className="px-5 pb-8">
        <h3 className="text-[15px] font-semibold text-gray-500 mb-3">已完成项目</h3>
        <div className="ios-card bg-white p-4 flex items-center justify-between opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Briefcase size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[15px] text-black font-medium">年中复盘总结</p>
              <p className="text-[12px] text-gray-400">已于 6 月完成</p>
            </div>
          </div>
          <span className="text-[12px] text-gray-400">已完成</span>
        </div>
      </div>

      <BottomTabBar />
      <FloatingActionButton />
    </main>
  );
}
