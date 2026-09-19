import { supabase } from "@/lib/supabase.js"

import { base } from "./base"

// ---------------------------------------------------------------------------
// Supabase auth wrapper. Every provider error is turned into one of the error
// names below before it leaves this file, so the pages keep reading
// `err.name` the way they always have and no raw provider text reaches the UI.
// ---------------------------------------------------------------------------

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
  NotAuthorizedException:
      "Incorrect email or password. Joined REBYU before 16 September 2026? Sign up again with the same email -- your progress is kept.",
  SamePasswordException: "Choose a password different from your current one.",
  LimitExceededException:
      "Too many attempts. Please wait a moment and try again.",
  NoSessionException: "Your sign-in link has expired. Sign in again.",
  EmptySignInUsername: "Enter your email address.",
  EmptySignInPassword: "Enter your password.",
}

/** Supabase error codes, mapped onto the names the pages already handle. */
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

/** Runs a Supabase auth call and throws a mapped error when it reports one. */
async function run(call) {
  const { data, error } = await call
  if (error) throw authError(error)
  return data
}

export function toSafeAuthMessage(error, fallback = "Something went wrong. Please try again.") {
  const name = error?.name ?? error?.code

  /* Unmapped errors are logged before being flattened into the fallback, so a
     network failure or a misconfigured project does not silently present as
     "your code is wrong". */
  if (name && !ERROR_MESSAGES[name]) {
    console.warn(`Unmapped auth error: ${name}`, error?.message ?? error)
  }

  return ERROR_MESSAGES[name] ?? fallback
}

/**
 * Registers a learner. Supabase emails a 6-digit code (the "Confirm signup"
 * email template must include {{ .Token }}).
 *
 * <p>Signing up again with an address that never confirmed simply sends a new
 * code, so an abandoned registration is not a dead end. An address that is
 * already confirmed comes back with no identities -- Supabase's way of not
 * revealing which emails are registered -- and is reported as taken.
 *
 * @returns {{ status: "SIGNED_UP" }}
 */
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

/**
 * Checks the emailed code. A correct code also signs the learner in; that
 * session is dropped so the page's "now sign in" step stays true.
 */
export async function confirmRegistration(email, code) {
  await run(supabase.auth.verifyOtp({ email, token: code, type: "email" }))
  await supabase.auth.signOut({ scope: "local" }).catch(() => {})
}

export function resendVerificationCode(email) {
  return run(supabase.auth.resend({ type: "signup", email }))
}

export async function loginWithCognito(email, password) {
  if (!email) throw Object.assign(new Error("email"), { name: "EmptySignInUsername" })
  if (!password) throw Object.assign(new Error("password"), { name: "EmptySignInPassword" })

  const data = await run(supabase.auth.signInWithPassword({ email, password }))
  // An account REBYU created signs in first with the emailed temporary
  // password, and must choose its own before going further -- the same step
  // Cognito called NEW_PASSWORD_REQUIRED, which the auth context already reads.
  if (data?.user?.user_metadata?.must_change_password) {
    return { isSignedIn: false, nextStep: { signInStep: "NEW_PASSWORD_REQUIRED" } }
  }
  // The shape the auth context reads: signed in, no further step.
  return { isSignedIn: true, nextStep: { signInStep: "DONE" } }
}

export function logoutFromCognito() {
  return supabase.auth.signOut({ scope: "local" })
}

/**
 * Changes the signed-in user's password.
 *
 * Supabase would accept a new password from any live session, so the current
 * one is checked first by signing in with it. That keeps the settings page as
 * safe as before: a borrowed session cannot change the password without it.
 */
export async function changePassword(oldPassword, newPassword) {
  const { data } = await supabase.auth.getUser()
  const email = data?.user?.email
  if (!email) throw Object.assign(new Error("no session"), { name: "NoSessionException" })

  await run(supabase.auth.signInWithPassword({ email, password: oldPassword }))
  await run(supabase.auth.updateUser({ password: newPassword }))
}

/** Signs out on every device, not just this browser. */
export function signOutEverywhere() {
  return supabase.auth.signOut({ scope: "global" })
}

/** Emails a reset code (the "Reset password" template must include {{ .Token }}). */
export function requestPasswordReset(email) {
  return run(supabase.auth.resetPasswordForEmail(email))
}

export async function confirmPasswordReset(email, code, newPassword) {
  await run(supabase.auth.verifyOtp({ email, token: code, type: "recovery" }))
  // A chosen password also ends the temporary-password step, so an account
  // whose emailed password never arrived is not asked for a new one again.
  await run(
    supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false, password_set: true },
    })
  )
  // Signed in by the code; the page sends them to sign in with the new password.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {})
}

// Returns the current access token, refreshed when it has expired, or null.
export async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  } catch {
    return null
  }
}

/** The email of the session opened by an invitation link, or null. */
export async function currentSessionEmail() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.email ?? null
}

// Backend-confirmed identity: links/provisions the REBYU account for the
// validated token and returns the safe user DTO (the routing authority).
export function syncCurrentUser() {
  return base("auth/me")
}

/**
 * Sets the first password of an account an admin or institution created.
 * The invitation link has already signed them in; this gives that account a
 * password so they can sign in normally afterwards.
 */
export async function completeTemporaryPassword(newPassword) {
  const { data } = await supabase.auth.getSession()
  if (!data?.session) {
    throw Object.assign(new Error("no session"), { name: "NoSessionException" })
  }
  return run(
    supabase.auth.updateUser({
      password: newPassword,
      // Clears the first-sign-in step, and marks the account as having a real
      // password so the backend never issues it another temporary one.
      data: { must_change_password: false, password_set: true },
    })
  )
}
