import { useMemo, useState } from "react"
import { Link, useOutletContext, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  FileQuestionIcon,
  Layers3Icon,
  UsersRoundIcon
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  AccessWindowBadge,
  InstitutionStatusBadge,
  formatDate,
} from "@/components/institution/institution-ui.jsx"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import { getExamTypes, getExams } from "@/services/assessmentService.js"
import { getAllCertifications } from "@/services/certificationService.js"
import { getDepartments } from "@/services/institutionService.js"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

/** One published assessment, wherever it sits in the tree. */
function ExamRow({ exam, label, className = "" }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-dashed bg-background px-3 py-2 ${className}`}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <ClipboardCheckIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate font-medium">{exam.title}</span>
      </span>
      <Badge variant="outline" className="shrink-0 capitalize">
        {String(label ?? "Assessment").replaceAll("_", " ").toLowerCase()}
      </Badge>
    </div>
  )
}

/** A collapsible row: header on the left, chevron on the right, children when open. */
function AccordionRow({ title, meta, defaultOpen = false, level = 0, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className={`overflow-hidden rounded-xl border ${level === 0 ? "bg-background" : ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
      >
        <div className="min-w-0">
          <p className={`truncate ${level === 0 ? "text-sm font-bold" : "text-sm font-semibold"}`}>{title}</p>
          {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {isOpen ? (
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      {isOpen ? <div className="space-y-2 border-t bg-muted/20 p-3">{children}</div> : null}
    </div>
  )
}

function countLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

/**
 * The curriculum with its assessments in place: each lesson quiz under its
 * lesson, each module exam under its module, each major exam under its major,
 * and the certification-wide ones (diagnostic, mock) as the last section.
 *
 * It used to be a flat "Certification assessments" list under the tree, which
 * put a lesson quiz next to the mock exam with nothing saying where in the
 * course either belonged.
 */
function MiddleCategoryRow({ middleCategory, examsFor, typeLabel, onAddQuestion }) {
  const lessons = middleCategory.lessons ?? []
  const middleExams = examsFor("middle", middleCategory.middleCategoryId)
  const lessonExamCount = lessons.reduce(
    (total, lesson) => total + examsFor("lesson", lesson.lessonId).length,
    0
  )
  const assessmentCount = middleExams.length + lessonExamCount

  return (
    <AccordionRow
      level={1}
      title={middleCategory.title}
      meta={[countLabel(lessons.length, "lesson"), assessmentCount ? countLabel(assessmentCount, "assessment") : null]
        .filter(Boolean)
        .join(" · ")}
    >
      {lessons.length === 0 ? (
        <p className="px-2 py-2 text-sm text-muted-foreground">No lessons in this module yet.</p>
      ) : (
        lessons.map((lesson, index) => {
          const lessonExams = examsFor("lesson", lesson.lessonId)
          return (
            <div key={lesson.lessonId ?? index} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <BookOpenIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{lesson.name}</span>
                </span>
                {onAddQuestion ? (
                  <Button variant="ghost" size="sm" onClick={() => onAddQuestion(lesson.lessonId)}>
                    <FileQuestionIcon className="size-4" aria-hidden="true" />
                    Add Question
                  </Button>
                ) : null}
              </div>
              {lessonExams.map((exam) => (
                <ExamRow key={exam.examId} exam={exam} label={typeLabel(exam)} className="ml-6" />
              ))}
            </div>
          )
        })
      )}
      {middleExams.length ? (
        <div className="space-y-1.5 border-t pt-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Module assessments
          </p>
          {middleExams.map((exam) => (
            <ExamRow key={exam.examId} exam={exam} label={typeLabel(exam)} />
          ))}
        </div>
      ) : null}
    </AccordionRow>
  )
}

function MajorCategoryRow({ major, index, examsFor, typeLabel }) {
  const middles = major.middleCategory ?? []
  const majorExams = examsFor("major", major.majorCategoryId)
  const lessonCount = middles.reduce((total, middle) => total + (middle.lessons?.length ?? 0), 0)

  return (
    <AccordionRow
      level={0}
      defaultOpen={index === 0}
      title={
        <>
          <span className="text-primary">Major Category {index + 1}:</span> {major.title}
        </>
      }
      meta={[
        countLabel(middles.length, "module"),
        countLabel(lessonCount, "lesson"),
        majorExams.length ? countLabel(majorExams.length, "major exam") : null,
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {middles.map((middle, middleIndex) => (
        <MiddleCategoryRow
          key={middle.middleCategoryId ?? middleIndex}
          middleCategory={middle}
          examsFor={examsFor}
          typeLabel={typeLabel}
        />
      ))}
      {majorExams.length ? (
        <div className="space-y-1.5 border-t pt-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Major assessments
          </p>
          {majorExams.map((exam) => (
            <ExamRow key={exam.examId} exam={exam} label={typeLabel(exam)} />
          ))}
        </div>
      ) : null}
    </AccordionRow>
  )
}

export default function InstitutionCertificationDetailPage() {
  const { institutionCertId } = useParams()
  const numericInstitutionCertId = Number(institutionCertId)
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const institutionId = institution?.institutionId
  const data = useInstitutionData(institutionId)

  const certificationsQuery = useQuery({
    queryKey: ["certifications-full"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
  })

  const institutionCert = data.institutionCertById.get(numericInstitutionCertId)

  const departmentsQuery = useQuery({
    queryKey: ["departments", institutionId],
    queryFn: () => getDepartments({ institutionId }),
    enabled: institutionId != null,
  })

  const groups = asArray(departmentsQuery.data).filter(
    (group) => group.institutionCertId === numericInstitutionCertId && group.status === "active"
  )

  const [activeTab, setActiveTab] = useState("curriculum")
  // Lesson handed to the Question Bank tab by the "Add Question" button next to
  // a lesson in the curriculum -- it opens the tab with the form already up.

  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: () => getExams(),
    staleTime: 60_000,
  })
  const examTypesQuery = useQuery({
    queryKey: ["exam-types"],
    queryFn: getExamTypes,
    staleTime: 5 * 60_000,
  })
  const examTypeById = new Map(
    asArray(examTypesQuery.data).map((type) => [type.examTypeId, type.examTypeText])
  )
  const certificationExams = asArray(examsQuery.data).filter(
    (exam) => exam.certificationId === institutionCert?.certificationId && exam.status === "PUBLISHED"
  )
  /* Exams keyed by where they sit. Scope is decided by the most specific id
     the exam carries: a lesson quiz also names its module and major, and must
     only show under the lesson. Anything with no id at all is
     certification-wide -- the diagnostic and the mock exam. */
  const examsByScope = useMemo(() => {
    const index = { lesson: new Map(), middle: new Map(), major: new Map(), certification: [] }
    const push = (map, key, exam) => map.set(key, [...(map.get(key) ?? []), exam])
    for (const exam of certificationExams) {
      if (exam.lessonId != null) push(index.lesson, exam.lessonId, exam)
      else if (exam.middleCategoryId != null) push(index.middle, exam.middleCategoryId, exam)
      else if (exam.majorCategoryId != null) push(index.major, exam.majorCategoryId, exam)
      else index.certification.push(exam)
    }
    return index
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examsQuery.data, institutionCert?.certificationId])
  const examsFor = (scope, id) => examsByScope[scope].get(id) ?? []
  const typeLabel = (exam) => examTypeById.get(exam.examTypeId) ?? "Assessment"
  /* Diagnostic first (it is sat before studying), mock exam last. */
  const scopeRank = (exam) => {
    const label = String(typeLabel(exam)).toUpperCase()
    return label.includes("DIAGNOSTIC") ? 0 : label.includes("MOCK") ? 2 : 1
  }
  const certificationWideExams = [...examsByScope.certification].sort((a, b) => scopeRank(a) - scopeRank(b))

  const certification = useMemo(
    () =>
      asArray(certificationsQuery.data).find(
        (c) => c.certificationId === institutionCert?.certificationId
      ) ?? null,
    [certificationsQuery.data, institutionCert?.certificationId]
  )

  const isLoading =
    institutionLoading ||
    (institution && data.isLoading) ||
    certificationsQuery.isLoading ||
    departmentsQuery.isLoading ||
    examsQuery.isLoading ||
    examTypesQuery.isLoading

  if (isLoading) return <InstitutionLoadingSkeleton />
  if (institutionError) return <InstitutionErrorState onRetry={refetchInstitution} />
  if (!institution || !institutionCert || !certification) {
    return (
      <div className="space-y-6">
        <InstitutionEmptyState
          title="Certification not found"
          description="This certification allocation could not be found."
        />
      </div>
    )
  }

  const majorCategories = certification.majorCategory ?? []
  const totalLessons = majorCategories.reduce(
    (total, major) =>
      total +
      (major.middleCategory ?? []).reduce(
        (subtotal, middle) => subtotal + (middle.lessons?.length ?? 0),
        0
      ),
    0
  )
  const used = institutionCert.usedSlots ?? 0
  const total = institutionCert.totalSlots ?? 0

  return (
    <div className="space-y-6">

      <InstitutionPageHeader
        title={certification.title}
        subtitle={certification.description || "No description available."}
        actions={<AccessWindowBadge allocation={institutionCert} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Layers3Icon className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xl font-semibold tabular-nums">
                {majorCategories.length}
              </p>
              <p className="text-xs text-muted-foreground">Major categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpenIcon className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xl font-semibold tabular-nums">{totalLessons}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slot usage</span>
              <span className="tabular-nums">
                {used} / {total}
              </span>
            </div>
            <Progress
              className="mt-2"
              value={total > 0 ? (used / total) * 100 : 0}
              aria-label="Slot usage"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="groups">Departments ({groups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          {majorCategories.length === 0 && certificationWideExams.length === 0 ? (
            <InstitutionEmptyState
              icon={Layers3Icon}
              title="No content yet"
              description="This certification has no categories or lessons yet."
            />
          ) : (
            <div className="space-y-3">
              {majorCategories.map((major, majorIndex) => (
                <MajorCategoryRow
                  key={major.majorCategoryId ?? majorIndex}
                  major={major}
                  index={majorIndex}
                  examsFor={examsFor}
                  typeLabel={typeLabel}
                />
              ))}

              {/* The certification-wide exams close the accordion the way
                  they close the course: a diagnostic before you start and the
                  mock exam at the end. */}
              {certificationWideExams.length ? (
                <AccordionRow
                  level={0}
                  defaultOpen={majorCategories.length === 0}
                  title={
                    <span className="flex items-center gap-2">
                      <ClipboardCheckIcon className="size-4 text-primary" aria-hidden="true" />
                      Certification assessments
                    </span>
                  }
                  meta={`${countLabel(certificationWideExams.length, "assessment")} · diagnostic and mock exams for the whole certification`}
                >
                  {certificationWideExams.map((exam) => (
                    <ExamRow key={exam.examId} exam={exam} label={typeLabel(exam)} />
                  ))}
                </AccordionRow>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild size="sm">
              <Link to={`/institution/departments?institutionCertId=${numericInstitutionCertId}`}>
                <UsersRoundIcon className="size-4" aria-hidden="true" />
                Manage departments
              </Link>
            </Button>
          </div>
          {groups.length === 0 ? (
            <InstitutionEmptyState
              icon={UsersRoundIcon}
              title="No departments yet"
              description="Create a department under this certification to assign a department head and start inviting learners."
              action={
                <Button asChild size="sm">
                  <Link to={`/institution/departments?institutionCertId=${numericInstitutionCertId}`}>
                    Create department
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <Card key={group.departmentId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{group.departmentName}</CardTitle>
                    <CardDescription>
                      {group.departmentDescription || "No description."}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">
                      {group.usedSlots ?? 0} / {group.totalSlots ?? 0} slot
                      {(group.totalSlots ?? 0) === 1 ? "" : "s"} used
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}
