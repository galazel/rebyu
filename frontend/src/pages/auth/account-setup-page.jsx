import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { AlertCircle, Building2, KeyRound, Loader2, UsersRound } from "@/components/icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { roleHomePath, useAuth } from "@/context/auth-context.jsx"
import { finishAccountSetup, pendingAccountSetup } from "@/services/authService.js"
import { redeemDepartmentHeadCode, registerInstitution } from "@/services/institutionService.js"
import AuthShell from "./auth-shell.jsx"

const COPY = {
  institution: {
    icon: Building2,
    label: "Institution",
    title: "Link your partnership request",
    description: "Enter the reference number from the partnership request you sent with this email.",
    submit: "Open institution dashboard",
  },
  department: {
    icon: UsersRound,
    label: "Department head code",
    title: "Enter your department head code",
    description: "Your institution emailed you a code when it made you a department head.",
    submit: "Open department dashboard",
  },
}

export default function AccountSetupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refresh } = useAuth()
  const [searchParams] = useSearchParams()

  const [type, setType] = useState(COPY[searchParams.get("type")] ? searchParams.get("type") : null)
  const [code, setCode] = useState("")
  const [institutionName, setInstitutionName] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [autoSetup, setAutoSetup] = useState(null)
  const autoStarted = useRef(false)

  useEffect(() => {
    let cancelled = false
    pendingAccountSetup()
      .then((setup) => {
        if (cancelled || !setup) return
        setType((current) => current ?? setup.type)
        if (setup.code) setCode((current) => current || setup.code)
        if (setup.institutionName) setInstitutionName(setup.institutionName)
        if (setup.type === "institution" && setup.code) setAutoSetup(setup)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const copy = COPY[type ?? "department"]
  const ready = code.trim() !== ""

  useEffect(() => {
    if (!autoSetup || autoStarted.current) return
    autoStarted.current = true
    void submit()
  }, [autoSetup])

  async function handleSubmit(event) {
    event.preventDefault()
    await submit()
  }

  async function submit() {
    if (!type) return
    setError("")
    setPending(true)
    try {
      const result =
        type === "institution"
          ? await registerInstitution(code.trim().toUpperCase())
          : await redeemDepartmentHeadCode(code.trim().toUpperCase())
      await finishAccountSetup("complete").catch(() => {})
      queryClient.clear()
      const nextUser = await refresh()
      toast.success(
        type === "institution"
          ? `Welcome, ${result?.institutionName ?? "your institution"}.`
          : `You are now the department head of ${result?.departmentName ?? "your department"}.`
      )
      navigate(roleHomePath(nextUser?.role ?? (type === "institution" ? "INSTITUTION" : "DEPARTMENT_HEAD")), {
        replace: true,
      })
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          (type === "institution"
            ? "That reference number could not be used. Check it and try again."
            : "That code could not be used. Check it and try again.")
      )
    } finally {
      setPending(false)
    }
  }

  async function continueAsLearner() {
    await finishAccountSetup("learner").catch(() => {})
    navigate(roleHomePath(user?.role), { replace: true })
  }

  return (
    <AuthShell
      compact
      side="right"
      story="register"
      title={type ? copy.title : "Finish setting up your account"}
      description={type ? copy.description : "What are you setting up?"}
      footer={
        <button type="button" onClick={continueAsLearner} className="font-medium text-primary hover:underline">
          Skip and use REBYU as a student
        </button>
      }
    >
      {autoSetup && !error ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Setting up {institutionName || "your institution"}...
        </p>
      ) : !type ? (
        <div className="flex flex-col gap-2.5">
          {Object.entries(COPY).map(([value, item]) => (
            <Button
              key={value}
              type="button"
              variant="outline"
              className="h-auto justify-start gap-3 p-3 text-left"
              onClick={() => setType(value)}
            >
              <item.icon className="size-5 text-primary" />
              <span className="font-semibold">{item.label}</span>
            </Button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FieldGroup className="gap-3">
            {type === "institution" ? (
              <Field>
                <FieldLabel htmlFor="setup-code">Partnership reference number</FieldLabel>
                <Input
                  id="setup-code"
                  required
                  autoFocus
                  autoComplete="off"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="PR-F263A55F"
                  className="h-10 font-mono uppercase"
                />
                <FieldDescription className="text-xs">
                  It must belong to a request sent with the email you signed in with.
                </FieldDescription>
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="setup-code">Department head code</FieldLabel>
                <Input
                  id="setup-code"
                  required
                  autoFocus
                  autoComplete="off"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="DH-XXXXXXXX"
                  className="h-10 font-mono uppercase"
                />
                <FieldDescription className="text-xs">
                  The code only works for the email address it was sent to.
                </FieldDescription>
              </Field>
            )}

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="h-10 w-full" disabled={pending || !ready}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {pending ? "Saving..." : copy.submit}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
