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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { apiMessage } from "@/services/base"
import {
  approveDeletionRequest,
  declineDeletionRequest,
  listDeletionRequests,
} from "@/services/accountDeletionService.js"

const QUERY_KEY = "admin-account-deletion-requests"

const KIND = {
  LEARNER: { label: "Learner", scope: "the learner account and all of its learning data" },
  DEPARTMENT_HEAD: { label: "Department head", scope: "the department head's account" },
  INSTITUTION: {
    label: "Institution",
    scope: "the whole institution (departments, assessments, results, files, invoices) and its staff sign-ins",
  },
}

const STATUS = {
  PENDING: { label: "Waiting for review", tone: "border-amber-300 text-amber-800 dark:text-amber-300" },
  APPROVED: { label: "Deleted", tone: "border-red-300 text-red-700 dark:text-red-300" },
  DECLINED: { label: "Declined", tone: "" },
  CANCELLED: { label: "Cancelled by user", tone: "" },
}

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString()
}

function RequestRow({ request }) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState(null) // "approve" | "decline" | null
  const [note, setNote] = useState("")
  const kind = KIND[request.kind] ?? KIND.LEARNER
  const status = STATUS[request.status] ?? STATUS.PENDING
  const pending = request.status === "PENDING"

  const decide = useMutation({
    mutationFn: () =>
      action === "approve"
        ? approveDeletionRequest(request.requestId, note)
        : declineDeletionRequest(request.requestId, note),
    onSuccess: () => {
      toast.success(action === "approve" ? "Account deleted." : "Request declined.")
      setAction(null)
      setNote("")
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (error) => toast.error(apiMessage(error, "Could not save the decision. Try again.")),
  })

  return (
    <li className={cn("rounded-xl border bg-card p-4", !pending && "opacity-80")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[11px]">{kind.label}</Badge>
        <Badge variant="outline" className={cn("text-[11px]", status.tone)}>{status.label}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">Requested {formatWhen(request.requestedAt)}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {(request.kind === "INSTITUTION" ? request.institutionName : null) ?? request.displayName ?? request.email}
      </p>
      <p className="text-xs text-muted-foreground">
        {request.email}
        {request.kind !== "INSTITUTION" && request.institutionName ? ` · ${request.institutionName}` : ""}
      </p>
      {request.reason ? (
        <blockquote className="mt-2 rounded-md border-l-4 border-border bg-muted/40 px-3 py-2 text-sm">
          {request.reason}
        </blockquote>
      ) : null}
      {pending && !request.accountExists ? (
        <p className="mt-2 text-xs text-muted-foreground">
          This account no longer exists. Approving just closes the request.
        </p>
      ) : null}
      {request.adminNote ? (
        <p className="mt-2 text-xs"><span className="font-semibold">Note:</span> {request.adminNote}</p>
      ) : null}
      {!pending && request.reviewedAt ? (
        <p className="mt-1 text-xs text-muted-foreground">Closed {formatWhen(request.reviewedAt)}</p>
      ) : null}
      {pending ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="destructive" onClick={() => setAction("approve")}>Approve and delete</Button>
          <Button size="sm" variant="outline" onClick={() => setAction("decline")}>Decline</Button>
        </div>
      ) : null}

      <AlertDialog open={action !== null} onOpenChange={(open) => !decide.isPending && !open && setAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" ? `Delete ${request.email}?` : "Decline this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? `This permanently deletes ${kind.scope}. It cannot be undone.`
                : "The account stays as it is, and the user is notified with your note."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder={action === "approve" ? "Note for the record (optional)" : "Reason shown to the user (optional)"}
            className="min-h-16 text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={decide.isPending}>Back</AlertDialogCancel>
            <AlertDialogAction
              className={action === "approve" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
              disabled={decide.isPending}
              onClick={(event) => {
                event.preventDefault()
                decide.mutate()
              }}
            >
              {decide.isPending ? "Saving…" : action === "approve" ? "Delete permanently" : "Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

/** Learners, department heads and institutions asking for their account to be deleted. */
export default function AccountDeletionRequestsPage() {
  const [pendingOnly, setPendingOnly] = useState(true)
  const query = useQuery({
    queryKey: [QUERY_KEY, pendingOnly],
    queryFn: () => listDeletionRequests(pendingOnly),
  })
  const requests = Array.isArray(query.data) ? query.data : []

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Trash2 className="size-5 text-red-600" aria-hidden="true" />
            Deletion requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Learners, department heads and institutions asking for their account to be deleted. Approving runs the
            full delete; declining keeps the account and notifies the user.
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter">
          {[["Waiting for review", true], ["All", false]].map(([label, value]) => (
            <button key={label} type="button" aria-pressed={pendingOnly === value} onClick={() => setPendingOnly(value)}
              className={cn("h-8 rounded-lg px-3 text-xs font-semibold",
                pendingOnly === value ? "bg-foreground text-background" : "border border-border bg-muted/40 text-muted-foreground")}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Deletion requests could not be loaded.</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {pendingOnly ? "No deletion requests are waiting." : "No one has asked for their account to be deleted."}
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => <RequestRow key={request.requestId} request={request} />)}
        </ul>
      )}
    </div>
  )
}
