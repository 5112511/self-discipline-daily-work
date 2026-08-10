// ===== 美学调色板：为各类分类提供稳定、和谐的颜色 =====
// 色板：雾霾蓝 / 复古绿 / 暖橙 / 豆沙粉 / 雾灰紫 / 鸭蛋青 / 焦糖 / 鼠尾草
// 所有颜色低饱和、可在浅底卡片上作背景与边框，文字用对应深色

export interface PaletteColor {
  base: string   // 主色（用于圆点/边框/图标背景）
  soft: string   // 软背景（用于 chip 背景）
  ink: string    // 深色文字（用于深底白字场景）
}

// 8 色美学板，循环分配
export const PALETTE: PaletteColor[] = [
  { base: '#5B7C99', soft: '#E8EEF3', ink: '#3A5670' }, // 雾霾蓝
  { base: '#7A9A6B', soft: '#ECF1E8', ink: '#556E49' }, // 复古绿 / 鼠尾草
  { base: '#D98E48', soft: '#F8EDDF', ink: '#9C5E1F' }, // 暖橙 / 焦糖
  { base: '#B57E8E', soft: '#F3E7EB', ink: '#834B5C' }, // 豆沙粉
  { base: '#8A86A6', soft: '#EDEAF2', ink: '#5C5878' }, // 雾灰紫
  { base: '#6FA3A3', soft: '#E6F0F0', ink: '#427070' }, // 鸭蛋青
  { base: '#C9A96E', soft: '#F5EEDD', ink: '#8A6E36' }, // 燕麦金
  { base: '#9C8A78', soft: '#F0EBE4', ink: '#6B5D4D' }, // 摩卡灰
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** 按 key 稳定取一个调色板色（用于自由分类，如账本 category） */
export function colorOf(key: string): PaletteColor {
  if (!key) return PALETTE[0]
  return PALETTE[hashStr(key) % PALETTE.length]
}

// Domain 固定映射，保证语义一致
import type { Domain, AccountKind } from './types'

export const DOMAIN_COLOR: Record<Domain, PaletteColor> = {
  content: PALETTE[0], // 雾霾蓝 — 内容创作
  ai: PALETTE[4],      // 雾灰紫 — AI 学习
  health: PALETTE[1],  // 复古绿 — 健康
  class: PALETTE[5],   // 鸭蛋青 — 技能提升
  work: PALETTE[3],    // 暖橙 — 工作
  life: PALETTE[6],    // 燕麦金 — 生活
}

export const ACCOUNT_KIND_COLOR: Record<AccountKind, PaletteColor> = {
  cash: PALETTE[6],
  bank: PALETTE[0],
  alipay: PALETTE[1],
  wechat: PALETTE[5],
  card: PALETTE[3],
  asset: PALETTE[7],
}

export function domainColor(d: Domain): PaletteColor {
  return DOMAIN_COLOR[d] || PALETTE[0]
}

export function accountKindColor(k: AccountKind): PaletteColor {
  return ACCOUNT_KIND_COLOR[k] || PALETTE[0]
}
