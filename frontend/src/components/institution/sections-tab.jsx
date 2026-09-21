import { useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  ChevronDown,
  ChevronRight,
  Layers,
  Loader2,
  MailIcon,
  PencilIcon,
  Plus,
  Trash2,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionStatusBadge,
} from "@/components/institution/institution-ui.jsx"
import {
  archiveGroupSection,
  createGroupSection,
  getGroupLearnerRoster,
  getGroupSections,
  moveLearnerToSection,
  removeLearnerFromGroup,
  updateGroupSection,
} from "@/services/institutionService.js"
import {
  cancelInstitutionInvitation,
  getInstitutionInvitations,
  sendInstitutionInvitations,
} from "@/services/partnershipService.js"

/**
 * The Sections tab of a department workspace.
 *
 * A department head splits the department's learners into sections (a class,
 * a block, a batch) and adds learners per section: typed in one at a time, or
 * in bulk from a CSV/TSV/TXT file. "Adding" a learner is sending them an
 * invitation -- accounts are created when they accept -- so each section shows
 * both its enrolled learners and the invitations still out.
 *
 * Learners the department already had before sections existed sit under
 * "Not in a section" and can be moved into one from the row.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NO_SECTION = "__none__"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback
}

function fullName(row) {
  return [row.firstName, row.lastName].filter(Boolean).join(" ")
}

/* ------------------------------------------------------------------ */
/* CSV import                                                          */
/* ------------------------------------------------------------------ */

/** Split one CSV/TSV line, honouring double quotes. */
function splitLine(line, delimiter) {
  const cells = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (ch === delimiter && !quoted) {
      cells.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells.map((cell) => cell.trim())
}

/**
 * Learners out of a spreadsheet export.
 *
 * Accepts a header row (email / e-mail, first name / firstname / given name,
 * last name / lastname / surname / family name, or a single "name" column) in
 * any order, or no header at all -- then the first email-looking cell is the
 * email and the other cells are the name. One learner per line; blank lines
 * and lines with no email are reported back rather than silently dropped.
 */
export function parseLearnerFile(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim() !== "")
  if (lines.length === 0) return { learners: [], problems: ["The file is empty."] }

  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") && !lines[0].includes(",") ? ";" : ","
  const firstCells = splitLine(lines[0], delimiter).map((cell) => cell.toLowerCase())
  const hasHeader = !firstCells.some((cell) => EMAIL_PATTERN.test(cell))

  const findColumn = (...names) => firstCells.findIndex((cell) => names.includes(cell.replace(/[\s_-]+/g, " ")))
  const columns = hasHeader
    ? {
        email: findColumn("email", "e mail", "email address", "e mail address"),
        first: findColumn("first name", "firstname", "given name", "first"),
        last: findColumn("last name", "lastname", "surname", "family name", "last"),
        name: findColumn("name", "full name", "learner", "student", "student name"),
      }
    : null

  const learners = []
  const problems = []
  const seen = new Set()
  lines.slice(hasHeader ? 1 : 0).forEach((line, index) => {
    const lineNo = index + (hasHeader ? 2 : 1)
    const cells = splitLine(line, delimiter)
    let email = ""
    let firstName = ""
    let lastName = ""

    if (columns && columns.email >= 0) {
      email = cells[columns.email] ?? ""
      firstName = columns.first >= 0 ? cells[columns.first] ?? "" : ""
      lastName = columns.last >= 0 ? cells[columns.last] ?? "" : ""
      if (!firstName && !lastName && columns.name >= 0) {
        const parts = (cells[columns.name] ?? "").split(/\s+/).filter(Boolean)
        firstName = parts.slice(0, -1).join(" ")
        lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? ""
      }
    } else {
      const emailIndex = cells.findIndex((cell) => EMAIL_PATTERN.test(cell))
      if (emailIndex >= 0) {
        email = cells[emailIndex]
        const rest = cells.filter((_, i) => i !== emailIndex).filter(Boolean)
        firstName = rest[0] ?? ""
        lastName = rest.slice(1).join(" ")
      }
    }

    email = email.trim().toLowerCase()
    if (!email) {
      problems.push(`Line ${lineNo}: no email address.`)
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      problems.push(`Line ${lineNo}: "${email}" is not a valid email.`)
      return
    }
    if (seen.has(email)) {
      problems.push(`Line ${lineNo}: ${email} is listed more than once.`)
      return
    }
    seen.add(email)
    learners.push({ email, firstName: firstName.trim(), lastName: lastName.trim() })
  })

  return { learners, problems }
}

const SAMPLE_CSV = "first name,last name,email\nJuan,Dela Cruz,juan@example.com\nMaria,Santos,maria@example.com\n"

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "rebyu-learners-template.csv"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* Add learners dialog: manual list + file import                      */
/* ------------------------------------------------------------------ */

function AddLearnersDialog({ open, onOpenChange, groupId, group, section }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [mode, setMode] = useState("manual")
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "" })
  const [staged, setStaged] = useState([])
  const [fileProblems, setFileProblems] = useState([])
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")

  const remainingSlots = Math.max(0, (group.totalSlots ?? 0) - (group.usedSlots ?? 0))

  const reset = () => {
    setMode("manual")
    setDraft({ firstName: "", lastName: "", email: "" })
    setStaged([])
    setFileProblems([])
    setFileName("")
    setError("")
    if (fileRef.current) fileRef.current.value = ""
  }

  const close = (next) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const stage = (learners) => {
    const next = [...staged]
    const dupes = []
    for (const learner of learners) {
      if (next.some((row) => row.email === learner.email)) dupes.push(learner.email)
      else next.push(learner)
    }
    if (next.length > remainingSlots) {
      setError(`Only ${remainingSlots} slot(s) remain in this department; ${next.length} learner(s) staged.`)
    } else {
      setError("")
    }
    setStaged(next)
    return dupes
  }

  const addManual = () => {
    const email = draft.email.trim().toLowerCase()
    if (!email) return setError("Enter the learner's email.")
    if (!EMAIL_PATTERN.test(email)) return setError(`"${email}" is not a valid email.`)
    const dupes = stage([{ email, firstName: draft.firstName.trim(), lastName: draft.lastName.trim() }])
    if (dupes.length) return setError("That email is already in the list.")
    setDraft({ firstName: "", lastName: "", email: "" })
    return undefined
  }

  const readFile = async (file) => {
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    const { learners, problems } = parseLearnerFile(text)
    const dupes = stage(learners)
    setFileProblems([
      ...problems,
      ...dupes.map((email) => `${email} was already in the list.`),
    ])
    if (learners.length === 0 && problems.length === 0) {
      setFileProblems(["No learners were found in that file."])
    }
  }

  const send = useMutation({
    mutationFn: () =>
      sendInstitutionInvitations({
        institutionGroupId: groupId,
        learners: staged,
        sectionId: section?.sectionId ?? null,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["group-invitations", groupId] })
      queryClient.invalidateQueries({ queryKey: ["group-sections", groupId] })
      queryClient.invalidateQueries({ queryKey: ["institution-group", groupId] })
      toast.success(
        `${response.created} learner(s) invited${section ? ` to ${section.sectionName}` : ""}.` +
          (response.skipped?.length ? ` ${response.skipped.length} skipped.` : "")
      )
      close(false)
    },
    onError: (err) => setError(backendMessage(err, "Unable to add these learners.")),
  })

  const overCap = staged.length > remainingSlots

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add learners{section ? ` to ${section.sectionName}` : ""}</DialogTitle>
          <DialogDescription>
            Each learner gets an email invitation and joins {section ? "this section" : "the department"} when they
            accept. {remainingSlots} of {group.totalSlots ?? 0} slot(s) remain in this department.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2" role="tablist">
          {[
            ["manual", "Type them in"],
            ["file", "Upload a file"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
                mode === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "manual" ? (
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
            <Input
              value={draft.firstName}
              onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
              placeholder="First name"
              aria-label="First name"
            />
            <Input
              value={draft.lastName}
              onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
              placeholder="Last name"
              aria-label="Last name"
            />
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addManual()
                }
              }}
              placeholder="learner@example.com"
              aria-label="Email"
            />
            <Button type="button" variant="outline" onClick={addManual}>
              Add
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                readFile(e.dataTransfer.files?.[0])
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                className="sr-only"
                aria-label="Upload a learner list"
                onChange={(e) => readFile(e.target.files?.[0])}
              />
              <div className="mb-3 flex size-12 items-center justify-center rounded-full border bg-background text-muted-foreground">
                <UploadIcon className="size-5" />
              </div>
              <p className="text-sm font-medium">Drop a CSV here</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                CSV, TSV or TXT with an <span className="font-mono">email</span> column and optional{" "}
                <span className="font-mono">first name</span> / <span className="font-mono">last name</span> (or{" "}
                <span className="font-mono">name</span>). Exporting your class list from Excel or Google Sheets as
                CSV works as-is.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <UploadIcon className="-ms-1 size-4 opacity-60" aria-hidden="true" />
                  Choose file
                </Button>
                <Button type="button" variant="ghost" onClick={downloadSampleCsv}>
                  Download template
                </Button>
              </div>
              {fileName ? <p className="mt-3 text-xs text-muted-foreground">Read {fileName}</p> : null}
            </div>
            {fileProblems.length ? (
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                {fileProblems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {staged.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {staged.length} learner(s) ready
            </p>
            <div className="max-h-56 divide-y overflow-y-auto rounded-lg border">
              {staged.map((row) => (
                <div key={row.email} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0 truncate">
                    <span className="font-medium">{fullName(row) || "—"}</span>
                    <span className="ml-2 text-muted-foreground">{row.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaged((current) => current.filter((r) => r.email !== row.email))}
                    aria-label={`Remove ${row.email}`}
                    className="rounded-full px-1 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={send.isPending}>
            Cancel
          </Button>
          <Button onClick={() => send.mutate()} disabled={staged.length === 0 || overCap || send.isPending}>
            {send.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              <>
                <MailIcon className="size-4" aria-hidden="true" />
                Invite {staged.length || ""} learner{staged.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Section create / rename dialog                                      */
/* ------------------------------------------------------------------ */

function SectionDialog({ open, onOpenChange, groupId, section }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(section?.sectionName ?? "")
  const [description, setDescription] = useState(section?.description ?? "")
  const [error, setError] = useState("")

  const save = useMutation({
    mutationFn: () =>
      section
        ? updateGroupSection(groupId, section.sectionId, { sectionName: name.trim(), description })
        : createGroupSection(groupId, { sectionName: name.trim(), description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-sections", groupId] })
      toast.success(section ? "Section updated." : "Section created.")
      onOpenChange(false)
    },
    onError: (err) => setError(backendMessage(err, "Unable to save this section.")),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{section ? "Rename section" : "New section"}</DialogTitle>
          <DialogDescription>
            A section is a class or batch inside this department, such as “BSIT 3A” or “Batch 2026 · Morning”.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="section-name">Section name</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BSIT 3A"
              maxLength={150}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="section-description">Description (optional)</Label>
            <Textarea
              id="section-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Schedule, adviser, anything the department should know."
              rows={2}
              maxLength={2000}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return setError("Enter a section name.")
              return save.mutate()
            }}
            disabled={save.isPending}
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : section ? "Save" : "Create section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* One section: its roster and pending invitations                     */
/* ------------------------------------------------------------------ */

function LessonProgressCell({ completed, total, percentage }) {
  if (!total) return <span className="text-sm text-muted-foreground">No lessons yet</span>
  const shown = Number.isFinite(Number(percentage)) ? Number(percentage) : 0
  return (
    <div className="flex items-center gap-2">
      <Progress value={Math.min(100, Math.max(0, shown))} className="h-1.5 w-16" />
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  )
}

function SectionPanel({
  groupId,
  group,
  section,
  sections,
  learners,
  invitations,
  defaultOpen,
  onEdit,
  onArchive,
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["group-learner-roster", groupId] })
    queryClient.invalidateQueries({ queryKey: ["group-sections", groupId] })
    queryClient.invalidateQueries({ queryKey: ["group-invitations", groupId] })
    queryClient.invalidateQueries({ queryKey: ["institution-group", groupId] })
  }

  const move = useMutation({
    mutationFn: ({ assigneeId, sectionId }) => moveLearnerToSection(groupId, assigneeId, sectionId),
    onSuccess: (_, variables) => {
      const target = sections.find((s) => s.sectionId === variables.sectionId)
      toast.success(target ? `Moved to ${target.sectionName}.` : "Removed from section.")
      invalidate()
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to move this learner.")),
  })

  const remove = useMutation({
    mutationFn: (learnerId) => removeLearnerFromGroup(groupId, learnerId),
    onSuccess: () => {
      toast.success("Learner removed from this department. Their account and progress are unchanged.")
      setRemoveTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to remove this learner.")),
  })

  const cancel = useMutation({
    mutationFn: (invitationId) => cancelInstitutionInvitation(invitationId),
    onSuccess: () => {
      toast.success("Invitation cancelled. Slot restored.")
      invalidate()
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to cancel this invitation.")),
  })

  const isUnsectioned = section == null
  const title = isUnsectioned ? "Not in a section" : section.sectionName
  const pending = invitations.filter((inv) => inv.status === "PENDING")

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${
              isUnsectioned ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            }`}
          >
            {isUnsectioned ? <UsersIcon className="size-4" /> : <Layers className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {learners.length} learner{learners.length === 1 ? "" : "s"}
              {pending.length ? ` · ${pending.length} invitation${pending.length === 1 ? "" : "s"} pending` : ""}
              {section?.description ? ` · ${section.description}` : ""}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen ? (
        <CardContent className="space-y-4 border-t bg-muted/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {isUnsectioned
                ? "Learners who joined before sections existed, or whose section was archived. Move them into a section from the row."
                : "Add learners by typing them in or uploading a class list."}
            </p>
            <div className="flex gap-2">
              {!isUnsectioned ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => onEdit(section)}>
                    <PencilIcon className="size-4" aria-hidden="true" />
                    Rename
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onArchive(section)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Archive
                  </Button>
                </>
              ) : null}
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlusIcon className="size-4" aria-hidden="true" />
                Add learners
              </Button>
            </div>
          </div>

          {pending.length ? (
            <div className="divide-y rounded-lg border bg-background">
              {pending.map((inv) => (
                <div key={inv.invitationId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <MailIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">
                      {fullName(inv) ? <span className="font-medium">{fullName(inv)} </span> : null}
                      <span className="text-muted-foreground">{inv.email}</span>
                    </span>
                    <InstitutionStatusBadge status={inv.status} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancel.mutate(inv.invitationId)}
                    disabled={cancel.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {learners.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-background px-4 py-6 text-center text-sm text-muted-foreground">
              {pending.length ? "No one has accepted yet." : "No learners here yet."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead className="w-44">Lessons completed</TableHead>
                    <TableHead className="w-44">Section</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners.map((row) => (
                    <TableRow key={row.institutionGroupAssigneeId}>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => navigate(`/institution/groups/${groupId}/learners/${row.learnerId}`)}
                      >
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.email ?? (row.username ? `@${row.username}` : "")}</p>
                      </TableCell>
                      <TableCell>
                        <LessonProgressCell
                          completed={row.completedLessonCount}
                          total={row.totalLessonCount}
                          percentage={row.completionPercentage}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.sectionId != null ? String(row.sectionId) : NO_SECTION}
                          onValueChange={(value) =>
                            move.mutate({
                              assigneeId: row.institutionGroupAssigneeId,
                              sectionId: value === NO_SECTION ? null : Number(value),
                            })
                          }
                          disabled={move.isPending}
                        >
                          <SelectTrigger className="h-8 text-xs" aria-label="Move to section">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_SECTION}>No section</SelectItem>
                            {sections.map((s) => (
                              <SelectItem key={s.sectionId} value={String(s.sectionId)}>
                                {s.sectionName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${row.name} from this department`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveTarget(row)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      ) : null}

      {addOpen ? (
        <AddLearnersDialog open={addOpen} onOpenChange={setAddOpen} groupId={groupId} group={group} section={section} />
      ) : null}

      <AlertDialog open={removeTarget != null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this learner from the department?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} will be unassigned from this department and the slot returned. Their account,
              enrolment, and progress are kept, so they can be added back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate(removeTarget.learnerId)} disabled={remove.isPending}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* The tab                                                             */
/* ------------------------------------------------------------------ */

export function SectionsTab({ groupId, group }) {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState(null) // { section } | null
  const [archiveTarget, setArchiveTarget] = useState(null)

  const sectionsQuery = useQuery({
    queryKey: ["group-sections", groupId],
    queryFn: () => getGroupSections(groupId),
    enabled: Number.isFinite(groupId),
  })
  const rosterQuery = useQuery({
    queryKey: ["group-learner-roster", groupId],
    queryFn: () => getGroupLearnerRoster(groupId),
    enabled: Number.isFinite(groupId),
  })
  const invitationsQuery = useQuery({
    queryKey: ["group-invitations", groupId],
    queryFn: () => getInstitutionInvitations(),
    enabled: Number.isFinite(groupId),
  })

  const sections = asArray(sectionsQuery.data)
  const roster = asArray(rosterQuery.data).filter((row) => row.status === "active")
  const invitations = asArray(invitationsQuery.data).filter((inv) => inv.institutionGroupId === groupId)

  const bySection = useMemo(() => {
    const map = new Map()
    for (const row of roster) {
      const key = row.sectionId ?? NO_SECTION
      map.set(key, [...(map.get(key) ?? []), row])
    }
    return map
  }, [roster])
  const invitationsBySection = useMemo(() => {
    const map = new Map()
    for (const inv of invitations) {
      const key = inv.sectionId ?? NO_SECTION
      map.set(key, [...(map.get(key) ?? []), inv])
    }
    return map
  }, [invitations])

  const archive = useMutation({
    mutationFn: (sectionId) => archiveGroupSection(groupId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-sections", groupId] })
      queryClient.invalidateQueries({ queryKey: ["group-learner-roster", groupId] })
      queryClient.invalidateQueries({ queryKey: ["group-invitations", groupId] })
      toast.success("Section archived. Its learners stay in the department.")
      setArchiveTarget(null)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to archive this section.")),
  })

  if (sectionsQuery.isLoading || rosterQuery.isLoading) return <InstitutionLoadingSkeleton rows={3} />
  if (sectionsQuery.isError) {
    return (
      <InstitutionErrorState
        title="Unable to load sections"
        description={backendMessage(sectionsQuery.error, "Check that the API is running.")}
        onRetry={() => sectionsQuery.refetch()}
      />
    )
  }

  const unsectioned = bySection.get(NO_SECTION) ?? []
  const unsectionedInvites = invitationsBySection.get(NO_SECTION) ?? []
  const remainingSlots = Math.max(0, (group.totalSlots ?? 0) - (group.usedSlots ?? 0))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">Sections</CardTitle>
            <CardDescription>
              {sections.length} section{sections.length === 1 ? "" : "s"} · {roster.length} learner
              {roster.length === 1 ? "" : "s"} · {remainingSlots} of {group.totalSlots ?? 0} slot(s) remaining
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialog({ section: null })}>
            <Plus className="size-4" aria-hidden="true" />
            New section
          </Button>
        </CardHeader>
      </Card>

      {sections.length === 0 && roster.length === 0 && invitations.length === 0 ? (
        <InstitutionEmptyState
          icon={Layers}
          title="No sections yet"
          description="Create a section for each class or batch, then add its learners by typing them in or uploading a CSV."
          action={
            <Button onClick={() => setDialog({ section: null })}>
              <Plus className="size-4" aria-hidden="true" />
              Create section
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <SectionPanel
              key={section.sectionId}
              groupId={groupId}
              group={group}
              section={section}
              sections={sections}
              learners={bySection.get(section.sectionId) ?? []}
              invitations={invitationsBySection.get(section.sectionId) ?? []}
              defaultOpen={index === 0}
              onEdit={(s) => setDialog({ section: s })}
              onArchive={(s) => setArchiveTarget(s)}
            />
          ))}
          {unsectioned.length > 0 || unsectionedInvites.length > 0 ? (
            <SectionPanel
              groupId={groupId}
              group={group}
              section={null}
              sections={sections}
              learners={unsectioned}
              invitations={unsectionedInvites}
              defaultOpen={sections.length === 0}
              onEdit={() => {}}
              onArchive={() => {}}
            />
          ) : null}
        </div>
      )}

      {dialog ? (
        <SectionDialog
          key={dialog.section?.sectionId ?? "new"}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          groupId={groupId}
          section={dialog.section}
        />
      ) : null}

      <AlertDialog open={archiveTarget != null} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{archiveTarget?.sectionName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Its {archiveTarget?.learnerCount ?? 0} learner(s) stay in the department under “Not in a section”, and any
              pending invitations still bring learners into the department. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep section</AlertDialogCancel>
            <AlertDialogAction onClick={() => archive.mutate(archiveTarget.sectionId)} disabled={archive.isPending}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
