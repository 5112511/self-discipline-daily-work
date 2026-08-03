'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DomainLabels, InspirationSource, LifeDomain } from '@/types';
import { Plus, Lightbulb, Mic, Mail, Image, Globe, MoreHorizontal, CheckSquare, FolderOpen, FileText, Bookmark, X } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import FloatingActionButton from '@/components/FloatingActionButton';
import TaskModal from '@/components/TaskModal';
import { DomainColors } from '@/data/mockData';

// 来源图标映射
const sourceIcons: Record<InspirationSource, React.ElementType> = {
  manual: Lightbulb,
  voice: Mic,
  gmail: Mail,
  image: Image,
  web: Globe,
  other: MoreHorizontal,
};

const sourceLabels: Record<InspirationSource, string> = {
  manual: '手动记录',
  voice: '语音记录',
  gmail: 'Gmail',
  image: '图片',
  web: '网页',
  other: '其他',
};

export default function InboxPage() {
  const { inspirations, addInspiration, updateInspiration, convertInspiration, deleteInspiration, addTask, isLoaded } = useApp();
  const [newInspirationContent, setNewInspirationContent] = useState('');
  const [isAddingInspiration, setIsAddingInspiration] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [convertingInspiration, setConvertingInspiration] = useState<string | null>(null);

  // 等待数据加载
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </main>
    );
  }

  const unprocessedInspirations = useMemo(() => {
    return inspirations.filter(i => i.status === 'unprocessed');
  }, [inspirations]);

  const unprocessedCount = unprocessedInspirations.length;

  // 计算最早未整理时间
  const earliestUnprocessed = useMemo(() => {
    if (unprocessedInspirations.length === 0) return null;
    const sorted = [...unprocessedInspirations].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const days = Math.floor((new Date().getTime() - new Date(sorted[0].createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }, [unprocessedInspirations]);

  // 计算今日新增
  const todayAdded = useMemo(() => {
    const today = new Date().toDateString();
    return inspirations.filter(i => new Date(i.createdAt).toDateString() === today).length;
  }, [inspirations]);

  // 处理添加灵感
  const handleAddInspiration = () => {
    if (!newInspirationContent.trim()) return;
    addInspiration(newInspirationContent, 'manual');
    setNewInspirationContent('');
    setIsAddingInspiration(false);
  };

  // 处理转化为任务
  const handleConvertToTask = (inspirationId: string, content: string, domain?: LifeDomain) => {
    setConvertingInspiration(inspirationId);
    setIsTaskModalOpen(true);
  };

  // 处理保存任务（转化后）
  const handleSaveTask = (taskData: Partial<import('@/types').Task>) => {
    const newTask = addTask(taskData as Omit<import('@/types').Task, 'id' | 'createdAt'>);
    if (convertingInspiration) {
      convertInspiration(convertingInspiration, 'task', newTask.id);
      setConvertingInspiration(null);
    }
    setIsTaskModalOpen(false);
  };

  // 处理归档
  const handleArchive = (inspirationId: string) => {
    updateInspiration(inspirationId, { status: 'archived' });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部标题 */}
      <header className="pt-12 px-5 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-black tracking-tight">收集箱</h1>
            <p className="text-[15px] text-gray-500 mt-1">
              {unprocessedCount} 条待整理
            </p>
          </div>
          <button
            onClick={() => setIsAddingInspiration(true)}
            className="w-10 h-10 bg-black rounded-full flex items-center justify-center"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* 快速输入区 */}
      <div className="px-5 py-4 bg-white border-b border-gray-100">
        {isAddingInspiration ? (
          <div className="bg-gray-100 rounded-2xl p-4">
            <textarea
              value={newInspirationContent}
              onChange={(e) => setNewInspirationContent(e.target.value)}
              placeholder="记录想法、任务或灵感..."
              className="w-full text-[15px] text-black placeholder-gray-400 bg-transparent border-none outline-none resize-none min-h-[60px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setIsAddingInspiration(false);
                  setNewInspirationContent('');
                }}
                className="px-4 py-2 text-[14px] text-gray-500"
              >
                取消
              </button>
              <button
                onClick={handleAddInspiration}
                disabled={!newInspirationContent.trim()}
                className="px-4 py-2 bg-black text-white rounded-full text-[14px] font-medium disabled:opacity-50"
              >
                记录
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsAddingInspiration(true)}
            className="bg-gray-100 rounded-2xl p-4 cursor-pointer"
          >
            <p className="text-[15px] text-gray-400">记录想法、任务或灵感...</p>
            <div className="flex items-center gap-4 mt-4">
              <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mic size={18} className="text-gray-600" />
              </button>
              <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Image size={18} className="text-gray-600" />
              </button>
              <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Globe size={18} className="text-gray-600" />
              </button>
              <span className="flex-1 text-right text-[14px] text-gray-400">点击快速记录</span>
            </div>
          </div>
        )}
      </div>

      {/* 来源筛选 */}
      <div className="px-5 py-4 bg-white">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-full text-[13px] font-medium">
            全部
          </button>
          <button className="flex-shrink-0 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-[13px] font-medium">
            手动记录
          </button>
          <button className="flex-shrink-0 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-[13px] font-medium">
            语音
          </button>
          <button className="flex-shrink-0 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-1">
            Gmail
            <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded-full">演示</span>
          </button>
        </div>
      </div>

      {/* 灵感列表 */}
      <div className="px-5 py-5 space-y-4">
        {/* 统计卡片 */}
        <div className="ios-card bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] text-gray-500">最早未整理</p>
            <p className="text-[15px] font-medium text-black mt-0.5">
              {earliestUnprocessed !== null ? `${earliestUnprocessed} 天前` : '无'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[13px] text-gray-500">今日新增</p>
            <p className="text-[15px] font-medium text-black mt-0.5">{todayAdded} 条</p>
          </div>
        </div>

        {/* 灵感卡片 */}
        {unprocessedInspirations.length === 0 ? (
          <div className="ios-card bg-white p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Lightbulb size={28} className="text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-500">收集箱是空的</p>
            <p className="text-[13px] text-gray-400 mt-1">点击右上角 + 记录新灵感</p>
          </div>
        ) : (
          unprocessedInspirations.map((inspiration) => {
            const SourceIcon = sourceIcons[inspiration.source];

            return (
              <div key={inspiration.id} className="ios-card bg-white p-5">
                {/* 头部信息 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <SourceIcon size={16} className="text-gray-500" />
                    </div>
                    <span className="text-[12px] text-gray-500">{sourceLabels[inspiration.source]}</span>
                  </div>
                  <button
                    onClick={() => deleteInspiration(inspiration.id)}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>

                {/* 内容 */}
                <p className="text-[16px] text-black leading-relaxed mb-4">
                  {inspiration.content}
                </p>

                {/* 领域标签 */}
                {inspiration.domain && (
                  <div className="mb-4">
                    <span
                      className="text-[12px] px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${DomainColors[inspiration.domain]}15`,
                        color: DomainColors[inspiration.domain]
                      }}
                    >
                      {DomainLabels[inspiration.domain]}
                    </span>
                  </div>
                )}

                {/* 转化操作 */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleConvertToTask(inspiration.id, inspiration.content, inspiration.domain)}
                    className="flex flex-col items-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <CheckSquare size={18} className="text-gray-600" />
                    </div>
                    <span className="text-[11px] text-gray-500">转任务</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FolderOpen size={18} className="text-gray-600" />
                    </div>
                    <span className="text-[11px] text-gray-500">转项目</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FileText size={18} className="text-gray-600" />
                    </div>
                    <span className="text-[11px] text-gray-500">转笔记</span>
                  </button>
                  <button
                    onClick={() => handleArchive(inspiration.id)}
                    className="flex flex-col items-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Bookmark size={18} className="text-gray-600" />
                    </div>
                    <span className="text-[11px] text-gray-500">归档</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Gmail 演示区域 */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-gray-500">Gmail 邮件</h3>
          <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">演示数据</span>
        </div>

        <div className="ios-card bg-white p-4 opacity-70">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-medium text-black truncate">航班预订确认</p>
                <span className="text-[11px] text-gray-400">昨天</span>
              </div>
              <p className="text-[13px] text-gray-500 truncate">您的泰国往返机票预订详情...</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">可能需要行动</span>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl text-[14px] text-gray-500 flex items-center justify-center gap-2">
          <Plus size={16} />
          连接 Gmail
        </button>
      </div>

      <BottomTabBar />
      <FloatingActionButton onAddInspiration={() => setIsAddingInspiration(true)} />

      {/* 任务弹窗（用于转化灵感为任务） */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setConvertingInspiration(null);
        }}
        onSave={handleSaveTask}
        task={null}
      />
    </main>
  );
}
