'use client';

import { Plus, CheckSquare, Lightbulb, FileText, Calendar, FolderPlus, Image } from 'lucide-react';
import { useState } from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const quickActions: QuickAction[] = [
  { id: 'task', label: '新任务', icon: CheckSquare, color: 'bg-black' },
  { id: 'inspiration', label: '新灵感', icon: Lightbulb, color: 'bg-gray-700' },
  { id: 'note', label: '新笔记', icon: FileText, color: 'bg-gray-600' },
  { id: 'event', label: '新日程', icon: Calendar, color: 'bg-gray-500' },
  { id: 'project', label: '新项目', icon: FolderPlus, color: 'bg-gray-400' },
  { id: 'photo', label: '照片', icon: Image, color: 'bg-gray-300' },
];

interface FloatingActionButtonProps {
  onAddTask?: () => void;
  onAddInspiration?: () => void;
}

export default function FloatingActionButton({ onAddTask, onAddInspiration }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionId: string) => {
    if (actionId === 'task' && onAddTask) {
      onAddTask();
    } else if (actionId === 'inspiration' && onAddInspiration) {
      onAddInspiration();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 快捷操作菜单 */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 animate-slide-up">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex items-center gap-3 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium text-gray-700 bg-white/90 px-3 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center shadow-lg text-white`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 主悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? 'rotate-45 bg-gray-800' : ''
        }`}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </>
  );
}
