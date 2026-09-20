import { createClient } from "@supabase/supabase-js"

/*
 * The one Supabase client, used for sign-in only -- REBYU's data lives in its
 * own API, never in Supabase tables.
 *
 * The publishable key is meant for browsers: it identifies the project and
 * grants nothing without a signed-in user. The secret key never comes here; it
 * lives only on the Java backend.
 *
 * Defaults are written in so a build that was not given the VITE_ variables
 * still signs in, the same way the Cognito pool ids used to be.
 */
const url = import.meta.env.VITE_SUPABASE_URL || "https://wjenfjqggmjpvhmffanp.supabase.co"
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_FP4hDdkASdcNbz_M61wnuw_6oBDu_zo"

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Invitation links land on /set-new-password with the session in the URL.
    detectSessionInUrl: true,
  },
})
