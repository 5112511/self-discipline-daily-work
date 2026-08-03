'use client';

import { useState, useEffect } from 'react';
import { Task, LifeDomain, TaskStatus, DomainLabels } from '@/types';
import { DomainColors } from '@/data/mockData';
import { X, Check, Clock, Flag, Calendar, AlignLeft, ChevronDown } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
}

const initialTask: Partial<Task> = {
  title: '',
  description: '',
  domain: LifeDomain.PERSONAL,
  status: 'pending',
  priority: 3,
  isImportant: false,
  isUrgent: false,
  progress: 0,
  isInToday: false,
  isInTop3: false,
};

export default function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>(initialTask);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        domain: task.domain,
        status: task.status,
        priority: task.priority,
        isImportant: task.isImportant,
        isUrgent: task.isUrgent,
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
        progress: task.progress,
        nextAction: task.nextAction,
        isInToday: task.isInToday,
        isInTop3: task.isInTop3,
      });
    } else {
      setFormData(initialTask);
    }
    setErrors({});
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      setErrors({ title: '请输入任务标题' });
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    setFormData(initialTask);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!task;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 弹窗 */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* 头部 */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={20} className="text-gray-600" />
          </button>
          <h2 className="text-[17px] font-semibold text-black">
            {isEditing ? '编辑任务' : '新任务'}
          </h2>
          <button
            onClick={handleSubmit}
            className="w-10 h-10 rounded-full bg-black flex items-center justify-center"
          >
            <Check size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 标题 */}
          <div>
            <input
              type="text"
              placeholder="任务标题"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({});
              }}
              className="w-full text-[20px] font-semibold text-black placeholder-gray-300 border-none outline-none bg-transparent"
              autoFocus
            />
            {errors.title && (
              <p className="text-[12px] text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlignLeft size={18} className="text-gray-400 mt-0.5" />
              <textarea
                placeholder="添加详细描述..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex-1 text-[15px] text-black placeholder-gray-400 border-none outline-none bg-transparent resize-none min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* 领域选择 */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-2 block">所属领域</label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {Object.values(LifeDomain).map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setFormData({ ...formData, domain })}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                    formData.domain === domain
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={{
                    backgroundColor: formData.domain === domain ? DomainColors[domain] : undefined
                  }}
                >
                  {DomainLabels[domain]}
                </button>
              ))}
            </div>
          </div>

          {/* 状态选择 */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-2 block">任务状态</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status, progress: status === 'completed' ? 100 : formData.progress })}
                  className={`py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                    formData.status === status
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {status === 'pending' && '待处理'}
                  {status === 'in_progress' && '进行中'}
                  {status === 'completed' && '已完成'}
                </button>
              ))}
            </div>
          </div>

          {/* 优先级和重要程度 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] text-gray-500 font-medium mb-2 block">优先级</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-medium transition-all ${
                      formData.priority === p
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[13px] text-gray-500 font-medium mb-2 block">重要程度</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isImportant: !formData.isImportant })}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    formData.isImportant
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  重要
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    formData.isUrgent
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  紧急
                </button>
              </div>
            </div>
          </div>

          {/* 截止时间和预计用时 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-[13px] text-gray-500">截止日期</span>
              </div>
              <input
                type="date"
                value={formData.dueDate?.split('T')[0] || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? `${e.target.value}T00:00:00` : undefined })}
                className="w-full text-[15px] text-black bg-transparent border-none outline-none"
              />
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-[13px] text-gray-500">预计用时</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.estimatedMinutes || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="flex-1 text-[15px] text-black bg-transparent border-none outline-none"
                  placeholder="分钟"
                />
                <span className="text-[13px] text-gray-400">分钟</span>
              </div>
            </div>
          </div>

          {/* 进度 */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-2 block">
              进度 {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-gray-400">0%</span>
              <span className="text-[11px] text-gray-400">50%</span>
              <span className="text-[11px] text-gray-400">100%</span>
            </div>
          </div>

          {/* 下一步行动 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flag size={16} className="text-gray-400" />
              <span className="text-[13px] text-gray-500">下一步行动</span>
            </div>
            <input
              type="text"
              value={formData.nextAction || ''}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              placeholder="接下来要做什么？"
              className="w-full text-[15px] text-black placeholder-gray-400 bg-transparent border-none outline-none"
            />
          </div>

          {/* 加入今日/Top 3 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isInToday: !formData.isInToday })}
              className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                formData.isInToday
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {formData.isInToday ? '✓ 已加入今日' : '加入今日'}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isInTop3: !formData.isInTop3 })}
              className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                formData.isInTop3
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {formData.isInTop3 ? '✓ 已加入 Top 3' : '加入 Top 3'}
            </button>
          </div>

          {/* 保存按钮 */}
          <button
            type="submit"
            className="w-full py-4 bg-black text-white rounded-2xl text-[17px] font-semibold"
          >
            {isEditing ? '保存修改' : '创建任务'}
          </button>
        </form>
      </div>
    </div>
  );
}
