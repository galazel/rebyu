import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { returnState } from "@/lib/assessment-return"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Crop,
  Circle,
  CircleHelp,
  Clock,
  Lock,
  Loader2,
  PanelLeft,
  Sparkles,
  Zap,
} from "@/components/icons"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { TactileButton, ProgressBar } from "@/components/rebyu/rebyu-ui.jsx"
import {
  AnimatePresence,
  Collapse,
  CountUp,
  Reveal,
  StaggerList,
  TickPop,
  fadeUp,
  motion,
  popIn,
} from "@/components/motion/rebyu-motion.jsx"
import { LearnerEmptyState } from "@/components/learner/learner-ui.jsx"
import { LessonAiTutor } from "@/components/learner/lesson-ai-tutor.jsx"
import { LessonSnipOverlay, SelectionAskButton } from "@/components/learner/lesson-snip.jsx"
import { LessonKnowledgeCheck } from "@/components/learner/lesson-knowledge-check.jsx"
import { useSkimChallenge } from "@/hooks/useSkimChallenge.js"
import { useReadingPaceGuard } from "@/hooks/useReadingPaceGuard.js"
import { Button } from "@/components/ui/button"
import { PriorityBookmark } from "@/components/learner/priority-tag.jsx"
import { ASSESSMENT_MAX_XP, LESSON_COMPLETION_XP } from "@/lib/xp.js"
import { announceRewards, prefetchRewards, snapshotRewards } from "@/components/learner/xp-award-modal.jsx"
import {
  forgetLessonCompleted,
  rememberLessonCompleted,
  wasLessonCompletedThisSession,
} from "@/lib/lesson-completion.js"
import { LessonTool } from "@/components/certifications/lesson-content-renderer.jsx"
import {
  getLessonById,
  getReadSections,
  markLessonComplete,
  markSectionRead,
  markSectionUnread,
  parseLessonStructure,
} from "@/services/learnerService.js"
import { getExams, getExamTypes } from "@/services/assessmentService.js"
import { getProgressAnalytics } from "@/services/learnerAnalyticsService.js"
import { cn } from "@/lib/utils"
import {
  buildCurriculum,
  examStanding,
  findMiddle,
  latestSitting,
  bestSitting,
  PROFICIENT_RATING,
} from "./curriculum-model.js"
import {
  SectionStackSkeleton,
  TopicPageSkeleton,
} from "@/components/learner/learning-skeletons.jsx"



function useIsXl() {
  const [isXl, setIsXl] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches,
  )

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)")
    const handle = (event) => setIsXl(event.matches)
    query.addEventListener("change", handle)
    return () => query.removeEventListener("change", handle)
  }, [])

  return isXl
}

function buildTrack(middle) {
  const track = middle.lessons.map((lesson) => ({ ...lesson, kind: "lesson" }))

  if (middle.assessment) {
    track.push({
      kind: "assessment",
      id: `assessment-${middle.assessment.examId}`,
      exam: middle.assessment,
      name: middle.assessment.title,
    })
  }

  return track
}

function readSectionsOf(structure) {
  const parsed = parseLessonStructure(structure).map((section, index) => ({
    ...section,
    key: String(section.id ?? `section-${index}`),
    name: section.sectionName ?? section.name ?? `Section ${index + 1}`,
    tools: Array.isArray(section.content) ? section.content : [],
  }))

  const merged = []
  for (let index = 0; index < parsed.length; index += 1) {
    const current = parsed[index]
    const name = current.name.trim().toLowerCase()

    if (name === "introduction") {
      const group = [current]
      let lookahead = index + 1

      if (parsed[lookahead]?.name.trim().toLowerCase() === "learning objectives") {
        group.push(parsed[lookahead])
        lookahead += 1
      }
      if (parsed[lookahead]?.name.trim().toLowerCase().startsWith("prerequisite")) {
        group.push(parsed[lookahead])
        lookahead += 1
      }

      if (group.length > 1) {
        merged.push({
          ...current,
          key: group.map((section) => section.key).join("+"),
          name: "Introduction & Learning Objectives",
          tools: group.flatMap((section) => section.tools),
        })
        index = lookahead - 1
        continue
      }
    }

    merged.push(current)
  }

  return merged
}


const ROW_ICON = { lesson: BookOpen, assessment: ClipboardCheck }

function OutlineRow({
  item,
  mastery,
  active,
  collapsed,
  expanded,
  onSelect,
  onToggle,
  index,
  sections,
  readSections,
  done,
  locked,
}) {
  const Icon = ROW_ICON[item.kind] ?? BookOpen
  const hasChildren = item.kind === "lesson" && (sections.length > 0 || Boolean(item.quiz))

  return (
    <motion.li variants={fadeUp}>
      <div
        className={`relative flex items-center gap-1 transition-colors ${
          active ? "bg-rb-macaw-wash" : "hover:bg-rb-polar"
        }`}
      >
        {active ? (
          <motion.span
            layoutId="rail-active"
            className="absolute inset-y-0 left-0 w-1 bg-rb-macaw"
            transition={{ type: "spring", stiffness: 520, damping: 40 }}
            aria-hidden="true"
          />
        ) : null}
        {!collapsed ? <span className="w-1 shrink-0" aria-hidden="true" /> : null}
        <button
          type="button"
          onClick={() => onSelect(item)}
          title={collapsed ? item.name : undefined}
          aria-current={active ? "step" : undefined}
          className={`flex min-w-0 flex-1 items-center gap-3 py-3 text-left ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          <TickPop
            done={done}
            className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors ${
              done
                ? "bg-rb-feather text-white"
                : active
                  ? "bg-rb-macaw text-white"
                  : item.kind === "assessment"
                    ? "bg-rb-fox-wash text-rb-fox-lip"
                    : "bg-rb-swan text-rb-wolf"
            }`}
          >
            {done ? (
              <Check className="size-4" aria-hidden="true" />
            ) : locked ? (
              <Lock className="size-4" aria-hidden="true" />
            ) : (
              <Icon className="size-4" aria-hidden="true" />
            )}
          </TickPop>

          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span
                className={`line-clamp-2 text-sm leading-snug ${
                  active ? "font-extrabold text-rb-macaw-lip" : locked ? "font-bold text-rb-hare" : "font-bold text-rb-eel"
                }`}
                title={item.name}
              >
                {index ? `${index} ` : ""}
                {item.name}
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-bold uppercase tracking-wide text-rb-wolf">
                {item.kind === "lesson"
                  ? `lesson${item.quiz ? " · 1 quiz" : ""}`
                  : `unit assessment · ${item.exam.totalQuestions} questions`}
              </span>
            </span>
          ) : null}
        </button>



        {item.kind === "lesson" && item.priorityTag ? (
          <span className={collapsed ? "absolute right-0.5 top-1" : "pr-2"}>
            <PriorityBookmark
              tag={item.priorityTag}
              masteryProbability={mastery}
              size={collapsed ? 11 : 14}
            />
          </span>
        ) : null}

        {hasChildren && !collapsed ? (
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} contents of ${item.name}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-rb-hare hover:bg-rb-swan hover:text-rb-eel"
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="grid place-items-center"
            >
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </motion.span>
          </button>
        ) : null}
      </div>

      <Collapse open={Boolean(hasChildren && expanded && !collapsed)} duration={0.26}>
        <ul className="border-l-4 border-transparent bg-rb-polar/60 py-1 pl-[2.75rem] pr-3">
          {sections.map((section) => {
            const sectionRead = readSections.has(section.key)

            return (
              <li key={section.key}>
                <a
                  href={`#${section.key}`}
                  className={`flex items-center gap-2 py-1.5 text-xs font-bold hover:text-rb-macaw-lip ${
                    sectionRead ? "text-rb-feather-ink" : "text-rb-wolf"
                  }`}
                >
                  <TickPop done={sectionRead} className="grid size-5 shrink-0 place-items-center">
                    {sectionRead ? (
                      <Check className="size-3 text-rb-feather" aria-hidden="true" />
                    ) : (
                      <Circle className="size-1.5" aria-hidden="true" />
                    )}
                  </TickPop>
                  <span className="min-w-0 truncate">{section.name}</span>
                </a>
              </li>
            )
          })}

          {item.quiz ? (
            <li>
              <button
                type="button"
                onClick={() => onSelect(item, { scrollTo: `quiz-${item.quiz.examId}` })}
                className="flex w-full items-center gap-2 py-1.5 text-left text-xs font-bold text-rb-beetle-lip hover:underline"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rb-beetle-wash">
                  <CircleHelp className="size-3" aria-hidden="true" />
                </span>
                <span className="min-w-0 truncate">
                  Quick check · {item.quiz.totalQuestions} questions
                </span>
              </button>
            </li>
          ) : null}
        </ul>
      </Collapse>
    </motion.li>
  )
}

function Outline({
  middle,
  major,
  track,
  masteryByLessonId,
  activeId,
  collapsed,
  onCollapse,
  onSelect,
  activeSections,
  readSections,
  isDone,
  isLocked,
}) {
  const [expanded, setExpanded] = useState(() => new Set([track[0]?.id]))

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const lessons = middle.lessons
  const done = lessons.filter((lesson) => isDone(lesson.id)).length
  const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0

  let lessonNumber = 0

  return (
    <div className="flex h-full min-h-0 flex-col bg-rb-snow">

      <div
        className={`flex h-[var(--rb-topbar-h)] shrink-0 items-center border-b-2 border-rb-swan ${
          collapsed ? "justify-center px-2" : "gap-2 px-4"
        }`}
      >
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="rb-eyebrow line-clamp-1" title={`Unit ${major.index} · ${major.name}`}>
              unit {major.index} · {major.name}
            </p>
            <p
              className="mt-0.5 line-clamp-1 font-rb-display text-base font-extrabold leading-snug text-rb-eel"
              title={middle.name}
            >
              {middle.name}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onCollapse}
          aria-label={collapsed ? "Expand outline" : "Collapse outline"}
          title={collapsed ? "Expand outline" : "Collapse outline"}
          className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-rb-swan bg-rb-snow text-rb-wolf transition hover:text-rb-eel"
        >
          <PanelLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      {!collapsed ? (
        <div className="shrink-0 border-b-2 border-rb-swan px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rb-wolf">
              {done} of {lessons.length} lessons
            </span>
            <CountUp value={progress} suffix="%" className="rb-numeric text-xs" />
          </div>
          <ProgressBar value={progress} tone="macaw" label="Topic progress" className="mt-2 !h-3" />
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Topic outline">
        <StaggerList as="ul" stagger={0.045} amount={0}>
          {track.map((item) => {
            if (item.kind === "lesson") lessonNumber += 1

            return (
              <OutlineRow
                key={item.id}
                item={item}
                index={item.kind === "lesson" ? `${lessonNumber}.` : ""}
                active={item.id === activeId}
                collapsed={collapsed}
                expanded={expanded.has(item.id)}
                onSelect={onSelect}
                onToggle={toggle}
                sections={item.id === activeId ? activeSections : []}
                mastery={masteryByLessonId?.get(String(item.id))}
                readSections={readSections}
                done={item.kind === "lesson" && isDone(item.id)}
                locked={Boolean(isLocked?.(item))}
              />
            )
          })}
        </StaggerList>
      </nav>
    </div>
  )
}


function ReadCheck({ done, label, onToggle, pending, disabled = false, size = "size-8" }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={done}
      aria-label={label}
      title={label}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      animate={done ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={
        done ? { duration: 0.42, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0.18 }
      }
      className={`grid ${size} shrink-0 place-items-center rounded-full border-2 transition-colors ${
        done
          ? "border-rb-feather bg-rb-feather text-white"
          : disabled
            ? "cursor-not-allowed border-rb-swan bg-rb-polar text-rb-hare/60"
            : "border-rb-swan bg-rb-snow text-rb-hare hover:border-rb-hare"
      }`}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="size-4" aria-hidden="true" />
      )}
    </motion.button>
  )
}

const MEDIA_KEY = /(Key|Url)$/

function textVolume(value) {
  if (typeof value === "string") return value.length
  if (Array.isArray(value)) return value.reduce((total, item) => total + textVolume(item), 0)

  if (value && typeof value === "object") {
    return Object.entries(value).reduce(
      (total, [key, item]) => (MEDIA_KEY.test(key) ? total : total + textVolume(item)),
      0,
    )
  }

  return 0
}

function sectionTone(section, index) {
  const hasMedia = section.tools.some(
    (tool) =>
      tool.type === "image" || tool.type === "video" || tool.type === "image-hotspot",
  )
  const volume = section.tools.reduce((total, tool) => total + textVolume(tool.data ?? {}), 0)

  if (!hasMedia && volume < 420) return "statement"
  return index % 2 === 0 ? "plain" : "wash"
}



const SECTION_TONE = {
  statement: {
    shell: "bg-rb-feather-lip",
    heading: "text-white",
    eyebrow: "text-white/70",
    rule: "bg-white/30",
    content:
      "[&_h2]:text-white [&_h2]:border-white/50 [&_h2]:bg-white/10 " +
      "[&_h3]:text-white [&_p]:text-white/90 [&_li]:text-white/90 " +
      "[&_strong]:text-white [&_a]:text-white [&_a]:underline " +
      "[&_.text-muted-foreground]:text-white/85 " +
      "[&_[data-marker]]:!bg-white/25 [&_[data-marker]]:!text-white",
  },
  wash: {
    shell: "bg-rb-polar",
    heading: "text-rb-eel",
    eyebrow: "text-rb-macaw-lip",
    rule: "bg-rb-macaw",
    content: "",
  },
  plain: {
    shell: "",
    heading: "text-rb-eel",
    eyebrow: "text-rb-macaw-lip",
    rule: "bg-rb-macaw",
    content: "",
  },
}

function LessonView({
  onOpenOutline,
  backTo,
  lessonItem,
  sections,
  loading,
  position,
  total,
  readSections,
  lessonDone,
  completing,
  onReadSection,
  onToggleSection,
  onReadLesson,
  onToggleLesson,
  onPrev,
  onNext,
  takenExamIds,
  quizPending,
  quizStanding,
  quizLatest,
  quizBest,
}) {
  const articleRef = useRef(null)
  const headerRef = useRef(null)

  const readSectionsRef = useRef(readSections)
  readSectionsRef.current = readSections

  useEffect(() => {
    const header = headerRef.current
    const article = articleRef.current
    if (!header || !article) return undefined

    const observer = new ResizeObserver(() => {
      article.style.setProperty("--lesson-header-h", `${header.offsetHeight}px`)
    })

    observer.observe(header)
    return () => observer.disconnect()
  }, [])


  useEffect(() => {
    const root = articleRef.current
    if (!root || sections.length === 0) return undefined

    function check() {
      const line = window.innerHeight * 0.9

      root.querySelectorAll("[data-read-section]").forEach((node) => {
        if (node.getBoundingClientRect().top < line) {
          onReadSection(node.dataset.readSection)
        }
      })

      const end = root.querySelector("[data-read-lesson]")
      if (!end || end.getBoundingClientRect().top >= line) return

      const read = readSectionsRef.current
      if (sections.every((section) => read.has(section.key))) {
        onReadLesson()
      }
    }

    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)

    return () => {
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [sections, onReadSection, onReadLesson])


  const autoCompletedRef = useRef(false)

  useEffect(() => {
    autoCompletedRef.current = false
  }, [sections])

  useEffect(() => {
    if (autoCompletedRef.current) return
    if (quizPending) return
    const quizTaken = Boolean(lessonItem.quiz)
    if (!quizTaken) {
      if (sections.length === 0) return
      if (!sections.every((section) => readSections.has(section.key))) return
    }

    autoCompletedRef.current = true
    onReadLesson()
  }, [sections, readSections, quizPending, onReadLesson, lessonItem.quiz])

  const prevLessonDoneRef = useRef(lessonDone)
  useEffect(() => {
    if (lessonDone && !prevLessonDoneRef.current) {
      requestAnimationFrame(() => {
        document.getElementById("lesson-complete")?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    }
    prevLessonDoneRef.current = lessonDone
  }, [lessonDone])

  return (
    <article
      ref={articleRef}
      style={{ "--lesson-header-h": "116px" }}
      className="w-full px-4 pb-10 sm:px-6 lg:px-8"
    >
      <div ref={headerRef} className="sticky top-0 z-10 -mx-4 border-b-2 border-rb-swan bg-rb-snow/95 px-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur supports-[backdrop-filter]:bg-rb-snow/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex h-[var(--rb-topbar-h)] items-center justify-between gap-2 sm:gap-4">
          {onOpenOutline ? (
            <button
              type="button"
              onClick={onOpenOutline}
              aria-label="Open topic outline"
              title="Topic outline"
              className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-rb-swan bg-white text-rb-eel transition-transform active:scale-95 xl:hidden"
            >
              <PanelLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="rb-eyebrow">
              lesson {position} of {total}
            </p>

            <h1 className="mt-0.5 truncate font-rb-display text-lg font-extrabold text-rb-eel sm:text-xl">
              {lessonItem.name}
            </h1>
          </div>

          {backTo ? (
            <TactileButton asChild variant="feather" size="sm" className="shrink-0">
              <Link to={backTo} aria-label="Back to curriculum">
                <span className="hidden sm:inline">back to curriculum</span>
                <span className="sm:hidden">curriculum</span>
              </Link>
            </TactileButton>
          ) : null}
        </div>
      </div>

      <div className="w-full">
        {loading ? (
        <div
          className="mx-auto mt-10 w-full max-w-6xl px-5 sm:px-8"
          role="status"
          aria-label="Loading lesson content"
        >
          <SectionStackSkeleton />
        </div>
      ) : sections.length === 0 ? (
        <div className="mx-auto mt-10 w-full max-w-6xl">
          <LearnerEmptyState
            icon={BookOpen}
            title="No lesson content yet"
            description="This lesson exists, but no learner-facing content has been published for it."
          />
        </div>
      ) : (
        <>

          <div className="-mx-4 mt-6 sm:-mx-6 lg:-mx-8">
            {sections.map((section, sectionIndex) => {
              const tone = SECTION_TONE[sectionTone(section, sectionIndex)]

              return (
                <Reveal
                  as="section"
                  key={section.key}
                  id={section.key}
                  amount={0.05}
                  className={`relative flex min-h-[calc(100dvh-var(--lesson-header-h))] snap-start scroll-mt-[var(--lesson-header-h)] flex-col justify-center overflow-hidden px-4 py-14 sm:px-6 lg:px-8 ${tone.shell}`}
                >
                  <div className="relative mx-auto w-full max-w-6xl">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-[0.16em] ${tone.eyebrow}`}
                    >
                      section {sectionIndex + 1} of {sections.length}
                    </p>

                    <h2 className={`mt-2 font-rb-display text-3xl font-extrabold ${tone.heading}`}>
                      {section.name}
                    </h2>

                    <span
                      aria-hidden="true"
                      className={`mt-4 block h-1.5 w-14 rounded-full ${tone.rule}`}
                    />
                  </div>

                  <div className={`relative mx-auto mt-6 w-full max-w-6xl space-y-6 ${tone.content}`}>
                    {section.tools.map((tool, toolIndex) => (
                      <div key={tool.id ?? toolIndex}>
                        <LessonTool tool={tool} index={toolIndex} />
                      </div>
                    ))}
                  </div>

                  <span aria-hidden="true" data-read-section={section.key} className="block h-px" />
                </Reveal>
              )
            })}
          </div>
        </>
      )}
      </div>

      {lessonItem.quiz ? (
        <div className="-mx-4 mt-10 sm:-mx-6 lg:-mx-8">
          <QuizBand
            quiz={lessonItem.quiz}
            taken={Boolean(takenExamIds?.has(String(lessonItem.quiz.examId)))}
            standing={quizStanding}
            latest={quizLatest}
            best={quizBest}
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl">
      <motion.div
        id="lesson-complete"
        aria-live="polite"
        animate={lessonDone ? { scale: [1, 1.015, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className={`mt-12 flex items-center gap-4 rounded-rb-card border-2 p-5 transition-colors ${
          lessonDone ? "border-rb-feather bg-rb-feather-wash" : "border-rb-swan bg-rb-polar"
        }`}
      >
        <ReadCheck
          done={lessonDone}
          pending={completing}
          disabled={!lessonDone && quizPending}
          size="size-11"
          label={
            lessonDone
              ? "Lesson complete"
              : quizPending
                ? "Sit the quick check to complete this lesson"
                : "Mark lesson complete"
          }
          onToggle={onToggleLesson}
        />

        <div className="min-w-0">
          <p className="font-rb-display text-base font-extrabold text-rb-eel">
            {lessonDone
              ? "Lesson complete"
              : completing
                ? "Saving your progress…"
                : quizPending
                  ? "One thing left: the quick check"
                  : "You reached the end of this lesson"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-rb-wolf">
            {lessonDone
              ? "This lesson is ticked off in your outline."
              : quizPending
                ? `Sit the quick check above to finish this lesson and earn its ${LESSON_COMPLETION_XP} XP.`
                : "Completion is saved automatically once you reach the end."}
          </p>
        </div>
      </motion.div>

      <span aria-hidden="true" data-read-lesson="true" className="block h-px" />

      <div className="mt-12 flex flex-col gap-3 border-t-2 border-rb-swan pt-6 sm:flex-row sm:items-center sm:justify-between">
        <TactileButton variant="ghost" size="sm" onClick={onPrev} disabled={!onPrev}>
          <ArrowLeft className="size-4" />
          previous
        </TactileButton>

        <TactileButton variant="macaw" size="sm" onClick={onNext} disabled={!onNext}>
          next
          <ArrowRight className="size-4" />
        </TactileButton>
      </div>
      </div>
    </article>
  )
}

function StandingBand({ standing, latest, best, goal }) {
  const shown = best ?? latest
  if (!shown && !(standing?.taken && !standing.cleared)) return null

  const cleared =
    shown == null
      ? false
      : shown.rating != null
        ? shown.rating >= PROFICIENT_RATING
        : shown.passed

  const retakeToShow =
    latest && best && latest.attemptNo !== best.attemptNo ? latest : null

  return (
    <>
      {shown ? (
        <div
          className={cn(
            "mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-rb-control border-2 px-3 py-2",
            cleared
              ? "border-rb-feather/50 bg-rb-feather-wash"
              : "border-rb-fox/40 bg-rb-fox-wash",
          )}
        >
          <span className="text-xs font-bold uppercase tracking-wide text-rb-wolf">
            {retakeToShow ? "Your best attempt" : "Your last attempt"}
          </span>
          <span className="text-sm font-extrabold text-rb-eel">
            {shown.rating != null
              ? `proficiency ${Math.round(shown.rating)} / 100${shown.label ? ` · ${shown.label}` : ""}`
              : `${Math.round(shown.score ?? 0)}%`}
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              cleared ? "text-rb-feather-lip" : "text-rb-fox-lip",
            )}
          >
            {shown.rating != null
              ? cleared
                ? "cleared"
                : `reach ${PROFICIENT_RATING} to complete`
              : shown.passed
                ? "passed"
                : "not passed"}
          </span>
          {shown.rating != null && shown.score != null ? (
            <span className="text-xs font-semibold text-rb-wolf">
              {Math.round(shown.score)}% of the items served
            </span>
          ) : null}

          {retakeToShow ? (
            <span className="w-full text-xs font-semibold text-rb-wolf">
              Latest retake:{" "}
              {retakeToShow.rating != null
                ? `proficiency ${Math.round(retakeToShow.rating)}`
                : `${Math.round(retakeToShow.score ?? 0)}%`}
              {" — your best stands, and the road stays open."}
            </span>
          ) : null}
        </div>
      ) : null}

      {standing?.taken && !standing.cleared ? (
        <p className="mt-3 rounded-rb-control border-2 border-rb-fox/40 bg-rb-fox-wash px-3 py-2 text-sm font-bold text-rb-eel">
          {standing.reason.charAt(0).toUpperCase() + standing.reason.slice(1)}.
          Retake it to {goal}.
        </p>
      ) : null}
    </>
  )
}

function QuizBand({ quiz, taken, standing, latest, best }) {
  const location = useLocation()
  return (
    <section id={`quiz-${quiz.examId}`} data-no-snip className="scroll-mt-8 bg-rb-bee px-5 py-12 sm:px-10 lg:px-14">
      <div className="w-full">
        <Reveal amount={0.2}>
          <p className="font-rb-display text-2xl font-extrabold text-white">Test your skills</p>
          <p className="mt-1 text-sm font-bold text-white/80">
            {quiz.title} · {quiz.totalQuestions} questions
          </p>
        </Reveal>

        <Reveal
          variants={popIn}
          amount={0.2}
          className="mt-6 rounded-rb-card border-2 border-rb-swan bg-rb-snow p-6 sm:p-8"
        >
          <p className="rb-body">
            {quiz.description ??
              "A short check on what this lesson covered. Answer it while the lesson is fresh — it is scored, and you can retake it."}
          </p>

          <StandingBand
            standing={standing}
            latest={latest}
            best={best}
            goal="complete this lesson"
          />

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [CircleHelp, `${quiz.totalQuestions} questions`],
              [CheckCircle2, `proficiency ${PROFICIENT_RATING} to complete`],
              [Clock, quiz.durationMinutes ? `${quiz.durationMinutes} minutes` : "Self-paced"],
              [Zap, `up to ${ASSESSMENT_MAX_XP} XP`],
            ].map(([Icon, label]) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-rb-card border-2 border-rb-swan bg-rb-polar p-4"
              >
                <Icon className="size-5 shrink-0 text-rb-beetle-lip" aria-hidden="true" />
                <span className="text-sm font-bold text-rb-eel">{label}</span>
              </li>
            ))}
          </ul>


          <div className="mt-8 flex flex-col items-center gap-3">
            <TactileButton asChild variant="macaw">
              <Link
                to={`/learner/assessments/${quiz.examId}`}
                state={returnState(location)}
              >
                {taken ? "retake quiz" : "start quiz"}
                <ArrowRight className="size-4" />
              </Link>
            </TactileButton>

            {taken ? (
              <Link
                to={`/learner/assessments/${quiz.examId}/history`}
                className="text-sm font-bold text-rb-macaw-lip underline decoration-dotted underline-offset-4 hover:text-rb-macaw"
              >
                view past attempts
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function AssessmentView({
  exam,
  position,
  total,
  backTo,
  taken,
  standing,
  latest,
  best,
  onOpenOutline,
}) {
  const location = useLocation()

  return (
    <div className="w-full pb-10">
      <div className="sticky top-0 z-10 border-b-2 border-rb-swan bg-rb-snow/95 px-5 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur supports-[backdrop-filter]:bg-rb-snow/80 sm:px-10 lg:px-14">
        <div className="flex h-[var(--rb-topbar-h)] items-center justify-between gap-2 sm:gap-4">
          {onOpenOutline ? (
            <button
              type="button"
              onClick={onOpenOutline}
              aria-label="Open topic outline"
              title="Topic outline"
              className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-rb-swan bg-white text-rb-eel transition-transform active:scale-95 xl:hidden"
            >
              <PanelLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="rb-eyebrow">
              lesson {position} of {total}
            </p>

            <h1 className="mt-0.5 truncate font-rb-display text-lg font-extrabold text-rb-eel sm:text-xl">
              {exam.title}
            </h1>
          </div>

          {backTo ? (
            <TactileButton asChild variant="feather" size="sm" className="shrink-0">
              <Link to={backTo} aria-label="Back to curriculum">
                <span className="hidden sm:inline">back to curriculum</span>
                <span className="sm:hidden">curriculum</span>
              </Link>
            </TactileButton>
          ) : null}
        </div>

      </div>

      <div className="px-5 py-16 sm:px-10 lg:px-14">
      <Reveal
        variants={popIn}
        amount={0}
        className="mx-auto w-full max-w-6xl rounded-rb-card border-2 border-rb-swan bg-rb-snow p-8 shadow-[var(--comic-shadow-sm)] sm:p-12"
      >
        <p className="rb-display rb-display-sm">assessment</p>

        <motion.span
          className="mt-5 block h-1.5 rounded-full bg-rb-fox"
          initial={{ width: 0 }}
          animate={{ width: "6rem" }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />

        <p className="rb-body-lg mt-7">
          This assessment measures your level across the whole topic. Reach proficiency{" "}
          {PROFICIENT_RATING} to pass it — you have unlimited chances, and your best sitting is
          the one that counts. Good luck!
        </p>

        <StandingBand standing={standing} latest={latest} best={best} goal="pass this assessment" />

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            [ClipboardCheck, `${exam.totalQuestions} questions`],
            [CheckCircle2, `proficiency ${PROFICIENT_RATING} to pass`],
            [Clock, exam.durationMinutes ? `${exam.durationMinutes} minutes` : "Unlimited attempts"],
          ].map(([Icon, label]) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-rb-card border-2 border-rb-swan bg-rb-polar p-4"
            >
              <Icon className="size-5 shrink-0 text-rb-fox-lip" aria-hidden="true" />
              <span className="text-sm font-bold text-rb-eel">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <TactileButton asChild variant="fox" className="w-fit">
            <Link
              to={`/learner/assessments/${exam.examId}`}
              state={returnState(location)}
            >
              {taken ? "retake exam" : "start exam"}
              <ArrowRight className="size-4" />
            </Link>
          </TactileButton>

          {taken ? (
            <Link
              to={`/learner/assessments/${exam.examId}/history`}
              className="text-sm font-bold text-rb-fox-lip underline decoration-dotted underline-offset-4 hover:text-rb-fox"
            >
              view past attempts
            </Link>
          ) : null}
        </div>
      </Reveal>
      </div>
    </div>
  )
}


export default function LearnerTopicPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useEffect(() => {
    prefetchRewards(queryClient).catch(() => {})
  }, [queryClient])
  const { certificationId, middleCategoryId } = useParams()
  const { data } = useOutletContext()
  const isXl = useIsXl()

  const [searchParams] = useSearchParams()
  const [activeId, setActiveId] = useState(null)
  const [outlineCollapsed, setOutlineCollapsed] = useState(false)
  const [tutorOpen, setTutorOpen] = useState(false)
  const readingRef = useRef(null)
  const [snipping, setSnipping] = useState(false)
  const [tutorSnippet, setTutorSnippet] = useState(null)
  const askTutorAbout = useCallback((snippet) => {
    setSnipping(false)
    setTutorSnippet(snippet)
    setTutorOpen(true)
  }, [])
  const [railOpen, setRailOpen] = useState(false)
  const [readSections, setReadSections] = useState(() => new Set())
  const [locallyDone, setLocallyDone] = useState(() => new Set())

  const certification = (data?.enrolledCertifications ?? []).find(
    (item) => String(item.certificationId) === String(certificationId),
  )


  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["learner-portal-data"] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const examsQuery = useQuery({ queryKey: ["exams"], queryFn: () => getExams(), staleTime: 60_000 })
  const examTypesQuery = useQuery({
    queryKey: ["exam-types"],
    queryFn: getExamTypes,
    staleTime: 5 * 60_000,
  })

  const examTypesById = useMemo(
    () =>
      new Map(
        (examTypesQuery.data ?? []).map((type) => [
          String(type.examTypeId),
          String(type.examTypeText ?? "").toUpperCase(),
        ]),
      ),
    [examTypesQuery.data],
  )

  const lessonById = useMemo(
    () => new Map((data?.lessons ?? []).map((lesson) => [String(lesson.lessonId), lesson])),
    [data?.lessons],
  )

  const takenExamIds = useMemo(
    () =>
      new Set(
        (data?.examResults ?? [])
          .map((result) => (result.examId == null ? null : String(result.examId)))
          .filter(Boolean),
      ),
    [data?.examResults],
  )

  const masteryQuery = useQuery({
    queryKey: ["learner-progress-analytics", certificationId],
    queryFn: () => getProgressAnalytics(certificationId),
    enabled: Boolean(certificationId),
    staleTime: 30_000,
  })

  const lessonPriorityById = useMemo(() => {
    const map = new Map()
    for (const topic of masteryQuery.data?.lessonPriorities ?? []) {
      if (topic.lessonId != null) map.set(String(topic.lessonId), topic.priorityTag)
    }
    return map
  }, [masteryQuery.data])

  const lessonMasteryById = useMemo(() => {
    const map = new Map()
    for (const topic of masteryQuery.data?.lessonPriorities ?? []) {
      if (topic.lessonId != null && topic.masteryProbability != null) {
        map.set(String(topic.lessonId), topic.masteryProbability)
      }
    }
    return map
  }, [masteryQuery.data])

  const curriculum = useMemo(() => {
    if (!certification) return null
    return buildCurriculum({
      certification,
      lessonById,
      exams: (examsQuery.data ?? []).filter(
        (exam) => String(exam.certificationId) === String(certificationId),
      ),
      examTypesById,
      lessonPriorityById,
      examResults: data?.examResults ?? [],
    })
  }, [certification, lessonById, examsQuery.data, certificationId, examTypesById, lessonPriorityById, data?.examResults])

  const { major, middle } = useMemo(
    () => (curriculum ? findMiddle(curriculum, middleCategoryId) : { major: null, middle: null }),
    [curriculum, middleCategoryId],
  )

  const track = useMemo(() => (middle ? buildTrack(middle) : []), [middle])


  useEffect(() => {
    if (activeId || track.length === 0) return

    const requestedLessonId = searchParams.get("lesson")
    const requested = requestedLessonId
      ? track.find(
          (item) => item.kind === "lesson" && String(item.id) === String(requestedLessonId),
        )
      : null

    const next =
      requested ??
      track.find((item) => item.kind === "lesson" && !item.completed) ??
      track[0]

    setActiveId(next.id)
  }, [track, activeId, searchParams])

  const activeIndex = Math.max(
    0,
    track.findIndex((item) => item.id === activeId),
  )
  const active = track[activeIndex] ?? track[0]
  const prev = track[activeIndex - 1]
  const next = track[activeIndex + 1]

  const activeLessonId = active?.kind === "lesson" ? active.id : null

  const lessonQuery = useQuery({
    queryKey: ["learner-lesson", activeLessonId],
    queryFn: () => getLessonById(activeLessonId),
    enabled: Boolean(activeLessonId),
  })

  const sections = useMemo(
    () => readSectionsOf(lessonQuery.data?.lessonComponentStructure),
    [lessonQuery.data?.lessonComponentStructure],
  )

  const readSectionsQuery = useQuery({
    queryKey: ["learner-read-sections", activeLessonId],
    queryFn: () => getReadSections(activeLessonId),
    enabled: Boolean(activeLessonId) && Boolean(data?.learnerId),
  })

  const persistedReadRef = useRef(new Set())

  function lockedBy(item) {
    // Lessons are never gated: mastery tags show which ones need work, so learners can open any lesson.
    if (item.kind !== "assessment") return null
    const position = track.findIndex((entry) => entry.id === item.id)
    if (position <= 0) return null
    return track.find((entry) => entry.kind === "lesson" && !isDone(entry.id)) ?? null
  }

  function explainLock(item) {
    const gate = lockedBy(item)
    if (!gate) return false
    const quiz = gate.quiz ? examStanding(data?.examResults, gate.quiz.examId) : null
    const why = quiz && quiz.taken && !quiz.cleared ? ` Its quiz: ${quiz.reason}.` : ""
    toast.warning(`${gate.name} comes first.${why}`)
    return true
  }

  const isDone = useCallback(
    (lessonId) => {
      const read =
        locallyDone.has(lessonId) ||
        wasLessonCompletedThisSession(lessonId) ||
        Boolean(lessonById.get(lessonId)?.completed)
      if (!read) return false
      const quiz = track.find((entry) => entry.id === lessonId)?.quiz
      if (!quiz) return true
      return examStanding(data?.examResults, quiz.examId).cleared
    },
    [locallyDone, lessonById, track, data?.examResults],
  )

  const readAtRef = useRef(new Map())

  const knowledgeCheck = useSkimChallenge({
    learnerId: data?.learnerId,
    lessonId: activeLessonId,
    enabled: Boolean(data?.learnerId),
  })

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (new URLSearchParams(location.search).get("skim") === "1" && data?.learnerId && activeLessonId) {
      knowledgeCheck.trigger({ force: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, data?.learnerId, activeLessonId])

  const lessonFinished = activeLessonId ? isDone(activeLessonId) : false
  const paceGuard = useReadingPaceGuard({
    enabled:
      Boolean(activeLessonId) &&
      sections.length > 0 &&
      !lessonFinished &&
      !knowledgeCheck.offer,
    onRush: (since) => {
      const rushed = [...readAtRef.current]
        .filter(([, at]) => at >= since)
        .map(([key]) => key)
      if (rushed.length > 0) {
        setReadSections((current) => {
          const nextSet = new Set(current)
          rushed.forEach((key) => nextSet.delete(key))
          return nextSet
        })
        rushed.forEach((key) => {
          persistedReadRef.current.delete(key)
          readAtRef.current.delete(key)
          if (activeLessonId) markSectionUnread(activeLessonId, key).catch(() => {})
        })
      }
      knowledgeCheck.trigger()
    },
  })

  const completeMutation = useMutation({
    mutationFn: (lessonId) =>
      markLessonComplete({
        learnerId: data?.learnerId,
        lessonId: Number(lessonId),
        completedAt: new Date().toISOString().slice(0, 19),
      }),
    onMutate: (lessonId) => {
      rememberLessonCompleted(lessonId)
      setLocallyDone((current) => new Set(current).add(lessonId))
      knowledgeCheck.clearStrikes()
      return snapshotRewards(queryClient)
    },
    onSuccess: async (_result, lessonId, before) => {
      await announceRewards({
        queryClient,
        before,
        title: "Lesson complete",
        fallback: "You had already earned the XP for this lesson.",
      })
      await queryClient.invalidateQueries({ queryKey: ["learner-streak"] })
    },
    onError: (error, lessonId) => {
      forgetLessonCompleted(lessonId)
      setLocallyDone((current) => {
        const next = new Set(current)
        next.delete(lessonId)
        return next
      })
      toast.error("Could not mark lesson complete", {
        description: error?.response?.data?.message ?? error?.message ?? "Please try again.",
      })
    },
  })

  const readSection = useCallback(
    (key) => {
      if (paceGuard.isRushing()) return

      setReadSections((current) => (current.has(key) ? current : new Set(current).add(key)))

      if (!activeLessonId || persistedReadRef.current.has(key)) return
      readAtRef.current.set(key, performance.now())
      persistedReadRef.current.add(key)
      markSectionRead(activeLessonId, key).catch(() => {
        persistedReadRef.current.delete(key)
      })
    },
    [activeLessonId, paceGuard.isRushing],
  )

  const toggleSection = useCallback(
    (key) => {
      const willBeRead = !readSections.has(key)

      setReadSections((current) => {
        const nextSet = new Set(current)
        if (nextSet.has(key)) nextSet.delete(key)
        else nextSet.add(key)
        return nextSet
      })

      if (!activeLessonId) return

      if (willBeRead) {
        persistedReadRef.current.add(key)
        markSectionRead(activeLessonId, key).catch(() => {
          persistedReadRef.current.delete(key)
        })
      } else {
        persistedReadRef.current.delete(key)
        markSectionUnread(activeLessonId, key).catch(() => {
          persistedReadRef.current.add(key)
        })
      }
    },
    [activeLessonId, readSections],
  )


  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.scrollSnapType
    root.style.scrollSnapType = "y proximity"

    return () => {
      root.style.scrollSnapType = previous
    }
  }, [])

  const alreadyDone = activeLessonId ? isDone(activeLessonId) : false
  const completing = completeMutation.isPending

  const activeQuiz = active?.kind === "lesson" ? active.quiz : null
  const quizStanding = activeQuiz ? examStanding(data?.examResults, activeQuiz.examId) : null
  const quizLatest = activeQuiz ? latestSitting(data?.examResults, activeQuiz.examId) : null
  const quizBest = activeQuiz ? bestSitting(data?.examResults, activeQuiz.examId) : null
  const quizPending = Boolean(activeQuiz) && !quizStanding?.cleared

  const readLesson = useCallback(() => {
    if (!activeLessonId || alreadyDone || completing || quizPending || !data?.learnerId) return
    if (wasLessonCompletedThisSession(activeLessonId)) return
    completeMutation.mutate(activeLessonId)
  }, [activeLessonId, alreadyDone, completing, quizPending, data?.learnerId, completeMutation])

  useEffect(() => {
    const saved = new Set(readSectionsQuery.data ?? [])
    readAtRef.current = new Map()
    persistedReadRef.current = saved
    setReadSections(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId, readSectionsQuery.data])

  if (!certification) {
    return (
      <LearnerEmptyState
        icon={BookOpen}
        title="Certification not found"
        description="You are not enrolled in this certification, or it is no longer published."
        action={
          <TactileButton variant="macaw" size="sm" onClick={() => navigate("/learner/learning")}>
            Back to my learning
          </TactileButton>
        }
      />
    )
  }

  if (examsQuery.isLoading || examTypesQuery.isLoading || !curriculum) {
    return <TopicPageSkeleton />
  }

  if (!middle || !major) {
    return (
      <LearnerEmptyState
        icon={BookOpen}
        title="Topic not found"
        description="This topic is not part of the certification you are enrolled in."
        action={
          <TactileButton
            variant="macaw"
            size="sm"
            onClick={() => navigate(`/learner/learning/${certificationId}`)}
          >
            Back to curriculum
          </TactileButton>
        }
      />
    )
  }

  const backTo = `/learner/learning/${certificationId}`

  if (track.length === 0) {
    return (
      <LearnerEmptyState
        icon={BookOpen}
        title="No lessons in this topic yet"
        description="Nothing has been published under this topic. Check back once content is released."
        action={
          <TactileButton variant="macaw" size="sm" onClick={() => navigate(backTo)}>
            Back to curriculum
          </TactileButton>
        }
      />
    )
  }

  const tutorVisible = tutorOpen && active?.kind === "lesson"

  const columns = outlineCollapsed
    ? tutorVisible
      ? "xl:grid-cols-[88px_minmax(0,1fr)_400px]"
      : "xl:grid-cols-[88px_minmax(0,1fr)]"
    : tutorVisible
      ? "xl:grid-cols-[340px_minmax(0,1fr)_400px]"
      : "xl:grid-cols-[340px_minmax(0,1fr)]"

  const outline = (
    <Outline
      middle={middle}
      major={major}
      track={track}
      masteryByLessonId={lessonMasteryById}
      activeId={active?.id}
      collapsed={outlineCollapsed}
      onCollapse={() => setOutlineCollapsed((value) => !value)}
      onSelect={(item, options) => {
        if (explainLock(item)) return
        setActiveId(item.id)
        setRailOpen(false)
        if (!options?.scrollTo) {
          window.scrollTo({ top: 0 })
          return
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const target = document.getElementById(options.scrollTo)
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
            else window.scrollTo({ top: 0 })
          })
        })
      }}
      activeSections={sections}
      readSections={readSections}
      isDone={isDone}
      isLocked={(item) => lockedBy(item) != null}
    />
  )

  return (
    <div className="rebyu-ds min-h-dvh w-full bg-rb-polar" style={{ "--rb-topbar-h": "72px" }}>
      <div className={`grid min-h-dvh ${columns}`}>
        <aside className="hidden min-h-0 border-r-2 border-rb-swan xl:block">
          <div className="sticky top-0 h-dvh">{outline}</div>
        </aside>

        <main ref={readingRef} className="min-w-0 bg-rb-snow">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
          {active?.kind === "lesson" ? (
            <LessonView
              key={active.id}
              lessonItem={active}
              backTo={backTo}
              sections={sections}
              loading={lessonQuery.isLoading}
              position={activeIndex + 1}
              total={track.length}
              readSections={readSections}
              lessonDone={alreadyDone}
              completing={completing}
              onReadSection={readSection}
              onToggleSection={toggleSection}
              onReadLesson={readLesson}
              onToggleLesson={readLesson}
              takenExamIds={takenExamIds}
              quizPending={quizPending}
              quizStanding={quizStanding}
              quizLatest={quizLatest}
              quizBest={quizBest}
              onPrev={
                prev
                  ? () => {
                      setActiveId(prev.id)
                      window.scrollTo({ top: 0 })
                    }
                  : undefined
              }
              onNext={
                next
                  ? () => {
                      if (explainLock(next)) return
                      setActiveId(next.id)
                      window.scrollTo({ top: 0 })
                    }
                  : undefined
              }
              onOpenOutline={() => setRailOpen(true)}
            />
          ) : (
            <AssessmentView
              exam={active.exam}
              position={activeIndex + 1}
              total={track.length}
              backTo={backTo}
              onOpenOutline={() => setRailOpen(true)}
              taken={Boolean(takenExamIds.has(String(active.exam.examId)))}
              standing={examStanding(data?.examResults, active.exam.examId)}
              latest={latestSitting(data?.examResults, active.exam.examId)}
              best={bestSitting(data?.examResults, active.exam.examId)}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </main>

        {tutorVisible && isXl ? (
          <aside className="hidden min-h-0 border-l-2 border-rb-swan xl:block">
            <div className="sticky top-0 h-dvh overflow-hidden">
              <LessonAiTutor
                lessonId={activeLessonId}
                lessonName={active?.name}
                learnerName={data?.user?.firstName ?? data?.learner?.firstName ?? "Learner"}
                learnerId={data?.learnerId}
                onClose={() => setTutorOpen(false)}
                pendingSnippet={tutorSnippet}
                onSnippetTaken={() => setTutorSnippet(null)}
                onStartSnip={() => setSnipping(true)}
              />
            </div>
          </aside>
        ) : null}
      </div>



      {createPortal(
        <AnimatePresence>
          {!tutorVisible && !railOpen && active?.kind === "lesson" ? (
            <motion.button
              type="button"
              onClick={() => setTutorOpen(true)}
              aria-label="Open AI tutor"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 480, damping: 22 }}
              className="fixed bottom-6 right-6 z-[60] grid size-16 place-items-center rounded-full bg-rb-feather text-white shadow-[var(--comic-shadow-sm)]"
            >
              <Sparkles className="size-7" aria-hidden="true" />
            </motion.button>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="left" className="rebyu-ds p-0">
          <SheetTitle className="sr-only">Topic outline</SheetTitle>
          {outline}
        </SheetContent>
      </Sheet>

      <Sheet open={tutorVisible && !isXl} onOpenChange={(open) => !open && setTutorOpen(false)}>
        <SheetContent side="right" className="rebyu-ds gap-0 p-0">
          <SheetTitle className="sr-only">AI tutor</SheetTitle>
          <LessonAiTutor
            lessonId={activeLessonId}
            lessonName={active?.name}
            learnerName={data?.user?.firstName ?? data?.learner?.firstName ?? "Learner"}
            learnerId={data?.learnerId}
            onClose={() => setTutorOpen(false)}
            pendingSnippet={tutorSnippet}
            onSnippetTaken={() => setTutorSnippet(null)}
            onStartSnip={() => setSnipping(true)}
          />
        </SheetContent>
      </Sheet>

      {active?.kind === "lesson" && !knowledgeCheck.offer ? (
        <>
          <SelectionAskButton target={readingRef} onAsk={askTutorAbout} />
          {snipping ? (
            <LessonSnipOverlay
              target={readingRef}
              onCapture={askTutorAbout}
              onCancel={() => setSnipping(false)}
            />
          ) : null}
          {createPortal(
            !tutorVisible && !railOpen && !snipping ? (
              <button
                type="button"
                onClick={() => setSnipping(true)}
                aria-label="Snip part of the lesson to ask the AI tutor"
                title="Snip part of the lesson to ask the AI tutor"
                className="fixed bottom-[6.5rem] right-[1.875rem] z-[60] grid size-11 place-items-center rounded-full border-2 border-rb-swan bg-rb-snow text-rb-feather-lip shadow-[var(--comic-shadow-sm)] transition-transform hover:scale-105"
              >
                <Crop className="size-5" aria-hidden="true" />
              </button>
            ) : null,
            document.body,
          )}
        </>
      ) : null}

      <LessonKnowledgeCheck
        open={Boolean(knowledgeCheck.offer)}
        lessonId={activeLessonId}
        learnerId={data?.learnerId}
        itemCount={knowledgeCheck.offer?.itemCount}
        lessonNames={knowledgeCheck.offer?.lessonNames}
        currentLessonOnly={knowledgeCheck.offer?.currentLessonOnly}
        attempt={knowledgeCheck.offer?.attempt ?? null}
        answerKey={knowledgeCheck.offer?.answerKey ?? []}
        onDismiss={knowledgeCheck.dismiss}
        onReadAgain={() => {
          paceGuard.pause?.(2000)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
      />
    </div>
  )
}
