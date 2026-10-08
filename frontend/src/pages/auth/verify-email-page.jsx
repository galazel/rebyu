import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OtpInput } from "@/components/ui/otp-input.jsx"
import {
  confirmRegistration,
  resendVerificationCode,
  toSafeAuthMessage,
} from "@/services/authService.js"
import AuthShell from "./auth-shell.jsx"

const CODE_LENGTH = 6

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()


  const presetEmail = location.state?.email ?? ""
  const emailLocked = presetEmail !== ""

  const [typedEmail, setTypedEmail] = useState("")

  const email = emailLocked ? presetEmail : typedEmail
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)

  const verify = async (submitted) => {
    const value = String(submitted ?? "").trim()
    if (pending || !value) return

    setError("")
    setPending(true)
    try {
      await confirmRegistration(email.trim(), value)
      toast.success("Email verified. You can sign in now.")
      navigate("/login", { replace: true })
    } catch (err) {
      setError(toSafeAuthMessage(err))
      setCode("")
    } finally {
      setPending(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    verify(code)
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.")
      return
    }
    setResending(true)
    try {
      await resendVerificationCode(email.trim())
      toast.success("A new verification code was sent to your email.")
    } catch (err) {
      setError(toSafeAuthMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      description="Enter the 6-digit code from the email, or click the confirmation link in it."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {emailLocked ? (
          <p className="text-sm leading-6 text-muted-foreground">
            We sent a code to{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="verify-email">Email</Label>
            <Input
              id="verify-email"
              type="email"
              autoComplete="email"
              required
              value={typedEmail}
              onChange={(event) => setTypedEmail(event.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="verify-code">Verification code</Label>

          <OtpInput
            id="verify-code"
            value={code}
            onChange={setCode}
            length={CODE_LENGTH}
            invalid={Boolean(error)}
            disabled={pending}
            onComplete={(value) => verify(value)}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending || code.length < CODE_LENGTH}>
          {pending ? "Verifying..." : "Verify Email"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend code"}
        </Button>
      </form>
    </AuthShell>
  )
}
