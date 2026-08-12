import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tosbgnfbtaykqxkqwczg.supabase.co'
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_HkzKorY568oYN3GZ3zFV0g_cox05c-a'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
