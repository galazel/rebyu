import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL || "https://ptvdrlidjxeohhworlyl.supabase.co"
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_xKnpGRknA2ohOLxu69F5GA_szScC0yv"

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
