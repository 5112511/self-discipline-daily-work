'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DomainLabels, LifeDomain } from '@/types';
import { User, Settings, Download, Upload, Trash2, RefreshCw, ChevronRight, Award, Target, Clock, TrendingUp, Check, X } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import FloatingActionButton from '@/components/FloatingActionButton';
import ProgressRing from '@/components/ProgressRing';
import { DomainColors } from '@/data/mockData';

export default function ProfilePage() {
  const { tasks, projects, inspirations, profile, exportData, importData, resetToDemoData, isLoaded } = useApp();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 等待数据加载
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </main>
    );
  }

  // 计算统计数据
  const stats = useMemo(() => {
    const weekCompleted = tasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedDate >= weekAgo;
    }).length;

    const top3Tasks = tasks.filter(t => t.isInTop3);
    const top3Completed = top3Tasks.filter(t => t.status === 'completed').length;
    const top3Rate = top3Tasks.length > 0 ? Math.round((top3Completed / top3Tasks.length) * 100) : 0;

    const inboxCleared = inspirations.filter(i => i.status !== 'unprocessed').length;

    return {
      weekCompleted,
      top3Rate,
      inboxCleared
    };
  }, [tasks, inspirations]);

  // 计算项目进度
  const projectStats = useMemo(() => {
    const contentProj = projects.find(p => p.domain === LifeDomain.CONTENT);
    const travelProj = projects.find(p => p.domain === LifeDomain.TRAVEL);
    const healthProj = projects.find(p => p.domain === LifeDomain.HEALTH);
    const aiProj = projects.find(p => p.domain === LifeDomain.AI_LEARNING);

    const travelDaysLeft = travelProj?.deadline ?
      Math.ceil((new Date(travelProj.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
      18;

    return {
      content: contentProj?.progress || 0,
      travel: travelProj?.progress || 0,
      health: healthProj?.progress || 0,
      ai: aiProj?.progress || 0,
      travelDaysLeft
    };
  }, [projects]);

  // 处理导出
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  // 处理导入
  const handleImport = () => {
    setImportError('');
    if (!importContent.trim()) {
      setImportError('请输入数据内容');
      return;
    }
    const success = importData(importContent);
    if (success) {
      setShowImportModal(false);
      setImportContent('');
    } else {
      setImportError('数据格式错误，请检查');
    }
  };

  // 处理恢复演示数据
  const handleReset = () => {
    resetToDemoData();
    setShowConfirmReset(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部个人信息 */}
      <header className="pt-12 px-5 pb-6 bg-white">
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
            <User size={32} className="text-gray-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-[24px] font-bold text-black">{profile.name}</h1>
            <p className="text-[14px] text-gray-500 mt-0.5">Personal OS 用户</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[12px] bg-black text-white px-3 py-1 rounded-full">
                连续 {profile.streakDays || 0} 天
              </span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* 本周概览 */}
      <div className="px-5 py-5">
        <h2 className="text-[20px] font-bold text-black mb-4">本周概览</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* 完成任务 */}
          <div className="ios-card bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <Target size={16} className="text-white" />
              </div>
              <span className="text-[12px] text-gray-500">本周完成</span>
            </div>
            <p className="text-[28px] font-bold text-black">{stats.weekCompleted}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">个任务</p>
          </div>

          {/* Top 3 完成率 */}
          <div className="ios-card bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Award size={16} className="text-gray-600" />
              </div>
              <span className="text-[12px] text-gray-500">Top 3 完成率</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-[28px] font-bold text-black">{stats.top3Rate}%</p>
              <ProgressRing progress={stats.top3Rate} size={28} strokeWidth={3} />
            </div>
          </div>

          {/* 专注时间 */}
          <div className="ios-card bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock size={16} className="text-gray-600" />
              </div>
              <span className="text-[12px] text-gray-500">待办任务</span>
            </div>
            <p className="text-[28px] font-bold text-black">
              {tasks.filter(t => t.status !== 'completed').length}
            </p>
            <p className="text-[12px] text-gray-400 mt-0.5">个待办</p>
          </div>

          {/* 收集箱清空 */}
          <div className="ios-card bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-gray-600" />
              </div>
              <span className="text-[12px] text-gray-500">收集箱处理</span>
            </div>
            <p className="text-[28px] font-bold text-black">{stats.inboxCleared}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">条已整理</p>
          </div>
        </div>
      </div>

      {/* 项目进度 */}
      <div className="px-5 pb-5">
        <h2 className="text-[20px] font-bold text-black mb-4">项目进度</h2>

        <div className="ios-card bg-white p-5">
          <div className="space-y-5">
            {/* 内容创作 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DomainColors[LifeDomain.CONTENT] }}
                  />
                  <span className="text-[14px] text-black">{DomainLabels[LifeDomain.CONTENT]}</span>
                </div>
                <span className="text-[14px] font-semibold text-black">{projectStats.content}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${projectStats.content}%`,
                    backgroundColor: DomainColors[LifeDomain.CONTENT]
                  }}
                />
              </div>
            </div>

            {/* 泰国旅行 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DomainColors[LifeDomain.TRAVEL] }}
                  />
                  <span className="text-[14px] text-black">{DomainLabels[LifeDomain.TRAVEL]}</span>
                </div>
                <span className="text-[14px] font-semibold text-black">{projectStats.travel}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${projectStats.travel}%`,
                    backgroundColor: DomainColors[LifeDomain.TRAVEL]
                  }}
                />
              </div>
              <p className="text-[12px] text-gray-400 mt-1.5">还有 {projectStats.travelDaysLeft} 天出发</p>
            </div>

            {/* 健康项目 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DomainColors[LifeDomain.HEALTH] }}
                  />
                  <span className="text-[14px] text-black">{DomainLabels[LifeDomain.HEALTH]}</span>
                </div>
                <span className="text-[14px] font-semibold text-black">{projectStats.health}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${projectStats.health}%`,
                    backgroundColor: DomainColors[LifeDomain.HEALTH]
                  }}
                />
              </div>
            </div>

            {/* AI 学习 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DomainColors[LifeDomain.AI_LEARNING] }}
                  />
                  <span className="text-[14px] text-black">{DomainLabels[LifeDomain.AI_LEARNING]}</span>
                </div>
                <span className="text-[14px] font-semibold text-black">{projectStats.ai}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${projectStats.ai}%`,
                    backgroundColor: DomainColors[LifeDomain.AI_LEARNING]
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设置选项 */}
      <div className="px-5 pb-8">
        <h2 className="text-[20px] font-bold text-black mb-4">设置</h2>

        <div className="ios-card bg-white divide-y divide-gray-50">
          <button
            onClick={handleExport}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <Upload size={18} className="text-gray-600" />
              </div>
              <div className="text-left">
                <span className="text-[15px] text-black block">导出数据</span>
                {exportSuccess && (
                  <span className="text-[12px] text-green-600">已下载到本地</span>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <Download size={18} className="text-gray-600" />
              </div>
              <span className="text-[15px] text-black">导入数据</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button
            onClick={() => setShowConfirmReset(true)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <RefreshCw size={18} className="text-gray-600" />
              </div>
              <span className="text-[15px] text-black">恢复演示数据</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button
            onClick={() => setShowConfirmClear(true)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <span className="text-[15px] text-red-500">清除所有数据</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        {/* 版本信息 */}
        <p className="text-center text-[12px] text-gray-400 mt-6">
          Personal OS v1.0 · 第二阶段
        </p>
      </div>

      <BottomTabBar />
      <FloatingActionButton />

      {/* 导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowImportModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-black">导入数据</h3>
              <button onClick={() => setShowImportModal(false)}>
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <textarea
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              placeholder="粘贴之前导出的 JSON 数据..."
              className="w-full h-40 p-4 bg-gray-100 rounded-2xl text-[14px] text-black border-none outline-none resize-none"
            />
            {importError && (
              <p className="text-[13px] text-red-500 mt-2">{importError}</p>
            )}
            <button
              onClick={handleImport}
              className="w-full mt-4 py-4 bg-black text-white rounded-2xl text-[16px] font-semibold"
            >
              导入
            </button>
          </div>
        </div>
      )}

      {/* 确认恢复演示数据 */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirmReset(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={28} className="text-amber-600" />
            </div>
            <h3 className="text-[18px] font-semibold text-black mb-2">恢复演示数据？</h3>
            <p className="text-[14px] text-gray-500 mb-6">
              这将覆盖当前所有数据，恢复到初始演示状态。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 bg-gray-100 text-black rounded-2xl text-[16px] font-medium"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-black text-white rounded-2xl text-[16px] font-medium"
              >
                恢复
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认清除数据 */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirmClear(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-[18px] font-semibold text-black mb-2">清除所有数据？</h3>
            <p className="text-[14px] text-gray-500 mb-6">
              此操作不可撤销，所有任务、项目和灵感将被删除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-3 bg-gray-100 text-black rounded-2xl text-[16px] font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-[16px] font-medium"
              >
                清除
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
