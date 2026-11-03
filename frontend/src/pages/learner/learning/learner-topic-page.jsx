import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  Trophy,
  ListChecks,
  FileText,
  GraduationCap,
  Pencil,
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
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
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
import { LiveTutor } from "@/components/learner/live-tutor.jsx"
import { LessonSnipOverlay, SelectionAskButton } from "@/components/learner/lesson-snip.jsx"
import { LessonKnowledgeCheck } from "@/components/learner/lesson-knowledge-check.jsx"
import { useSkimChallenge } from "@/hooks/useSkimChallenge.js"
import { useReadingPaceGuard } from "@/hooks/useReadingPaceGuard.js"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
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
import { getTopicReflection } from "@/services/reflectionService.js"
import { ReflectionIcon, TopicReflectionView } from "@/components/learner/topic-reflection.jsx"
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

// The tutor panel starts at this width on every visit; dragging the handle is not remembered.
const TUTOR_DEFAULT_WIDTH = "400px"
const TUTOR_MIN_WIDTH = "340px"
const TUTOR_MAX_WIDTH = "60%"
// The old drag handle saved the width here; nothing reads it any more.
try {
  window.localStorage.removeItem("rebyu:tutor-width")
} catch {
  /* storage unavailable */
}

function buildTrack(middle) {
  const track = middle.lessons.map((lesson) => ({ ...lesson, kind: "lesson" }))

  if (middle.assessment) {
    track.push({
      kind: "reflection",
      id: `reflection-${middle.id}`,
      middleId: middle.id,
      name: "Reflection",
    })
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


const ROW_ICON = { lesson: FileText, assessment: GraduationCap, reflection: Pencil }

const ROW_META = {
  lesson: (item) => (item.quiz ? "Lesson · quick check" : "Lesson"),
  reflection: () => "Practice · AI-graded",
  assessment: (item) => `Unit exam · ${item.exam.totalQuestions} questions`,
}

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
  const hasChildren = item.kind === "lesson"

  return (
    <motion.li variants={fadeUp}>
      <div
        className={`relative flex items-center gap-1 transition-colors ${
          active ? "bg-[var(--tg-softer)]" : "hover:bg-[var(--tg-softer)]"
        }`}
      >
        {active ? (
          <motion.span
            layoutId="rail-active"
            className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[var(--tg)]"
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
            className={`grid size-7 shrink-0 place-items-center rounded-lg border text-[11px] font-bold tabular-nums transition-colors ${
              done
                ? "border-transparent bg-[var(--tg)] text-white"
                : active
                  ? "border-[var(--tg)] bg-card text-[var(--tg-ink)]"
                  : locked
                    ? "border-[var(--tg-line)] bg-muted text-muted-foreground"
                    : "border-[var(--tg-line)] bg-card text-muted-foreground"
            }`}
          >
            {done ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : locked ? (
              <Lock className="size-3.5" aria-hidden="true" />
            ) : item.kind === "lesson" && index ? (
              <span aria-hidden="true">{String(index).replace(".", "")}</span>
            ) : (
              <Icon className="size-3.5" aria-hidden="true" />
            )}
          </TickPop>

          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span
                className={`line-clamp-2 text-[13px] leading-snug ${
                  active ? "font-bold text-[var(--tg-ink)]" : locked ? "font-semibold text-muted-foreground" : "font-semibold text-foreground"
                }`}
                title={item.name}
              >
                {item.name}
              </span>
              <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-rb-wolf">
                {item.kind !== "lesson" ? <Icon className="size-3 shrink-0" aria-hidden="true" /> : null}
                {(ROW_META[item.kind] ?? ROW_META.lesson)(item)}
                {done ? <span className="text-[var(--tg-ink)]">· done</span> : null}
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
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-[var(--tg-soft)] hover:text-[var(--tg-ink)]"
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
        <ul className="bg-[var(--tg-softer)] py-1 pl-[3.25rem] pr-3">
          {!active ? (
            <li>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-2 py-1.5 text-left text-xs font-semibold text-rb-wolf hover:text-[var(--tg-ink)]"
              >
                <span className="grid size-5 shrink-0 place-items-center">
                  <FileText className="size-3" aria-hidden="true" />
                </span>
                <span className="min-w-0 truncate">Open lesson to see its sections</span>
              </button>
            </li>
          ) : null}
          {sections.map((section) => {
            const sectionRead = readSections.has(section.key)

            return (
              <li key={section.key}>
                <a
                  href={`#${section.key}`}
                  className={`flex items-center gap-2 py-1.5 text-xs font-semibold hover:text-[var(--tg-ink)] ${
                    sectionRead ? "text-[var(--tg-ink)]" : "text-muted-foreground"
                  }`}
                >
                  <TickPop done={sectionRead} className="grid size-5 shrink-0 place-items-center">
                    {sectionRead ? (
                      <Check className="size-3 text-[var(--tg)]" aria-hidden="true" />
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
                className="flex w-full items-center gap-2 py-1.5 text-left text-xs font-semibold text-rb-wolf hover:text-[var(--tg-ink)]"
              >
                <span className="grid size-5 shrink-0 place-items-center">
                  <ListChecks className="size-3" aria-hidden="true" />
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
  reflectionPassed,
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
    <div className="tg-cat-explain flex h-full min-h-0 flex-col bg-card">

      <div
        className={`flex h-[var(--rb-topbar-h)] shrink-0 items-center border-b border-[var(--tg-line)] ${
          collapsed ? "justify-center px-2" : "gap-2 px-4"
        }`}
      >
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="tg-kicker line-clamp-1" title={`Unit ${major.index} · ${major.name}`}>
              unit {major.index} · {major.name}
            </p>
            <p
              className="mt-0.5 line-clamp-1 font-rb-display text-base font-extrabold leading-snug text-foreground"
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
          className="tg-btn tg-icon-btn !size-9 shrink-0"
        >
          <PanelLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      {!collapsed ? (
        <div className="shrink-0 border-b border-[var(--tg-line)] px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {done} of {lessons.length} lessons
            </span>
            <CountUp value={progress} suffix="%" className="rb-numeric text-xs" />
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--tg-soft)]" role="progressbar" aria-label="Topic progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full tg-solid-soft transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Topic outline">
        <StaggerList as="ul" stagger={0.045} amount={0}>
          {track.map((item) => {
            if (item.kind === "lesson") lessonNumber += 1
            const firstAfterLessons =
              item.kind !== "lesson" && track[track.indexOf(item) - 1]?.kind === "lesson"

            return (
              <Fragment key={item.id}>
              {firstAfterLessons && !collapsed ? (
                <li className="tg-kicker px-4 pb-1 pt-4 !text-[10px]">
                  Finish the topic
                </li>
              ) : null}
              <OutlineRow
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
                done={item.kind === "lesson" ? isDone(item.id) : item.kind === "reflection" && Boolean(reflectionPassed)}
                locked={Boolean(isLocked?.(item))}
              />
              </Fragment>
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
          ? "border-[var(--tg)] bg-[var(--tg)] text-white"
          : disabled
            ? "cursor-not-allowed border-[var(--tg-line)] bg-muted text-muted-foreground/60"
            : "border-[var(--tg-line)] bg-card text-muted-foreground hover:border-[var(--tg)]"
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
    shell: "tg-solid",
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
    shell: "bg-[var(--tg-softer)]",
    heading: "text-foreground",
    eyebrow: "text-[var(--tg-ink)]",
    rule: "bg-[var(--tg)]",
    content: "",
  },
  plain: {
    shell: "",
    heading: "text-foreground",
    eyebrow: "text-[var(--tg-ink)]",
    rule: "bg-[var(--tg)]",
    content: "",
  },
}

function LessonView({
  onOpenOutline,
  outlineHidden,
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
      // No right-click menu on lesson content (a deterrent against casual copying;
      // selecting text still works, the tutor's "ask about this" relies on it).
      onContextMenu={(event) => event.preventDefault()}
      style={{ "--lesson-header-h": "116px" }}
      className="tg-cat-explain w-full px-4 pb-10 sm:px-6 lg:px-8"
    >
      <div ref={headerRef} data-snip-chrome className="sticky top-0 z-10 -mx-4 border-b border-[var(--tg-line)] bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex h-[var(--rb-topbar-h)] items-center justify-between gap-2 sm:gap-4">
          {onOpenOutline ? (
            <button
              type="button"
              onClick={onOpenOutline}
              aria-label="Open topic outline"
              title="Topic outline"
              className={`tg-btn tg-icon-btn shrink-0 ${outlineHidden ? "" : "xl:!hidden"}`}
            >
              <PanelLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="tg-kicker">
              Lesson {position} of {total}
            </p>

            <h1 className="mt-0.5 truncate font-rb-display text-lg font-extrabold text-foreground sm:text-xl">
              {lessonItem.name}
            </h1>
          </div>

          {backTo ? (
            <Link to={backTo} aria-label="Back to curriculum" className="tg-btn shrink-0">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to curriculum</span>
              <span className="sm:hidden">Curriculum</span>
            </Link>
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
                  data-live-section-id={section.key}
                  data-live-title={section.name}
                  data-snip-area
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
        className={`mt-12 flex items-center gap-4 rounded-2xl border p-5 transition-colors ${
          lessonDone ? "border-[var(--tg)] bg-[var(--tg-softer)]" : "border-[var(--tg-line)] bg-card"
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
          <p className="text-base font-bold text-foreground">
            {lessonDone
              ? "Lesson complete"
              : completing
                ? "Saving your progress…"
                : quizPending
                  ? "One thing left: the quick check"
                  : "You reached the end of this lesson"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {lessonDone
              ? "This lesson is ticked off in your outline."
              : quizPending
                ? `Sit the quick check above to finish this lesson and earn its ${LESSON_COMPLETION_XP} XP.`
                : "Completion is saved automatically once you reach the end."}
          </p>
        </div>
      </motion.div>

      <span aria-hidden="true" data-read-lesson="true" className="block h-px" />

      <div className="mt-12 flex flex-col gap-3 border-t border-[var(--tg-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="tg-btn" onClick={onPrev} disabled={!onPrev}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Previous
        </button>

        <button type="button" className="tg-btn tg-btn-primary" onClick={onNext} disabled={!onNext}>
          Next
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
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

function LevelMeter({ standing, latest, best, taken }) {
  const shown = best ?? latest
  const rating = shown?.rating != null ? Math.round(shown.rating) : null
  const pct = Math.max(0, Math.min(100, rating ?? 0))
  const cleared = rating != null ? rating >= PROFICIENT_RATING : Boolean(standing?.cleared)
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border-2 border-rb-swan bg-rb-polar/60 p-4 sm:flex-row sm:items-center">
      <div
        className="relative grid size-20 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${cleared ? "var(--color-rb-feather)" : "var(--color-rb-fox)"} ${pct * 3.6}deg, var(--color-rb-swan) 0deg)`,
        }}
      >
        <span className="grid size-[64px] place-items-center rounded-full bg-rb-snow">
          {cleared ? (
            <Trophy className="size-7 text-rb-bee" aria-hidden="true" />
          ) : (
            <span className="rb-numeric text-xl font-black text-rb-eel">{rating ?? "?"}</span>
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-rb-wolf">
          {cleared ? "Level cleared" : taken ? "Keep going" : "New challenge"}
        </p>
        <p className="font-rb-display text-xl font-extrabold text-rb-eel">
          {rating != null ? `Proficiency ${rating} / 100` : "Not attempted yet"}
        </p>
        <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-rb-swan">
          <div
            className={`h-full rounded-full ${cleared ? "bg-rb-feather" : "bg-rb-fox"}`}
            style={{ width: `${pct}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 bg-rb-eel/60"
            style={{ left: `${PROFICIENT_RATING}%` }}
          />
        </div>
        <p className="mt-1 text-xs font-semibold text-rb-wolf">
          Goal: {PROFICIENT_RATING} · {cleared ? "you made it — retake to raise your best" : `${Math.max(0, PROFICIENT_RATING - (rating ?? 0))} to go`}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-rb-bee-wash px-3 py-1.5 text-sm font-extrabold text-rb-bee-ink sm:self-center">
        <Zap className="size-4" aria-hidden="true" /> +{ASSESSMENT_MAX_XP} XP
      </span>
    </div>
  )
}

function QuizBand({ quiz, taken, standing, latest, best }) {
  const location = useLocation()
  return (
    <section id={`quiz-${quiz.examId}`} data-no-snip className="tg-cat-explain relative scroll-mt-8 overflow-hidden tg-solid px-5 py-12 sm:px-10 lg:px-14">
      <div className="relative w-full">
        <Reveal amount={0.2}>
          <p className="font-rb-display text-2xl font-extrabold text-white">Test your skills</p>
          <p className="mt-1 text-sm font-bold text-white/80">
            {quiz.title} · {quiz.totalQuestions} questions
          </p>
        </Reveal>

        <Reveal
          variants={popIn}
          amount={0.2}
          className="mt-6 rounded-2xl bg-card p-6 shadow-[0_4px_0_rgb(0_0_0/0.12)] sm:p-8"
        >
          <LevelMeter standing={standing} latest={latest} best={best} taken={taken} />

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

          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-semibold text-rb-wolf">
            <span className="inline-flex items-center gap-1.5"><CircleHelp className="size-4" aria-hidden="true" />{quiz.totalQuestions} questions</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden="true" />{quiz.durationMinutes ? `${quiz.durationMinutes} min` : "Self-paced"}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4" aria-hidden="true" />Pass at {PROFICIENT_RATING}</span>
          </p>


          <div className="mt-5 flex flex-col items-center gap-3">
            <Link
              to={`/learner/assessments/${quiz.examId}`}
              state={returnState(location)}
              className="tg-btn tg-btn-primary !px-7 !py-3 !text-base"
            >
              {taken ? "Retake quiz" : "Start quiz"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

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
  outlineHidden,
}) {
  const location = useLocation()

  return (
    <div className="tg-cat-explain w-full pb-10">
      <div className="sticky top-0 z-10 border-b border-[var(--tg-line)] bg-card/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:px-10 lg:px-14">
        <div className="flex h-[var(--rb-topbar-h)] items-center justify-between gap-2 sm:gap-4">
          {onOpenOutline ? (
            <button
              type="button"
              onClick={onOpenOutline}
              aria-label="Open topic outline"
              title="Topic outline"
              className={`tg-btn tg-icon-btn shrink-0 ${outlineHidden ? "" : "xl:!hidden"}`}
            >
              <PanelLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="tg-kicker">
              Lesson {position} of {total}
            </p>

            <h1 className="mt-0.5 truncate font-rb-display text-lg font-extrabold text-foreground sm:text-xl">
              {exam.title}
            </h1>
          </div>

          {backTo ? (
            <Link to={backTo} aria-label="Back to curriculum" className="tg-btn shrink-0">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to curriculum</span>
              <span className="sm:hidden">Curriculum</span>
            </Link>
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
          <Link
            to={`/learner/assessments/${exam.examId}`}
            state={returnState(location)}
            className="tg-btn tg-btn-primary w-fit !px-6 !py-3 !text-base"
          >
            {taken ? "Retake exam" : "Start exam"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>

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
  const [liveTutorOpen, setLiveTutorOpen] = useState(false)
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

  const requestedLessonId = searchParams.get("lesson")
  const requestedLesson = requestedLessonId ? lessonById.get(String(requestedLessonId)) : null

  // Repair links saved before an overall plan retained the event's own
  // certification. Do not redirect to content the learner cannot access.
  const repairHref = useMemo(() => {
    if (!requestedLesson) return null
    const actualCertificationId = requestedLesson.certificationId
    const actualMiddleCategoryId = requestedLesson.middleCategoryId
    const isEnrolledInActualCertification = (data?.enrolledCertifications ?? []).some(
      (item) => String(item.certificationId) === String(actualCertificationId),
    )
    if (
      !isEnrolledInActualCertification ||
      actualCertificationId == null ||
      actualMiddleCategoryId == null ||
      (String(actualCertificationId) === String(certificationId) &&
        String(actualMiddleCategoryId) === String(middleCategoryId))
    ) {
      return null
    }
    return `/learner/learning/${actualCertificationId}/topics/${actualMiddleCategoryId}?lesson=${requestedLessonId}`
  }, [certificationId, data?.enrolledCertifications, middleCategoryId, requestedLesson, requestedLessonId])

  useEffect(() => {
    if (repairHref) navigate(repairHref, { replace: true })
  }, [navigate, repairHref])

  useEffect(() => {
    setActiveId(null)
  }, [certificationId, middleCategoryId, requestedLessonId])

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
    if (!masteryQuery.data) return null
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

  const reflectionItem = track.find((item) => item.kind === "reflection") ?? null
  const reflectionQuery = useQuery({
    queryKey: ["learner-reflection", String(reflectionItem?.middleId ?? "")],
    queryFn: () => getTopicReflection(reflectionItem.middleId),
    enabled: Boolean(reflectionItem),
    staleTime: 60_000,
    retry: 1,
  })
  const reflectionPassed = Boolean(reflectionQuery.data?.passed)


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
    if (item.kind !== "assessment" && item.kind !== "reflection") return null
    const position = track.findIndex((entry) => entry.id === item.id)
    if (position <= 0) return null
    const lesson = track.find((entry) => entry.kind === "lesson" && !isDone(entry.id))
    if (lesson) return lesson
    if (item.kind === "assessment" && reflectionItem && !reflectionPassed) return reflectionItem
    return null
  }

  function explainLock(item) {
    const gate = lockedBy(item)
    if (!gate) return false
    if (gate.kind === "reflection") {
      toast.warning("Pass this topic's reflection first — it unlocks the exam.")
      return true
    }
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
    enabled: Boolean(data?.learnerId) && !liveTutorOpen,
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
    lessonRootRef: readingRef,
    resetKey: activeLessonId,
    enabled:
      !liveTutorOpen &&
      Boolean(activeLessonId) &&
      sections.length > 0 &&
      !knowledgeCheck.offer,
    onRush: (since) => {
      if (liveTutorOpen) return
      const rushed = [...readAtRef.current]
        .filter(([, at]) => at >= since)
        .map(([key]) => key)
      // A finished lesson stays finished; skimming it still counts toward the challenge.
      if (rushed.length > 0 && !lessonFinished) {
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

  if (repairHref) return <TopicPageSkeleton />

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

  // A stale link is about to redirect; don't flash "Topic not found" first.
  if (repairHref || examsQuery.isLoading || examTypesQuery.isLoading || !curriculum) {
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

  const tutorVisible = tutorOpen && !liveTutorOpen && active?.kind === "lesson"

  // A closed outline takes no room at all; the icon in each view's top bar reopens it.
  const outlineColumn = outlineCollapsed ? "" : "340px "
  const gridStyle = isXl
    ? {
        gridTemplateColumns: `${outlineColumn}minmax(0,1fr)`,
      }
    : undefined
  const openOutline = () => (isXl ? setOutlineCollapsed(false) : setRailOpen(true))

  const outline = (
    <Outline
      middle={middle}
      major={major}
      track={track}
      masteryByLessonId={lessonMasteryById}
      activeId={active?.id}
      collapsed={false}
      onCollapse={() => (isXl ? setOutlineCollapsed(true) : setRailOpen(false))}
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
      reflectionPassed={reflectionPassed}
    />
  )

  return (
    <div className="rebyu-ds min-h-dvh w-full bg-rb-polar" style={{ "--rb-topbar-h": "72px" }}>
      <div className="grid min-h-dvh" style={gridStyle}>
        {outlineCollapsed ? null : (
          <aside className="hidden min-h-0 border-r-2 border-rb-swan xl:block">
            <div className="sticky top-0 h-dvh">{outline}</div>
          </aside>
        )}

        <ResizablePanelGroup
          orientation="horizontal"
          className="min-w-0 !items-stretch"
          style={{ height: "auto", overflow: "visible" }}
        >
        <ResizablePanel id="lesson" minSize="30%" style={{ overflow: "visible", maxHeight: "none" }}>
        <main ref={readingRef} className="min-h-dvh min-w-0 bg-rb-snow">
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
              onOpenOutline={openOutline}
              outlineHidden={outlineCollapsed}
            />
          ) : active?.kind === "reflection" ? (
            <TopicReflectionView
              middleId={active.middleId}
              query={reflectionQuery}
              position={activeIndex + 1}
              total={track.length}
              backTo={backTo}
              onOpenOutline={openOutline}
              outlineHidden={outlineCollapsed}
              examLabel={next?.kind === "assessment" ? next.name : "the topic exam"}
            />
          ) : (
            <AssessmentView
              exam={active.exam}
              position={activeIndex + 1}
              total={track.length}
              backTo={backTo}
              onOpenOutline={openOutline}
              outlineHidden={outlineCollapsed}
              taken={Boolean(takenExamIds.has(String(active.exam.examId)))}
              standing={examStanding(data?.examResults, active.exam.examId)}
              latest={latestSitting(data?.examResults, active.exam.examId)}
              best={bestSitting(data?.examResults, active.exam.examId)}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </main>

        </ResizablePanel>
        {tutorVisible && isXl ? (
          <>
          {/* The line is as tall as the lesson, so its own grip would sit far off-screen;
              the visible grip is pinned beside the tutor instead (see below). */}
          <ResizableHandle
            aria-label="Resize AI tutor"
            className="w-0.5 bg-rb-swan after:!w-3 hover:bg-rb-feather/60 data-[separator=active]:bg-rb-feather"
          />
          <ResizablePanel
            id="tutor"
            defaultSize={TUTOR_DEFAULT_WIDTH}
            minSize={TUTOR_MIN_WIDTH}
            maxSize={TUTOR_MAX_WIDTH}
            style={{ overflow: "visible", maxHeight: "none" }}
          >
          <aside className="relative h-full min-h-0 w-full">
            <div className="sticky top-0 h-dvh overflow-hidden">
              <span aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-1/2 z-20 h-10 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rb-hare/70" />
              <LessonAiTutor
                lessonId={activeLessonId}
                lessonName={active?.name}
                learnerName={data?.user?.firstName ?? data?.learner?.firstName ?? "Learner"}
                learnerId={data?.learnerId}
                onClose={() => setTutorOpen(false)}
                onStartLive={() => { setTutorOpen(false); setLiveTutorOpen(true) }}
                pendingSnippet={tutorSnippet}
                onSnippetTaken={() => setTutorSnippet(null)}
                onStartSnip={() => setSnipping(true)}
              />
            </div>
          </aside>
          </ResizablePanel>
          </>
        ) : null}
        </ResizablePanelGroup>
      </div>



      {createPortal(
        <AnimatePresence>
          {!tutorVisible && !liveTutorOpen && !railOpen && active?.kind === "lesson" ? (
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

      {liveTutorOpen && active?.kind === "lesson" ? createPortal(
        <LiveTutor key={activeLessonId} lessonId={activeLessonId} lessonName={active?.name} lessonStructure={lessonQuery.data?.lessonComponentStructure} lessonRootRef={readingRef} onExit={() => setLiveTutorOpen(false)} />,
        document.body,
      ) : null}

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="left" className="rebyu-ds p-0">
          <SheetTitle className="sr-only">Topic outline</SheetTitle>
          {outline}
        </SheetContent>
      </Sheet>

      <Sheet open={tutorVisible && !isXl} onOpenChange={(open) => !open && setTutorOpen(false)}>
        <SheetContent side="right" className="rebyu-ds gap-0 p-0 data-[side=right]:!w-full data-[side=right]:sm:!w-[28rem]">
          <SheetTitle className="sr-only">AI tutor</SheetTitle>
          <LessonAiTutor
            lessonId={activeLessonId}
            lessonName={active?.name}
            learnerName={data?.user?.firstName ?? data?.learner?.firstName ?? "Learner"}
            learnerId={data?.learnerId}
            onClose={() => setTutorOpen(false)}
            onStartLive={() => { setTutorOpen(false); setLiveTutorOpen(true) }}
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
        open={!liveTutorOpen && Boolean(knowledgeCheck.offer)}
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
