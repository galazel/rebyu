import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertCircle, KeyRound, Loader2, UsersRound } from "@/components/icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { roleHomePath, useAuth } from "@/context/auth-context.jsx"
import { finishAccountSetup } from "@/services/authService.js"
import { redeemDepartmentHeadCode } from "@/services/institutionService.js"

/** Shown on the dashboard of an account registered as Department until its DH- code is entered. */
export function DepartmentCodeCard({ onDismiss, initialCode = "", title = "Enter your department head code" }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refresh } = useAuth()
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  // A code typed at registration is redeemed on first sign-in, without asking again.
  const autoStarted = useRef(false)
  useEffect(() => {
    if (!initialCode || autoStarted.current) return
    autoStarted.current = true
    void submit()
  }, [initialCode])

  async function submit(event) {
    event?.preventDefault()
    setError("")
    setPending(true)
    try {
      const result = await redeemDepartmentHeadCode(code.trim().toUpperCase())
      await finishAccountSetup("complete").catch(() => {})
      queryClient.clear()
      const nextUser = await refresh()
      toast.success(`You are now the department head of ${result?.departmentName ?? "your department"}.`)
      navigate(roleHomePath(nextUser?.role ?? "DEPARTMENT_HEAD"), { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message ?? "That code could not be used. Check it and try again.")
    } finally {
      setPending(false)
    }
  }

  async function dismiss() {
    await finishAccountSetup("learner").catch(() => {})
    onDismiss?.()
  }

  return (
    <section className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <UsersRound className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Your institution emailed you a code (DH-…). It only works for the email you signed up with.
          </p>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label="Department head code"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="DH-XXXXXXXX"
              className="h-10 font-mono uppercase sm:max-w-xs"
            />
            <Button type="submit" className="h-10" disabled={pending || !code.trim()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {pending ? "Checking..." : "Redeem code"}
            </Button>
            {onDismiss ? (
              <Button type="button" variant="ghost" className="h-10" onClick={dismiss}>
                I'm a student
              </Button>
            ) : null}
          </form>
          {error ? (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </section>
  )
}
