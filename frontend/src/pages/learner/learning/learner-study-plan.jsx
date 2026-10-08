import { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useQueries, useQuery } from "@tanstack/react-query"

import {
    getProgressAnalytics,
    progressAnalyticsQueryKey,
} from "@/services/learnerAnalyticsService.js"
import {
    ArrowLeft,
    BookOpenCheck,
    Brain,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ListChecks,
    Repeat2,
    Sparkles,
    Target,
    TimerReset,
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { planStudy } from "@/lib/study-plan-events.js"

const readinessOptions = [
    "Ready 1 week before the exam",
    "Ready 2 weeks before the exam",
    "Ready 1 month before the exam",
    "Steady long-term review",
]

const priorityOptions = [
    "Main certification goal",
    "Weak topic improvement",
    "Mock exam preparation",
    "Daily learning consistency",
]

const studyDaysOptions = [
    "3 days per week",
    "4 days per week",
    "5 days per week",
    "6 days per week",
    "Every day",
]

const studyWindowOptions = [
    "Morning · 7:00 AM",
    "Afternoon · 2:00 PM",
    "Evening · 7:00 PM",
    "Late night · 10:00 PM",
]

const STUDY_WINDOW_TIMES = {
    "Morning · 7:00 AM": "07:00",
    "Afternoon · 2:00 PM": "14:00",
    "Evening · 7:00 PM": "19:00",
    "Late night · 10:00 PM": "22:00",
}

const studyTechniques = [
    {
        id: "spaced-repetition",
        title: "Spaced Repetition",
        description:
            "Review lessons repeatedly across different days to improve long-term memory.",
        icon: Repeat2,
    },
    {
        id: "active-recall",
        title: "Active Recall",
        description:
            "Practice remembering answers before checking notes or explanations.",
        icon: Brain,
    },
    {
        id: "pomodoro",
        title: "Pomodoro",
        description:
            "Study in focused sessions with short breaks to avoid burnout.",
        icon: TimerReset,
    },
]

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const OVERALL_CERTIFICATION_LABEL = "All certifications"

const OVERALL_PRIORITY_TOPIC_LIMIT = 12

function parseDate(value) {
    return new Date(`${value}T00:00:00`)
}

function addDays(date, days) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

function toDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function formatMonthYear(date) {
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    })
}

function getEventClassName(type) {
    if (type === "review") {
        return "bg-rb-leaf-wash text-rb-leaf-lip ring-rb-leaf/30"
    }

    if (type === "quiz") {
        return "bg-rb-bee-wash text-rb-bee-ink ring-rb-bee/40"
    }

    if (type === "mock") {
        return "bg-rb-fox-wash text-rb-fox-lip ring-rb-fox/30"
    }

    if (type === "exam") {
        return "bg-rb-cardinal-wash text-rb-cardinal-lip ring-rb-cardinal/30"
    }

    if (type === "catch-up") {
        return "bg-muted text-muted-foreground ring-border"
    }

    return "bg-rb-feather-wash text-rb-feather-ink ring-rb-feather/20"
}

function buildMonthDays(viewDate) {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const startDate = new Date(firstDayOfMonth)

    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + index)

        return {
            date,
            key: toDateKey(date),
            isCurrentMonth: date.getMonth() === month,
            day: date.getDate(),
        }
    })
}

function curriculumFor(lessons, certificationId, certificationTitle = null) {
    return (Array.isArray(lessons) ? lessons : []).filter((lesson) =>
        certificationId != null
            ? String(lesson?.certificationId) === String(certificationId)
            : certificationTitle != null && lesson?.certificationTitle === certificationTitle
    )
}

function masteryMap(rows) {
    const map = {}
    for (const row of Array.isArray(rows) ? rows : []) {
        if (row?.lessonId != null && row?.masteryPercentage != null) {
            map[String(row.lessonId)] = row.masteryPercentage
        }
    }
    return map
}

function shortDate(dateKey) {
    if (!dateKey) return null
    const date = new Date(`${dateKey}T00:00:00`)
    return Number.isNaN(date.getTime())
        ? dateKey
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function topicRefs(rows) {
    const seen = new Set()
    const refs = []

    for (const row of Array.isArray(rows) ? rows : []) {
        const title = String(row?.lessonTitle ?? "").trim()
        if (!title || seen.has(title)) continue

        seen.add(title)
        refs.push({ lessonId: row?.lessonId ?? null, middleCategoryId: row?.middleCategoryId ?? null, title })
    }

    return refs
}

function byWeakestFirst(a, b) {
    return (
        (a?.masteryPercentage ?? Number.POSITIVE_INFINITY) -
        (b?.masteryPercentage ?? Number.POSITIVE_INFINITY)
    )
}

function FormSelect({ label, value, onValueChange, options }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
                {label}
            </Label>

            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="h-10 w-full rounded-lg text-sm">
                    <SelectValue placeholder={label} />
                </SelectTrigger>

                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function FormInput({ label, value, onChange, type = "text", min, max, error }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
                {label}
            </Label>

            <Input
                type={type}
                value={value}
                min={min}
                max={max}
                aria-invalid={error ? true : undefined}
                onChange={(event) => onChange(event.target.value)}
                className={`h-10 rounded-lg text-sm ${
                    error ? "border-destructive focus-visible:ring-destructive/40" : ""
                }`}
            />

            {error ? (
                <p className="text-xs font-medium text-destructive">{error}</p>
            ) : null}
        </div>
    )
}

function TechniqueCard({ technique, selected, onSelect }) {
    const Icon = technique.icon

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`h-full rounded-2xl border-2 bg-card p-4 text-left shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selected ? "border-rb-bee ring-4 ring-rb-bee/40" : "border-transparent hover:border-rb-swan"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className={`flex size-9 items-center justify-center rounded-xl ${
                        selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground"
                    }`}
                >
                    <Icon className="size-4" />
                </div>

                {selected ? (
                    <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
                ) : null}
            </div>

            <h3 className="mt-3 text-base font-bold text-foreground">
                {technique.title}
            </h3>

            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                {technique.description}
            </p>
        </button>
    )
}

function CalendarEvent({ event }) {
    return (
        <div
            className={`truncate rounded-md px-2 py-1 text-[11px] font-medium ring-1 ${getEventClassName(
                event.type
            )}`}
            title={`${event.title} · ${event.time}${event.detail ? `
${event.detail}` : ""}`}
        >
            {event.title}
        </div>
    )
}

function StudyPlanCalendar({
                               generatedPlan,
                               onBackToForm,
                               viewDate,
                               onPreviousMonth,
                               onNextMonth,
                           }) {
    const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate])

    const eventsByDate = useMemo(() => {
        const map = new Map()

        generatedPlan.events.forEach((event) => {
            const currentEvents = map.get(event.dateKey) ?? []
            map.set(event.dateKey, [...currentEvents, event])
        })

        return map
    }, [generatedPlan.events])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Button variant="outline" onClick={onBackToForm} className="gap-2">
                    <ArrowLeft className="size-4" />
                    Edit Plan
                </Button>
            </div>

            <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="border-b border-border pb-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                {generatedPlan.certification}
                            </p>

                            <CardTitle className="mt-1 text-xl">
                                {formatMonthYear(viewDate)}
                            </CardTitle>

                            <CardDescription className="mt-1">
                                Lessons, reviews, recall quizzes, catch-up days, mock exams, and your exam day.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={onPreviousMonth}>
                                Previous
                            </Button>

                            <Button variant="outline" size="sm" onClick={onNextMonth}>
                                Next
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b border-border bg-muted/40">
                        {weekdayLabels.map((day) => (
                            <div
                                key={day}
                                className="border-r border-border px-3 py-3 text-center text-xs font-semibold text-muted-foreground last:border-r-0"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {monthDays.map((day) => {
                            const events = eventsByDate.get(day.key) ?? []

                            return (
                                <div
                                    key={day.key}
                                    className={`min-h-[132px] border-r border-b border-border p-2 last:border-r-0 ${
                                        day.isCurrentMonth ? "bg-background" : "bg-muted/20"
                                    }`}
                                >
                                    <div className="flex justify-end">
                    <span
                        className={`text-xs font-medium ${
                            day.isCurrentMonth
                                ? "text-foreground"
                                : "text-muted-foreground/50"
                        }`}
                    >
                      {day.day}
                    </span>
                                    </div>

                                    <div className="mt-2 space-y-1.5">
                                        {events.slice(0, 3).map((event) => (
                                            <CalendarEvent key={event.id} event={event} />
                                        ))}

                                        {events.length > 3 ? (
                                            <p className="px-1 text-[11px] text-muted-foreground">
                                                +{events.length - 3} more
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-xl shadow-none">
                    <CardContent className="p-4">
                        <BookOpenCheck className="size-5 text-primary" />
                        <p className="mt-3 text-sm font-semibold">Lessons</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            A new topic, studied with your chosen technique
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-none">
                    <CardContent className="p-4">
                        <Repeat2 className="size-5 text-rb-leaf" />
                        <p className="mt-3 text-sm font-semibold">Reviews</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Short look-backs at topics you already studied
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-none">
                    <CardContent className="p-4">
                        <Brain className="size-5 text-rb-bee-ink" />
                        <p className="mt-3 text-sm font-semibold">Recall quizzes</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Questions answered from memory, before checking
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-none">
                    <CardContent className="p-4">
                        <Target className="size-5 text-rb-fox" />
                        <p className="mt-3 text-sm font-semibold">Mock Exams</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            A full timed practice test to measure readiness
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export function StudyPlanContent({
    onPlanGenerated,
    lockedCertification,
    certificationId,
    overall = false,
    generating = false,
}) {
    const { data } = useOutletContext()

    const certificationOptions = useMemo(
        () => (data?.certifications ?? [])
            .map((item) => item?.title)
            .filter(Boolean),
        [data?.certifications]
    )

    const [chosenCertificationIds, setChosenCertificationIds] = useState(null)

    const enrolledCertifications = useMemo(() => {
        if (!overall) {
            return []
        }
        const rows = data?.enrolledCertifications ?? data?.certifications ?? []
        return rows
            .filter((row) => row?.certificationId != null)
            .map((row) => ({
                id: String(row.certificationId),
                title: row?.title ?? "Untitled Certification",
            }))
    }, [overall, data?.enrolledCertifications, data?.certifications])

    const selectedCertificationIds = useMemo(() => {
        const enrolledIds = enrolledCertifications.map((row) => row.id)
        if (chosenCertificationIds == null) {
            return enrolledIds
        }
        const enrolled = new Set(enrolledIds)
        return chosenCertificationIds.filter((id) => enrolled.has(id))
    }, [enrolledCertifications, chosenCertificationIds])

    function toggleCertification(id) {
        setChosenCertificationIds((current) => {
            const base = current ?? enrolledCertifications.map((row) => row.id)
            return base.includes(id)
                ? base.filter((selected) => selected !== id)
                : [...base, id]
        })
    }


    const [certificationDates, setCertificationDates] = useState({})

    function datesFor(id) {
        return certificationDates[id] ?? { calendarStart, targetExamDate }
    }

    function setCertificationDate(id, field, value) {
        setCertificationDates((current) => ({
            ...current,
            [id]: { ...(current[id] ?? { calendarStart, targetExamDate }), [field]: value },
        }))
    }

    function certificationDatesOutOfOrder(id) {
        const { calendarStart: from, targetExamDate: to } = datesFor(id)
        return Boolean(from) && Boolean(to) && from > to
    }

    const overallCertificationLabel = useMemo(() => {
        if (!overall) {
            return null
        }
        const count = selectedCertificationIds.length
        if (count === 0) {
            return "No certifications selected"
        }
        if (count === enrolledCertifications.length) {
            return OVERALL_CERTIFICATION_LABEL
        }
        if (count === 1) {
            return enrolledCertifications.find((row) => row.id === selectedCertificationIds[0])?.title
                ?? "1 certification"
        }
        return `${count} certifications`
    }, [overall, selectedCertificationIds, enrolledCertifications])

    const certificationLabel = overall
        ? overallCertificationLabel
        : lockedCertification

    const [certification, setCertification] = useState(certificationLabel ?? "")
    const [courseGoal, setCourseGoal] = useState("Complete a full reviewer")
    const [targetExamDate, setTargetExamDate] = useState(() => toDateKey(addDays(new Date(), 90)))
    const [targetReadiness, setTargetReadiness] = useState(readinessOptions[1])
    const [examPriority, setExamPriority] = useState(priorityOptions[0])
    const [calendarStart, setCalendarStart] = useState(() => toDateKey(new Date()))
    const [studyDays, setStudyDays] = useState(studyDaysOptions[2])
    const [studyWindow, setStudyWindow] = useState(studyWindowOptions[2])
    const [selectedTechnique, setSelectedTechnique] = useState("spaced-repetition")
    const [studyPreferences, setStudyPreferences] = useState("")
    const [generatedPlan, setGeneratedPlan] = useState(null)
    const [viewDate, setViewDate] = useState(() => new Date())

    useEffect(() => {
        if (certificationLabel) {
            setCertification(certificationLabel)
            return
        }
        if (!certificationOptions.includes(certification)) {
            setCertification(certificationOptions[0] ?? "")
        }
    }, [certification, certificationOptions, certificationLabel])

    const analyticsQuery = useQuery({
        queryKey: progressAnalyticsQueryKey(String(certificationId ?? "")),
        queryFn: () => getProgressAnalytics(certificationId),
        enabled: !overall && Boolean(certificationId),
        staleTime: 60_000,
    })



    const overallPriorities = useQueries({
        queries: selectedCertificationIds.map((id) => ({
            queryKey: progressAnalyticsQueryKey(id),
            queryFn: () => getProgressAnalytics(id),
            staleTime: 60_000,
        })),
        combine: (results) => {

            const byCertification = {}
            const masteryByCertification = {}
            results.forEach((result, index) => {
                const id = selectedCertificationIds[index]
                if (id != null) {
                    byCertification[id] = topicRefs(result.data?.weakestTopics)
                    masteryByCertification[id] = masteryMap(result.data?.lessonPriorities)
                }
            })

            return {
                byCertification,
                masteryByCertification,

                topics: topicRefs(
                    results
                        .flatMap((result) =>
                            Array.isArray(result.data?.weakestTopics)
                                ? result.data.weakestTopics
                                : []
                        )
                        .sort(byWeakestFirst)
                ).slice(0, OVERALL_PRIORITY_TOPIC_LIMIT),

                pending: results.some(
                    (result) => result.isLoading || result.data?.bktAvailable === false
                ),
            }
        },
    })

    const singleCertificationTopics = useMemo(() => {
        const rows = analyticsQuery.data?.weakestTopics
        return [
            ...new Set(
                (Array.isArray(rows) ? rows : [])
                    .map((row) => String(row?.lessonTitle ?? "").trim())
                    .filter(Boolean)
            ),
        ]
    }, [analyticsQuery.data])

    const singleMastery = useMemo(
        () => masteryMap(analyticsQuery.data?.lessonPriorities),
        [analyticsQuery.data]
    )

    const priorityTopics = overall ? overallPriorities.topics : singleCertificationTopics

    const priorityTopicsPending = overall
        ? overallPriorities.pending
        : Boolean(certificationId) &&
          (analyticsQuery.isLoading || analyticsQuery.data?.bktAvailable === false)

    const selectedTechniqueInfo = useMemo(() => {
        return studyTechniques.find((item) => item.id === selectedTechnique)
    }, [selectedTechnique])

    const datesOutOfOrder = overall
        ? selectedCertificationIds.some(certificationDatesOutOfOrder)
        : Boolean(calendarStart) && Boolean(targetExamDate) && calendarStart > targetExamDate

    const noCertificationsSelected = overall && selectedCertificationIds.length === 0

    const previewExamDate = overall
        ? selectedCertificationIds
              .map((id) => datesFor(id).targetExamDate)
              .filter(Boolean)
              .reduce((latest, value) => (value > latest ? value : latest), "") || "—"
        : targetExamDate

    const pacePreview = useMemo(() => {
        const entries = overall
            ? selectedCertificationIds.map((id) => ({
                  certificationId: id,
                  title: enrolledCertifications.find((row) => row.id === id)?.title ?? "Certification",
                  ...datesFor(id),
                  mastery: overallPriorities.masteryByCertification?.[String(id)] ?? {},
              }))
            : [{ certificationId, title: certification, calendarStart, targetExamDate, mastery: singleMastery }]

        return entries
            .filter((entry) => entry.calendarStart && entry.targetExamDate)
            .map((entry) => ({
                title: entry.title,
                summary: planStudy({
                    calendarStart: entry.calendarStart,
                    targetExamDate: entry.targetExamDate,
                    studyDays,
                    studyWindow,
                    studyWindowTimes: STUDY_WINDOW_TIMES,
                    studyTime: entry.studyTime ?? null,
                    selectedTechniqueInfo,
                    readiness: targetReadiness,
                    curriculum: curriculumFor(data?.lessons, entry.certificationId, overall ? null : certification),
                    masteryByLesson: entry.mastery,
                    priorityTopics: overall ? [] : priorityTopics,
                }).summary,
            }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overall, selectedCertificationIds, certificationDates, calendarStart, targetExamDate, studyDays, studyWindow,
        selectedTechniqueInfo, targetReadiness, data?.lessons, overallPriorities.masteryByCertification, singleMastery,
        priorityTopics, certification, certificationId, enrolledCertifications])

    function handleGeneratePlan() {
        if (noCertificationsSelected) {
            return
        }

        if (datesOutOfOrder) {
            return
        }

        const certificationPlans = overall
            ? selectedCertificationIds.map((id) => ({
                  certificationId: Number(id),
                  title:
                      enrolledCertifications.find((row) => row.id === id)?.title
                      ?? "Untitled Certification",
                  ...datesFor(id),
              }))
            : []

        const plannedByCertification = overall
            ? certificationPlans.map((entry) => ({
                  entry,
                  planned: planStudy({
                      calendarStart: entry.calendarStart,
                      targetExamDate: entry.targetExamDate,
                      studyDays,
                      studyWindow,
                      studyWindowTimes: STUDY_WINDOW_TIMES,
                      studyTime: entry.studyTime ?? null,
                      selectedTechniqueInfo,
                      readiness: targetReadiness,
                      curriculum: curriculumFor(data?.lessons, entry.certificationId),
                      masteryByLesson:
                          overallPriorities.masteryByCertification[String(entry.certificationId)] ?? {},
                      priorityTopics:
                          overallPriorities.byCertification[String(entry.certificationId)] ?? [],
                  }),
              }))
            : []

        const singlePlanned = overall
            ? null
            : planStudy({
                  calendarStart,
                  targetExamDate,
                  studyDays,
                  studyWindow,
                  studyWindowTimes: STUDY_WINDOW_TIMES,
                  selectedTechniqueInfo,
                  readiness: targetReadiness,
                  curriculum: curriculumFor(data?.lessons, certificationId, certification),
                  masteryByLesson: singleMastery,
                  priorityTopics,
              })

        const events = overall
            ? plannedByCertification.flatMap(({ entry, planned }) =>
                  planned.events.map((event) => ({
                      ...event,
                      id: `${entry.certificationId}-${event.id}`,
                      certificationId: entry.certificationId,
                      certification: entry.title,
                  }))
              )
            : singlePlanned.events

        const planCalendarStart = overall
            ? certificationPlans
                  .map((entry) => entry.calendarStart)
                  .filter(Boolean)
                  .reduce((earliest, value) => (value < earliest ? value : earliest), calendarStart)
            : calendarStart

        const planTargetExamDate = overall
            ? certificationPlans
                  .map((entry) => entry.targetExamDate)
                  .filter(Boolean)
                  .reduce((latest, value) => (value > latest ? value : latest), targetExamDate)
            : targetExamDate

        const nextPlan = {
            certification,
            ...(overall
                ? {
                      certificationIds: selectedCertificationIds.map(Number),
                      certificationPlans,
                  }
                : null),
            generatedAt: new Date().toISOString(),
            summaries: overall
                ? plannedByCertification.map(({ entry, planned }) => ({
                      certificationId: entry.certificationId,
                      title: entry.title,
                      ...planned.summary,
                  }))
                : [{ certificationId: certificationId ?? null, title: certification, ...singlePlanned.summary }],
            courseGoal,
            targetExamDate: planTargetExamDate,
            targetReadiness,
            examPriority,
            calendarStart: planCalendarStart,
            studyDays,
            studyWindow,
            selectedTechniqueInfo,
            priorityTopics,
            studyPreferences,
            events,
        }

        if (onPlanGenerated) {
            onPlanGenerated(nextPlan)
        } else {
            setGeneratedPlan(nextPlan)
        }

        setViewDate(parseDate(planCalendarStart))
    }

    function handlePreviousMonth() {
        setViewDate((currentDate) => {
            const nextDate = new Date(currentDate)
            nextDate.setMonth(currentDate.getMonth() - 1)
            return nextDate
        })
    }

    function handleNextMonth() {
        setViewDate((currentDate) => {
            const nextDate = new Date(currentDate)
            nextDate.setMonth(currentDate.getMonth() + 1)
            return nextDate
        })
    }

    if (generatedPlan) {
        return (
            <StudyPlanCalendar
                generatedPlan={generatedPlan}
                viewDate={viewDate}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                onBackToForm={() => setGeneratedPlan(null)}
            />
        )
    }

    return (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
            <main className="min-w-0 space-y-8">
                <section>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Course and target
                    </p>

                    {overall ? (
                        <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <Label className="text-xs font-semibold text-foreground">
                                    Certifications to cover
                                </Label>

                                <p className="text-xs text-muted-foreground">
                                    {noCertificationsSelected
                                        ? "Pick at least one"
                                        : `${selectedCertificationIds.length} of ${enrolledCertifications.length} selected`}
                                </p>
                            </div>

                            {enrolledCertifications.length === 0 ? (
                                <p className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                                    You are not enrolled in any certifications yet, so there is
                                    nothing to build a plan around.
                                </p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {enrolledCertifications.map((row) => {
                                        const checked = selectedCertificationIds.includes(row.id)
                                        const dates = datesFor(row.id)
                                        const outOfOrder = checked && certificationDatesOutOfOrder(row.id)

                                        return (
                                            <div
                                                key={row.id}
                                                className={`rounded-2xl p-3 transition ${
                                                    checked
                                                        ? "bg-primary/10 ring-2 ring-primary"
                                                        : "bg-muted/50 hover:bg-muted"
                                                }`}
                                            >
                                                <Label
                                                    htmlFor={`study-plan-certification-${row.id}`}
                                                    className="flex cursor-pointer items-center gap-3 text-sm font-medium"
                                                >
                                                    <Checkbox
                                                        id={`study-plan-certification-${row.id}`}
                                                        checked={checked}
                                                        onCheckedChange={() => toggleCertification(row.id)}
                                                    />

                                                    <span className="min-w-0 leading-snug">{row.title}</span>
                                                </Label>

                                                {checked ? (
                                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                        <FormInput
                                                            label="Starts"
                                                            value={dates.calendarStart}
                                                            onChange={(value) =>
                                                                setCertificationDate(row.id, "calendarStart", value)
                                                            }
                                                            type="date"
                                                            max={dates.targetExamDate || undefined}
                                                            error={
                                                                outOfOrder
                                                                    ? "Start on or before the exam."
                                                                    : undefined
                                                            }
                                                        />

                                                        <FormInput
                                                            label="Target exam date"
                                                            value={dates.targetExamDate}
                                                            onChange={(value) =>
                                                                setCertificationDate(row.id, "targetExamDate", value)
                                                            }
                                                            type="date"
                                                            min={dates.calendarStart || undefined}
                                                            error={
                                                                outOfOrder
                                                                    ? "The exam is before the start."
                                                                    : undefined
                                                            }
                                                        />

                                                        <div className="sm:col-span-2">
                                                            <FormInput
                                                                label="Study time"
                                                                value={
                                                                    dates.studyTime ??
                                                                    STUDY_WINDOW_TIMES[studyWindow] ??
                                                                    "19:00"
                                                                }
                                                                onChange={(value) =>
                                                                    setCertificationDate(row.id, "studyTime", value || null)
                                                                }
                                                                type="time"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {overall ? null : lockedCertification ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-foreground">
                                    Certification
                                </Label>

                                <p className="flex h-10 items-center rounded-lg bg-muted px-3 text-sm font-medium text-foreground">
                                    {lockedCertification}
                                </p>
                            </div>
                        ) : (
                            <FormSelect
                                label="Certification"
                                value={certification}
                                onValueChange={setCertification}
                                options={certificationOptions}
                            />
                        )}

                        <FormInput
                            label="Course goal"
                            value={courseGoal}
                            onChange={setCourseGoal}
                        />

                        {overall ? null : (
                            <FormInput
                                label="Target exam date"
                                value={targetExamDate}
                                onChange={setTargetExamDate}
                                type="date"
                                min={calendarStart || undefined}
                                error={
                                    datesOutOfOrder
                                        ? "The exam date is before the calendar starts."
                                        : undefined
                                }
                            />
                        )}

                        <FormSelect
                            label="Target readiness"
                            value={targetReadiness}
                            onValueChange={setTargetReadiness}
                            options={readinessOptions}
                        />

                        <FormSelect
                            label="Exam priority"
                            value={examPriority}
                            onValueChange={setExamPriority}
                            options={priorityOptions}
                        />
                    </div>
                </section>

                <section>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Schedule
                    </p>

                    <div className={`mt-4 grid gap-4 ${overall ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                        {overall ? null : (
                            <FormInput
                                label="Calendar starts"
                                value={calendarStart}
                                onChange={setCalendarStart}
                                type="date"
                                max={targetExamDate || undefined}
                                error={
                                    datesOutOfOrder
                                        ? "Start the calendar on or before your exam date."
                                        : undefined
                                }
                            />
                        )}

                        <FormSelect
                            label="Study days per week"
                            value={studyDays}
                            onValueChange={setStudyDays}
                            options={studyDaysOptions}
                        />

                        {overall ? null : (
                            <FormSelect
                                label="Preferred study time"
                                value={studyWindow}
                                onValueChange={setStudyWindow}
                                options={studyWindowOptions}
                            />
                        )}
                    </div>
                </section>

                <section>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Study technique
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                        {studyTechniques.map((technique) => (
                            <TechniqueCard
                                key={technique.id}
                                technique={technique}
                                selected={selectedTechnique === technique.id}
                                onSelect={() => setSelectedTechnique(technique.id)}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                            Priority topics
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {overall
                                ? "Weakest across every certification"
                                : "From your diagnostic"}
                        </p>
                    </div>

                    {priorityTopics.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {priorityTopics.map((topic) => (
                                <Badge
                                    key={topic.title}
                                    variant="secondary"
                                    className="h-auto max-w-full whitespace-normal rounded-full px-3 py-1.5 text-left text-xs font-medium leading-snug"
                                >
                                    {topic.title}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 rounded-2xl bg-card p-4 text-sm leading-6 text-muted-foreground">
                            {priorityTopicsPending
                                ? "Working out which topics to put first from your diagnostic. This takes a moment."
                                : overall
                                    ? "Your weak topics appear here once you have submitted a diagnostic on at least one certification."
                                    : "Your weak topics appear here once the diagnostic is submitted."}
                        </p>
                    )}
                </section>

                <section>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Anything else
                    </p>

                    <Textarea
                        value={studyPreferences}
                        onChange={(event) => setStudyPreferences(event.target.value)}
                        maxLength={500}
                        placeholder="Example: I am available Monday, Wednesday, and Friday after 7 PM. Use short sessions with breaks and add one catch-up day every week."
                        className="mt-4 min-h-28 resize-none rounded-2xl"
                    />

                    <p className="mt-2 text-right text-xs text-muted-foreground">
                        {studyPreferences.length} / 500
                    </p>
                </section>

                <div className="flex justify-end">
                    <Button
                        className="gap-2"
                        onClick={handleGeneratePlan}
                        disabled={generating || datesOutOfOrder || noCertificationsSelected}
                    >
                        {generating ? (
                            "Saving plan…"
                        ) : (
                            <>
                                <Sparkles className="size-4" />
                                Generate calendar
                            </>
                        )}
                    </Button>
                </div>
            </main>

            <aside className="min-w-0 xl:sticky xl:top-0 xl:self-start">
                <div className="overflow-hidden rounded-2xl bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ListChecks className="size-4" aria-hidden="true" />

                        <p className="text-xs font-semibold uppercase tracking-wider">
                            Preview
                        </p>
                    </div>

                    <p className="mt-4 font-semibold leading-snug text-foreground">
                        {certification || "Your certification"}
                    </p>

                    <dl className="mt-4 space-y-3 text-sm">
                        {[
                            [Clock3, "Study days", studyDays],
                            [CalendarDays, overall ? "Last exam" : "Exam date", previewExamDate],
                            [Brain, "Technique", selectedTechniqueInfo?.title],
                            [Target, "Readiness", targetReadiness],
                        ].map(([Icon, label, value]) => (
                            <div key={label} className="flex items-start gap-2.5">
                                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />

                                <div className="min-w-0">
                                    <dt className="text-xs text-muted-foreground">{label}</dt>
                                    <dd className="font-medium text-foreground">{value}</dd>
                                </div>
                            </div>
                        ))}
                    </dl>

                    {pacePreview.length > 0 ? (
                        <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
                            <p className="text-xs text-muted-foreground">Pace</p>
                            {pacePreview.map(({ title, summary }) => (
                                <div key={title} className="text-sm leading-5">
                                    {overall ? <p className="font-semibold text-foreground">{title}</p> : null}
                                    <p className="text-foreground">
                                        {summary.lessonsToStudy} lessons left
                                        {summary.lessonsCompleted > 0 ? ` (${summary.lessonsCompleted} done)` : ""}
                                        {" · "}
                                        {summary.lessonsPerDay} per study day
                                    </p>
                                    {summary.lessonsEndOn ? (
                                        <p className="text-xs text-muted-foreground">
                                            New lessons done by {shortDate(summary.lessonsEndOn)}, then review and{" "}
                                            {summary.mockCount} mock {summary.mockCount === 1 ? "exam" : "exams"}.
                                        </p>
                                    ) : null}
                                    {summary.warning ? (
                                        <p className="mt-1 text-xs font-semibold text-destructive">{summary.warning}</p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {priorityTopics.length > 0 ? (
                        <div className="mt-5 border-t border-border/60 pt-4">
                            <p className="text-xs text-muted-foreground">Focus first</p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {priorityTopics.slice(0, 4).map((topic) => (
                                    <Badge
                                        key={topic.title}
                                        variant="secondary"
                                        className="h-auto max-w-full whitespace-normal rounded-xl text-left leading-snug"
                                    >
                                        {topic.title}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </aside>
        </div>
    )
}

export function StudyPlanGenerator({
    onPlanGenerated,
    lockedCertification,
    certificationId,
    overall,
    generating,
}) {
    return (
        <StudyPlanContent
            onPlanGenerated={onPlanGenerated}
            lockedCertification={lockedCertification}
            certificationId={certificationId}
            overall={overall}
            generating={generating}
        />
    )
}

export default function LearningStudyPlan() {
    return <StudyPlanGenerator />
}
