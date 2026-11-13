import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAvatarUrls } from "@/hooks/use-avatar-url.js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { certificationBadgeUrl } from "@/services/certificationService.js"

import {
  AwardIcon,
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
  MoreVertical,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  formatDate,
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionStatusBadge,
} from "@/components/institution/institution-ui.jsx"
import {
  deleteGroupSection,
  createGroupSection,
  getGroupLearnerAwards,
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

const HEADER_NAMES = {
  email: ["email", "e mail", "email address", "e mail address", "emails", "school email", "student email"],
  first: ["first name", "firstname", "given name", "first"],
  last: ["last name", "lastname", "surname", "family name", "last"],
  name: ["name", "full name", "fullname", "complete name", "learner", "learner name", "student", "student name"],
}

function headerKey(cell) {
  return cell.toLowerCase().replace(/[^a-z\s_-]/g, "").replace(/[\s_-]+/g, " ").trim()
}

/** "Dela Cruz, Juan" (class lists) or "Juan Dela Cruz" → first and last name. */
function splitFullName(value) {
  const full = (value ?? "").trim()
  if (!full) return { firstName: "", lastName: "" }
  if (full.includes(",")) {
    const [last, ...rest] = full.split(",")
    return { firstName: rest.join(",").trim(), lastName: last.trim() }
  }
  const parts = full.split(/\s+/)
  return parts.length === 1
    ? { firstName: parts[0], lastName: "" }
    : { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] }
}

/** Row numbers, student numbers and other ids are not part of a name. */
function looksLikeId(cell) {
  return /^[\d\s\-./#]+$/.test(cell)
}

/**
 * Reads a class list (CSV, TSV or an Excel sheet turned into tab-separated text).
 * Title rows above the header, blank rows, a "Last, First" name column and extra
 * columns (student number, course) are all fine. Problems name the spreadsheet row.
 */
export function parseLearnerFile(text) {
  const all = text.replace(/^﻿/, "").split(/\r?\n/)
  const rows = all.map((line, index) => ({ line, rowNo: index + 1 })).filter((row) => row.line.trim() !== "")
  if (rows.length === 0) return { learners: [], problems: ["The file is empty."] }

  // Any tab means a spreadsheet; otherwise the most common of ; and , on the lines.
  const sample = rows.map((row) => row.line).join("\n")
  const delimiter = sample.includes("\t")
    ? "\t"
    : (sample.match(/;/g)?.length ?? 0) > (sample.match(/,/g)?.length ?? 0)
      ? ";"
      : ","
  const cellsOf = rows.map((row) => splitLine(row.line, delimiter))

  // The header is the last row before the first email that names an email column.
  const firstEmailRow = cellsOf.findIndex((cells) => cells.some((cell) => EMAIL_PATTERN.test(cell.trim())))
  let headerIndex = -1
  for (let i = (firstEmailRow < 0 ? cellsOf.length : firstEmailRow) - 1; i >= 0; i -= 1) {
    if (cellsOf[i].some((cell) => HEADER_NAMES.email.includes(headerKey(cell)))) {
      headerIndex = i
      break
    }
  }
  const header = headerIndex >= 0 ? cellsOf[headerIndex].map(headerKey) : null
  const findColumn = (names) => (header ? header.findIndex((cell) => names.includes(cell)) : -1)
  const columns = {
    email: findColumn(HEADER_NAMES.email),
    first: findColumn(HEADER_NAMES.first),
    last: findColumn(HEADER_NAMES.last),
    name: findColumn(HEADER_NAMES.name),
  }
  // Without a header, rows before the first email are titles and are skipped.
  const start = headerIndex >= 0 ? headerIndex + 1 : Math.max(firstEmailRow, 0)

  const learners = []
  const problems = []
  const seen = new Set()
  for (let i = start; i < rows.length; i += 1) {
    const { rowNo } = rows[i]
    const cells = cellsOf[i]
    let email = ""
    let firstName = ""
    let lastName = ""

    if (columns.email >= 0) {
      email = cells[columns.email] ?? ""
      firstName = columns.first >= 0 ? cells[columns.first] ?? "" : ""
      lastName = columns.last >= 0 ? cells[columns.last] ?? "" : ""
      if (!firstName && !lastName && columns.name >= 0) {
        ;({ firstName, lastName } = splitFullName(cells[columns.name]))
      }
    } else {
      const emailIndex = cells.findIndex((cell) => EMAIL_PATTERN.test(cell.trim()))
      if (emailIndex >= 0) {
        email = cells[emailIndex]
        const rest = cells.filter((cell, index) => index !== emailIndex && cell && !looksLikeId(cell))
        ;({ firstName, lastName } = rest.length === 1 ? splitFullName(rest[0]) : { firstName: rest[0] ?? "", lastName: rest[1] ?? "" })
      }
    }

    email = email.trim().toLowerCase()
    if (!email) {
      problems.push(`Row ${rowNo}: no email address.`)
      continue
    }
    if (!EMAIL_PATTERN.test(email)) {
      problems.push(`Row ${rowNo}: "${email}" is not a valid email.`)
      continue
    }
    if (seen.has(email)) {
      problems.push(`Row ${rowNo}: ${email} is listed more than once.`)
      continue
    }
    seen.add(email)
    learners.push({ email, firstName: firstName.trim(), lastName: lastName.trim() })
  }

  return { learners, problems }
}

/** The first sheet of an .xlsx workbook as tab-separated text, for parseLearnerFile. */
export async function xlsxToText(file) {
  const { default: JSZip } = await import("jszip")
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const xml = (path) => zip.file(path)?.async("string")
  const parse = (text) => new DOMParser().parseFromString(text, "application/xml")

  const shared = []
  const sharedXml = await xml("xl/sharedStrings.xml")
  if (sharedXml) {
    for (const item of parse(sharedXml).getElementsByTagName("si")) {
      shared.push(Array.from(item.getElementsByTagName("t")).map((t) => t.textContent ?? "").join(""))
    }
  }
  const sheetPath = Object.keys(zip.files)
    .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))[0]
  if (!sheetPath) return ""

  const columnIndex = (ref) => {
    const letters = (ref ?? "").replace(/\d+/g, "")
    let index = 0
    for (const ch of letters) index = index * 26 + (ch.charCodeAt(0) - 64)
    return Math.max(index - 1, 0)
  }
  const lines = []
  for (const row of parse(await xml(sheetPath)).getElementsByTagName("row")) {
    const cells = []
    for (const cell of row.getElementsByTagName("c")) {
      const type = cell.getAttribute("t")
      const raw =
        type === "inlineStr"
          ? cell.getElementsByTagName("t")[0]?.textContent ?? ""
          : cell.getElementsByTagName("v")[0]?.textContent ?? ""
      cells[columnIndex(cell.getAttribute("r"))] = type === "s" ? shared[Number(raw)] ?? "" : raw
    }
    lines.push(Array.from(cells, (value) => String(value ?? "").replace(/[\t\r\n]+/g, " ")).join("\t"))
  }
  return lines.join("\n")
}

function certSlotsLeft(cert) {
  return Math.max(0, Number(cert?.totalSlots ?? 0) - Number(cert?.usedSlots ?? 0))
}

function AddLearnersDialog({ open, onOpenChange, departmentId, group, section, certificationOptions = null }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [mode, setMode] = useState("manual")
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "" })
  const [staged, setStaged] = useState([])
  const [fileProblems, setFileProblems] = useState([])
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")

  // A section made for one certification (before programs) keeps it. Any other section
  // lets the inviter pick which of the department's certifications these learners get:
  // one invitation per certification, one email.
  const fixedCertId = section?.programId == null ? section?.institutionCertId ?? null : null
  const options =
    fixedCertId == null
      ? asArray(certificationOptions ?? group?.certifications).filter(
          (c) => c?.institutionCertId != null && String(c?.status ?? "active").toLowerCase() === "active"
        )
      : []
  const defaultChoice = () => {
    // A program's section starts with every certification the program offers.
    if (options.length === 1 || certificationOptions != null) return options.map((c) => c.institutionCertId)
    const active = group?.activeCertification?.institutionCertId
    return active != null && options.some((c) => c.institutionCertId === active) ? [active] : []
  }
  const [chosenCertIds, setChosenCertIds] = useState(defaultChoice)
  const chosen = options.filter((c) => chosenCertIds.includes(c.institutionCertId))
  const needsCertChoice = options.length > 0 && chosen.length === 0
  const toggleChosen = (id) =>
    setChosenCertIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  // Every chosen certification takes a seat per learner, so the tightest one decides.
  const fixedCert = asArray(group?.certifications).find((c) => c.institutionCertId === fixedCertId)
  const remainingSlots = chosen.length
    ? Math.min(...chosen.map(certSlotsLeft))
    : fixedCert
      ? certSlotsLeft(fixedCert)
      : Math.max(0, (group.totalSlots ?? 0) - (group.usedSlots ?? 0))

  const reset = () => {
    setChosenCertIds(defaultChoice())
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
    setError("")
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
    const isExcel = /\.xlsx$/i.test(file.name)
    let text
    try {
      text = isExcel ? await xlsxToText(file) : await file.text()
    } catch {
      setFileProblems([`${file.name} could not be read. Save it as .xlsx or .csv and try again.`])
      return
    }
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
    mutationFn: async () => {
      const ids = chosen.map((c) => c.institutionCertId)
      const response = await sendInstitutionInvitations({
        departmentId: departmentId,
        learners: staged,
        sectionId: section?.sectionId ?? null,
        institutionCertId: ids.length ? null : (fixedCertId ?? group.activeCertification?.institutionCertId ?? null),
        institutionCertIds: ids.length ? ids : null,
      })
      return { created: response?.created ?? 0, skipped: asArray(response?.skipped) }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["department-invitations", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department-overview", departmentId] })
      toast.success(
        `${response.created} learner(s) invited${section ? ` to ${section.sectionName}` : ""}.`,
        response.skipped?.length ? { description: `Skipped: ${response.skipped.join("; ")}` } : undefined
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
            Each learner gets one email invitation and joins {section ? "this section" : "the department"} when they
            accept.
          </DialogDescription>
        </DialogHeader>

        {options.length > 0 ? (
          <fieldset className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <legend className="text-sm font-semibold text-foreground">1. Certifications they can access</legend>
              {options.length > 1 ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() =>
                    setChosenCertIds(chosen.length === options.length ? [] : options.map((c) => c.institutionCertId))
                  }
                >
                  {chosen.length === options.length ? "Clear" : "Select all"}
                </button>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Certifications to enroll in">
              {options.map((cert) => {
                const checked = chosenCertIds.includes(cert.institutionCertId)
                const left = certSlotsLeft(cert)
                return (
                  <button
                    key={cert.institutionCertId}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleChosen(cert.institutionCertId)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      checked ? "border-primary/60 bg-primary/10" : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                      }`}
                      aria-hidden="true"
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{cert.title}</span>
                      <span className={`block text-[11px] ${left === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {left} slot{left === 1 ? "" : "s"} left
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              A learner already studying one on their own keeps their progress
              {section ? ` and moves under ${section.sectionName}` : ""}.
            </p>
          </fieldset>
        ) : fixedCert ? (
          <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            This section is for <span className="font-semibold text-foreground">{fixedCert.title}</span> ·{" "}
            {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left
          </p>
        ) : null}

        {options.length > 0 ? <p className="-mb-1 text-sm font-semibold text-foreground">2. Who to invite</p> : null}

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
              className="h-10 text-sm"
            />
            <Input
              value={draft.lastName}
              onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
              placeholder="Last name"
              aria-label="Last name"
              className="h-10 text-sm"
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
              className="h-10 text-sm"
            />
            <Button type="button" variant="outline" onClick={addManual} className="h-10 w-full sm:w-auto">
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
                accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/tab-separated-values,text/plain"
                className="sr-only"
                aria-label="Upload a learner list"
                onChange={(e) => readFile(e.target.files?.[0])}
              />
              <div className="mb-3 flex size-12 items-center justify-center rounded-full border bg-background text-muted-foreground">
                <UploadIcon className="size-5" />
              </div>
              <p className="text-sm font-medium">Drop an Excel or CSV file here</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Excel (.xlsx), CSV, TSV or TXT with an <span className="font-mono">email</span> column and
                optional <span className="font-mono">first name</span> / <span className="font-mono">last name</span>{" "}
                (or <span className="font-mono">name</span>). Your class list from Excel or Google Sheets works as-is.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <UploadIcon className="-ms-1 size-4 opacity-60" aria-hidden="true" />
                  Choose file
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
            <div className="max-h-44 divide-y overflow-y-auto rounded-lg border">
              {staged.map((row) => (
                <div key={row.email} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{fullName(row) || "—"}</p>
                    <p className="break-all text-xs text-muted-foreground">{row.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaged((current) => current.filter((r) => r.email !== row.email))}
                    aria-label={`Remove ${row.email}`}
                    className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {needsCertChoice && staged.length > 0 ? (
          <p className="text-xs text-muted-foreground">Pick at least one certification to send the invitations.</p>
        ) : null}
        {overCap && !needsCertChoice ? (
          <p className="text-xs text-destructive" role="alert">
            {staged.length} learner(s) listed but only {remainingSlots} slot(s) remain
            {chosen.length > 1 ? " in the fullest certification you picked" : ""}.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" className="min-h-[44px] sm:min-h-0 sm:h-9" onClick={() => close(false)} disabled={send.isPending}>
            Cancel
          </Button>
          <Button className="min-h-[44px] sm:min-h-0 sm:h-9" onClick={() => send.mutate()} disabled={staged.length === 0 || overCap || needsCertChoice || send.isPending}>
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


export function SectionDialog({
  open,
  onOpenChange,
  departmentId,
  section,
  institutionCertId,
  programId = null,
  certifications = [],
  programs = [],
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(section?.sectionName ?? "")
  const [description, setDescription] = useState(section?.description ?? "")
  const availableCerts = Array.isArray(certifications) ? certifications : []
  const initialCertId =
    section?.institutionCertId ??
    institutionCertId ??
    (availableCerts.length > 0 ? availableCerts[0].institutionCertId : null)
  const [selectedCertId, setSelectedCertId] = useState(initialCertId)
  const availablePrograms = !section && programId == null && Array.isArray(programs) ? programs : []
  const [selectedProgramId, setSelectedProgramId] = useState(
    availablePrograms.length === 1 ? availablePrograms[0].programId : null
  )
  const effectiveProgramId = programId ?? selectedProgramId
  const [error, setError] = useState("")

  const save = useMutation({
    mutationFn: () =>
      section
        ? updateGroupSection(departmentId, section.sectionId, {
            sectionName: name.trim(),
            description: description.trim() || null,
            programId: section.programId ?? programId,
          })
        : createGroupSection(departmentId, {
            sectionName: name.trim(),
            description: description.trim() || null,
            institutionCertId: effectiveProgramId != null ? null : selectedCertId,
            programId: effectiveProgramId,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
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
            A section is a class or batch inside this department, such as "BSIT 3A" or "Batch 2026 - Morning".
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
          {availablePrograms.length ? (
            <div className="space-y-1.5">
              <Label htmlFor="section-program">Program</Label>
              <Select
                value={selectedProgramId != null ? String(selectedProgramId) : undefined}
                onValueChange={(val) => {
                  setSelectedProgramId(Number(val))
                  setError("")
                }}
              >
                <SelectTrigger id="section-program" className="w-full">
                  <SelectValue placeholder="Choose the program this class belongs to" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.map((program) => (
                    <SelectItem key={program.programId} value={String(program.programId)}>
                      {program.programCode ? `${program.programCode} · ` : ""}
                      {program.programName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The section shows under this program on the Programs page and in its workspace.
              </p>
            </div>
          ) : null}
          {!section && effectiveProgramId == null && availableCerts.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="section-cert">Certification</Label>
              <Select
                value={selectedCertId != null ? String(selectedCertId) : undefined}
                onValueChange={(val) => setSelectedCertId(Number(val))}
              >
                <SelectTrigger id="section-cert" className="w-full">
                  <SelectValue placeholder="Choose a certification" />
                </SelectTrigger>
                <SelectContent>
                  {availableCerts.map((cert) => (
                    <SelectItem key={cert.institutionCertId} value={String(cert.institutionCertId)}>
                      {cert.title || cert.certificationTitle || "Certification"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
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
          <Button variant="outline" className="min-h-[44px] sm:min-h-0 sm:h-9" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            className="min-h-[44px] sm:min-h-0 sm:h-9"
            onClick={() => {
              if (!name.trim()) return setError("Enter a section name.")
              if (availablePrograms.length && selectedProgramId == null)
                return setError("Choose the program this section belongs to.")
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


function rosterInitials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("")
}

// The badges the learner has earned, shown as small medallions with the
// certification's badge art.
function EarnedBadges({ learnerId }) {
  const query = useQuery({
    queryKey: ["group-learner-awards", learnerId],
    queryFn: () => getGroupLearnerAwards(learnerId),
    enabled: learnerId != null,
    staleTime: 5 * 60_000,
  })
  const badges = asArray(query.data).filter((award) => award.badgeAwardedAt != null)
  if (badges.length === 0) return null
  return (
    <span className="flex flex-wrap items-center gap-1">
      {badges.map((award) => (
        <Badge
          key={award.certificationId}
          variant="default"
          className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-[10px] tracking-wide"
          title={`Certified - Badge earned on ${new Date(award.badgeAwardedAt).toLocaleDateString()}`}
        >
          {award.hasBadgeImage ? (
            <img
              src={`${certificationBadgeUrl(award.certificationId)}?v=${encodeURIComponent(award.badgeAwardedAt)}`}
              alt=""
              className="size-3.5 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <AwardIcon className="size-3" aria-hidden="true" />
          )}
          <span>Certified</span>
        </Badge>
      ))}
    </span>
  )
}

function SectionPanel({
  focused = false,
  certificationOptions = null,
  departmentId,
  group,
  section,
  sections,
  learners,
  invitations,
  defaultOpen,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(defaultOpen || focused)
  const [addOpen, setAddOpen] = useState(false)
  const panelRef = useRef(null)
  // Opened from a section link (?section=): bring it into view.
  useEffect(() => {
    if (focused) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [focused])
  const [removeTarget, setRemoveTarget] = useState(null)
  const rosterAvatars = useAvatarUrls(learners.map((row) => row.avatarKey))
  const certTitles = new Map(asArray(group?.certifications).map((cert) => [cert.certificationId, cert.title]))

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["department-learner-roster", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-invitations", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department", departmentId] })
  }

  const move = useMutation({
    mutationFn: ({ assigneeId, sectionId }) => moveLearnerToSection(departmentId, assigneeId, sectionId),
    onSuccess: (_, variables) => {
      const target = sections.find((s) => s.sectionId === variables.sectionId)
      toast.success(target ? `Moved to ${target.sectionName}.` : "Removed from section.")
      invalidate()
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to move this learner.")),
  })

  const remove = useMutation({
    mutationFn: (learnerId) => removeLearnerFromGroup(departmentId, learnerId),
    onSuccess: () => {
      toast.success("Learner removed from this department. Their account and progress are unchanged.")
      setRemoveTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to remove this learner.")),
  })

  // A program section invites one person to several certifications; cancel them together.
  const cancel = useMutation({
    mutationFn: async (invitationIds) => {
      for (const invitationId of invitationIds) await cancelInstitutionInvitation(invitationId)
    },
    onSuccess: () => {
      toast.success("Invitation cancelled.")
      invalidate()
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to cancel this invitation.")),
  })

  const isUnsectioned = section == null
  const title = isUnsectioned ? "Not in a section" : section.sectionName
  const pending = useMemo(() => {
    const byEmail = new Map()
    for (const inv of invitations) {
      if (inv.status !== "PENDING") continue
      const key = String(inv.email ?? "").toLowerCase()
      const person = byEmail.get(key)
      if (person) {
        person.ids.push(inv.invitationId)
        if (inv.certificationTitle) person.titles.push(inv.certificationTitle)
      } else {
        byEmail.set(key, { ...inv, ids: [inv.invitationId], titles: inv.certificationTitle ? [inv.certificationTitle] : [] })
      }
    }
    return [...byEmail.values()]
  }, [invitations])
  const pendingCount = pending.length

  // The roster has one row per enrolment; a learner with several certifications is one person here.
  const people = useMemo(() => {
    const byLearner = new Map()
    for (const row of learners) {
      const person = byLearner.get(row.learnerId)
      if (person) person.rows.push(row)
      else byLearner.set(row.learnerId, { ...row, rows: [row] })
    }
    return [...byLearner.values()].map((person) => {
      const joined = person.rows.map((row) => row.assignedAt).filter(Boolean).sort()[0] ?? null
      const sectionIds = [...new Set(person.rows.map((row) => row.sectionId ?? null))]
      return { ...person, joined, sectionId: sectionIds.length === 1 ? sectionIds[0] : undefined }
    })
  }, [learners])

  // Moving a person moves every certification they study in this department.
  const movePerson = async (person, sectionId) => {
    for (const row of person.rows) {
      if ((row.sectionId ?? null) === sectionId) continue
      await move.mutateAsync({ assigneeId: row.departmentLearnerId, sectionId })
    }
  }

  return (
    <Card ref={panelRef} className={`scroll-mt-24 overflow-hidden ${focused ? "ring-2 ring-primary/40" : ""}`}>
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold">{title}</p>
              {pendingCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="gap-1 border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  <MailIcon className="size-3" aria-hidden="true" />
                  {pendingCount} pending {pendingCount === 1 ? "invitation" : "invitations"}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {section?.certificationTitle && section?.programId == null ? `${section.certificationTitle} · ` : ""}
              {section?.programName ? `${section.programName} · ` : ""}
              {people.length} {people.length === 1 ? "learner" : "learners"}
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
        <CardContent className="space-y-4 border-t bg-muted/10 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isUnsectioned
                ? "Learners who joined before sections existed, or whose section was deleted. Move them into a section from the row."
                : "Add learners by typing them in or uploading a class list."}
            </p>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              {!isUnsectioned ? (
                <>
                  <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-0 sm:h-9 justify-center" onClick={() => onEdit(section)}>
                    <PencilIcon className="size-4" aria-hidden="true" />
                    Rename
                  </Button>
                  <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-0 sm:h-9 justify-center text-muted-foreground hover:text-destructive" onClick={() => onDelete(section)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </>
              ) : null}
              <Button size="sm" className="min-h-[44px] sm:min-h-0 sm:h-9 justify-center col-span-2 sm:col-span-1" onClick={() => setAddOpen(true)}>
                <UserPlusIcon className="size-4" aria-hidden="true" />
                Add learners
              </Button>
            </div>
          </div>

          {pending.length ? (
            <div className="divide-y rounded-lg border bg-background">
              {pending.map((inv) => (
                <div key={inv.invitationId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 text-sm">
                  <div className="flex min-w-0 items-start sm:items-center gap-2">
                    <MailIcon className="size-4 shrink-0 text-muted-foreground mt-0.5 sm:mt-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      {fullName(inv) ? <p className="font-medium text-foreground truncate">{fullName(inv)}</p> : null}
                      <p className="text-xs text-muted-foreground break-all">{inv.email}</p>
                      {inv.titles.length > 1 ? (
                        <p className="text-xs text-muted-foreground">{inv.titles.join(", ")}</p>
                      ) : null}
                    </div>
                    <InstitutionStatusBadge status={inv.status} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end sm:self-auto text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => cancel.mutate(inv.ids)}
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
            <ul className="divide-y rounded-lg border bg-background">
              <li className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_2rem] gap-4 bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid">
                <span>Learner</span>
                <span>Certifications · lessons completed</span>
                <span />
              </li>
              {people.map((person) => (
                <li
                  key={person.learnerId}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_2rem] md:items-center md:gap-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/institution/departments/${departmentId}/learners/${person.learnerId}`)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-[11px] font-bold text-muted-foreground">
                      {rosterInitials(person.name)}
                      {rosterAvatars[person.avatarKey] ? (
                        <img
                          src={rosterAvatars[person.avatarKey]}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-foreground hover:underline">{person.name}</span>
                        <EarnedBadges learnerId={person.learnerId} />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {person.email ?? (person.username ? `@${person.username}` : "")}
                        {person.joined ? ` · joined ${formatDate(person.joined)}` : ""}
                      </span>
                    </span>
                  </button>

                  <div className="space-y-1.5">
                    {person.rows.map((row) => {
                      const total = Number(row.totalLessonCount ?? 0)
                      const done = Number(row.completedLessonCount ?? 0)
                      const pct = total ? Math.round((done / total) * 100) : 0
                      return (
                        <div key={row.departmentLearnerId} className="flex items-center gap-2 text-xs">
                          <span className="w-28 shrink-0 truncate font-medium text-foreground" title={certTitles.get(row.certificationId)}>
                            {certTitles.get(row.certificationId) ?? "Certification"}
                          </span>
                          {total ? (
                            <>
                              <Progress value={pct} className="h-1.5 flex-1" aria-label={`${certTitles.get(row.certificationId)} lessons`} />
                              <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                                {done}/{total}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No lessons yet</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${person.name} actions`}
                        className="size-8 justify-self-end text-muted-foreground"
                        disabled={move.isPending}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">Move to</DropdownMenuLabel>
                      {sections
                        .filter((s) => s.sectionId !== person.sectionId)
                        .map((s) => (
                          <DropdownMenuItem key={s.sectionId} className="text-xs" onClick={() => movePerson(person, s.sectionId)}>
                            {s.sectionName}
                          </DropdownMenuItem>
                        ))}
                      {person.sectionId !== null ? (
                        <DropdownMenuItem className="text-xs" onClick={() => movePerson(person, null)}>
                          No section
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-xs text-destructive focus:text-destructive"
                        onClick={() => setRemoveTarget(person)}
                      >
                        <Trash2 className="size-3.5" />
                        Remove from department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      ) : null}

      {addOpen ? (
        <AddLearnersDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          departmentId={departmentId}
          group={group}
          section={section}
          certificationOptions={certificationOptions}
        />
      ) : null}

      <AlertDialog open={removeTarget != null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this learner from the department?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} will be unassigned from this department
              {removeTarget?.rows?.length > 1 ? ` in all ${removeTarget.rows.length} certifications` : ""} and the
              slots returned. Their account, enrolment, and progress are kept, so they can be added back later.
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


export function SectionsTab({ departmentId, group: department, certificationId, programId = null, certifications = null, focusSectionId = null }) {
  // A department covers several certifications; this tab works on the one the
  // workspace has selected, and its slots are that certification's. A program
  // passes its certifications instead and sees all of them at once.
  const covered = asArray(department?.certifications)
  const programCerts = Array.isArray(certifications) ? certifications : null
  const current = programCerts
    ? null
    : covered.find((cert) => cert.certificationId === certificationId) ?? covered[0] ?? null
  const scoped = programCerts ? false : covered.length > 1 && current != null
  const programCertIds = new Set((programCerts ?? []).map((cert) => cert.certificationId))
  const group = current
    ? { ...department, totalSlots: current.totalSlots ?? 0, usedSlots: current.usedSlots ?? 0, activeCertification: current }
    : department
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sectionsQuery = useQuery({
    queryKey: ["department-sections", departmentId],
    queryFn: () => getGroupSections(departmentId),
    enabled: Number.isFinite(departmentId),
  })
  const rosterQuery = useQuery({
    queryKey: ["department-learner-roster", departmentId],
    queryFn: () => getGroupLearnerRoster(departmentId),
    enabled: Number.isFinite(departmentId),
  })
  const invitationsQuery = useQuery({
    queryKey: ["department-invitations", departmentId],
    queryFn: () => getInstitutionInvitations(),
    enabled: Number.isFinite(departmentId),
  })

  const sections = asArray(sectionsQuery.data).filter(
    (s) =>
      (!scoped || s.certificationId == null || s.certificationId === current.certificationId) &&
      (programId == null || s.programId === programId)
  )
  // Sections made before programs existed belong to none; a program can adopt them.
  const unassignedSections =
    programId == null ? [] : asArray(sectionsQuery.data).filter((s) => s.programId == null)
  const adopt = useMutation({
    mutationFn: (section) =>
      updateGroupSection(departmentId, section.sectionId, {
        sectionName: section.sectionName,
        description: section.description,
        programId,
      }),
    onSuccess: (_, section) => {
      queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department-programs", departmentId] })
      toast.success(`${section.sectionName} added to this program.`)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to move this section.")),
  })
  const inProgram = (certId) => !programCerts || programCertIds.has(certId)
  // In a program, a learner sitting in another program's section is not ours.
  const sectionIds = new Set(sections.map((section) => section.sectionId))
  const inProgramSection = (sectionId) => programId == null || sectionId == null || sectionIds.has(sectionId)
  const roster = asArray(rosterQuery.data).filter(
    (row) =>
      row.status === "active" &&
      (!scoped || row.certificationId === current.certificationId) &&
      inProgram(row.certificationId) &&
      inProgramSection(row.sectionId)
  )
  // One row per learner per certification: count people for "learners", rows for seats.
  const rosterPeople = new Set(roster.map((row) => row.learnerId)).size
  const invitations = asArray(invitationsQuery.data).filter(
    (inv) =>
      inv.departmentId === departmentId &&
      (!scoped || inv.certificationId === current.certificationId) &&
      inProgram(inv.certificationId) &&
      inProgramSection(inv.sectionId)
  )

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

  const removeSection = useMutation({
    mutationFn: (sectionId) => deleteGroupSection(departmentId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department-learner-roster", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department-invitations", departmentId] })
      toast.success("Section deleted. Its learners stay in the department.")
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to delete this section.")),
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
  // Only invitations still waiting count: accepted or cancelled ones need no section,
  // and kept "Not in a section" on screen with nobody in it.
  const unsectionedInvites = (invitationsBySection.get(NO_SECTION) ?? []).filter(
    (inv) => inv.status === "PENDING"
  )
  const slotTotal = programCerts
    ? programCerts.reduce((sum, cert) => sum + (cert.totalSlots ?? 0), 0)
    : group.totalSlots ?? 0
  const slotUsed = programCerts
    ? programCerts.reduce((sum, cert) => sum + (cert.usedSlots ?? 0), 0)
    : group.usedSlots ?? 0
  const remainingSlots = Math.max(0, slotTotal - slotUsed)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="text-base">Sections</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {sections.length} section{sections.length === 1 ? "" : "s"} · {rosterPeople} learner
              {rosterPeople === 1 ? "" : "s"} · {remainingSlots} of {slotTotal} slot(s) remaining
              {slotUsed > roster.length
                ? ` · ${slotUsed - roster.length} more held by pending invitations or other programs`
                : ""}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialog({ section: null })} className="self-start sm:self-auto shrink-0">
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
              certificationOptions={programCerts}
              focused={focusSectionId != null && section.sectionId === focusSectionId}
              key={section.sectionId}
              departmentId={departmentId}
              group={group}
              section={section}
              sections={sections}
              learners={bySection.get(section.sectionId) ?? []}
              invitations={invitationsBySection.get(section.sectionId) ?? []}
              defaultOpen={focusSectionId == null && index === 0}
              onEdit={(s) => setDialog({ section: s })}
              onDelete={(s) => setDeleteTarget(s)}
            />
          ))}
          {unsectioned.length > 0 || unsectionedInvites.length > 0 ? (
            <SectionPanel
              certificationOptions={programCerts}
              departmentId={departmentId}
              group={group}
              section={null}
              sections={sections}
              learners={unsectioned}
              invitations={unsectionedInvites}
              defaultOpen={sections.length === 0}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </div>
      )}

      {unassignedSections.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sections not in a program</CardTitle>
            <CardDescription>
              Made before programs existed. Add one here to bring its learners into this program.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassignedSections.map((section) => (
              <div
                key={section.sectionId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{section.sectionName}</p>
                  <p className="text-xs text-muted-foreground">
                    {section.certificationTitle ? `${section.certificationTitle} · ` : ""}
                    {section.learnerCount} learner{section.learnerCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={adopt.isPending} onClick={() => adopt.mutate(section)}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add to this program
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {dialog ? (
        <SectionDialog
          key={dialog.section?.sectionId ?? "new"}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          departmentId={departmentId}
          section={dialog.section}
          institutionCertId={current?.institutionCertId ?? null}
          programId={programId}
          certifications={covered}
        />
      ) : null}

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.sectionName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Its {deleteTarget?.learnerCount ?? 0} learner(s) stay in the department under “Not in a section”, and any
              pending invitations still bring learners into the department. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep section</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeSection.mutate(deleteTarget.sectionId)} disabled={removeSection.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
