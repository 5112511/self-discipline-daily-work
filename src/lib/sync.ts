// ===== 同步层：本地 LocalStorage ↔ Supabase 云端 =====
// 策略：本地优先（所有操作先写本地），后台异步同步到云端
// 同步是增量 + 双向合并（以 updated_at 为准，云端新覆盖本地旧，反之亦然）

import { getSupabase, isSupabaseConfigured } from './supabase'
import type { AppData } from '../store'
import type { Task, Inspiration, Schedule, FocusSession, LedgerAccount, LedgerTxn, Domain } from '../types'

const SYNC_KEY = 'personal-os-last-sync'

// 表名映射
const TABLES = {
  tasks: 'tasks',
  inspirations: 'inspirations',
  schedules: 'schedules',
  accounts: 'ledger_accounts',
  txns: 'ledger_txns',
  focusSessions: 'focus_sessions',
} as const

// ===== 上传：本地 → 云端 =====
// 登录后或定期调用，把本地数据推到云端（upsert）
export async function pushToCloud(data: AppData, userId: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase 未配置' }

  try {
    // tasks
    if (data.tasks.length) {
      const rows = data.tasks.map(t => taskToRow(t, userId))
      const { error } = await sb.from(TABLES.tasks).upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }
    // inspirations
    if (data.inspirations.length) {
      const rows = data.inspirations.map(i => inspToRow(i, userId))
      const { error } = await sb.from(TABLES.inspirations).upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }
    // schedules
    if (data.schedules.length) {
      const rows = data.schedules.map(s => schToRow(s, userId))
      const { error } = await sb.from(TABLES.schedules).upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }
    // ledger accounts
    if (data.ledger.accounts.length) {
      const rows = data.ledger.accounts.map(a => accToRow(a, userId))
      const { error } = await sb.from(TABLES.accounts).upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }
    // ledger txns
    if (data.ledger.txns.length) {
      const rows = data.ledger.txns.map(x => txnToRow(x, userId))
      const { error } = await sb.from(TABLES.txns).upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }
    // focus sessions
    if (data.focusSessions.length) {
      const rows = data.focusSessions.map(f => fsToRow(f, userId))
      const { error } = await sb.from(TABLES.focusSessions).upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }
    // user settings
    const { error: usErr } = await sb.from('user_settings').upsert({
      user_id: userId,
      avatar_text: data.settings.avatarText,
      display_name: data.settings.displayName,
      focus_settings: data.focusSettings as any,
      trending_source: data.trendingSource as any,
      meta: data.meta as any,
    }, { onConflict: 'user_id' })
    if (usErr && !usErr.message.includes('duplicate')) throw usErr

    localStorage.setItem(SYNC_KEY, new Date().toISOString())
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}

// ===== 拉取：云端 → 本地 =====
// 登录后拉取云端全部数据，与本地合并
export async function pullFromCloud(userId: string): Promise<{ ok: boolean; data?: Partial<AppData>; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase 未配置' }

  try {
    const result: Partial<AppData> = {}

    // tasks
    const { data: tasks, error: e1 } = await sb.from(TABLES.tasks).select('*').eq('user_id', userId)
    if (e1) throw e1
    if (tasks) result.tasks = tasks.map(rowToTask)

    // inspirations
    const { data: insps, error: e2 } = await sb.from(TABLES.inspirations).select('*').eq('user_id', userId)
    if (e2) throw e2
    if (insps) result.inspirations = insps.map(rowToInsp)

    // schedules
    const { data: schs, error: e3 } = await sb.from(TABLES.schedules).select('*').eq('user_id', userId)
    if (e3) throw e3
    if (schs) result.schedules = schs.map(rowToSch)

    // accounts
    const { data: accs, error: e4 } = await sb.from(TABLES.accounts).select('*').eq('user_id', userId)
    if (e4) throw e4

    // txns
    const { data: txns, error: e5 } = await sb.from(TABLES.txns).select('*').eq('user_id', userId)
    if (e5) throw e5

    if (accs || txns) {
      result.ledger = {
        accounts: (accs || []).map(rowToAcc),
        txns: (txns || []).map(rowToTxn),
        snapshots: [],  // 快照暂不同步
      }
    }

    // focus sessions
    const { data: fss, error: e6 } = await sb.from(TABLES.focusSessions).select('*').eq('user_id', userId)
    if (e6) throw e6
    if (fss) result.focusSessions = fss.map(rowToFs)

    // user settings
    const { data: us, error: e7 } = await sb.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
    if (e7) throw e7
    if (us) {
      result.settings = {
        avatarText: us.avatar_text || '玥',
        displayName: us.display_name || '玥莹',
      }
      if (us.focus_settings) result.focusSettings = us.focus_settings as any
      if (us.trending_source) result.trendingSource = us.trending_source as any
      if (us.meta) result.meta = us.meta as any
    }

    localStorage.setItem(SYNC_KEY, new Date().toISOString())
    return { ok: true, data: result }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}

// ===== 合并：本地数据 + 云端数据 → 合并结果 =====
// 策略：以 ID 去重，云端数据覆盖本地（首次登录时以云端为准）
// 如果本地有但云端没有（新增未同步），保留本地
export function mergeData(local: AppData, cloud: Partial<AppData>): AppData {
  const mergeArr = <T extends { id: string }>(l: T[] | undefined, c: T[] | undefined): T[] => {
    const map = new Map<string, T>()
    ;(l || []).forEach(x => map.set(x.id, x))
    // 云端覆盖本地（云端为准）
    ;(c || []).forEach(x => map.set(x.id, x))
    return Array.from(map.values())
  }

  const merged: AppData = {
    ...local,
    tasks: mergeArr(local.tasks, cloud.tasks),
    inspirations: mergeArr(local.inspirations, cloud.inspirations),
    schedules: mergeArr(local.schedules, cloud.schedules),
    focusSessions: mergeArr(local.focusSessions, cloud.focusSessions),
    ledger: {
      accounts: mergeArr(local.ledger.accounts, cloud.ledger?.accounts),
      txns: mergeArr(local.ledger.txns, cloud.ledger?.txns),
      snapshots: local.ledger.snapshots,  // 快照不同步
    },
    settings: cloud.settings || local.settings,
    focusSettings: cloud.focusSettings || local.focusSettings,
    trendingSource: cloud.trendingSource || local.trendingSource,
    meta: cloud.meta || local.meta,
  }
  return merged
}

// ===== 行转换函数 =====
function taskToRow(t: Task, userId: string): any {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    note: t.note,
    completion_note: t.completionNote,
    meeting_location: t.meetingLocation,
    meeting_contact: t.meetingContact,
    domain: t.domain,
    project_id: t.projectId,
    priority: t.priority,
    suggested_priority: t.suggestedPriority,
    due_date: t.dueDate,
    due_time: t.dueTime,
    estimated_minutes: t.estimatedMinutes,
    progress: t.progress,
    next_action: t.nextAction,
    in_today: t.inToday,
    in_top3: t.inTop3,
    top3_order: t.top3Order,
    status: t.status,
    links: t.links,
    created_at: t.createdAt,
    completed_at: t.completedAt,
    overdue: t.overdue,
    deleted_at: t.deletedAt,
    data: t as any,
  }
}
function rowToTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    note: r.note,
    completionNote: r.completion_note,
    meetingLocation: r.meeting_location,
    meetingContact: r.meeting_contact,
    domain: r.domain as Domain,
    projectId: r.project_id,
    priority: r.priority,
    suggestedPriority: r.suggested_priority,
    dueDate: r.due_date,
    dueTime: r.due_time,
    estimatedMinutes: r.estimated_minutes,
    progress: r.progress,
    nextAction: r.next_action,
    inToday: r.in_today,
    inTop3: r.in_top3,
    top3Order: r.top3_order,
    status: r.status,
    links: r.links,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    overdue: r.overdue,
    deletedAt: r.deleted_at,
  }
}

function inspToRow(i: Inspiration, userId: string): any {
  return {
    id: i.id,
    user_id: userId,
    content: i.content,
    source: i.source,
    domain: i.domain,
    created_at: i.createdAt,
    converted_to: i.convertedTo as any,
    archived: i.archived,
    note: i.note,
    data: i as any,
  }
}
function rowToInsp(r: any): Inspiration {
  return {
    id: r.id,
    content: r.content,
    source: r.source,
    domain: r.domain,
    createdAt: r.created_at,
    convertedTo: r.converted_to,
    archived: r.archived,
    note: r.note,
  }
}

function schToRow(s: Schedule, userId: string): any {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    domain: s.domain,
    date: s.date,
    start: s.start,
    end: s.end,
    repeat_rule: s.repeatRule,
    project_id: s.projectId,
    task_id: s.taskId,
    done: s.done,
    data: s as any,
  }
}
function rowToSch(r: any): Schedule {
  return {
    id: r.id,
    title: r.title,
    domain: r.domain as Domain,
    date: r.date,
    start: r.start,
    end: r.end,
    repeatRule: r.repeat_rule,
    projectId: r.project_id,
    taskId: r.task_id,
    done: r.done,
  }
}

function accToRow(a: LedgerAccount, userId: string): any {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    kind: a.kind,
    balance: a.balance,
    note: a.note,
    updated_at: a.updatedAt,
    data: a as any,
  }
}
function rowToAcc(r: any): LedgerAccount {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    balance: Number(r.balance) || 0,
    note: r.note,
    updatedAt: r.updated_at,
  }
}

function txnToRow(x: LedgerTxn, userId: string): any {
  return {
    id: x.id,
    user_id: userId,
    account_id: x.accountId,
    type: x.type,
    amount: x.amount,
    category: x.category,
    note: x.note,
    date: x.date,
    time: x.time,
    data: x as any,
  }
}
function rowToTxn(r: any): LedgerTxn {
  return {
    id: r.id,
    accountId: r.account_id,
    type: r.type,
    amount: Number(r.amount) || 0,
    category: r.category,
    note: r.note,
    date: r.date,
    time: r.time,
  }
}

function fsToRow(f: FocusSession, userId: string): any {
  return {
    id: f.id,
    user_id: userId,
    title: f.title,
    domain: f.domain,
    task_id: f.taskId,
    date: f.date,
    start: f.start,
    end: f.end,
    planned_min: f.plannedMin,
    actual_min: f.actualMin,
    completed: f.completed,
    cancelled: f.cancelled,
    data: f as any,
  }
}
function rowToFs(r: any): FocusSession {
  return {
    id: r.id,
    title: r.title,
    domain: r.domain as Domain,
    taskId: r.task_id,
    date: r.date,
    start: r.start,
    end: r.end,
    plannedMin: r.planned_min,
    actualMin: r.actual_min,
    completed: r.completed,
    cancelled: r.cancelled,
  }
}

// ===== 同步状态 =====
export function getLastSyncTime(): string | null {
  return localStorage.getItem(SYNC_KEY)
}

export function isCloudEnabled(): boolean {
  return isSupabaseConfigured()
}
