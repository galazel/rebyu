import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MailIcon,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UsersRoundIcon,
  XCircle,
} from "@/components/icons"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import { formatDate, formatDateTime } from "@/components/institution/institution-ui.jsx"
import {
  assignDepartmentHeadAssignment,
  cancelDepartmentHeadCode,
  getDepartmentHeadAssignments,
  getDepartmentHeadCodeInvitations,
  getMyDepartmentHeads,
  removeDepartmentHeadAssignment,
  sendDepartmentHeadCode,
} from "@/services/institutionService.js"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback
}

export function CoAuthoritiesPanel({ departmentId, departmentName, embedded = false }) {
  const { user } = useAuth()
  const isOwner = isInstitutionOwner(user)
  const queryClient = useQueryClient()

  const [inviteEmail, setInviteEmail] = useState("")
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState("")
  const [cancelTargetInvite, setCancelTargetInvite] = useState(null)
  const [removeTargetAuthority, setRemoveTargetAuthority] = useState(null)

  // 1. Fetch active authorities assigned to this department
  const authoritiesQuery = useQuery({
    queryKey: ["department-head-assignments", departmentId],
    queryFn: () => getDepartmentHeadAssignments({ departmentId }),
    enabled: Number.isFinite(Number(departmentId)),
    retry: 1,
  })

  // 2. Fetch pending / past co-authority invitations
  const invitationsQuery = useQuery({
    queryKey: ["department-head-codes", departmentId],
    queryFn: () => getDepartmentHeadCodeInvitations(departmentId),
    enabled: Number.isFinite(Number(departmentId)) && isOwner,
    retry: 1,
  })

  // 3. Fetch institution members (for member-name lookup and owner delegation)
  const membersQuery = useQuery({
    queryKey: ["institution-members"],
    queryFn: getMyDepartmentHeads,
    enabled: isOwner,
    retry: 1,
  })

  const authorities = useMemo(
    () => (Array.isArray(authoritiesQuery.data) ? authoritiesQuery.data : []),
    [authoritiesQuery.data]
  )
  const activeAuthorities = useMemo(
    () => authorities.filter((a) => (a?.status ?? "active") === "active"),
    [authorities]
  )

  const invitations = useMemo(
    () => (Array.isArray(invitationsQuery.data) ? invitationsQuery.data : []),
    [invitationsQuery.data]
  )
  const pendingInvitations = useMemo(
    () => invitations.filter((inv) => (inv?.status ?? "").toUpperCase() === "PENDING"),
    [invitations]
  )

  const members = useMemo(
    () => (Array.isArray(membersQuery.data) ? membersQuery.data : []),
    [membersQuery.data]
  )

  const memberLookup = useMemo(() => {
    const map = new Map()
    members.forEach((m) => {
      const name = [m.firstName, m.lastName].filter(Boolean).join(" ").trim()
      map.set(Number(m.userId), {
        name: name || m.email || `User #${m.userId}`,
        email: m.email,
        role: m.headRole,
      })
    })
    return map
  }, [members])

  // Institution members not yet assigned to this department
  const assignableMembers = useMemo(() => {
    const assignedUserIds = new Set(activeAuthorities.map((a) => Number(a.userId)))
    return members.filter(
      (m) => m.headRole !== "owner" && !assignedUserIds.has(Number(m.userId))
    )
  }, [members, activeAuthorities])

  // Mutation: Invite co-authority by email
  const sendInviteMutation = useMutation({
    mutationFn: (email) =>
      sendDepartmentHeadCode({
        departmentId: Number(departmentId),
        email: email.trim().toLowerCase(),
      }),
    onSuccess: (data, email) => {
      queryClient.invalidateQueries({ queryKey: ["department-head-codes", departmentId] })
      toast.success(`Co-authority invitation emailed to ${email}.`)
      setInviteEmail("")
    },
    onError: (err) => {
      toast.error(backendMessage(err, "Unable to send the co-authority invitation."))
    },
  })

  // Mutation: Cancel pending invitation
  const cancelInviteMutation = useMutation({
    mutationFn: (invitationId) => cancelDepartmentHeadCode(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-codes", departmentId] })
      toast.success("Co-authority invitation cancelled.")
      setCancelTargetInvite(null)
    },
    onError: (err) => {
      toast.error(backendMessage(err, "Unable to cancel this invitation."))
    },
  })

  // Mutation: Assign existing member directly
  const assignMemberMutation = useMutation({
    mutationFn: (userId) =>
      assignDepartmentHeadAssignment({
        departmentId: Number(departmentId),
        userId: Number(userId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-assignments", departmentId] })
      toast.success("Co-authority assigned.")
      setSelectedAssigneeUserId("")
    },
    onError: (err) => {
      toast.error(backendMessage(err, "Unable to assign co-authority."))
    },
  })

  // Mutation: Remove assigned authority
  const removeAuthorityMutation = useMutation({
    mutationFn: (assignmentId) => removeDepartmentHeadAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-assignments", departmentId] })
      toast.success("Co-authority removed from department.")
      setRemoveTargetAuthority(null)
    },
    onError: (err) => {
      toast.error(backendMessage(err, "Unable to remove co-authority."))
    },
  })

  const handleSendInvite = (e) => {
    e.preventDefault()
    const trimmed = inviteEmail.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(trimmed)) {
      toast.error("Please provide a valid email address.")
      return
    }
    sendInviteMutation.mutate(trimmed)
  }

  const getStatusBadge = (status) => {
    const s = String(status ?? "").toUpperCase()
    if (s === "PENDING") {
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
        >
          <Clock className="mr-1 size-3" aria-hidden="true" />
          Pending claim
        </Badge>
      )
    }
    if (s === "REDEEMED") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
        >
          <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
          Claimed
        </Badge>
      )
    }
    if (s === "CANCELLED") {
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/30 bg-muted/40 text-muted-foreground font-medium"
        >
          <XCircle className="mr-1 size-3" aria-hidden="true" />
          Cancelled
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="font-medium">
        {status}
      </Badge>
    )
  }

  return (
    <div className={`space-y-6 ${embedded ? "" : "p-1"}`}>
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Authorities
            </p>
            <p className="text-2xl font-black text-foreground">
              {authoritiesQuery.isLoading ? "—" : activeAuthorities.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <MailIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Invitations
            </p>
            <p className="text-2xl font-black text-foreground">
              {invitationsQuery.isLoading ? "—" : pendingInvitations.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
            <UsersRoundIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department Scope
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {departmentName || `Department #${departmentId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Card: Invite Co-Authority by Email */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle className="text-base font-bold">Invite Co-Authority by Email</CardTitle>
                <CardDescription className="text-xs">
                  Send a one-time onboarding code to invite a faculty member or assistant dean to co-manage this department.
                </CardDescription>
              </div>
            </div>
            {!isOwner ? (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                Administrator permission required
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <form onSubmit={handleSendInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="co-authority-invite-email" className="text-xs font-medium">
                  Faculty or Head Email Address
                </Label>
                <Input
                  id="co-authority-invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. dean.ramos@institution.edu"
                  disabled={sendInviteMutation.isPending}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                id="co-authority-submit-invite"
                disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                className="h-10 shrink-0 font-medium"
              >
                {sendInviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Sending invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 size-4" aria-hidden="true" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground">
              <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Delegated Authority Notice</p>
                <p className="mt-0.5 leading-relaxed">
                  Only the Institution Administrator can issue new co-authority invitation codes or revoke existing invitations. Contact your institution administrator if you require additional department co-heads.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitations Table (List & Cancel Flow) */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold">Invitations</CardTitle>
              <CardDescription className="text-xs">
                Track status of sent co-authority invitation codes, registration claims, and expiration.
              </CardDescription>
            </div>
            {isOwner && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {invitations.length} Total
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isOwner ? (
            <p className="text-xs text-muted-foreground">
              Invitation history is managed by the institution owner. Current assigned leaders are listed below.
            </p>
          ) : invitationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Loading invitations...
            </div>
          ) : invitationsQuery.isError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{backendMessage(invitationsQuery.error, "Unable to load invitations.")}</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <MailIcon className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-foreground">No invitations sent yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter an email address above to dispatch the first co-authority invitation code.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Recipient Email</TableHead>
                    <TableHead className="text-xs font-semibold">Account Claim</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Sent Date</TableHead>
                    <TableHead className="text-xs font-semibold">Expires</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const isPending = (inv.status ?? "").toUpperCase() === "PENDING"
                    return (
                      <TableRow key={inv.invitationId}>
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          {inv.email}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inv.accountName ? (
                            <span className="font-medium text-foreground">{inv.accountName}</span>
                          ) : (
                            <span className="italic">Awaiting registration</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(inv.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(inv.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(inv.expiresAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending && isOwner ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelTargetInvite(inv)}
                              className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Co-Authorities Section */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold">Assigned Department Authorities</CardTitle>
              <CardDescription className="text-xs">
                Active leaders with authority to manage curriculum, section cohorts, and learner progress.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {activeAuthorities.length} Assigned
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {authoritiesQuery.isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Loading department authorities...
            </div>
          ) : authoritiesQuery.isError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{backendMessage(authoritiesQuery.error, "Unable to load assigned authorities.")}</span>
            </div>
          ) : activeAuthorities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <Shield className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-foreground">No co-authorities assigned</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assign existing institution members or send an email invitation above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Authority</TableHead>
                    <TableHead className="text-xs font-semibold">Contact Email</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Assigned On</TableHead>
                    {isOwner ? <TableHead className="text-right text-xs font-semibold">Action</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAuthorities.map((auth) => {
                    const profile = memberLookup.get(Number(auth.userId))
                    const displayName = profile?.name ?? `User #${auth.userId}`
                    const email = profile?.email ?? "—"
                    return (
                      <TableRow key={auth.departmentHeadAssignmentId}>
                        <TableCell className="text-xs font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                              <UserCheck className="size-3.5" aria-hidden="true" />
                            </span>
                            <span>{displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px]"
                          >
                            Active Authority
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(auth.assignedAt)}
                        </TableCell>
                        {isOwner ? (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveTargetAuthority(auth)}
                              className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="mr-1 size-3.5" aria-hidden="true" />
                              Remove
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Quick Assign from Institution Staff (Owner Only) */}
          {isOwner && assignableMembers.length > 0 ? (
            <div className="pt-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Direct Delegation: Assign Existing Institution Member
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={selectedAssigneeUserId}
                    onValueChange={setSelectedAssigneeUserId}
                  >
                    <SelectTrigger className="h-9 w-full sm:max-w-xs text-xs">
                      <SelectValue placeholder="Select institution staff member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableMembers.map((m) => {
                        const name = [m.firstName, m.lastName].filter(Boolean).join(" ").trim()
                        return (
                          <SelectItem key={m.userId} value={String(m.userId)} className="text-xs">
                            {name ? `${name} (${m.email})` : m.email}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selectedAssigneeUserId || assignMemberMutation.isPending}
                    onClick={() => assignMemberMutation.mutate(selectedAssigneeUserId)}
                    className="h-9 font-medium text-xs"
                  >
                    {assignMemberMutation.isPending ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
                    )}
                    Assign Co-Authority
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Confirmation Dialog: Cancel Invitation */}
      <AlertDialog
        open={cancelTargetInvite != null}
        onOpenChange={(open) => !open && setCancelTargetInvite(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Co-Authority Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the onboarding invitation code sent to{" "}
              <strong className="text-foreground">{cancelTargetInvite?.email}</strong>. The code will no longer be usable to claim a co-authority role for this department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelInviteMutation.isPending}>
              Keep Invitation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                cancelInviteMutation.mutate(cancelTargetInvite.invitationId)
              }}
              disabled={cancelInviteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Cancelling...
                </>
              ) : (
                "Cancel Invitation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog: Remove Assigned Authority */}
      <AlertDialog
        open={removeTargetAuthority != null}
        onOpenChange={(open) => !open && setRemoveTargetAuthority(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Co-Authority?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this co-authority from the department? They will lose access to department curriculum, sections, and learner rosters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAuthorityMutation.isPending}>
              Keep Authority
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                removeAuthorityMutation.mutate(removeTargetAuthority.departmentHeadAssignmentId)
              }}
              disabled={removeAuthorityMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAuthorityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Removing...
                </>
              ) : (
                "Remove Authority"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function CoAuthoritiesDialog({ open, onOpenChange, departmentId, departmentName }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Co-Authority Delegation & Invitations</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage authorized department heads, dispatch secure invitation codes by email, and track onboarding status.
          </DialogDescription>
        </DialogHeader>
        {departmentId ? (
          <CoAuthoritiesPanel
            departmentId={departmentId}
            departmentName={departmentName}
            embedded
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
