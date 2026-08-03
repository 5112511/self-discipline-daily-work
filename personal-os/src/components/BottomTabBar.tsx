'use client';

import { Home, FolderOpen, CalendarDays, Inbox, User } from 'lucide-react';
import { TabType } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  href: string;
}

const tabs: TabItem[] = [
  { id: 'today', label: '今日', icon: Home, href: '/' },
  { id: 'projects', label: '项目', icon: FolderOpen, href: '/projects' },
  { id: 'calendar', label: '日程', icon: CalendarDays, href: '/calendar' },
  { id: 'inbox', label: '收集箱', icon: Inbox, href: '/inbox' },
  { id: 'profile', label: '我的', icon: User, href: '/profile' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const getActiveTab = (): TabType => {
    if (pathname === '/') return 'today';
    if (pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/inbox')) return 'inbox';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'today';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* iOS 毛玻璃背景 */}
      <div className="glass border-t border-gray-200/50">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                    isActive ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  <div className="relative">
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2 : 1.5}
                      className="transition-all duration-200"
                    />
                    {tab.id === 'inbox' && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                        5
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
