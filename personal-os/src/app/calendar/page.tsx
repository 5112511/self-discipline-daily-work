import { mockSchedule, DomainColors } from '@/data/mockData';
import { DomainLabels } from '@/types';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import FloatingActionButton from '@/components/FloatingActionButton';

export default function CalendarPage() {
  // 获取本周日期
  const today = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getWeekDates = () => {
    const dates = [];
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(diff + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const currentMonth = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

  // 按时间排序日程
  const sortedSchedule = [...mockSchedule].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* 顶部标题 */}
      <header className="pt-12 px-5 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-black tracking-tight">日程</h1>
            <p className="text-[15px] text-gray-500 mt-1">{currentMonth}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
            <button className="w-10 h-10 bg-black rounded-full flex items-center justify-center ml-2">
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* 周视图选择器 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex justify-between">
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            const dayName = weekDays[index];
            const dayNum = date.getDate();

            return (
              <button
                key={index}
                className={`flex flex-col items-center justify-center w-10 h-14 rounded-2xl transition-all ${
                  isToday ? 'bg-black text-white' : 'bg-transparent text-gray-600'
                }`}
              >
                <span className={`text-[11px] font-medium ${isToday ? 'text-gray-300' : 'text-gray-400'}`}>
                  {dayName}
                </span>
                <span className={`text-[17px] font-semibold mt-0.5 ${isToday ? 'text-white' : 'text-black'}`}>
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 今日时间轴 */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-black">今日安排</h2>
          <button className="text-[14px] font-medium text-gray-500">周视图</button>
        </div>

        {/* 时间轴 */}
        <div className="relative">
          {/* 时间刻度背景 */}
          <div className="absolute left-0 top-0 bottom-0 w-14 border-r border-gray-100">
            {Array.from({ length: 15 }, (_, i) => i + 7).map((hour) => (
              <div key={hour} className="h-20 flex items-start justify-end pr-3">
                <span className="text-[11px] text-gray-400 -mt-1.5">
                  {hour}:00
                </span>
              </div>
            ))}
          </div>

          {/* 日程内容 */}
          <div className="ml-16 space-y-2">
            {sortedSchedule.map((item) => {
              const startHour = new Date(item.startTime).getHours();
              const startMin = new Date(item.startTime).getMinutes();
              const endHour = new Date(item.endTime).getHours();
              const endMin = new Date(item.endTime).getMinutes();
              const duration = (endHour - startHour) * 60 + (endMin - startMin);
              const topOffset = (startHour - 7) * 80 + (startMin / 60) * 80;
              const height = (duration / 60) * 80;

              return (
                <div
                  key={item.id}
                  className={`absolute left-16 right-5 rounded-xl p-3 border-l-4 ${
                    item.completed ? 'bg-gray-50 opacity-60' : 'bg-gray-50'
                  }`}
                  style={{
                    top: topOffset,
                    height: Math.max(height, 60),
                    borderLeftColor: DomainColors[item.domain],
                  }}
                >
                  <div className="flex items-start justify-between h-full">
                    <div>
                      <p className={`text-[15px] font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-black'}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${DomainColors[item.domain]}15`,
                            color: DomainColors[item.domain]
                          }}
                        >
                          {DomainLabels[item.domain]}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {startHour}:{startMin.toString().padStart(2, '0')} - {endHour}:{endMin.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    {item.completed && (
                      <span className="text-[11px] text-gray-400">已完成</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 空时间块填充 */}
            <div className="h-[1200px]" />
          </div>
        </div>
      </div>

      {/* 快速添加 */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          <button className="flex-shrink-0 bg-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-medium text-black">添加日程</span>
          </button>
          <button className="flex-shrink-0 bg-white rounded-xl px-4 py-3 text-[14px] text-gray-600 shadow-sm">
            重复日程
          </button>
          <button className="flex-shrink-0 bg-white rounded-xl px-4 py-3 text-[14px] text-gray-600 shadow-sm">
            从任务创建
          </button>
        </div>
      </div>

      <BottomTabBar />
      <FloatingActionButton />
    </main>
  );
}
