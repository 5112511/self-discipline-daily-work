import React from 'react'

// 线性图标集 · 极简黑白灰
type P = { size?: number; stroke?: number; className?: string }
const S = ({ size = 22, stroke = 1.6, className, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
)

export const IconSun = (p: P) => <S {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></S>
export const IconFolder = (p: P) => <S {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></S>
export const IconCalendar = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></S>
export const IconInbox = (p: P) => <S {...p}><path d="M3 13l3-8h12l3 8" /><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /><path d="M3 13h5l2 3h4l2-3h5" /></S>
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></S>
export const IconPlus = (p: P) => <S {...p} stroke={2.2}><path d="M12 5v14M5 12h14" /></S>
export const IconCheck = (p: P) => <S {...p} stroke={2}><path d="M5 12l4 4 10-10" /></S>
export const IconChevronRight = (p: P) => <S {...p}><path d="M9 6l6 6-6 6" /></S>
export const IconFlame = (p: P) => <S {...p}><path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-2-1-4 0-7z" /></S>
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>
export const IconBolt = (p: P) => <S {...p}><path d="M13 3L4 14h7l-1 7 9-11h-7z" /></S>
export const IconMail = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></S>
export const IconLock = (p: P) => <S {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>
export const IconBulb = (p: P) => <S {...p}><path d="M9 18h6M10 21h4M12 2a6 6 0 0 0-4 10c1 1 2 2 2 4h4c0-2 1-3 2-4a6 6 0 0 0-4-10z" /></S>
export const IconSparkle = (p: P) => <S {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 3.5l.6 1.7L21.3 6l-1.7.6L19 8.3l-.6-1.7L16.7 6l1.7-.6z" /></S>
export const IconNote = (p: P) => <S {...p}><path d="M5 3h10l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M8 13h8M8 17h5" /></S>
export const IconPhoto = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M3 17l5-4 4 3 4-3 5 4" /></S>
export const IconFlag = (p: P) => <S {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></S>
export const IconArrowRight = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>
export const IconDots = (p: P) => <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></S>
export const IconRefresh = (p: P) => <S {...p}><path d="M4 12a8 8 0 0 1 13-6l2 2M20 12a8 8 0 0 1-13 6l-2-2" /><path d="M19 4v4h-4M5 20v-4h4" /></S>
export const IconDownload = (p: P) => <S {...p}><path d="M12 4v10M8 10l4 4 4-4M5 20h14" /></S>
export const IconTrash = (p: P) => <S {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></S>
export const IconPlay = (p: P) => <S {...p}><path d="M8 5l11 7-11 7z" /></S>
export const IconPause = (p: P) => <S {...p} stroke={2}><path d="M8 5v14M16 5v14" /></S>
export const IconClose = (p: P) => <S {...p} stroke={2}><path d="M6 6l12 12M18 6L6 18" /></S>
export const IconStop = (p: P) => <S {...p} stroke={2}><rect x="6" y="6" width="12" height="12" rx="2" /></S>
export const IconMenu = (p: P) => <S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>
export const IconWallet = (p: P) => <S {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5" /><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="16" cy="13.5" r="1.4" fill="currentColor" stroke="none" /></S>
export const IconArrowUp = (p: P) => <S {...p}><path d="M12 19V5M6 11l6-6 6 6" /></S>
export const IconArrowDown = (p: P) => <S {...p}><path d="M12 5v14M6 13l6 6 6-6" /></S>
