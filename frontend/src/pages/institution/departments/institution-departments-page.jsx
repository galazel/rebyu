import { useEffect, useMemo, useState } from "react"
import { Link, useOutletContext, useSearchParams } from "react-router-dom"
import { ArrowLeftIcon } from "@/components/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Mail, Plus, Trash2, UserCog, UserPlus, Users2, UsersRound } from "@/components/icons"
import { toast } from "sonner"

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
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import { REFERENCE_DEPARTMENT, useReferenceOptions } from "@/services/referenceService.js"
import {
  getLearnerDisplayName,
  useInstitutionData,
} from "@/hooks/use-institution-data.js"
import {
  addDepartmentLearner,
  archiveDepartment,
  assignDepartmentHeadAssignment,
  changeDepartmentLearnerRole,
  createDepartment,
  getDepartmentLearners,
  getDepartmentHeadAssignments,
  getDepartments,
  getMyDepartmentHeads,
  inviteDepartmentHead,
  removeDepartmentLearner,
  removeDepartmentHeadAssignment,
  updateDepartment,
} from "@/services/institutionService.js"
import {
  cancelInstitutionInvitation,
  sendInstitutionInvitations,
} from "@/services/partnershipService.js"

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? fallback
}

const OTHER_DEPARTMENT = "__other__"

function CreateGroupDialog({ open, onOpenChange, institutionCerts, certificationById, lockedInstitutionCertId, departments = [] }) {
  /* The department names on offer come from the stored list an admin keeps,
     not a free text box: one vocabulary across every institution, and no
     "CCS" beside "College of Computer Studies". */
  const { options: departmentOptions } = useReferenceOptions(REFERENCE_DEPARTMENT)
  const queryClient = useQueryClient()
  const [institutionCertId, setInstitutionCertId] = useState("")
  const [departmentName, setDepartmentName] = useState("")
  /* "Other" in the select opens a text box; the typed name is what is sent. */
  const [departmentChoice, setDepartmentChoice] = useState("")
  const [departmentDescription, setDepartmentDescription] = useState("")
  const [totalSlots, setTotalSlots] = useState("")
  const [error, setError] = useState("")

  const selectedInstitutionCert = institutionCerts.find(
    (institutionCert) => String(institutionCert.institutionCertId) === institutionCertId
  )

  // Arriving from a specific certification's card: the allocation is fixed,
  // not picked from a dropdown.
  useEffect(() => {
    if (open) {
      setInstitutionCertId(lockedInstitutionCertId != null ? String(lockedInstitutionCertId) : "")
    }
  }, [open, lockedInstitutionCertId])

  const reset = () => {
    setInstitutionCertId(lockedInstitutionCertId != null ? String(lockedInstitutionCertId) : "")
    setDepartmentName("")
    setDepartmentChoice("")
    setDepartmentDescription("")
    setTotalSlots("")
    setError("")
  }

  /* What this allocation still has to give: its total less what the
     departments already under it were given. The field is capped at that,
     and opens on it, so an institution sees at a glance how much is left
     rather than the allocation's whole size. */
  const allocatedSlots = departments
    .filter((group) => String(group.institutionCertId) === String(institutionCertId))
    .reduce((sum, group) => sum + Number(group.totalSlots ?? 0), 0)
  const remainingSlots = selectedInstitutionCert
    ? Math.max(0, Number(selectedInstitutionCert.totalSlots ?? 0) - allocatedSlots)
    : null

  const createMutation = useMutation({
    mutationFn: () =>
      createDepartment({
        institutionCertId: Number(institutionCertId),
        departmentName: departmentName.trim(),
        departmentDescription: departmentDescription.trim() || null,
        totalSlots: Number(totalSlots),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success("Department created.")
      reset()
      onOpenChange(false)
    },
    onError: (err) => {
      const message = backendMessage(err, "Unable to create the department.")
      setError(message)
      toast.error(message)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!institutionCertId) {
      setError("Select a certification allocation.")
      return
    }
    if (!departmentName.trim()) {
      setError("Enter a department name.")
      return
    }
    const slots = Number(totalSlots)
    if (!totalSlots || !Number.isInteger(slots) || slots < 1) {
      setError("Enter a number of slots (at least 1).")
      return
    }
    if (remainingSlots != null && slots > remainingSlots) {
      setError(
        remainingSlots === 0
          ? "This allocation has no slots left for a new department."
          : `Only ${remainingSlots} slot(s) are left on this allocation; the other departments hold the rest.`
      )
      return
    }
    createMutation.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create department</DialogTitle>
          <DialogDescription>
            Departments organize learners under one certification allocation. Assign an
            department head afterwards to let them manage the department's learners.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department-cert">Certification allocation</Label>
            <Select
              value={institutionCertId}
              onValueChange={setInstitutionCertId}
              disabled={lockedInstitutionCertId != null}
            >
              <SelectTrigger id="department-cert" className="w-full">
                <SelectValue placeholder="Select certification allocation" />
              </SelectTrigger>
              <SelectContent>
                {institutionCerts.map((institutionCert) => (
                  <SelectItem key={institutionCert.institutionCertId} value={String(institutionCert.institutionCertId)}>
                    {certificationById.get(institutionCert.certificationId)?.title ??
                      `Certification #${institutionCert.certificationId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-name">Department</Label>
            <Select
              value={departmentChoice}
              onValueChange={(value) => {
                setDepartmentChoice(value)
                setDepartmentName(value === OTHER_DEPARTMENT ? "" : value)
              }}
            >
              <SelectTrigger id="group-name" className="w-full">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.filter((name) => name !== "Other").map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_DEPARTMENT}>Other (type a name)</SelectItem>
              </SelectContent>
            </Select>
            {departmentChoice === OTHER_DEPARTMENT ? (
              <Input
                id="group-name-other"
                autoFocus
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Department name"
                maxLength={150}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Description (optional)</Label>
            <Textarea
              id="group-description"
              value={departmentDescription}
              onChange={(e) => setDepartmentDescription(e.target.value)}
              placeholder="What is this department for?"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-slots">Learner slots</Label>
            <Input
              id="department-slots"
              type="number"
              min={1}
              max={remainingSlots ?? undefined}
              value={totalSlots}
              onChange={(e) => setTotalSlots(e.target.value)}
              placeholder={remainingSlots != null ? String(remainingSlots) : "e.g. 30"}
            />
            {selectedInstitutionCert ? (
              <p className={`text-xs ${remainingSlots === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {remainingSlots === 0
                  ? `No slots left: all ${selectedInstitutionCert.totalSlots} on this allocation are already given to departments.`
                  : `${remainingSlots} of ${selectedInstitutionCert.totalSlots} slot(s) still available on this certification allocation.`}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                "Create department"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ManageGroupDialog({
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
  const [authorityUserId, setAuthorityUserId] = useState("")
  const [institutionCertLearnerId, setInstitutionCertLearnerId] = useState("")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [learnerInviteEmail, setLearnerInviteEmail] = useState("")
  const [learnerInviteFirst, setLearnerInviteFirst] = useState("")
  const [learnerInviteLast, setLearnerInviteLast] = useState("")
  const [editingSlots, setEditingSlots] = useState(false)
  const [slotsInput, setSlotsInput] = useState("")
  /* Name and description, edited in place. The name is picked from the
     stored department list like it was at creation, with "Other" for a name
     the list does not hold. */
  const [editingDetails, setEditingDetails] = useState(false)
  const [nameChoice, setNameChoice] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [descriptionInput, setDescriptionInput] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { options: departmentOptions } = useReferenceOptions(REFERENCE_DEPARTMENT)

  useEffect(() => {
    if (open && group) {
      setSlotsInput(String(group.totalSlots ?? 0))
      setEditingSlots(false)
      setEditingDetails(false)
      setConfirmDelete(false)
      setNameInput(group.departmentName ?? "")
      setDescriptionInput(group.departmentDescription ?? "")
    }
  }, [open, group])

  useEffect(() => {
    if (!open || !group) return
    const listed = departmentOptions.includes(group.departmentName)
    setNameChoice(listed ? group.departmentName : OTHER_DEPARTMENT)
  }, [open, group, departmentOptions])

  const updateDetailsMutation = useMutation({
    mutationFn: () =>
      updateDepartment(departmentId, {
        departmentName: nameInput.trim(),
        departmentDescription: descriptionInput.trim() || null,
        totalSlots: group.totalSlots,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success("Department updated.")
      setEditingDetails(false)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to update the department.")),
  })

  const deleteMutation = useMutation({
    mutationFn: () => archiveDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success("Department deleted.")
      setConfirmDelete(false)
      onOpenChange(false)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to delete the department.")),
  })

  const updateSlotsMutation = useMutation({
    mutationFn: (nextTotalSlots) =>
      updateDepartment(departmentId, {
        departmentName: group.departmentName,
        departmentDescription: group.departmentDescription,
        totalSlots: nextTotalSlots,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success("Slot limit updated.")
      setEditingSlots(false)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to update the slot limit.")),
  })

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

  // Only this group's leader may invite/cancel its learner invitations -- the
  // institution account itself is read-only here.
  const isLeader = activeAuthorities.some((a) => a.userId === user?.userId)
  // Assigning/removing a group's leader (and creating a new leader's account)
  // is an institution-management action -- owner-only, same as Billing/
  // Partnership/Institution profile.
  const isOwner = isInstitutionOwner(user)

  const departmentInvitations = (Array.isArray(invitations) ? invitations : []).filter(
    (inv) => inv.departmentId === departmentId
  )
  const pendingGroupInvitations = departmentInvitations.filter((inv) => inv.status === "PENDING")

  const institutionCert = institutionCertById?.get(group?.institutionCertId)
  // The group's own slot cap is the binding constraint a leader actually
  // faces (never more than the certification's own remaining slots either --
  // the backend enforces both).
  const groupTotalSlots = group?.totalSlots ?? 0
  const groupUsedSlots = group?.usedSlots ?? 0
  const remainingSlots = Math.max(0, groupTotalSlots - groupUsedSlots)

  const assignedInstitutionCertLearnerIds = new Set(
    activeAssignees.map((a) => a.institutionCertLearnerId)
  )

  // Only learners that already hold access to THIS group's certification and are
  // not already in the group can be added — mirrors the backend invariant.
  const availableLearners = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.institutionCertId === group?.institutionCertId &&
          !assignedInstitutionCertLearnerIds.has(assignment.institutionCertLearnerId)
      ),
    [assignments, group?.institutionCertId, assignedInstitutionCertLearnerIds]
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

  const inviteMemberMutation = useMutation({
    mutationFn: () =>
      inviteDepartmentHead({
        firstName: inviteFirstName.trim(),
        lastName: inviteLastName.trim(),
        email: inviteEmail.trim(),
        headRole: "manager",
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["department-heads"] })
      toast.success(
        result?.emailed
          ? `Account created — login credentials were emailed to ${inviteEmail.trim()}.`
          : (result?.note ?? "Account created.")
      )
      setInviteFirstName("")
      setInviteLastName("")
      setInviteEmail("")
      setShowInviteForm(false)
    },
    onError: (err) =>
      toast.error(backendMessage(err, "Unable to create this account.")),
  })

  const inviteLearnerMutation = useMutation({
    mutationFn: () =>
      sendInstitutionInvitations({
        departmentId: departmentId,
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

  // Prefer the member's name (captured when their account was provisioned),
  // falling back to email for members created before names were stored.
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
          {/* Name and description */}
          {isOwner ? (
            <section className="rounded-lg border p-3">
              {editingDetails ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-department-name">Department</Label>
                    <Select
                      value={nameChoice}
                      onValueChange={(value) => {
                        setNameChoice(value)
                        setNameInput(value === OTHER_DEPARTMENT ? "" : value)
                      }}
                    >
                      <SelectTrigger id="edit-department-name" className="w-full">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.filter((name) => name !== "Other").map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_DEPARTMENT}>Other (type a name)</SelectItem>
                      </SelectContent>
                    </Select>
                    {nameChoice === OTHER_DEPARTMENT ? (
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Department name"
                        maxLength={150}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department-description">Description (optional)</Label>
                    <Textarea
                      id="edit-department-description"
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingDetails(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateDetailsMutation.mutate()}
                      disabled={!nameInput.trim() || updateDetailsMutation.isPending}
                    >
                      {updateDetailsMutation.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" /> : null}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{group.departmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.departmentDescription?.trim() || "No description."}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingDetails(true)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="mr-1.5 size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Slots */}
          <section className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {groupUsedSlots} / {groupTotalSlots} slot{groupTotalSlots === 1 ? "" : "s"} used
              </p>
              <p className="text-xs text-muted-foreground">
                Caps how many learners this department's head can invite.
              </p>
            </div>
            {isOwner ? (
              editingSlots ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={groupUsedSlots}
                    max={institutionCert?.totalSlots}
                    value={slotsInput}
                    onChange={(e) => setSlotsInput(e.target.value)}
                    className="w-20"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateSlotsMutation.mutate(Number(slotsInput))}
                    disabled={
                      !slotsInput ||
                      Number(slotsInput) < groupUsedSlots ||
                      updateSlotsMutation.isPending
                    }
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSlots(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingSlots(true)}>
                  Edit slots
                </Button>
              )
            ) : null}
          </section>

          {/* Authorities */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCog className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium">
                Authorities ({activeAuthorities.length})
              </h3>
            </div>

            {isOwner ? (
              <>
                <div className="flex gap-2">
                  <Select value={authorityUserId} onValueChange={setAuthorityUserId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department head" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No members available
                        </SelectItem>
                      ) : (
                        members.map((member) => (
                          <SelectItem key={member.userId} value={String(member.userId)}>
                            {memberLabel(member.userId)} · {member.headRole}
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
                  <UserPlus className="size-4" aria-hidden="true" />
                  {showInviteForm ? "Cancel" : "This person doesn't have an account yet"}
                </Button>

                {showInviteForm ? (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Create a new login account for a department head. They'll receive their
                      username and a temporary password by email.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="invite-first-name">First name</Label>
                        <Input
                          id="invite-first-name"
                          value={inviteFirstName}
                          onChange={(e) => setInviteFirstName(e.target.value)}
                          placeholder="Juan"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="invite-last-name">Last name</Label>
                        <Input
                          id="invite-last-name"
                          value={inviteLastName}
                          onChange={(e) => setInviteLastName(e.target.value)}
                          placeholder="Dela Cruz"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="head@example.com"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => inviteMemberMutation.mutate()}
                      disabled={
                        !inviteFirstName.trim() ||
                        !inviteLastName.trim() ||
                        !inviteEmail.trim() ||
                        inviteMemberMutation.isPending
                      }
                    >
                      {inviteMemberMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </div>
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

          {/* Invitations */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium">
                Learner invitations ({remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left)
              </h3>
            </div>

            {isLeader ? (
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

          {/* Learners */}
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

      {/* Deleting archives the department: its rows stay for the record,
          the learners in it lose the grouping, and it leaves this list. */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {group.departmentName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {groupUsedSlots > 0
                ? `${groupUsedSlots} learner${groupUsedSlots === 1 ? "" : "s"} in this department will lose the grouping; their enrollments and progress are kept. `
                : ""}
              The department's {groupTotalSlots} slot{groupTotalSlots === 1 ? "" : "s"} return to the certification allocation. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                deleteMutation.mutate()
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" /> : null}
              Delete department
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

export default function DepartmentsPage() {
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const institutionId = institution?.institutionId
  const [searchParams] = useSearchParams()
  // Reached from a specific certification's card on the Certifications page --
  // groups are always created/viewed in the context of one allocation. Without
  // this param (a stale bookmark, e.g.), every group across the org is shown.
  const scopedInstitutionCertIdParam = searchParams.get("institutionCertId")
  const scopedInstitutionCertId = scopedInstitutionCertIdParam ? Number(scopedInstitutionCertIdParam) : null

  const data = useInstitutionData(institutionId)
  const [createOpen, setCreateOpen] = useState(false)
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

  // Member/authority labels come from the tenant-scoped members list (which carries
  // each member's name and email) -- no global users fetch needed.
  const userById = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members]
  )

  const groups = (Array.isArray(departmentsQuery.data) ? departmentsQuery.data : []).filter(
    (group) =>
      group.status === "active" &&
      (scopedInstitutionCertId == null || group.institutionCertId === scopedInstitutionCertId)
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

  const hasAllocations = data.institutionCerts.length > 0

  return (
    <div className="space-y-6">
      {scopedInstitutionCertId != null ? (
        <Link
          to="/institution/certifications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to Certifications
        </Link>
      ) : null}

      <InstitutionPageHeader
        title={scopedCertification ? `Departments — ${scopedCertification.title}` : "Departments"}
        subtitle="Organize learners into departments under a certification allocation and delegate management to a department head."
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={!hasAllocations}>
            <Plus aria-hidden="true" />
            Create department
          </Button>
        }
      />

      {departmentsQuery.isError ? (
        <InstitutionErrorState onRetry={departmentsQuery.refetch} />
      ) : !hasAllocations ? (
        <InstitutionEmptyState
          icon={UsersRound}
          title="No certification allocations yet"
          description="Once your institution has a certification allocation, you can create departments under it."
        />
      ) : groups.length === 0 ? (
        <InstitutionEmptyState
          icon={UsersRound}
          title="No departments yet"
          description="Create a department to start organizing your learners."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const institutionCert = data.institutionCertById.get(group.institutionCertId)
            const certification = institutionCert
              ? data.certificationById.get(institutionCert.certificationId)
              : null
            return (
              <Card key={group.departmentId} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{group.departmentName}</CardTitle>
                    <InstitutionStatusBadge status={group.status} />
                  </div>
                  <CardDescription>
                    {certification?.title ??
                      `Certification #${institutionCert?.certificationId ?? "?"}`}
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

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        institutionCerts={data.institutionCerts}
        certificationById={data.certificationById}
        lockedInstitutionCertId={scopedInstitutionCertId}
        departments={Array.isArray(departmentsQuery.data) ? departmentsQuery.data : []}
      />

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
