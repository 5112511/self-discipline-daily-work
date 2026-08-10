// ===== 日历工具：周一起始，本地时区 =====

export interface CalCell {
  date: Date
  ymd: string // YYYY-MM-DD
  day: number
  inMonth: boolean // 是否属于当前展示月
  isToday: boolean
  weekday: number // 0=周日 ... 6=周六
}

const PAD = (n: number) => String(n).padStart(2, '0')

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}`
}

export function todayYmd(): string {
  return toYmd(new Date())
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// 周一起始：把 JS 的 0(周日)..6(周六) 映射成 0(周一)..6(周日)
function mondayDow(d: Date): number {
  const js = d.getDay() // 0..6 周日起
  return js === 0 ? 6 : js - 1
}

/**
 * 返回某年某月的 6 行 × 7 列 日历矩阵（足够覆盖任何月份的跨度）
 */
export function monthMatrix(year: number, month: number): CalCell[][] {
  const first = new Date(year, month, 1)
  const offset = mondayDow(first) // 当月 1 号前需要补几个空（上周的日期）
  const start = new Date(year, month, 1 - offset)
  const today = new Date()
  const grid: CalCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    grid.push({
      date: d,
      ymd: toYmd(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isToday: isSameDay(d, today),
      weekday: d.getDay(),
    })
  }
  const weeks: CalCell[][] = []
  for (let i = 0; i < 6; i++) weeks.push(grid.slice(i * 7, (i + 1) * 7))
  return weeks
}

/**
 * 返回某年某周（ISO 周，周一起始）的 7 天
 */
export function weekMatrix(year: number, weekIdx: number): CalCell[] {
  // 找到该年第一个周一
  const jan1 = new Date(year, 0, 1)
  const jan1Offset = mondayDow(jan1)
  const firstMonday = new Date(year, 0, 1 + (jan1Offset === 0 ? 0 : 7 - jan1Offset))
  const start = new Date(firstMonday)
  start.setDate(firstMonday.getDate() + weekIdx * 7)
  const today = new Date()
  const cells: CalCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({
      date: d,
      ymd: toYmd(d),
      day: d.getDate(),
      inMonth: d.getMonth() === start.getMonth(),
      isToday: isSameDay(d, today),
      weekday: d.getDay(),
    })
  }
  return cells
}

export const DOW_MON = ['一', '二', '三', '四', '五', '六', '日']
export const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/**
 * 给定一组 ymd，返回某天的事件数（用于月历点标记）
 */
export function countByDate(ymds: string[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const y of ymds) m[y] = (m[y] || 0) + 1
  return m
}

/**
 * 把任务的自由文本 dueDate 解析成 YYYY-MM-DD
 * 支持：今天/明天/后天/大后天/昨天/前天/N天后/N天前/周X/X月X日/X/X/X号/2025-08-05 等
 * 解析失败返回 null
 */
export function parseDueDate(input: string | undefined, ref: Date = new Date()): string | null {
  if (!input) return null
  const s = input.trim()
  if (!s) return null

  // 已经是 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const base = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())

  // 相对天数
  const relMatch = s.match(/^(今天|明天|后天|大后天|昨天|前天|大前天)$/)
  if (relMatch) {
    const map: Record<string, number> = { '今天': 0, '明天': 1, '后天': 2, '大后天': 3, '昨天': -1, '前天': -2, '大前天': -3 }
    const d = new Date(base)
    d.setDate(base.getDate() + map[s])
    return toYmd(d)
  }
  const nDays = s.match(/^(\d+)\s*天[后前]$/)
  if (nDays) {
    const dir = s.includes('前') ? -1 : 1
    const d = new Date(base)
    d.setDate(base.getDate() + dir * parseInt(nDays[1]))
    return toYmd(d)
  }
  // N周后
  const nWeeks = s.match(/^(\d+)\s*周[后前]$/)
  if (nWeeks) {
    const dir = s.includes('前') ? -1 : 1
    const d = new Date(base)
    d.setDate(base.getDate() + dir * 7 * parseInt(nWeeks[1]))
    return toYmd(d)
  }
  // 周X（本周的某天）
  const dowMatch = s.match(/^周([一二三四五六日天])$/)
  if (dowMatch) {
    const map: Record<string, number> = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6, '天': 6 }
    const target = map[dowMatch[1]]
    const cur = (base.getDay() + 6) % 7 // 周一=0
    const d = new Date(base)
    d.setDate(base.getDate() + (target - cur))
    return toYmd(d)
  }
  // X月X日 / X月X号 / X月X
  const mdMatch = s.match(/^(\d{1,2})月(\d{1,2})(?:日|号)?$/)
  if (mdMatch) {
    const mo = parseInt(mdMatch[1]) - 1
    const dy = parseInt(mdMatch[2])
    const d = new Date(base.getFullYear(), mo, dy)
    // 如果这个日期已经过了，且没指定年份，推到明年（适用于"下个月"的语义）
    if (d < base && mo < base.getMonth()) d.setFullYear(base.getFullYear() + 1)
    return toYmd(d)
  }
  // M/D 或 M-D
  const slashMatch = s.match(/^(\d{1,2})[/-](\d{1,2})$/)
  if (slashMatch) {
    const mo = parseInt(slashMatch[1]) - 1
    const dy = parseInt(slashMatch[2])
    const d = new Date(base.getFullYear(), mo, dy)
    if (d < base && mo < base.getMonth()) d.setFullYear(base.getFullYear() + 1)
    return toYmd(d)
  }
  // 下周X / 上周X
  const nextWeekMatch = s.match(/^[下上]周([一二三四五六日天])$/)
  if (nextWeekMatch) {
    const map: Record<string, number> = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6, '天': 6 }
    const target = map[nextWeekMatch[1]]
    const cur = (base.getDay() + 6) % 7
    const offset = s.startsWith('下') ? 7 : -7
    const d = new Date(base)
    d.setDate(base.getDate() + offset + (target - cur))
    return toYmd(d)
  }

  return null
}

// ===== .ics 导入导出 =====

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toICSDate(ymd: string, hhmm: string): string {
  // ymd = YYYY-MM-DD, hhmm = HH:mm => 本地时间，ICS 用 floating time（无 Z）
  return `${ymd.replace(/-/g, '')}T${hhmm.replace(':', '')}00`
}

function parseICSDate(dt: string): { ymd: string; hhmm: string } {
  // 形如 20260730T093000 或 20260730T093000Z
  const m = dt.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/)
  if (!m) return { ymd: todayYmd(), hhmm: '09:00' }
  return { ymd: `${m[1]}-${m[2]}-${m[3]}`, hhmm: `${m[4]}:${m[5]}` }
}

export function exportICS(schedules: { title: string; date: string; start: string; end: string; domain?: string; done?: boolean }[]): string {
  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PersonalOS//EN', 'CALSCALE:GREGORIAN')
  for (const s of schedules) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${s.date}-${s.start}-${escapeICS(s.title)}@personal-os`)
    lines.push(`DTSTART:${toICSDate(s.date, s.start)}`)
    lines.push(`DTEND:${toICSDate(s.date, s.end)}`)
    lines.push(`SUMMARY:${escapeICS(s.title)}`)
    if (s.domain) lines.push(`CATEGORIES:${escapeICS(s.domain)}`)
    if (s.done) lines.push('STATUS:COMPLETED')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function importICS(text: string): { title: string; date: string; start: string; end: string; domain?: string; done?: boolean }[] {
  const out: { title: string; date: string; start: string; end: string; domain?: string; done?: boolean }[] = []
  // 折行还原：ICS 里超长行会被折成下一行以 空格/制表符 开头
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)
  let cur: Partial<{ title: string; date: string; start: string; end: string; domain?: string; done?: boolean }> | null = null
  for (const ln of lines) {
    if (ln === 'BEGIN:VEVENT') { cur = {}; continue }
    if (ln === 'END:VEVENT') {
      if (cur && cur.title && cur.date && cur.start && cur.end) {
        out.push({ title: cur.title, date: cur.date, start: cur.start, end: cur.end, domain: cur.domain, done: cur.done })
      }
      cur = null; continue
    }
    if (!cur) continue
    const idx = ln.indexOf(':')
    if (idx < 0) continue
    const key = ln.slice(0, idx).split(';')[0]
    const val = ln.slice(idx + 1)
    if (key === 'SUMMARY') cur.title = val
    else if (key === 'DTSTART') { const p = parseICSDate(val); cur.date = p.ymd; cur.start = p.hhmm }
    else if (key === 'DTEND') { cur.end = parseICSDate(val).hhmm }
    else if (key === 'CATEGORIES') cur.domain = val
    else if (key === 'STATUS') cur.done = val === 'COMPLETED'
  }
  return out
}
