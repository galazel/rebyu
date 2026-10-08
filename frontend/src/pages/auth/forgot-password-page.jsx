import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  confirmPasswordReset,
  requestPasswordReset,
  toSafeAuthMessage,
} from "@/services/authService.js"
import AuthShell from "./auth-shell.jsx"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleRequest = async (event) => {
    event.preventDefault()
    setError("")
    setPending(true)
    try {
      await requestPasswordReset(email.trim())
      toast.success("A reset code was sent to your email.")
      setStep("confirm")
    } catch (err) {
      setError(toSafeAuthMessage(err))
    } finally {
      setPending(false)
    }
  }

  const handleConfirm = async (event) => {
    event.preventDefault()
    setError("")
    setPending(true)
    try {
      await confirmPasswordReset(email.trim(), code.trim(), newPassword)
      toast.success("Password updated. Sign in with your new password.")
      navigate("/login", { replace: true })
    } catch (err) {
      setError(
        toSafeAuthMessage(err, "Your reset code is invalid or expired.")
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description={
        step === "request"
          ? "We'll email you a code to reset your password."
          : "Enter the code from your email and choose a new password."
      }
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {step === "request" ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-code">Reset code</Label>
            <Input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
