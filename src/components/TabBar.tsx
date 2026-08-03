import React from 'react'
import { IconSun, IconFolder, IconCalendar, IconInbox, IconUser, IconPlus, IconCheck, IconNote, IconBulb, IconPhoto } from './Icons'

export type TabKey = 'today' | 'project' | 'schedule' | 'inbox' | 'me'

const TABS: { key: TabKey; label: string; Icon: any }[] = [
  { key: 'today', label: '今日', Icon: IconSun },
  { key: 'project', label: '项目', Icon: IconFolder },
  { key: 'schedule', label: '日程', Icon: IconCalendar },
  { key: 'inbox', label: '收集箱', Icon: IconInbox },
  { key: 'me', label: '我的', Icon: IconUser },
]

export function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className="tabbar">
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key
        return (
          <button key={key} className={'tab' + (on ? ' on' : '')} onClick={() => onChange(key)}>
            <Icon size={24} stroke={on ? 2 : 1.6} />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function FabButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" onClick={onClick} aria-label="快速记录">
      <IconPlus size={26} />
    </button>
  )
}

const ACTIONS: { label: string; desc: string; Icon: any }[] = [
  { label: '新任务', desc: '一个明确的下一步行动', Icon: IconCheck },
  { label: '新灵感', desc: '一句话，先记下来', Icon: IconBulb },
  { label: '新笔记', desc: '稍后展开思考', Icon: IconNote },
  { label: '新日程', desc: '安排到时间轴', Icon: IconCalendar },
  { label: '新项目', desc: '开启一条新主线', Icon: IconFolder },
  { label: '照片/文件', desc: '留存素材', Icon: IconPhoto },
]

export function ActionSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick?: (label: string) => void }) {
  if (!open) return null
  const pick = (label: string) => { onPick?.(label) }
  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div className="t-h3">快速记录</div>
          <button className="t-sub tap" onClick={onClose}>取消</button>
        </div>
        <div className="sheet-list">
          {ACTIONS.map(({ label, desc, Icon }) => (
            <button key={label} className="sheet-item" onClick={() => pick(label)}>
              <span className="icn-box"><Icon size={18} /></span>
              <span className="sheet-item-text">
                <span className="t-body" style={{ fontWeight: 500 }}>{label}</span>
                <span className="t-cap">{desc}</span>
              </span>
              <span className="t-cap">›</span>
            </button>
          ))}
        </div>
        <div className="sheet-foot">任意高频功能最多两次点击即可到达</div>
      </div>
    </div>
  )
}
