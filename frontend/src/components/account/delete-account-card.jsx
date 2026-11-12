import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Trash2 } from "@/components/icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiMessage } from "@/services/base"
import {
  cancelDeletionRequest,
  getMyDeletionRequest,
  submitDeletionRequest,
} from "@/services/accountDeletionService.js"

const QUERY_KEY = ["my-deletion-request"]

// What an approved request removes, per account kind.
const SCOPE = {
  learner:
    "Your profile, progress, attempts and results, enrollments, notes, library files and community posts will be permanently deleted, and you will no longer be able to sign in.",
  "department-head":
    "Your department head account and sign-in will be permanently deleted. Your institution, its departments and its learners are not affected.",
  institution:
    "Your institution and everything under it will be permanently deleted: departments, department heads, institution assessments and results, files and invoices, along with your sign-in.",
}

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()
}

/**
 * "Delete account" danger zone. Deleting is not instant: it files a request an administrator
 * reviews, and the user can cancel it while it waits.
 *
 * @param {{ kind: "learner" | "department-head" | "institution" }} props
 */
export default function DeleteAccountCard({ kind = "learner" }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState("")

  const query = useQuery({ queryKey: QUERY_KEY, queryFn: getMyDeletionRequest })
  const request = query.data ?? null
  const pending = request?.status === "PENDING"

  const refresh = (data) => queryClient.setQueryData(QUERY_KEY, data)

  const submit = useMutation({
    mutationFn: () => submitDeletionRequest(reason),
    onSuccess: (data) => {
      refresh(data)
      setConfirming(false)
      setReason("")
      toast.success("Deletion request sent. An administrator will review it.")
    },
    onError: (error) => toast.error(apiMessage(error, "Could not send the request. Try again.")),
  })

  const cancel = useMutation({
    mutationFn: cancelDeletionRequest,
    onSuccess: (data) => {
      refresh(data)
      toast.success("Deletion request cancelled.")
    },
    onError: (error) => toast.error(apiMessage(error, "Could not cancel the request. Try again.")),
  })

  const title = kind === "institution" ? "Delete institution account" : "Delete account"

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="size-4" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription>{SCOPE[kind] ?? SCOPE.learner}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : pending ? (
          <div className="space-y-3">
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              You asked for this account to be deleted on {formatWhen(request.requestedAt)}. An administrator will
              review it. You can keep using your account until then.
            </p>
            <Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
              {cancel.isPending ? "Cancelling…" : "Cancel deletion request"}
            </Button>
          </div>
        ) : (
          <>
            {request?.status === "DECLINED" ? (
              <p className="text-sm text-muted-foreground">
                Your last request ({formatWhen(request.requestedAt)}) was declined
                {request.adminNote ? `: ${request.adminNote}` : "."}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Deletion cannot be undone. An administrator reviews every request before anything is removed.
            </p>
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              Request account deletion
            </Button>
          </>
        )}
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={(open) => !submit.isPending && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request deletion of this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {SCOPE[kind] ?? SCOPE.learner} This cannot be undone once an administrator approves it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deletion-reason">Reason (optional)</Label>
            <Textarea
              id="deletion-reason"
              value={reason}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tell us why you are leaving"
              className="min-h-20 text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submit.isPending}>Keep my account</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={submit.isPending}
              onClick={(event) => {
                event.preventDefault()
                submit.mutate()
              }}
            >
              {submit.isPending ? "Sending…" : "Send deletion request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
