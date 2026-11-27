import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import { showLiveTutor } from "@/lib/live-tutor-visibility.js"
import { cn } from "@/lib/utils"

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  DollarSign,
  Gauge,
  KeyRound,
  List,
  Loader2,
  Search,
  Sparkles,
  X,
  XCircle,
  Zap,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiMessage } from "@/services/base.js"
import { chooseAiModel, getAiSettings, resetAiModel } from "@/services/aiSettingsService.js"
import { LiveTutorSettingsCard } from "@/components/admin/live-tutor-settings.jsx"
import { ReadingGuardSettingsCard } from "@/components/admin/reading-guard-settings.jsx"
import AssessmentTimerSettings from "@/components/assessments/admin/assessment-timer-settings.jsx"

const money = (value) =>
  value === null || value === undefined ? "—" : `$${Number(value).toFixed(2)}`

const proAiLimitsSection = {
  id: showLiveTutor ? "section-live-tutor" : "section-pro-ai-limits",
  label: showLiveTutor ? "Live Tutor & Voice Limits" : "Pro AI Usage Limits",
  shortLabel: showLiveTutor ? "Live Tutor" : "Pro AI Limits",
  group: "Core Services",
  icon: Sparkles,
  badge: showLiveTutor ? "ElevenLabs" : null,
}

const assessmentTimersSection = {
  id: "section-assessment-timers",
  label: "Assessment timers",
  shortLabel: "Assessment timers",
  group: "Core Services",
  icon: Clock,
}

function priceOf(model) {
  if (!model) return ""
  if (model.free) return "Free"
  return `$${model.promptPrice} / $${model.completionPrice} per 1M tokens`
}

export default function AiSettingsPage() {
  const { hash } = useLocation()
  const [activeSection, setActiveSection] = useState(proAiLimitsSection.id)
  const [sidebarFilter, setSidebarFilter] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // While a click's smooth scroll runs, scroll tracking must not move the highlight.
  const clickScrollUntil = useRef(0)

  const query = useQuery({
    queryKey: ["ai-settings"],
    queryFn: getAiSettings,
    staleTime: 30_000,
    refetchInterval: 15_000,
  })
  const data = query.data
  const taskLabel = (name) => data?.tasks?.find((task) => task.task === name)?.label ?? name

  // Navigation items index for each section of information
  const sections = useMemo(() => {
    const list = [
      proAiLimitsSection,
      {
        id: "section-reading-guard",
        label: "Lessons · Skim Challenge",
        shortLabel: "Skim Guard",
        group: "Core Services",
        icon: BookOpen,
        badge: "Cooldown",
      },
      assessmentTimersSection,
      {
        id: "section-credits",
        label: "OpenRouter Credits",
        shortLabel: "Credits",
        group: "Infrastructure",
        icon: DollarSign,
        badge: data?.credits?.remaining != null ? money(data.credits.remaining) : "Balance",
      },
      {
        id: "section-health",
        label: "Model Status & Health",
        shortLabel: "Model Health",
        group: "Infrastructure",
        icon: Gauge,
        badge: data?.modelHealth ? `${Object.keys(data.modelHealth).length} models` : "Status",
      },
    ]

    if (Array.isArray(data?.tasks) && data.tasks.length > 0) {
      data.tasks.forEach((task) => {
        list.push({
          id: `task-${task.task}`,
          label: task.label,
          shortLabel: task.label,
          group: "Models by Feature",
          icon: Zap,
          badge: task.model ? task.model.split("/").pop() : "Model",
          subtext: task.usedFor?.[0] ?? "",
        })
      })
    }

    return list
  }, [data])

  const filteredSections = useMemo(() => {
    if (!sidebarFilter.trim()) return sections
    const term = sidebarFilter.trim().toLowerCase()
    return sections.filter(
      (s) =>
        s.label.toLowerCase().includes(term) ||
        s.group.toLowerCase().includes(term) ||
        (s.badge && s.badge.toLowerCase().includes(term))
    )
  }, [sections, sidebarFilter])

  const groupedSections = useMemo(() => {
    const map = {}
    for (const item of filteredSections) {
      if (!map[item.group]) map[item.group] = []
      map[item.group].push(item)
    }
    return map
  }, [filteredSections])

  const scrollToSection = useCallback((id, behavior = "smooth") => {
    const el = document.getElementById(id)
    if (el) {
      clickScrollUntil.current = Date.now() + 900
      el.scrollIntoView({ behavior, block: "start" })
      setActiveSection(id)
      setMobileMenuOpen(false)
    }
  }, [])

  useEffect(() => {
    if (hash === `#${assessmentTimersSection.id}`) {
      scrollToSection(assessmentTimersSection.id, "instant")
    }
  }, [hash, scrollToSection])

  // Only the ids matter for tracking; the 15 s data refresh rebuilds `sections`
  // with new badges, which must not tear the scroll tracking down each time.
  const sectionIds = sections.map((item) => item.id).join("|")

  // Active section = the last one whose top has scrolled past the header. One
  // deterministic answer per frame, instead of an observer picking among several.
  useEffect(() => {
    const ids = sectionIds ? sectionIds.split("|") : []
    // Runs straight on each scroll event: measuring ~16 sections is cheap, and
    // waiting for an animation frame left the highlight a step behind.
    const update = () => {
      if (Date.now() < clickScrollUntil.current) return
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) current = id
      }
      if (current) setActiveSection((previous) => (previous === current ? previous : current))
    }
    // Capture phase: also hears scrolling inside the portal's scroll container.
    window.addEventListener("scroll", update, { capture: true, passive: true })
    update()
    return () => window.removeEventListener("scroll", update, { capture: true })
  }, [sectionIds])

  const currentActiveItem = sections.find((s) => s.id === activeSection)

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-5 sm:gap-6 pb-12">
      <h1 className="sr-only">Others</h1>

      {/* Sticky Mobile Quick-Jump Nav Bar (lg:hidden) */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-md border-b border-border/70 lg:hidden shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
              {currentActiveItem?.shortLabel ?? "Others"}
            </span>
          </div>
          <Button
            variant={mobileMenuOpen ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Section Menu"
          >
            <List className="size-3.5" />
            {mobileMenuOpen ? "Close Menu" : `Index (${sections.length})`}
            <ChevronDown className={cn("size-3 transition-transform", mobileMenuOpen ? "rotate-180" : "")} />
          </Button>
        </div>

        {/* Horizontal Quick-Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 whitespace-nowrap",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>

        {/* Expandable Mobile Section Menu Drawer */}
        {mobileMenuOpen ? (
          <div className="rounded-xl border border-border/80 bg-card p-3 shadow-md space-y-3 max-h-80 overflow-y-auto overscroll-contain">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Search sections..."
                className="h-8 pl-8 pr-7 text-xs"
              />
              {sidebarFilter ? (
                <button
                  type="button"
                  onClick={() => setSidebarFilter("")}
                  className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              {Object.entries(groupedSections).map(([groupName, items]) => (
                <div key={groupName} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                    {groupName} ({items.length})
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs",
                          activeSection === item.id
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "text-foreground/75 hover:bg-primary/10 hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge ? (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-2",
                              activeSection === item.id
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        {/* Desktop Sticky Sidebar Menu */}
        <aside className="hidden lg:flex sticky top-20 max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-border/70 space-y-2.5 shrink-0 bg-muted/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Settings Navigation
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0.5">
                {sections.length} sections
              </Badge>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Filter titles..."
                className="h-8 pl-8 pr-7 text-xs"
              />
              {sidebarFilter ? (
                <button
                  type="button"
                  onClick={() => setSidebarFilter("")}
                  className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-4">
            {Object.keys(groupedSections).length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                No sections match filter.
              </p>
            ) : (
              Object.entries(groupedSections).map(([groupName, items]) => (
                <div key={groupName} className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {groupName} ({items.length})
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon
                      const isActive = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => scrollToSection(item.id)}
                          className={cn(
                            "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-foreground/75 hover:bg-primary/10 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={cn(
                                "size-3.5 shrink-0 transition-colors",
                                isActive ? "text-primary-foreground" : "text-primary/75 group-hover:text-primary"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge ? (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 truncate max-w-[80px]",
                                isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content Sections */}
        <div className="min-w-0 space-y-6">
          <div id={proAiLimitsSection.id} className="scroll-mt-28 sm:scroll-mt-20">
            <LiveTutorSettingsCard />
          </div>

          {/* Section 2: Reading Guard */}
          <div id="section-reading-guard" className="scroll-mt-28 sm:scroll-mt-20">
            <ReadingGuardSettingsCard />
          </div>

          <div id={assessmentTimersSection.id} className="scroll-mt-28 sm:scroll-mt-20">
            <AssessmentTimerSettings />
          </div>

          {query.isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : query.isError ? (
            <p className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {apiMessage(query.error, "These settings could not be loaded.")}
            </p>
          ) : (
            <>
              {/* Section 3: OpenRouter Credits */}
              <div id="section-credits" className="scroll-mt-28 sm:scroll-mt-20">
                <CreditsCard credits={data.credits} providers={data.providers} />
              </div>

              {/* Section 4: Model Health */}
              {data.modelHealth ? (
                <div id="section-health" className="scroll-mt-28 sm:scroll-mt-20">
                  <HealthOverview
                    health={data.modelHealth}
                    since={data.healthSince}
                    tasks={data.tasks}
                    taskLabel={taskLabel}
                  />
                </div>
              ) : null}

              {data.catalogueError ? (
                <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  {data.catalogueError}
                </p>
              ) : null}

              {/* Section 5: Feature Models */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                      Models by Feature
                    </h2>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {data.tasks?.length ?? 0} features
                  </Badge>
                </div>

                {data.tasks.map((task) => (
                  <div key={task.task} id={`task-${task.task}`} className="scroll-mt-28 sm:scroll-mt-20">
                    <TaskCard
                      task={task}
                      models={data.models}
                      health={data.modelHealth}
                      taskLabel={taskLabel}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CreditsCard({ credits, providers }) {
  const empty = credits?.available && credits.remaining !== undefined && credits.remaining <= 0
  const key = credits?.key
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
            OpenRouter Credits & API Keys
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(providers ?? {}).map(([name, present]) => (
            <Badge key={name} variant={present ? "secondary" : "outline"} className="gap-1 capitalize text-xs">
              {present ? <CheckCircle2 className="size-3 text-emerald-600" /> : null}
              {name} key {present ? "set" : "missing"}
            </Badge>
          ))}
        </div>
      </div>

      {!credits?.available ? (
        <p className="mt-4 text-sm text-destructive">{credits?.reason ?? "The balance could not be read."}</p>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-4">
            <Stat label="Remaining Balance" value={money(credits.remaining)} tone={empty ? "bad" : "good"} />
            <Stat label="Total Purchased" value={money(credits.totalCredits)} />
            <Stat label="Total Used (All-Time)" value={money(credits.totalUsage)} />
            <Stat
              label="Key Allowance Left"
              value={key?.limit === null || key?.limit === undefined ? "No limit" : `${money(key.limitRemaining)} of ${money(key.limit)}`}
            />
            <Stat label="Used Today (This Key)" value={money(key?.usageDaily)} />
            <Stat label="Used This Month" value={money(key?.usageMonthly)} />
          </dl>
          {empty ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              The balance is used up, so paid models are refused. Features fall back to free models, which are often rate-limited. Add credit at openrouter.ai/settings/credits.
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/15 p-3.5">
      <dt className="text-xs font-semibold text-muted-foreground truncate">{label}</dt>
      <dd
        className={`mt-1.5 text-xl font-bold tracking-tight tabular-nums ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function TaskCard({ task, models, health, taskLabel }) {
  const queryClient = useQueryClient()
  const [picked, setPicked] = useState("")

  const others = useMemo(() => {
    const recommended = new Set(task.recommended.map((m) => m.id))
    return models
      .filter((m) => !recommended.has(m.id))
      .filter((m) => !task.needsVision || m.vision)
      .filter((m) => !task.blocked.some((prefix) => m.id.startsWith(prefix)))
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [models, task])

  const choose = useMutation({
    mutationFn: (model) => chooseAiModel(task.task, model),
    onSuccess: (_, model) => {
      toast.success(`${task.label} now uses ${model}.`)
      setPicked("")
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] })
    },
    onError: (error) => toast.error(apiMessage(error, "The model could not be changed.")),
  })
  const reset = useMutation({
    mutationFn: () => resetAiModel(task.task),
    onSuccess: () => {
      toast.success(`${task.label} is back on ${task.configuredModel}.`)
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] })
    },
    onError: (error) => toast.error(apiMessage(error, "The model could not be reset.")),
  })

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
              {task.label}
            </h3>
            {task.needsVision ? <Badge variant="outline" className="text-[10px]">Reads images</Badge> : null}
            <Badge variant="outline" className="capitalize text-[10px]">{task.provider}</Badge>
          </div>
          <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
            {task.usedFor.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] border-t border-border/70 pt-4">
        <div className="text-sm">
          <p>
            <span className="text-muted-foreground">Active model: </span>
            <b className="font-semibold text-foreground">{task.model}</b>
            {task.overridden ? (
              <Badge variant="secondary" className="ml-2 text-[10px]">Custom selected</Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-[10px]">Default</Badge>
            )}
          </p>
          {task.modelInfo ? (
            <p className="mt-1 text-xs text-muted-foreground">{priceOf(task.modelInfo)}</p>
          ) : null}
          {health ? (
            <TaskChain task={task} health={health} taskLabel={taskLabel} />
          ) : task.fallbacks.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Fallbacks: {task.fallbacks.join(" → ")}
            </p>
          ) : null}
          {task.overridden ? (
            <p className="mt-1 text-xs text-muted-foreground">Deployment default: {task.configuredModel}</p>
          ) : null}
        </div>

        {task.changeable ? (
          <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Select value={picked} onValueChange={setPicked}>
              <SelectTrigger className="h-auto min-h-10 w-full min-w-0 sm:basis-full [&>span]:min-w-0 [&>span]:whitespace-normal [&>span]:break-all text-xs" aria-label={`Model for ${task.label}`}>
                <SelectValue placeholder="Choose a different model…" />
              </SelectTrigger>
              <SelectContent className="max-h-96 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] [&_[data-slot=select-item]]:whitespace-normal [&_[data-slot=select-item]]:break-words">
                <SelectGroup>
                  <SelectLabel className="text-xs">Recommended for this feature</SelectLabel>
                  {task.recommended.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-xs">
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {model.id}
                          {model.id === task.model ? " (current)" : ""}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {model.note} · {priceOf(model)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs">Every other {task.needsVision ? "image-reading " : ""}model</SelectLabel>
                  {others.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-xs">
                      {model.id}
                      <span className="ml-2 text-[11px] text-muted-foreground">{priceOf(model)}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              disabled={!picked || picked === task.model || choose.isPending}
              onClick={() => choose.mutate(picked)}
              className="gap-1.5 text-xs font-medium"
            >
              {choose.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Use Selected Model
            </Button>
            {task.overridden ? (
              <Button type="button" variant="outline" size="sm" disabled={reset.isPending} onClick={() => reset.mutate()} className="text-xs">
                Reset
              </Button>
            ) : null}
            {task.blocked.length ? (
              <p className="w-full text-xs text-muted-foreground">
                Incompatible: {task.blocked.map((prefix) => `${prefix}…`).join(", ")} (unsupported tool calling format).
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Runs on {task.provider}; managed via deployment.</p>
        )}
      </div>
    </article>
  )
}

const STATE_META = {
  ok: { label: "Working", icon: CheckCircle2, tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  cooling_down: { label: "Limit reached", icon: Clock, tone: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  failing: { label: "Failing", icon: XCircle, tone: "border-destructive/40 bg-destructive/10 text-destructive" },
  no_key: { label: "No API key", icon: KeyRound, tone: "border-border bg-muted text-muted-foreground" },
  unused: { label: "Not used yet", icon: Circle, tone: "border-border bg-muted/30 text-muted-foreground" },
}
const STATE_ORDER = ["failing", "cooling_down", "no_key", "ok", "unused"]

const KIND_LABELS = {
  out_of_credits: "Out of credit",
  free_daily_cap: "Free daily cap",
  daily_limit: "Daily limit",
  rate_limit: "Rate limited",
  upstream_down: "Provider unavailable",
  too_large: "Request too large",
  tool_rejected: "Tool call refused",
  no_answer: "No usable answer",
  auth: "Key rejected",
  not_found: "Model not found",
  timeout: "Timed out",
  error: "Error",
}

function ago(value) {
  if (!value) return "never"
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`
  return new Date(value).toLocaleString()
}

function duration(seconds) {
  if (!seconds) return "a moment"
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`
  return `${Math.floor(seconds / 3600)} h ${Math.ceil((seconds % 3600) / 60)} min`
}

function providerOf(model) {
  const prefix = model.includes(":") ? model.split(":")[0] : null
  return prefix && !prefix.includes("/") ? prefix : "openrouter"
}

function statusDetail(model, health) {
  if (!health) return ""
  if (health.state === "cooling_down") {
    return `${health.lastError?.label ?? `Set aside with the other ${providerOf(model)} models`} · back in ${duration(health.availableInSeconds)}`
  }
  if (health.state === "failing") return `${health.lastError?.label ?? "Error"} · ${ago(health.lastFailureAt)}`
  if (health.state === "ok") {
    const speed = health.avgLatencyMs != null ? ` · ~${(health.avgLatencyMs / 1000).toFixed(1)}s` : ""
    return `Answered ${ago(health.lastSuccessAt)}${speed}`
  }
  if (health.state === "no_key") return `No ${providerOf(model)} key in the deployment`
  return ""
}

function ModelStatusBadge({ health }) {
  const meta = STATE_META[health?.state] ?? STATE_META.unused
  const Icon = meta.icon
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

function MiniStat({ label, value, tone }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5">
      <dt className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 break-words font-semibold tabular-nums text-xs ${tone === "bad" ? "text-destructive" : ""}`}>{value}</dd>
    </div>
  )
}

function ModelHealthDetails({ model, health, taskLabel }) {
  const error = health?.lastError
  const kinds = Object.entries(health?.failuresByKind ?? {}).sort((a, b) => b[1] - a[1])
  return (
    <div className="grid gap-3 border-t border-border/70 px-4 pb-4 pt-3 text-xs bg-muted/10">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <MiniStat label="Provider" value={providerOf(model)} />
        <MiniStat label="Answers" value={health?.successes ?? 0} />
        <MiniStat label="Failures" value={health?.failures ?? 0} tone={health?.failures ? "bad" : null} />
        <MiniStat
          label="Avg. response"
          value={health?.avgLatencyMs != null ? `${(health.avgLatencyMs / 1000).toFixed(1)}s` : "—"}
        />
        <MiniStat label="Last used for" value={health?.lastTask ? taskLabel(health.lastTask) : "—"} />
      </dl>

      {health?.state === "cooling_down" ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          Every feature skips this model for another {duration(health.availableInSeconds)}; requests go to the next
          model in each chain meanwhile.
        </p>
      ) : null}
      {health?.state === "no_key" ? (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted p-3 text-muted-foreground">
          <KeyRound className="mt-0.5 size-3.5 shrink-0" />
          The deployment has no {providerOf(model)} API key, so every feature skips this model.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="font-semibold text-destructive">
            Last error: {error.label}
            {error.status ? ` (HTTP ${error.status})` : ""}
            <span className="font-normal text-muted-foreground">
              {" "}· {ago(error.at)} · during {taskLabel(error.task)}
            </span>
          </p>
          <p className="mt-1 text-foreground">{error.advice}</p>
          <p className="mt-1.5 break-words rounded bg-background/80 p-2 font-mono text-[11px] text-muted-foreground border border-border">
            {error.message}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">No errors reported for this model.</p>
      )}

      {kinds.length ? (
        <div>
          <p className="mb-1 font-semibold text-muted-foreground">Failures by kind</p>
          <div className="flex flex-wrap gap-1.5">
            {kinds.map(([kind, count]) => (
              <Badge key={kind} variant="outline" className="text-[10px]">
                {KIND_LABELS[kind] ?? kind} × {count}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {health?.recent?.length ? (
        <div>
          <p className="mb-1.5 font-semibold text-muted-foreground">Recent calls (newest first)</p>
          <ol className="grid gap-1">
            {health.recent.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex flex-wrap items-center gap-x-2 text-xs">
                {event.ok ? (
                  <CheckCircle2 className="size-3 text-emerald-600 shrink-0" aria-label="Answered" />
                ) : (
                  <XCircle className="size-3 text-destructive shrink-0" aria-label="Failed" />
                )}
                <span className="tabular-nums text-muted-foreground">{new Date(event.at).toLocaleTimeString()}</span>
                <span className="font-medium text-foreground">{event.ok ? "Answered" : event.label}</span>
                <span className="text-muted-foreground">· {taskLabel(event.task)}</span>
                {event.ms != null ? (
                  <span className="tabular-nums text-muted-foreground">· {(event.ms / 1000).toFixed(1)}s</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

function ModelHealthRow({ model, label, health, note, taskLabel }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl border border-border/80 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 p-3 text-left text-xs hover:bg-muted/30 transition-colors"
      >
        <ModelStatusBadge health={health} />
        <span className="min-w-0 break-all font-semibold text-foreground">{label ?? model}</span>
        {note ? <Badge variant="secondary" className="max-w-full whitespace-normal break-words text-left text-[10px]">{note}</Badge> : null}
        <span className="ml-auto text-muted-foreground text-[11px]">{statusDetail(model, health)}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? <ModelHealthDetails model={model} health={health} taskLabel={taskLabel} /> : null}
    </li>
  )
}

function HealthOverview({ health, since, tasks, taskLabel }) {
  const entries = Object.entries(health ?? {})
  const counts = STATE_ORDER.map((state) => [state, entries.filter(([, h]) => h.state === state).length])
  const sorted = [...entries].sort(
    (a, b) => STATE_ORDER.indexOf(a[1].state) - STATE_ORDER.indexOf(b[1].state) || a[0].localeCompare(b[0])
  )
  const usedBy = (model) =>
    tasks.filter((task) => task.model === model || task.fallbacks.includes(model)).map((task) => task.label)

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
            Model Health & Status Monitor
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.map(([state, count]) =>
            count ? (
              <span key={state} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-2.5 py-0.5">
                <ModelStatusBadge health={{ state }} />
                <span className="text-xs font-semibold tabular-nums text-foreground">{count}</span>
              </span>
            ) : null
          )}
        </div>
      </div>
      <ul className="mt-4 grid gap-2">
        {sorted.map(([model, h]) => (
          <ModelHealthRow key={model} model={model} health={h} note={usedBy(model).join(", ")} taskLabel={taskLabel} />
        ))}
      </ul>
    </section>
  )
}

function TaskChain({ task, health, taskLabel }) {
  const chain = [task.model, ...task.fallbacks]
  const answering = chain.find((model) => !["cooling_down", "no_key"].includes(health?.[model]?.state))
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Fallback Chain (tried in order)
      </p>
      <ol className="grid gap-1.5">
        {chain.map((model, index) => (
          <ModelHealthRow
            key={model}
            model={model}
            label={`${index + 1}. ${model}`}
            health={health?.[model]}
            note={model === answering ? "Active" : index === 0 ? "Primary" : null}
            taskLabel={taskLabel}
          />
        ))}
      </ol>
      {!answering ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Every configured model for this feature is currently unavailable.
        </p>
      ) : null}
    </div>
  )
}
