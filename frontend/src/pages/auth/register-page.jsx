import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronRight,
  GraduationCap,
  Loader2,
  UserPlus,
  UsersRound,
} from "@/components/icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { registerAccount, toSafeAuthMessage } from "@/services/authService.js"
import { getRegistrationRequest, lookupDepartmentHeadCode } from "@/services/partnershipService.js"
import AuthShell from "./auth-shell.jsx"

const PASSWORD_REQUIREMENTS =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/

const ACCOUNT_TYPES = [
  {
    value: "learner",
    label: "Student",
    icon: GraduationCap,
    blurb: "Review for a certification on your own or through your school.",
  },
  {
    value: "institution",
    label: "Institution",
    icon: Building2,
    blurb: "You already sent a partnership request. Have its reference number ready.",
  },
  {
    value: "department",
    label: "Department",
    icon: UsersRound,
    blurb: "Your institution made you a department head. You enter its code after signing in.",
  },
]

const TYPE_COPY = {
  learner: {
    title: "Create your account",
    description: "Start preparing for your certification with REBYU.",
  },
  institution: {
    title: "Create your institution account",
    description: "Enter the reference number you got after sending your partnership request, then choose a password.",
  },
  department: {
    title: "Create your department account",
    description: "Use the email that received your department head code.",
  },
}

function AccountTypeStep({ onChoose }) {
  return (
    <div className="flex flex-col gap-2.5">
      {ACCOUNT_TYPES.map(({ value, label, icon: Icon, blurb }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChoose(value)}
          className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-foreground">{label}</span>
            <span className="block text-xs leading-5 text-muted-foreground">{blurb}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
        </button>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = ACCOUNT_TYPES.some((t) => t.value === searchParams.get("type"))
    ? searchParams.get("type")
    : null
  const [accountType, setAccountType] = useState(initialType)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referenceNumber: searchParams.get("ref") ?? "",
    departmentCode: searchParams.get("code") ?? "",
  })
  const [request, setRequest] = useState(null)
  const [lookup, setLookup] = useState({ pending: false, error: "" })
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const referenceNumber = form.referenceNumber.trim().toUpperCase()
  const referenceComplete = /^PR-[A-Z0-9]{8}$/.test(referenceNumber)

  useEffect(() => {
    setRequest(null)
    if (accountType !== "institution" || !referenceComplete) {
      setLookup({ pending: false, error: "" })
      return
    }
    let cancelled = false
    setLookup({ pending: true, error: "" })
    getRegistrationRequest(referenceNumber)
      .then((found) => {
        if (cancelled) return
        setRequest(found)
        setLookup({ pending: false, error: "" })
      })
      .catch((err) => {
        if (cancelled) return
        setLookup({
          pending: false,
          error: err?.response?.data?.message ?? "No partnership request has that reference number.",
        })
      })
    return () => {
      cancelled = true
    }
  }, [accountType, referenceComplete, referenceNumber])

  const departmentCodeValue = form.departmentCode.trim().toUpperCase()
  const departmentCodeComplete = /^DH-[A-Z0-9]{8}$/.test(departmentCodeValue)
  const filledEmail = useRef("")
  const [codeLookup, setCodeLookup] = useState({ pending: false, error: "", found: null })

  useEffect(() => {
    // Drop an email filled in from a previous code; the new code decides it.
    if (filledEmail.current) {
      const previous = filledEmail.current
      filledEmail.current = ""
      setForm((current) => (current.email === previous ? { ...current, email: "" } : current))
    }
    if (accountType !== "department" || !departmentCodeComplete) {
      setCodeLookup({ pending: false, error: "", found: null })
      return
    }
    let cancelled = false
    setCodeLookup({ pending: true, error: "", found: null })
    lookupDepartmentHeadCode(departmentCodeValue)
      .then((found) => {
        if (cancelled) return
        setCodeLookup({ pending: false, error: "", found })
        filledEmail.current = found.email
        setForm((current) => ({ ...current, email: found.email }))
      })
      .catch((err) => {
        if (cancelled) return
        setCodeLookup({
          pending: false,
          error: err?.response?.data?.message ?? "That code is not valid.",
          found: null,
        })
      })
    return () => {
      cancelled = true
    }
  }, [accountType, departmentCodeComplete, departmentCodeValue])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (!PASSWORD_REQUIREMENTS.test(form.password)) {
      setError(
        "Password must be at least 8 characters and include upper and lower case letters, a number, and a special character."
      )
      return
    }
    const isInstitution = accountType === "institution"
    if (isInstitution && !request) {
      setError(lookup.error || "Enter the reference number from your partnership request.")
      return
    }
    const departmentCode = form.departmentCode.trim().toUpperCase()
    if (accountType === "department" && !/^DH-[A-Z0-9]+$/.test(departmentCode)) {
      setError("Enter the department head code from your email (DH-...).")
      return
    }
    const email = isInstitution ? request.institutionEmail : form.email.trim()
    const [contactFirst = "", ...contactRest] = String(request?.contactPersonName ?? "").trim().split(/\s+/)
    setPending(true)
    try {
      const { status } = await registerAccount({
        email,
        password: form.password,
        firstName: isInstitution ? contactFirst : form.firstName.trim(),
        lastName: isInstitution ? contactRest.join(" ") : form.lastName.trim(),
        extraMetadata: isInstitution
          ? {
              institution_name: request.institutionName,
            }
          : undefined,
        accountType: accountType === "learner" ? undefined : accountType,
        setupCode: isInstitution ? referenceNumber : accountType === "department" ? departmentCode : undefined,
      })

      toast.success(
        status === "RESENT_CODE"
          ? "You already started signing up. We sent a new code to your email."
          : "Account created. Check your email for a verification code.",
        status === "RESENT_CODE"
          ? { description: "Verify it, then sign in with the password you first chose." }
          : undefined
      )
      navigate("/verify-email", { state: { email } })
    } catch (err) {
      setError(
        toSafeAuthMessage(
          err,
          "Unable to create your account. Please check your details and try again."
        )
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell
      compact
      side="right"
      story="register"
      title={accountType ? TYPE_COPY[accountType].title : "Who are you signing up as?"}
      description={
        accountType
          ? TYPE_COPY[accountType].description
          : "Pick the account that fits you. Each one opens a different workspace."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {!accountType ? (
        <AccountTypeStep onChoose={setAccountType} />
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setAccountType(null)
            setError("")
          }}
          className="-mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Signing up as {ACCOUNT_TYPES.find((t) => t.value === accountType)?.label}. Change
        </button>
        <FieldGroup className="gap-3">
          {accountType === "institution" ? (
            <>
              <Field>
                <FieldLabel htmlFor="register-reference">Partnership reference number</FieldLabel>
                <Input
                  id="register-reference"
                  required
                  autoComplete="off"
                  value={form.referenceNumber}
                  onChange={setField("referenceNumber")}
                  placeholder="PR-F263A55F"
                  className="h-10 font-mono uppercase"
                />
                <FieldDescription className="text-xs">
                  Shown after you sent your request, and in your confirmation email.{" "}
                  <Link to="/institution/request-access" className="font-medium text-primary hover:underline">
                    No request yet?
                  </Link>
                </FieldDescription>
              </Field>
              {lookup.pending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Looking up your request...
                </p>
              ) : lookup.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{lookup.error}</AlertDescription>
                </Alert>
              ) : request ? (
                <dl className="grid gap-2 rounded-lg border border-border bg-primary/5 p-3 text-sm">
                  {[
                    ["Institution", request.institutionName],
                    ["Sign-in email", request.institutionEmail],
                    ["Contact person", request.contactPersonName],
                    ["Contact number", request.contactNumber],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-2">
                        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                        <dd className="min-w-0 break-words font-medium text-foreground">{value}</dd>
                      </div>
                    ))}
                  <p className="text-xs text-muted-foreground">
                    From your partnership request. We send a verification code to this email.
                  </p>
                </dl>
              ) : null}
            </>
          ) : (
          <>
        {accountType === "department" ? (
          <Field>
            <FieldLabel htmlFor="register-code">Department head code</FieldLabel>
            <Input
              id="register-code"
              required
              autoComplete="off"
              value={form.departmentCode}
              onChange={setField("departmentCode")}
              placeholder="DH-XXXXXXXX"
              className="h-10 font-mono uppercase"
            />
            <FieldDescription className="text-xs">
              From the email your institution sent. We fill in the email it was sent to.
            </FieldDescription>
            {codeLookup.pending ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Checking the code...
              </p>
            ) : codeLookup.error ? (
              <p className="text-xs font-medium text-destructive">{codeLookup.error}</p>
            ) : codeLookup.found ? (
              <p className="text-xs font-medium text-primary">
                {codeLookup.found.departmentName} · {codeLookup.found.institutionName}
              </p>
            ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="register-first">First name</FieldLabel>
              <Input
                id="register-first"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={setField("firstName")}
                className="h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-last">Last name</FieldLabel>
              <Input
                id="register-last"
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={setField("lastName")}
                className="h-10"
              />
            </Field>
          </div>
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="register-email">Email</FieldLabel>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={setField("email")}
            readOnly={accountType === "department" && Boolean(codeLookup.found)}
            placeholder="you@example.com"
            className="h-10"
          />
        </Field>
          </>
          )}
        <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="register-password">Password</FieldLabel>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            required
            minLength={8}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}"
            title="Use at least 8 characters with upper and lower case letters, a number, and a special character."
            value={form.password}
            onChange={setField("password")}
            className="h-10"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="register-confirm">Confirm password</FieldLabel>
          <PasswordInput
            id="register-confirm"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={setField("confirmPassword")}
            className="h-10"
          />
        </Field>
        </div>
        <FieldDescription className="-mt-1 text-xs">
          8+ characters with upper and lower case letters, a number, and a symbol (!, @, #).
        </FieldDescription>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Create account
              </>
            )}
          </Button>
        </Field>
        </FieldGroup>
      </form>
      )}
    </AuthShell>
  )
}
