import { supabase } from "@/lib/supabase.js"

import { API, base } from "./base"


const ERROR_MESSAGES = {
  UsernameExistsException: "This email may already be registered.",
  InvalidPasswordException:
      "Your password does not meet the required requirements.",
  InvalidParameterException:
      "Unable to process your details. Please check them and try again.",
  CodeMismatchException: "That code is not right. Check the newest email -- each resend replaces the last code.",
  CodeDeliveryFailureException: "We could not send the code to that address.",
  ExpiredCodeException: "That code is wrong or has expired. Request a new one below.",
  UserNotConfirmedException:
      "Your account must be verified before signing in.",
  NotAuthorizedException: "Incorrect email or password.",
  SamePasswordException: "Choose a password different from your current one.",
  LimitExceededException:
      "Too many attempts. Please wait a moment and try again.",
  NoSessionException: "Your sign-in link has expired. Sign in again.",
  EmptySignInUsername: "Enter your email address.",
  EmptySignInPassword: "Enter your password.",
}

const SUPABASE_CODES = {
  invalid_credentials: "NotAuthorizedException",
  email_not_confirmed: "UserNotConfirmedException",
  user_already_exists: "UsernameExistsException",
  email_exists: "UsernameExistsException",
  weak_password: "InvalidPasswordException",
  validation_failed: "InvalidParameterException",
  email_address_invalid: "InvalidParameterException",
  otp_expired: "ExpiredCodeException",
  otp_disabled: "CodeDeliveryFailureException",
  over_email_send_rate_limit: "LimitExceededException",
  over_request_rate_limit: "LimitExceededException",
  same_password: "SamePasswordException",
  session_not_found: "NoSessionException",
}

function authError(error) {
  const name =
    SUPABASE_CODES[error?.code] ??
    (error?.status === 429 ? "LimitExceededException" : error?.name ?? "AuthError")
  const wrapped = new Error(error?.message ?? name)
  wrapped.name = name
  wrapped.code = error?.code
  return wrapped
}

async function run(call) {
  const { data, error } = await call
  if (error) throw authError(error)
  return data
}

export function toSafeAuthMessage(error, fallback = "Something went wrong. Please try again.") {
  const name = error?.name ?? error?.code

  if (name && !ERROR_MESSAGES[name]) {
    console.warn(`Unmapped auth error: ${name}`, error?.message ?? error)
  }

  return ERROR_MESSAGES[name] ?? fallback
}

export async function registerAccount({ email, password, firstName, lastName }) {
  await supabase.auth.signOut({ scope: "local" }).catch(() => {})

  const data = await run(
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...(firstName ? { given_name: firstName } : {}),
          ...(lastName ? { family_name: lastName } : {}),
        },
      },
    })
  )

  if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
    const taken = new Error("already registered")
    taken.name = "UsernameExistsException"
    throw taken
  }

  return { status: "SIGNED_UP" }
}

export async function confirmRegistration(email, code) {
  await run(supabase.auth.verifyOtp({ email, token: code, type: "email" }))
  await supabase.auth.signOut({ scope: "local" }).catch(() => {})
}

export function resendVerificationCode(email) {
  return run(supabase.auth.resend({ type: "signup", email }))
}

export async function signInState(email) {
  try {
    const response = await fetch(`${API}/public/sign-in-state?email=${encodeURIComponent(email)}`)
    if (!response.ok) return "UNKNOWN"
    const body = await response.json()
    return body?.state ?? "UNKNOWN"
  } catch {
    return "UNKNOWN"
  }
}

export async function loginWithCognito(email, password) {
  if (!email) throw Object.assign(new Error("email"), { name: "EmptySignInUsername" })
  if (!password) throw Object.assign(new Error("password"), { name: "EmptySignInPassword" })

  const data = await run(supabase.auth.signInWithPassword({ email, password }))
  if (data?.user?.user_metadata?.must_change_password) {
    return { isSignedIn: false, nextStep: { signInStep: "NEW_PASSWORD_REQUIRED" } }
  }
  return { isSignedIn: true, nextStep: { signInStep: "DONE" } }
}

export function logoutFromCognito() {
  return supabase.auth.signOut({ scope: "local" })
}

export async function changePassword(oldPassword, newPassword) {
  const { data } = await supabase.auth.getUser()
  const email = data?.user?.email
  if (!email) throw Object.assign(new Error("no session"), { name: "NoSessionException" })

  await run(supabase.auth.signInWithPassword({ email, password: oldPassword }))
  await run(supabase.auth.updateUser({ password: newPassword }))
}

export function signOutEverywhere() {
  return supabase.auth.signOut({ scope: "global" })
}

export function requestPasswordReset(email) {
  return run(supabase.auth.resetPasswordForEmail(email))
}

export async function confirmPasswordReset(email, code, newPassword) {
  await run(supabase.auth.verifyOtp({ email, token: code, type: "recovery" }))
  await run(
    supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false, password_set: true },
    })
  )
  await supabase.auth.signOut({ scope: "local" }).catch(() => {})
}

export async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  } catch {
    return null
  }
}

export async function currentSessionEmail() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.email ?? null
}

export function syncCurrentUser() {
  return base("auth/me")
}

export async function completeTemporaryPassword(newPassword) {
  const { data } = await supabase.auth.getSession()
  if (!data?.session) {
    throw Object.assign(new Error("no session"), { name: "NoSessionException" })
  }
  return run(
    supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false, password_set: true },
    })
  )
}
