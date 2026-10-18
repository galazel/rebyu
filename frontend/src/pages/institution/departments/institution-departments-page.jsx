import { useEffect, useMemo, useState } from "react"
import { Link, useOutletContext, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Mail, Plus, ShieldCheck, Trash2, UserCog, UserPlus, Users2, UsersRound } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatusBadge,
} from "@/components/institution/institution-ui.jsx"
import { CoAuthoritiesDialog } from "@/components/institution/co-authorities-dialog.jsx"
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import {
  getLearnerDisplayName,
  useInstitutionData,
} from "@/hooks/use-institution-data.js"
import {
  cancelDepartmentHeadCode,
  getDepartmentHeadCodeInvitations,
  sendDepartmentHeadCode,
  addDepartmentLearner,
  assignDepartmentHeadAssignment,
  changeDepartmentLearnerRole,
  createDepartment,
  getDepartmentLearners,
  getDepartmentHeadAssignments,
  getDepartments,
  getMyDepartmentHeads,
  removeDepartmentLearner,
  removeDepartmentHeadAssignment,
} from "@/services/institutionService.js"
import {
  cancelInstitutionInvitation,
  sendInstitutionInvitations,
} from "@/services/partnershipService.js"

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? fallback
}


export function ManageGroupDialog({
  group,
  open,
  onOpenChange,
  members,
  userById,
  assignments,
  learnerById,
  invitations,
  institutionCertById,
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const departmentId = group?.departmentId
  const [coAuthoritiesOpen, setCoAuthoritiesOpen] = useState(false)
  const [authorityUserId, setAuthorityUserId] = useState("")
  const [institutionCertLearnerId, setInstitutionCertLearnerId] = useState("")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [learnerInviteEmail, setLearnerInviteEmail] = useState("")
  const [learnerInviteCertId, setLearnerInviteCertId] = useState("")
  const [learnerInviteFirst, setLearnerInviteFirst] = useState("")
  const [learnerInviteLast, setLearnerInviteLast] = useState("")
  const authoritiesQuery = useQuery({
    queryKey: ["department-head-assignments", departmentId],
    queryFn: () => getDepartmentHeadAssignments({ departmentId }),
    enabled: open && departmentId != null,
    retry: 1,
  })

  const assigneesQuery = useQuery({
    queryKey: ["department-learners", departmentId],
    queryFn: () => getDepartmentLearners({ departmentId }),
    enabled: open && departmentId != null,
    retry: 1,
  })

  const authorities = Array.isArray(authoritiesQuery.data) ? authoritiesQuery.data : []
  const assignees = Array.isArray(assigneesQuery.data) ? assigneesQuery.data : []

  const activeAuthorities = authorities.filter((a) => a.status === "active")
  const activeAssignees = assignees.filter((a) => a.status === "active")

  const isLeader = activeAuthorities.some((a) => a.userId === user?.userId)
  // Only managers who are not already this department's head. The owner already
  // manages every department, so they are never offered.
  const assignableMembers = members.filter(
    (member) =>
      member.headRole !== "owner" && !activeAuthorities.some((a) => a.userId === member.userId)
  )
  const isOwner = isInstitutionOwner(user)

  const departmentInvitations = (Array.isArray(invitations) ? invitations : []).filter(
    (inv) => inv.departmentId === departmentId
  )
  const pendingGroupInvitations = departmentInvitations.filter((inv) => inv.status === "PENDING")

  // A department covers every certification the institution holds from its college.
  const groupCertifications = Array.isArray(group?.certifications) ? group.certifications : []
  const groupCertIds = groupCertifications.map((cert) => cert.institutionCertId)
  const groupTotalSlots = group?.totalSlots ?? 0
  const groupUsedSlots = group?.usedSlots ?? 0
  const remainingSlots = Math.max(0, groupTotalSlots - groupUsedSlots)

  const assignedInstitutionCertLearnerIds = new Set(
    activeAssignees.map((a) => a.institutionCertLearnerId)
  )

  const availableLearners = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          groupCertIds.includes(assignment.institutionCertId) &&
          !assignedInstitutionCertLearnerIds.has(assignment.institutionCertLearnerId)
      ),
    [assignments, groupCertIds.join(","), assignedInstitutionCertLearnerIds]
  )

  const assignAuthorityMutation = useMutation({
    mutationFn: () =>
      assignDepartmentHeadAssignment({
        departmentId: departmentId,
        userId: Number(authorityUserId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-assignments", departmentId] })
      toast.success("Department head assigned.")
      setAuthorityUserId("")
    },
    onError: (err) =>
      toast.error(backendMessage(err, "Unable to assign this department head.")),
  })

  const headCodesQuery = useQuery({
    queryKey: ["department-head-codes", departmentId],
    queryFn: () => getDepartmentHeadCodeInvitations(departmentId),
    enabled: open && departmentId != null && isOwner,
    retry: 1,
  })
  const pendingHeadCodes = (Array.isArray(headCodesQuery.data) ? headCodesQuery.data : []).filter(
    (invite) => invite.status === "PENDING"
  )

  const sendHeadCodeMutation = useMutation({
    mutationFn: () => sendDepartmentHeadCode({ departmentId, email: inviteEmail.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-codes", departmentId] })
      toast.success(`Department head code emailed to ${inviteEmail.trim()}.`)
      setInviteEmail("")
      setShowInviteForm(false)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to send the code.")),
  })

  const cancelHeadCodeMutation = useMutation({
    mutationFn: (invitationId) => cancelDepartmentHeadCode(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-codes", departmentId] })
      toast.success("Code cancelled.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to cancel this code.")),
  })

  const inviteLearnerMutation = useMutation({
    mutationFn: () =>
      sendInstitutionInvitations({
        departmentId: departmentId,
        institutionCertId: Number(learnerInviteCertId || groupCertIds[0]) || null,
        learners: [
          {
            firstName: learnerInviteFirst.trim(),
            lastName: learnerInviteLast.trim(),
            email: learnerInviteEmail.trim(),
          },
        ],
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["institution-overview"] })
      toast.success(
        `${response.created} invitation(s) sent.` +
          (response.skipped?.length ? ` ${response.skipped.length} skipped.` : "")
      )
      setLearnerInviteEmail("")
      setLearnerInviteFirst("")
      setLearnerInviteLast("")
    },
    onError: (err) =>
      toast.error(backendMessage(err, "Unable to send this invitation.")),
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId) => cancelInstitutionInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-overview"] })
      toast.success("Invitation cancelled. Slot restored.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to cancel this invitation.")),
  })

  const removeAuthorityMutation = useMutation({
    mutationFn: (authorityId) => removeDepartmentHeadAssignment(authorityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-assignments", departmentId] })
      toast.success("Department head removed.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to remove department head.")),
  })

  const addLearnerMutation = useMutation({
    mutationFn: () =>
      addDepartmentLearner({
        departmentId: departmentId,
        institutionCertLearnerId: Number(institutionCertLearnerId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-learners", departmentId] })
      toast.success("Learner added to department.")
      setInstitutionCertLearnerId("")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to add this learner.")),
  })

  const removeLearnerMutation = useMutation({
    mutationFn: (assigneeId) => removeDepartmentLearner(assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-learners", departmentId] })
      toast.success("Learner removed from department.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to remove learner.")),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ assigneeId, role }) =>
      changeDepartmentLearnerRole(assigneeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-learners", departmentId] })
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to update this learner's role.")),
  })

  const memberLabel = (memberUserId) => {
    const member = userById.get(memberUserId)
    if (!member) return `User #${memberUserId}`
    const name = [member.firstName, member.lastName].filter(Boolean).join(" ")
    if (name && member.email) return `${name} (${member.email})`
    return name || member.email || `User #${memberUserId}`
  }

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group.departmentName}</DialogTitle>
          <DialogDescription>
            Assign a department head and manage the learners in this department.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isOwner ? (
            <section className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{group.departmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.departmentDescription?.trim() || "No description."}
                    </p>
                  </div>
                </div>
            </section>
          ) : null}

          <section className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {groupUsedSlots} / {groupTotalSlots} slot{groupTotalSlots === 1 ? "" : "s"} used
              </p>
              <p className="text-xs text-muted-foreground">
                Matches the learner slots your institution holds for this certification.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCog className="size-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-medium">
                  Authorities ({activeAuthorities.length})
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs font-semibold gap-1.5"
                onClick={() => setCoAuthoritiesOpen(true)}
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Manage / Invite
              </Button>
            </div>

            {isOwner ? (
              <>
                <div className="flex gap-2">
                  <Select value={authorityUserId} onValueChange={setAuthorityUserId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department head" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableMembers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No one else to assign. Email a department head code instead.
                        </SelectItem>
                      ) : (
                        assignableMembers.map((member) => (
                          <SelectItem key={member.userId} value={String(member.userId)}>
                            {memberLabel(member.userId)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => assignAuthorityMutation.mutate()}
                    disabled={!authorityUserId || assignAuthorityMutation.isPending}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Assign
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowInviteForm((prev) => !prev)}
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {showInviteForm ? "Cancel" : "Email a department head code"}
                </Button>

                {showInviteForm ? (
                  <form
                    className="space-y-3 rounded-lg border p-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      sendHeadCodeMutation.mutate()
                    }}
                  >
                    <p className="text-xs text-muted-foreground">
                      We email them a one-time code. They create their own account with that email,
                      choose Department, then enter the code after signing in.
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="head@example.com"
                      />
                    </div>
                    <Button type="submit" disabled={!inviteEmail.trim() || sendHeadCodeMutation.isPending}>
                      {sendHeadCodeMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Sending code...
                        </>
                      ) : (
                        "Send code"
                      )}
                    </Button>
                  </form>
                ) : null}

                {pendingHeadCodes.length > 0 ? (
                  <ul className="divide-y rounded-lg border">
                    {pendingHeadCodes.map((invite) => (
                      <li key={invite.invitationId} className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="min-w-0 truncate text-sm">
                          {invite.accountName ? `${invite.accountName} (${invite.email})` : invite.email}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {invite.accountName ? "account created, code not entered yet" : "code sent, no account yet"}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelHeadCodeMutation.mutate(invite.invitationId)}
                          disabled={cancelHeadCodeMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the institution owner can assign this department's head.
              </p>
            )}

            {authoritiesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading department heads...</p>
            ) : activeAuthorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No department head assigned yet. The institution assigns a department head who then
                manages this department's learners.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {activeAuthorities.map((authority) => (
                  <li
                    key={authority.departmentHeadAssignmentId}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="text-sm">{memberLabel(authority.userId)}</span>
                    {isOwner ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeAuthorityMutation.mutate(authority.departmentHeadAssignmentId)
                        }
                        disabled={removeAuthorityMutation.isPending}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Remove
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium">
                Learner invitations ({remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left)
              </h3>
            </div>

            {isLeader ? (
              <div className="space-y-2">
              {groupCertifications.length > 1 ? (
                <Select
                  value={String(learnerInviteCertId || groupCertIds[0] || "")}
                  onValueChange={setLearnerInviteCertId}
                >
                  <SelectTrigger className="w-full" aria-label="Certification to invite to">
                    <SelectValue placeholder="Choose a certification" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupCertifications.map((cert) => (
                      <SelectItem key={cert.institutionCertId} value={String(cert.institutionCertId)}>
                        {cert.title} · {Math.max(0, (cert.totalSlots ?? 0) - (cert.usedSlots ?? 0))} slot(s) left
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                <Input
                  value={learnerInviteFirst}
                  onChange={(e) => setLearnerInviteFirst(e.target.value)}
                  placeholder="First name"
                  disabled={remainingSlots <= 0}
                />
                <Input
                  value={learnerInviteLast}
                  onChange={(e) => setLearnerInviteLast(e.target.value)}
                  placeholder="Last name"
                  disabled={remainingSlots <= 0}
                />
                <Input
                  type="email"
                  value={learnerInviteEmail}
                  onChange={(e) => setLearnerInviteEmail(e.target.value)}
                  placeholder="learner@example.com"
                  disabled={remainingSlots <= 0}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inviteLearnerMutation.mutate()}
                  disabled={
                    !learnerInviteEmail.trim() ||
                    remainingSlots <= 0 ||
                    inviteLearnerMutation.isPending
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Invite
                </Button>
              </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only this department's head can invite learners.
              </p>
            )}

            {departmentInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {departmentInvitations.map((inv) => (
                  <li
                    key={inv.invitationId}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      {inv.email}
                      <InstitutionStatusBadge status={inv.status} />
                    </span>
                    {isLeader && inv.status === "PENDING" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelInvitationMutation.mutate(inv.invitationId)}
                        disabled={cancelInvitationMutation.isPending}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Cancel
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users2 className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium">
                Learners ({activeAssignees.length})
              </h3>
            </div>

            {isLeader ? (
              <div className="flex gap-2">
                <Select value={institutionCertLearnerId} onValueChange={setInstitutionCertLearnerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add a learner with access to this certification" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLearners.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No eligible learners
                      </SelectItem>
                    ) : (
                      availableLearners.map((assignment) => (
                        <SelectItem
                          key={assignment.institutionCertLearnerId}
                          value={String(assignment.institutionCertLearnerId)}
                        >
                          {getLearnerDisplayName(learnerById.get(assignment.learnerId))}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addLearnerMutation.mutate()}
                  disabled={!institutionCertLearnerId || addLearnerMutation.isPending}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only this department's head manages its learner roster.
              </p>
            )}

            {assigneesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading learners...</p>
            ) : activeAssignees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No learners in this department yet.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {activeAssignees.map((assignee) => {
                  const isLead = assignee.role === "lead"
                  return (
                    <li
                      key={assignee.departmentLearnerId}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {getLearnerDisplayName(learnerById.get(assignee.learnerId))}
                        {isLead ? <Badge variant="secondary">Lead</Badge> : null}
                      </span>
                      {isLeader ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              changeRoleMutation.mutate({
                                assigneeId: assignee.departmentLearnerId,
                                role: isLead ? "member" : "lead",
                              })
                            }
                            disabled={changeRoleMutation.isPending}
                          >
                            {isLead ? "Make member" : "Make lead"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeLearnerMutation.mutate(assignee.departmentLearnerId)
                            }
                            disabled={removeLearnerMutation.isPending}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Remove
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>

      {coAuthoritiesOpen && departmentId ? (
        <CoAuthoritiesDialog
          open={coAuthoritiesOpen}
          onOpenChange={setCoAuthoritiesOpen}
          departmentId={departmentId}
          departmentName={group?.departmentName || group?.name}
        />
      ) : null}
    </Dialog>
  )
}

export default function DepartmentsPage() {
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const institutionId = institution?.institutionId
  const [searchParams] = useSearchParams()
  const scopedInstitutionCertIdParam = searchParams.get("institutionCertId")
  const scopedInstitutionCertId = scopedInstitutionCertIdParam ? Number(scopedInstitutionCertIdParam) : null

  const data = useInstitutionData(institutionId)
  const [manageGroup, setManageGroup] = useState(null)
  const queryClient = useQueryClient()

  const departmentsQuery = useQuery({
    queryKey: ["departments", institutionId],
    queryFn: () => getDepartments({ institutionId }),
    enabled: institutionId != null,
    retry: 1,
  })

  const membersQuery = useQuery({
    queryKey: ["department-heads", institutionId],
    queryFn: () => getMyDepartmentHeads(),
    enabled: institutionId != null,
    retry: 1,
  })

  const members = Array.isArray(membersQuery.data) ? membersQuery.data : []

  const userById = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members]
  )

  const groups = (Array.isArray(departmentsQuery.data) ? departmentsQuery.data : []).filter(
    (group) =>
      group.status === "active" &&
      (scopedInstitutionCertId == null || (group.institutionCertIds ?? []).includes(scopedInstitutionCertId))
  )

  const scopedCertification = scopedInstitutionCertId != null
    ? data.certificationById.get(data.institutionCertById.get(scopedInstitutionCertId)?.certificationId)
    : null

  if (institutionLoading || (institution && data.isLoading)) {
    return <InstitutionLoadingSkeleton />
  }
  if (institutionError) {
    return <InstitutionErrorState onRetry={refetchInstitution} />
  }
  if (!institution) {
    return (
      <InstitutionEmptyState
        title="No institution found"
        description="Learner departments appear here once your institution is registered."
      />
    )
  }

  const hasAllocations = data.institutionCerts.some((cert) => String(cert.status ?? "").toLowerCase() === "active")
  const awaitingPayment = data.institutionCerts.some((cert) => String(cert.status ?? "").toLowerCase() === "pending")

  return (
    <div className="space-y-6">

      <InstitutionPageHeader
        title={scopedCertification ? `Departments — ${scopedCertification.title}` : "Departments"}
        subtitle="Each certification your institution holds has one department, named after the certification's department. Assign its head and manage its learners here."
      />

      {departmentsQuery.isError ? (
        <InstitutionErrorState onRetry={departmentsQuery.refetch} />
      ) : !hasAllocations ? (
        <InstitutionEmptyState
          icon={UsersRound}
          title={awaitingPayment ? "Pay your invoice to create departments" : "No certification allocations yet"}
          description={
            awaitingPayment
              ? "Your certification access activates once the invoice is paid. Departments can be created after that."
              : "Once your institution has a paid certification allocation, you can create departments under it."
          }
          action={
            <Button asChild size="sm">
              <Link to={awaitingPayment ? "/institution/invoices" : "/institution/partnership"}>
                {awaitingPayment ? "Open invoices" : "Request partnership"}
              </Link>
            </Button>
          }
        />
      ) : groups.length === 0 ? (
        <InstitutionEmptyState
          icon={UsersRound}
          title="No departments yet"
          description="A department appears here automatically once your certification access is paid and active."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const coveredTitles = (group.certifications ?? []).map((cert) => cert.title).filter(Boolean)
            return (
              <Card key={group.departmentId} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{group.departmentName}</CardTitle>
                    <InstitutionStatusBadge status={group.status} />
                  </div>
                  <CardDescription>
                    {coveredTitles.length > 0 ? coveredTitles.join(" · ") : "No certifications"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {group.departmentDescription || "No description."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.usedSlots ?? 0} / {group.totalSlots ?? 0} slot
                    {(group.totalSlots ?? 0) === 1 ? "" : "s"} used
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManageGroup(group)}
                  >
                    <UserCog className="size-4" aria-hidden="true" />
                    Manage
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <ManageGroupDialog
        group={manageGroup}
        open={manageGroup != null}
        onOpenChange={(open) => !open && setManageGroup(null)}
        members={members}
        userById={userById}
        assignments={data.assignments}
        learnerById={data.learnerById}
        invitations={data.invitations}
        institutionCertById={data.institutionCertById}
      />
    </div>
  )
}
