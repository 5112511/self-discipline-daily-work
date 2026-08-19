import React, { useState, useCallback } from 'react'
import { TabBar, FabButton, ActionSheet, type TabKey } from './components/TabBar'
import { TodayPage } from './pages/TodayPage'
import { ProjectPage } from './pages/ProjectPage'
import { SchedulePage } from './pages/SchedulePage'
import { InboxPage } from './pages/InboxPage'
import { MePage } from './pages/MePage'
import { ConfirmProvider } from './components/ConfirmSheet'
import { ToastProvider, useToast } from './components/Toast'
import { TaskSheet } from './components/TaskSheet'
import { FocusOverlay } from './components/FocusOverlay'
import { SideDrawer, type DrawerItem } from './components/SideDrawer'
import { LedgerPage } from './pages/LedgerPage'
import { TrendingPage } from './pages/TrendingPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { HistoryPage } from './pages/HistoryPage'
import { CountdownPage } from './pages/CountdownPage'
import { AuthPage } from './pages/AuthPage'
import { useAuth } from './lib/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { store } from './store'
import type { Task } from './types'
import { IconCheck, IconBulb, IconNote, IconCalendar, IconFolder, IconPhoto, IconMenu } from './components/Icons'

// 全局任务表单上下文：任意页面可打开"新建/编辑任务"
export const TaskSheetCtx = React.createContext<{
  openNew: () => void
  openEdit: (t: Task) => void
}>({ openNew: () => {}, openEdit: () => {} })
export const useTaskSheet = () => React.useContext(TaskSheetCtx)

// 全局专注模式上下文
export const FocusCtx = React.createContext<{ open: (taskId?: string) => void; close: () => void }>({ open: () => {}, close: () => {} })
export const useFocus = () => React.useContext(FocusCtx)

// 全局侧边栏上下文
export const DrawerCtx = React.createContext<{ open: () => void; close: () => void }>({ open: () => {}, close: () => {} })
export const useDrawer = () => React.useContext(DrawerCtx)

export default function App() {
  const auth = useAuth()
  const initial = (typeof location !== 'undefined' && location.hash.replace('#', '')) as TabKey
  const [tab, setTab] = useState<TabKey>(['today', 'project', 'schedule', 'inbox', 'me'].includes(initial) ? initial : 'today')
  const [sheet, setSheet] = useState(false)
  const [taskSheet, setTaskSheet] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [focus, setFocus] = useState<{ open: boolean; taskId?: string }>({ open: false })
  const [drawer, setDrawer] = useState(false)
  const [extraView, setExtraView] = useState<null | 'ledger' | 'trending' | 'history' | 'countdown' | { view: 'project'; projectId: string }>(null)
  const [offlineMode, setOfflineMode] = useState(!auth.isConfigured && !auth.user)

  // 切换 tab 时关闭额外视图
  const switchTab = useCallback((k: TabKey) => { setTab(k); setExtraView(null) }, [])

  // 响应浏览器前进/后退/手动改 hash
  React.useEffect(() => {
    const onHash = () => {
      const k = location.hash.replace('#', '') as TabKey
      if (['today', 'project', 'schedule', 'inbox', 'me'].includes(k)) setTab(k)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const openNew = useCallback(() => setTaskSheet({ open: true, task: null }), [])
  const openEdit = useCallback((t: Task) => setTaskSheet({ open: true, task: t }), [])
  const openFocus = useCallback((taskId?: string) => setFocus({ open: true, taskId }), [])
  const closeFocus = useCallback(() => setFocus({ open: false }), [])
  const openDrawer = useCallback(() => setDrawer(true), [])
  const closeDrawer = useCallback(() => setDrawer(false), [])

  // 侧边栏菜单项跳转
  const onDrawerPick = (k: DrawerItem) => {
    setDrawer(false)
    if (k === 'today') { switchTab('today') }
    else if (k === 'schedule') { switchTab('schedule') }
    else if (k === 'ledger') { setExtraView('ledger') }
    else if (k === 'trending') { setExtraView('trending') }
    else if (k === 'history') { setExtraView('history') }
    else if (k === 'countdown') { setExtraView('countdown') }
  }

  const openProjectDetail = useCallback((projectId: string) => setExtraView({ view: 'project', projectId }), [])
  const closeExtra = useCallback(() => setExtraView(null), [])
  const onQuick = (label: string) => {
    setSheet(false)
    if (label === '新任务') openNew()
    else if (label === '新灵感') { setTab('inbox'); /* InboxPage 自己会高亮输入框 */ }
    else if (label === '新日程') setTab('schedule')
    else if (label === '新项目') setTab('project')
  }

  return (
    <ErrorBoundary>
    <ConfirmProvider>
      <ToastProvider>
        <TaskSheetCtx.Provider value={{ openNew, openEdit }}>
        <FocusCtx.Provider value={{ open: openFocus, close: closeFocus }}>
        <DrawerCtx.Provider value={{ open: openDrawer, close: closeDrawer }}>
          {/* 未登录且未选离线模式：显示登录页 */}
          {!auth.user && !offlineMode ? (
            <AuthPage
              onAuthed={(id, email, nickname) => { if (nickname) store.updateSettings({ displayName: nickname, avatarText: nickname.slice(0, 1) }); auth.signIn(id, email); setOfflineMode(false) }}
              onOffline={() => setOfflineMode(true)}
            />
          ) : (
          <div className="phone-shell">
            <div className="app">
              {/* 悬浮菜单按钮：固定在左上角，透明玻璃质感椭圆 */}
              <button className="fab-menu tap" onClick={openDrawer} aria-label="菜单"><IconMenu size={20} /></button>

              {extraView === 'ledger' && <LedgerPage onBack={closeExtra} />}
              {extraView === 'trending' && <TrendingPage onBack={closeExtra} />}
              {extraView === 'history' && <HistoryPage onBack={closeExtra} />}
              {extraView === 'countdown' && <CountdownPage onBack={closeExtra} />}
              {extraView && (extraView as { view: string }).view === 'project' && <ProjectDetailPage projectId={(extraView as { projectId: string }).projectId} onBack={closeExtra} onEditTask={openEdit} />}
              {!extraView && tab === 'today' && <TodayPage onSwitchTab={switchTab} onOpenHistory={() => setExtraView('history')} />}
              {!extraView && tab === 'project' && <ProjectPage onOpenDetail={openProjectDetail} />}
              {!extraView && tab === 'schedule' && <SchedulePage />}
              {!extraView && tab === 'inbox' && <InboxPage onOpenProject={openProjectDetail} />}
              {!extraView && tab === 'me' && <MePage auth={auth} onExitOffline={() => setOfflineMode(false)} />}
            </div>

            {extraView ? null : <FabButton onClick={() => setSheet(true)} />}
            {extraView ? null : <TabBar active={tab} onChange={switchTab} />}
            <ActionSheet
              open={sheet}
              onClose={() => setSheet(false)}
              onPick={onQuick}
            />
            <TaskSheet
              open={taskSheet.open}
              task={taskSheet.task}
              onClose={() => setTaskSheet({ open: false, task: null })}
            />
            <FocusOverlay open={focus.open} presetTaskId={focus.taskId} onClose={closeFocus} />
            <SideDrawer open={drawer} onClose={closeDrawer} onPick={onDrawerPick} />
                </div>
          )}
        </DrawerCtx.Provider>
        </FocusCtx.Provider>
        </TaskSheetCtx.Provider>
      </ToastProvider>
    </ConfirmProvider>
    </ErrorBoundary>
  )
}
