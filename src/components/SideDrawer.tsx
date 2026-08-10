import React from 'react'
import { useStore } from '../useStore'
import { DOMAIN_LABEL } from '../types'
import { IconClose, IconSun, IconCalendar, IconWallet, IconBolt, IconChevronRight, IconClock } from './Icons'

export type DrawerItem = 'today' | 'ledger' | 'schedule' | 'trending' | 'history'

const ITEMS: { key: DrawerItem; label: string; desc: string; Icon: any }[] = [
  { key: 'today', label: '计划', desc: '今日 Top3 · 待办', Icon: IconSun },
  { key: 'history', label: '历史', desc: '时间轴日记 · 回收站', Icon: IconClock },
  { key: 'ledger', label: '账本', desc: '净资产 · 收支 · 账户', Icon: IconWallet },
  { key: 'schedule', label: '日程', desc: '时间轴 · 日历', Icon: IconCalendar },
  { key: 'trending', label: '热点跟踪', desc: '微博/小红书/抖音 · 关键词过滤', Icon: IconBolt },
]

export function SideDrawer({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (k: DrawerItem) => void }) {
  const data = useStore()
  const netWorth = data.ledger.accounts.reduce((a, x) => a + x.balance, 0)
  const todayDone = data.tasks.filter(t => t.inToday && t.status === 'done' && !t.deletedAt).length
  const todayTotal = data.tasks.filter(t => t.inToday && !t.deletedAt).length || 0

  return (
    <>
      <div className={'drawer-mask' + (open ? ' show' : '')} onClick={onClose} />
      <aside className={'side-drawer nav' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="drawer-head">
          <div className="drawer-user">
            <div className="drawer-avatar">{data.settings.avatarText}</div>
            <div>
              <div className="t-body" style={{ fontWeight: 600 }}>{data.settings.displayName}</div>
              <div className="t-cap">今日 {todayDone}/{todayTotal} · 净资产 ¥{netWorth.toLocaleString('zh-CN')}</div>
            </div>
          </div>
          <button className="t-sub tap" onClick={onClose}><IconClose size={20} /></button>
        </div>

        <div className="drawer-nav">
          {ITEMS.map(({ key, label, desc, Icon }) => (
            <button key={key} className="drawer-nav-item tap" onClick={() => onPick(key)}>
              <span className="dn-icn"><Icon size={20} /></span>
              <div className="dn-body">
                <div className="t-body" style={{ fontWeight: 500 }}>{label}</div>
                <div className="t-cap">{desc}</div>
              </div>
              <IconChevronRight size={16} />
            </button>
          ))}
        </div>

        <div className="drawer-foot">
          <div className="t-cap">{DOMAIN_LABEL['life']} · Personal OS</div>
          <div className="t-cap">本地存储 · 隐私优先</div>
        </div>
      </aside>
    </>
  )
}
