import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { InstitutionStatusBadge } from "@/components/institution/institution-ui.jsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Replace this with data from your institution service.
// The component also accepts an `institutions` prop.
const DEMO_INSTITUTIONS = [
  {
    institutionId: 1,
    institutionName: "Cebu Institute of Technology",
    contactPerson: "Maria Santos",
    contactEmail: "maria.santos@example.com",
    industry: "Education",
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
    industry: "Training Center",
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
    industry: "Review Center",
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
    industry: "Information Technology",
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
    industry: "Professional Training",
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
    industry: "Education",
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
    industry: "Training Center",
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
    industry: "Review Center",
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
    industry: "Government",
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

export default function Institutions({ onEdit, onDelete }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE)
  const [industryFilter, setIndustryFilter] = useState(ALL_FILTER_VALUE)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, toggle, sortRows } = useTableSort()

  const { data: fetchedInstitutions = [], isLoading } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: () => getAllInstitutions(),
    staleTime: 5 * 60 * 1000,
  })

  const list = Array.isArray(fetchedInstitutions) ? fetchedInstitutions : []

  const industries = useMemo(() => {
    return [...new Set(
        list
            .map((institution) => institution.industry)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b))
  }, [list])

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
      const industry = String(institution.industry ?? "").toLowerCase()
      const status = String(institution.status ?? "pending").toLowerCase()

      const matchesSearch =
          !normalizedSearch ||
          name.includes(normalizedSearch) ||
          contactPerson.includes(normalizedSearch) ||
          email.includes(normalizedSearch)

      const matchesStatus =
          statusFilter === ALL_FILTER_VALUE || status === statusFilter

      const matchesIndustry =
          industryFilter === ALL_FILTER_VALUE ||
          industry === industryFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesIndustry
    })
  }, [industryFilter, list, searchQuery, statusFilter])

  /* Sorting runs on the filtered set, so a sort never pulls in a row the
     filters excluded. Accessors read the same fallbacks the cells render. */
  const sortedInstitutions = useMemo(
      () =>
          sortRows(filteredInstitutions, {
            institution: (institution) => getInstitutionName(institution),
            contact: (institution) =>
                institution.primaryContactName ??
                institution.contactPerson ??
                institution.contactName ??
                null,
            industry: (institution) => institution.industry ?? null,
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
  }, [searchQuery, statusFilter, industryFilter, pageSize])

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
      <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {/* Three counts, not three cards. They were bordered panels sitting in
            a bordered strip inside a padded page -- three frames deep for three
            numbers. A figure with its label under it is already legible; the
            border was only telling you where one number stopped and the next
            began, which the spacing does. */}
        <div className="flex shrink-0 flex-wrap items-baseline gap-x-10 gap-y-3 border-b border-border pb-4">
          <div className="flex items-baseline gap-2">
            <Building2 className="h-4 w-4 self-center text-primary" />
            <p className="text-xl font-semibold tabular-nums">{list.length}</p>
            <p className="text-xs font-medium text-muted-foreground">
              Total institutions
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="h-2.5 w-2.5 self-center rounded-full bg-rb-bee" />
            <p className="text-xl font-semibold tabular-nums">{activeCount}</p>
            <p className="text-xs font-medium text-muted-foreground">Active</p>
          </div>

          <div className="flex items-baseline gap-2">
            <Users className="h-4 w-4 self-center text-primary" />
            <p className="text-xl font-semibold tabular-nums">
              {totalLearners.toLocaleString()}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Institution learners
            </p>
          </div>
        </div>

        {/* The table fills what the summary strip leaves, inside the portal's
            own gutter -- the same inset every other admin page's content sits
            in. The rows are what scrolls; the toolbar and the pager stay put
            at the card's two edges. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TableCard className="flex min-h-0 flex-1 flex-col">
            <TableToolbar
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                search={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search institution, contact, or email"
            >
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="h-9 w-full sm:w-52">
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All industries</SelectItem>

                  {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

            {/* The rows scroll, the pager does not: with a short list the page still
                ends where the window does rather than leaving the pager stranded
                halfway up a blank page. */}
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
                        column="industry"
                        label="Industry"
                        sort={sort}
                        onSort={toggle}
                        className="min-w-40"
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

                                  <div className="min-w-0">
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

                              <TableCell className="text-sm text-muted-foreground">
                                {institution.industry ?? "Not specified"}
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label={`Actions for ${institutionName}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            navigate(
                                                `/admin/institutions/${getInstitutionId(institution, index)}`
                                            )
                                        }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onSelect={() => onEdit?.(institution)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onSelect={() => onDelete?.(institution)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                              No institutions found
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              Try changing the search or filter, or add a new
                              institution.
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
