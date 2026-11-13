import { useEffect, useState } from "react"
import { useOutletContext, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
} from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
} from "@/components/institution/institution-ui.jsx"
import { CurriculumOverview } from "@/components/institution/curriculum-overview.jsx"
import {
  DEPARTMENT_VIEW_ALIASES,
  DEPARTMENT_VIEW_IDS,
  DepartmentTabs,
} from "@/components/institution/departments-sidebar.jsx"
import { DepartmentProgramsPanel } from "@/components/institution/department-programs-panel.jsx"
import {
  DepartmentAssessmentsPanel,
  DepartmentQuestionBankPanel,
} from "@/components/institution/department-teaching-panels.jsx"
import { DepartmentProgramsEditor } from "@/components/institution/department-programs-editor.jsx"
import { useMyDepartments } from "@/hooks/use-my-department.js"
import { DepartmentManagementBoard } from "@/components/institution/department-management-board.jsx"
import { CoAuthoritiesDialog } from "@/components/institution/co-authorities-dialog.jsx"
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import {
  cancelDepartmentHeadCode,
  getDepartmentHeadCodeInvitations,
  sendDepartmentHeadCode,
  getDepartmentHeadAssignments,
  removeDepartmentHeadAssignment,
} from "@/services/institutionService.js"

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? fallback
}


export function ManageGroupDialog({
  group,
  open,
  onOpenChange,
  userById,
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const departmentId = group?.departmentId
  const [coAuthoritiesOpen, setCoAuthoritiesOpen] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const authoritiesQuery = useQuery({
    queryKey: ["department-head-assignments", departmentId],
    queryFn: () => getDepartmentHeadAssignments({ departmentId }),
    enabled: open && departmentId != null,
    retry: 1,
  })

  const authorities = Array.isArray(authoritiesQuery.data) ? authoritiesQuery.data : []

  const activeAuthorities = authorities.filter((a) => a.status === "active")

  const isOwner = isInstitutionOwner(user)

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["department-head-codes", departmentId] })
      if (data?.status === "REASSIGNED") {
        queryClient.invalidateQueries({ queryKey: ["department-head-assignments"] })
        toast.success(`${inviteEmail.trim()} already has a department head account, so access was restored directly.`)
      } else {
        toast.success(`Department head code emailed to ${inviteEmail.trim()}.`)
      }
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

  const removeAuthorityMutation = useMutation({
    mutationFn: (authorityId) => removeDepartmentHeadAssignment(authorityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-head-assignments", departmentId] })
      toast.success("Department head removed.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to remove department head.")),
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
      <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group.departmentName}</DialogTitle>
          <DialogDescription>
            Assign and manage this department's co-authorities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isOwner && group.departmentDescription ? (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                {group.departmentDescription.trim()}
              </p>
            </div>
          ) : null}

          {isOwner ? <DepartmentProgramsEditor department={group} /> : null}

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
                    No department head assigned yet. The institution assigns a department head to oversee
                    this department.
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
  const { user } = useAuth()
  const isOwner = isInstitutionOwner(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const { departmentsQuery, departments: groups, department: activeDepartment, departmentId: activeDepartmentId, selectDepartment } =
    useMyDepartments()

  // ?view=programs|roster|heads|announcements picks the panel, so the
  // dashboard's alerts and the browser's back button land on the right one.
  // Old #hash links (#dept-learner-table) still work.
  const hashView = typeof window !== "undefined" ? window.location.hash.replace("#", "") : ""
  const viewParam = searchParams.get("view")
  const activeFeature =
    DEPARTMENT_VIEW_IDS[DEPARTMENT_VIEW_ALIASES[viewParam] ?? viewParam] ??
    (Object.values(DEPARTMENT_VIEW_IDS).includes(hashView) ? hashView : DEPARTMENT_VIEW_IDS.programs)
  const rosterFilter = searchParams.get("filter") ?? "all"
  const sectionFilter = searchParams.get("section") ?? "all"
  const activeCertifications = (activeDepartment?.certifications ?? []).filter(
    (cert) => cert?.certificationId != null && String(cert?.status ?? "active").toLowerCase() === "active"
  )
  const requestedCertificationId = Number(searchParams.get("certificationId"))
  const curriculumCertificationId = activeCertifications.some(
    (cert) => cert.certificationId === requestedCertificationId
  )
    ? requestedCertificationId
    : activeCertifications[0]?.certificationId ?? null

  // ?department= (from a program page or the assessment builder) picks which department shows.
  const departmentParam = searchParams.get("department")
  useEffect(() => {
    if (departmentParam && String(departmentParam) !== String(activeDepartmentId)
        && groups.some((dept) => String(dept.departmentId) === departmentParam)) {
      selectDepartment(Number(departmentParam))
    }
  }, [departmentParam, activeDepartmentId, groups, selectDepartment])

  const selectFeature = (featureId) => {
    const view = Object.keys(DEPARTMENT_VIEW_IDS).find((key) => DEPARTMENT_VIEW_IDS[key] === featureId)
    // Assessments and the question bank share the chosen certification.
    const certificationId = searchParams.get("certificationId")
    setSearchParams(view ? { view, ...(certificationId ? { certificationId } : {}) } : {}, { replace: false })
  }

  if (institutionLoading || departmentsQuery.isLoading) {
    return <InstitutionLoadingSkeleton />
  }
  if (institutionError) {
    return <InstitutionErrorState onRetry={refetchInstitution} />
  }
  if (!institution) {
    return (
      <InstitutionEmptyState
        title="No institution found"
        description="Your department appears here once your institution is registered."
      />
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title={activeDepartment ? activeDepartment.departmentName : "Department"}
        subtitle={(activeDepartment?.certifications ?? []).map((cert) => cert.title).join(" · ") || null}
      />

      {departmentsQuery.isError ? (
        <InstitutionErrorState onRetry={departmentsQuery.refetch} />
      ) : groups.length === 0 ? (
        <InstitutionEmptyState
          icon={UsersRound}
          title="No active department"
          description="A department appears here once your institution's certification access is active and you are assigned to it."
        />
      ) : (
        <div className="space-y-6">
          <DepartmentTabs
            departments={groups}
            selectedDepartmentId={activeDepartmentId}
            onSelectDepartment={selectDepartment}
            activeFeature={activeFeature}
            onSelectFeature={selectFeature}
          />
          <div className="min-w-0">
            {activeFeature === DEPARTMENT_VIEW_IDS.programs ? (
              <DepartmentProgramsPanel key={activeDepartmentId} department={activeDepartment} />
            ) : activeFeature === DEPARTMENT_VIEW_IDS.curriculum ? (
              <section className="space-y-4">
                {activeCertifications.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Certification">
                    <span className="text-xs font-medium text-muted-foreground">Certification</span>
                    {activeCertifications.map((cert) => {
                      const selected = cert.certificationId === curriculumCertificationId
                      return (
                        <button
                          key={cert.certificationId}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() =>
                            setSearchParams(
                              { view: "curriculum", certificationId: String(cert.certificationId) },
                              { replace: false }
                            )
                          }
                          className={
                            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                            (selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:bg-muted")
                          }
                        >
                          {cert.title}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
                {curriculumCertificationId != null ? (
                  <CurriculumOverview
                    key={curriculumCertificationId}
                    certificationId={curriculumCertificationId}
                    departmentId={activeDepartmentId}
                  />
                ) : (
                  <InstitutionEmptyState
                    title="No curriculum available"
                    description="This department does not have an active certification yet."
                  />
                )}
              </section>
            ) : activeFeature === DEPARTMENT_VIEW_IDS.assessments ? (
              <DepartmentAssessmentsPanel key={activeDepartmentId} department={activeDepartment} />
            ) : activeFeature === DEPARTMENT_VIEW_IDS["question-bank"] ? (
              <DepartmentQuestionBankPanel key={activeDepartmentId} department={activeDepartment} />
            ) : (
              <DepartmentManagementBoard
                key={`${activeDepartmentId}-${activeFeature}-${rosterFilter}-${sectionFilter}`}
                departmentId={activeDepartmentId}
                department={activeDepartment}
                isOwner={isOwner}
                activeFeature={activeFeature}
                initialRosterFilter={rosterFilter}
                initialSectionFilter={sectionFilter}
              />
            )}
          </div>
        </div>
      )}

    </div>
  )
}
