import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Public anon credentials — safe in the browser (RLS protects data). */
const FALLBACK_URL = 'https://sqpwybdcccvthbmelesb.supabase.co'
const FALLBACK_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHd5YmRjY2N2dGhibWVsZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjM4MTQsImV4cCI6MjA5OTc5OTgxNH0.FM4SOh-iOnQtbN4tBODvHVYh3W8TS3QWIYwn2eebZ1o'

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || FALLBACK_URL
const anon =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || FALLBACK_ANON

export const isSupabaseConfigured = Boolean(url && anon)

export const supabase: SupabaseClient = createClient(url, anon)
