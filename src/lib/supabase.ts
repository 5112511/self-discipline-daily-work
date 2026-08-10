import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ===== Supabase 配置 =====
// 注册后填入你的项目 URL 和 anon/publishable key（在 Supabase Dashboard → Settings → API）
// 这些是公开值（publishable key 不是 secret，前端安全靠 RLS 策略保证）

export const SUPABASE_URL = 'https://dairjiforlwjzfepuqgx.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_8TRWRW9VV4ppr9i3jaYJOA_c7LZiPIg'

export const isSupabaseConfigured = (): boolean =>
  SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
  (SUPABASE_ANON_KEY.length > 20)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
