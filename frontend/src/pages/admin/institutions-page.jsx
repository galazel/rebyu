import { DirectoryHeader, DirectoryResults } from "@/components/admin/directory-header.jsx"
import { useEffect, useMemo, useState } from "react"
import { ExportButton, sectionsFromPayload, tableFromObjects } from "@/components/commons/export-button.jsx"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Eye,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { InstitutionStatusBadge } from "@/components/institution/institution-ui.jsx"
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
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PlainHead,
  SortableHead,
  TableCard,
  TablePagination,
  TableToolbar,
  useTableSort,
} from "@/components/commons/data-table.jsx"
import { getAllInstitutions } from "@/services/adminInstitutionService"

const ALL_FILTER_VALUE = "all"

const DEMO_INSTITUTIONS = [
  {
    institutionId: 1,
    institutionName: "Cebu Institute of Technology",
    contactPerson: "Maria Santos",
    contactEmail: "maria.santos@example.com",
    learnerCount: 428,
    certificationCount: 4,
    status: "active",
    createdAt: "2026-06-12",
  },
  {
    institutionId: 2,
    institutionName: "TechBridge Training Center",
    contactPerson: "Daniel Reyes",
    contactEmail: "daniel.reyes@example.com",
    learnerCount: 215,
    certificationCount: 3,
    status: "active",
    createdAt: "2026-06-07",
  },
  {
    institutionId: 3,
    institutionName: "Northstar Review Academy",
    contactPerson: "Angela Cruz",
    contactEmail: "angela.cruz@example.com",
    learnerCount: 126,
    certificationCount: 2,
    status: "pending",
    createdAt: "2026-05-28",
  },
  {
    institutionId: 4,
    institutionName: "Innovate Cebu Solutions",
    contactPerson: "Paolo Lim",
    contactEmail: "paolo.lim@example.com",
    learnerCount: 89,
    certificationCount: 2,
    status: "active",
    createdAt: "2026-05-21",
  },
  {
    institutionId: 5,
    institutionName: "Global Skills Development Hub",
    contactPerson: "Karen Dela Peña",
    contactEmail: "karen.delapena@example.com",
    learnerCount: 304,
    certificationCount: 5,
    status: "active",
    createdAt: "2026-05-14",
  },
  {
    institutionId: 6,
    institutionName: "Metro Learning Partners",
    contactPerson: "Joshua Tan",
    contactEmail: "joshua.tan@example.com",
    learnerCount: 72,
    certificationCount: 1,
    status: "suspended",
    createdAt: "2026-04-30",
  },
  {
    institutionId: 7,
    institutionName: "FutureReady Philippines",
    contactPerson: "Nicole Ramos",
    contactEmail: "nicole.ramos@example.com",
    learnerCount: 191,
    certificationCount: 3,
    status: "pending",
    createdAt: "2026-04-18",
  },
  {
    institutionId: 8,
    institutionName: "Digital Career Academy",
    contactPerson: "Mark Villanueva",
    contactEmail: "mark.villanueva@example.com",
    learnerCount: 154,
    certificationCount: 2,
    status: "active",
    createdAt: "2026-04-03",
  },
  {
    institutionId: 9,
    institutionName: "Central Visayas Tech Council",
    contactPerson: "Leah Mendoza",
    contactEmail: "leah.mendoza@example.com",
    learnerCount: 511,
    certificationCount: 6,
    status: "active",
    createdAt: "2026-03-25",
  },
]

function getInstitutionId(institution, index) {
  return (
      institution.institutionId ??
      institution.institutionId ??
      institution.id ??
      `institution-${index}`
  )
}

function getInstitutionName(institution) {
  return (
      institution.institutionName ??
      institution.institutionName ??
      institution.name ??
      institution.title ??
      "Unnamed institution"
  )
}

function getInitials(name) {
  return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
}

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export default function Institutions() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, toggle, sortRows } = useTableSort()

  const { data: fetchedInstitutions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: () => getAllInstitutions(),
    staleTime: 5 * 60 * 1000,
  })

  const list = Array.isArray(fetchedInstitutions) ? fetchedInstitutions : []

  const filteredInstitutions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return list.filter((institution) => {
      const name = getInstitutionName(institution).toLowerCase()
      const contactPerson = String(
          institution.primaryContactName ??
          institution.contactPerson ??
          institution.contactName ??
          ""
      ).toLowerCase()
      const email = String(
          institution.primaryContactEmail ??
          institution.contactEmail ??
          institution.email ??
          ""
      ).toLowerCase()
      const status = String(institution.status ?? "pending").toLowerCase()

      const matchesSearch =
          !normalizedSearch ||
          name.includes(normalizedSearch) ||
          contactPerson.includes(normalizedSearch) ||
          email.includes(normalizedSearch)

      const matchesStatus =
          statusFilter === ALL_FILTER_VALUE || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [list, searchQuery, statusFilter])

  const sortedInstitutions = useMemo(
      () =>
          sortRows(filteredInstitutions, {
            institution: (institution) => getInstitutionName(institution),
            contact: (institution) =>
                institution.primaryContactName ??
                institution.contactPerson ??
                institution.contactName ??
                null,
            learners: (institution) =>
                Number(
                    institution.learnerCount ??
                    institution.totalLearners ??
                    institution.learnersCount ??
                    0
                ),
            certifications: (institution) =>
                Number(
                    institution.certificationCount ??
                    institution.totalCertifications ??
                    institution.certificationsCount ??
                    0
                ),
            status: (institution) => institution.status ?? "pending",
            added: (institution) => {
              const raw =
                  institution.joinedAt ??
                  institution.createdAt ??
                  institution.dateCreated ??
                  institution.createdDate
              const time = raw ? new Date(raw).getTime() : Number.NaN
              return Number.isNaN(time) ? null : time
            },
          }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [filteredInstitutions, sort]
  )

  const totalPages = Math.max(
      1,
      Math.ceil(sortedInstitutions.length / pageSize)
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, pageSize])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedInstitutions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize

    return sortedInstitutions.slice(
        startIndex,
        startIndex + pageSize
    )
  }, [currentPage, pageSize, sortedInstitutions])

  const activeCount = useMemo(
      () =>
          list.filter(
              (institution) =>
                  String(institution.status ?? "").toLowerCase() === "active"
          ).length,
      [list]
  )

  const totalLearners = useMemo(
      () =>
          list.reduce(
              (total, institution) =>
                  total +
                  Number(
                      institution.learnerCount ??
                      institution.totalLearners ??
                      institution.learnersCount ??
                      0
                  ),
              0
          ),
      [list]
  )

  const visibleStart =
      sortedInstitutions.length === 0
          ? 0
          : (currentPage - 1) * pageSize + 1

  const visibleEnd = Math.min(
      currentPage * pageSize,
      sortedInstitutions.length
  )

  return (
      <section className="admin-directory flex min-h-0 w-full flex-1 flex-col gap-6">
      <DirectoryHeader title="Institutions" description="Manage institution accounts, contacts, certification access, and learner coverage." stats={[{ label: "All institutions", value: list.length, onSelect: () => setStatusFilter(ALL_FILTER_VALUE), active: statusFilter === ALL_FILTER_VALUE }, { label: "Active", value: activeCount, onSelect: () => setStatusFilter("active"), active: statusFilter === "active" }, { label: "Institution learners", value: totalLearners.toLocaleString(), hint: "Across all institutions" }, { label: "Pending", value: list.filter((i) => String(i.status).toLowerCase() === "pending").length, onSelect: () => setStatusFilter("pending"), active: statusFilter === "pending" }]}>
        <ExportButton
            filename="rebyu-admin-institutions"
            report="Institutions"
            details={() => [["Institutions in file", `${sortedInstitutions.length} of ${list.length}`], ["Filters", "As set on the page; every page of results"]]}
            className="order-last ml-auto self-center"
            disabled={sortedInstitutions.length === 0}
            sections={() => [{
              title: "Institutions",
              columns: [
                "Institution", "Type", "Verified", "Status", "Address", "Contact person", "Contact email",
                "Contact phone", "Joined on", "Learners", "Certifications",
              ],
              rows: sortedInstitutions.map((i) => [
                i.institutionName, i.institutionType, Boolean(i.isVerified ?? i.verified), i.status, i.address ?? "",
                i.primaryContactName ?? "", i.primaryContactEmail ?? "", i.primaryContactPhone ?? "",
                i.joinedAt, i.learnerCount ?? 0, i.certificationCount ?? 0,
              ]),
            }]}
          />
      </DirectoryHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TableCard className="flex min-h-0 flex-1 flex-col">
            <DirectoryResults title="Institution directory" count={sortedInstitutions.length} error={isError} onRetry={refetch} filtered={Boolean(searchQuery || statusFilter !== ALL_FILTER_VALUE)} onReset={() => { setSearchQuery(""); setStatusFilter(ALL_FILTER_VALUE); }} />
            <TableToolbar
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                search={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search institution, contact, or email"
            >
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-36">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </TableToolbar>

            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                        column="institution"
                        label="Institution"
                        sort={sort}
                        onSort={toggle}
                        className="min-w-64"
                    />
                    <SortableHead
                        column="contact"
                        label="Primary contact"
                        sort={sort}
                        onSort={toggle}
                        className="min-w-56"
                    />
                    <SortableHead
                        column="learners"
                        label="Learners"
                        sort={sort}
                        onSort={toggle}
                        className="w-28 text-center"
                    />
                    <SortableHead
                        column="certifications"
                        label="Certifications"
                        sort={sort}
                        onSort={toggle}
                        className="w-32 text-center"
                    />
                    <SortableHead
                        column="status"
                        label="Status"
                        sort={sort}
                        onSort={toggle}
                        className="w-28"
                    />
                    <SortableHead
                        column="added"
                        label="Date added"
                        sort={sort}
                        onSort={toggle}
                        className="min-w-32"
                    />
                    <PlainHead label="Actions" align="right" className="w-16" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={`loading-${index}`}>
                            <TableCell colSpan={8} className="h-16">
                              <div className="h-4 w-full animate-pulse rounded bg-muted" />
                            </TableCell>
                          </TableRow>
                      ))
                  ) : paginatedInstitutions.length > 0 ? (
                      paginatedInstitutions.map((institution, index) => {
                        const institutionName = getInstitutionName(institution)
                        const learnerCount = Number(
                            institution.learnerCount ??
                            institution.totalLearners ??
                            institution.learnersCount ??
                            0
                        )
                        const certificationCount = Number(
                            institution.certificationCount ??
                            institution.totalCertifications ??
                            institution.certificationsCount ??
                            0
                        )

                        return (
                            <TableRow
                                key={getInstitutionId(institution, index)}
                                className="group"
                            >
                              <TableCell>
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-xs font-bold text-primary">
                                    {getInitials(institutionName)}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {institutionName}
                                    </p>

                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                      ID: {getInstitutionId(institution, index)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {institution.primaryContactName ??
                                        institution.contactPerson ??
                                        institution.contactName ??
                                        "Not assigned"}
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {institution.primaryContactEmail ??
                                        institution.contactEmail ??
                                        institution.email ??
                                        "No email provided"}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell className="text-center font-medium tabular-nums">
                                {learnerCount.toLocaleString()}
                              </TableCell>

                              <TableCell className="text-center font-medium tabular-nums">
                                {certificationCount}
                              </TableCell>

                              <TableCell>
                                <InstitutionStatusBadge
                                    status={institution.status}
                                />
                              </TableCell>

                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(
                                    institution.joinedAt ??
                                    institution.createdAt ??
                                    institution.dateCreated ??
                                    institution.createdDate
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <Button type="button" variant="outline" className="min-h-11 gap-2" aria-label={`View details for ${institutionName}`} onClick={() => navigate(`/admin/institutions/${getInstitutionId(institution, index)}`)}>
                                  <Eye className="size-4" /> View details
                                </Button>
                              </TableCell>
                            </TableRow>
                        )
                      })
                  ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-64 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <p className="mt-4 text-sm font-semibold">
                            {isError ? "Institutions could not be loaded" : "No institutions found"}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {isError ? "Try loading the directory again." : "Try changing the search or clearing the filters."}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <TablePagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                rangeStart={visibleStart}
                rangeEnd={visibleEnd}
                total={sortedInstitutions.length}
                unit="institutions"
            />
          </TableCard>
        </div>
      </section>
  )
}
