import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AlertTriangle, CheckCircle2, ChevronDown, Circle, Clock, KeyRound, Loader2, XCircle } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const money = (value) =>
  value === null || value === undefined ? "—" : `$${Number(value).toFixed(2)}`

function priceOf(model) {
  if (!model) return ""
  if (model.free) return "Free"
  return `$${model.promptPrice} / $${model.completionPrice} per 1M tokens`
}

export default function AiSettingsPage() {
  const query = useQuery({
    queryKey: ["ai-settings"],
    queryFn: getAiSettings,
    staleTime: 30_000,
    refetchInterval: 15_000,
  })
  const data = query.data
  const taskLabel = (name) => data?.tasks?.find((task) => task.task === name)?.label ?? name

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold">AI settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What is left to spend, which model each AI feature uses and where, and which model to use for it.
          A change takes effect within about 30 seconds.
        </p>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : query.isError ? (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {apiMessage(query.error, "The AI settings could not be loaded.")}
        </p>
      ) : (
        <>
          <CreditsCard credits={data.credits} providers={data.providers} />
          {data.modelHealth ? (
            <HealthOverview health={data.modelHealth} since={data.healthSince} tasks={data.tasks} taskLabel={taskLabel} />
          ) : null}
          {data.catalogueError ? (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{data.catalogueError}</p>
          ) : null}
          <section className="grid gap-4">
            <h2 className="text-base font-semibold">Models by feature</h2>
            {data.tasks.map((task) => (
              <TaskCard key={task.task} task={task} models={data.models} health={data.modelHealth} taskLabel={taskLabel} />
            ))}
          </section>
        </>
      )}
    </div>
  )
}

function CreditsCard({ credits, providers }) {
  const empty = credits?.available && credits.remaining !== undefined && credits.remaining <= 0
  const key = credits?.key
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">OpenRouter credits</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every AI feature runs through OpenRouter. Paid models draw from this balance; free models do not, but are
            often rate-limited.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(providers ?? {}).map(([name, present]) => (
            <Badge key={name} variant={present ? "secondary" : "outline"} className="gap-1 capitalize">
              {present ? <CheckCircle2 className="size-3" /> : null}
              {name} key {present ? "set" : "missing"}
            </Badge>
          ))}
        </div>
      </div>

      {!credits?.available ? (
        <p className="mt-3 text-sm text-destructive">{credits?.reason ?? "The balance could not be read."}</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Remaining" value={money(credits.remaining)} tone={empty ? "bad" : "good"} />
            <Stat label="Bought" value={money(credits.totalCredits)} />
            <Stat label="Used, all time" value={money(credits.totalUsage)} />
            <Stat
              label="This key's limit left"
              value={key?.limit === null || key?.limit === undefined ? "No limit" : `${money(key.limitRemaining)} of ${money(key.limit)}`}
            />
            <Stat label="Used today (this key)" value={money(key?.usageDaily)} />
            <Stat label="Used this month (this key)" value={money(key?.usageMonthly)} />
          </dl>
          {empty ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              The balance is used up, so every paid model is refused. Features fall back to free models, which are
              often rate-limited. Add credit at openrouter.ai/settings/credits.
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold ${tone === "bad" ? "text-destructive" : tone === "good" ? "text-emerald-700" : ""}`}>
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
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{task.label}</h3>
          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
            {task.usedFor.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {task.needsVision ? <Badge variant="outline">Reads images</Badge> : null}
          <Badge variant="outline" className="capitalize">{task.provider}</Badge>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="text-sm">
          <p>
            <span className="text-muted-foreground">Uses </span>
            <b>{task.model}</b>
            {task.overridden ? (
              <Badge variant="secondary" className="ml-2">Chosen here</Badge>
            ) : (
              <Badge variant="outline" className="ml-2">Deployment default</Badge>
            )}
          </p>
          {task.modelInfo ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{priceOf(task.modelInfo)}</p>
          ) : null}
          {health ? (
            <TaskChain task={task} health={health} taskLabel={taskLabel} />
          ) : task.fallbacks.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              If it fails: {task.fallbacks.join(" → ")}
            </p>
          ) : null}
          {task.overridden ? (
            <p className="mt-1 text-xs text-muted-foreground">Deployment default: {task.configuredModel}</p>
          ) : null}
        </div>

        {task.changeable ? (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={picked} onValueChange={setPicked}>
              <SelectTrigger className="min-w-0 flex-1" aria-label={`Model for ${task.label}`}>
                <SelectValue placeholder="Choose a different model…" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                <SelectGroup>
                  <SelectLabel>Recommended for this feature</SelectLabel>
                  {task.recommended.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className="flex flex-col">
                        <span>
                          {model.id}
                          {model.id === task.model ? " (current)" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {model.note} · {priceOf(model)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Every other {task.needsVision ? "image-reading " : ""}model</SelectLabel>
                  {others.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.id}
                      <span className="ml-2 text-xs text-muted-foreground">{priceOf(model)}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="button" disabled={!picked || picked === task.model || choose.isPending} onClick={() => choose.mutate(picked)}>
              {choose.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Use this model
            </Button>
            {task.overridden ? (
              <Button type="button" variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
                Reset
              </Button>
            ) : null}
            {task.blocked.length ? (
              <p className="w-full text-xs text-muted-foreground">
                Not offered: {task.blocked.map((prefix) => `${prefix}…`).join(", ")} — they fail this feature&apos;s
                multi-step tool calls.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Runs on {task.provider}; its model is set in the deployment.</p>
        )}
      </div>
    </article>
  )
}

const STATE_META = {
  ok: { label: "Working", icon: CheckCircle2, tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  cooling_down: { label: "Limit reached", icon: Clock, tone: "border-amber-300 bg-amber-50 text-amber-800" },
  failing: { label: "Failing", icon: XCircle, tone: "border-destructive/40 bg-destructive/5 text-destructive" },
  no_key: { label: "No API key", icon: KeyRound, tone: "border-border bg-muted text-muted-foreground" },
  unused: { label: "Not used yet", icon: Circle, tone: "border-border bg-background text-muted-foreground" },
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
    <div className="rounded-md border border-border/70 px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 truncate font-semibold ${tone === "bad" ? "text-destructive" : ""}`}>{value}</dd>
    </div>
  )
}

function ModelHealthDetails({ model, health, taskLabel }) {
  const error = health?.lastError
  const kinds = Object.entries(health?.failuresByKind ?? {}).sort((a, b) => b[1] - a[1])
  return (
    <div className="grid gap-3 border-t border-border/70 px-3 pb-3 pt-3 text-xs">
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
        <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-amber-900">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          Every feature skips this model for another {duration(health.availableInSeconds)}; requests go to the next
          model in each chain meanwhile.
          {!health.lastError
            ? ` It was not called itself: another ${providerOf(model)} model hit an account-wide wall (out of credit, or the shared free-model cap), which applies to this one too.`
            : ""}
        </p>
      ) : null}
      {health?.state === "no_key" ? (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-2.5 text-muted-foreground">
          <KeyRound className="mt-0.5 size-3.5 shrink-0" />
          The deployment has no {providerOf(model)} API key, so every feature skips this model.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
          <p className="font-semibold text-destructive">
            Last error: {error.label}
            {error.status ? ` (HTTP ${error.status})` : ""}
            <span className="font-normal text-muted-foreground">
              {" "}· {ago(error.at)} · during {taskLabel(error.task)}
            </span>
          </p>
          <p className="mt-1 text-foreground">{error.advice}</p>
          <p className="mt-1.5 break-words rounded bg-background/70 p-2 font-mono text-[11px] text-muted-foreground">
            {error.message}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">No errors since the AI service started.</p>
      )}

      {kinds.length ? (
        <div>
          <p className="mb-1 font-semibold text-muted-foreground">Failures by kind</p>
          <div className="flex flex-wrap gap-1.5">
            {kinds.map(([kind, count]) => (
              <Badge key={kind} variant="outline">
                {KIND_LABELS[kind] ?? kind} × {count}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {health?.recent?.length ? (
        <div>
          <p className="mb-1 font-semibold text-muted-foreground">Recent calls (newest first)</p>
          <ol className="grid gap-0.5">
            {health.recent.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex flex-wrap items-center gap-x-2">
                {event.ok ? (
                  <CheckCircle2 className="size-3 text-emerald-600" aria-label="Answered" />
                ) : (
                  <XCircle className="size-3 text-destructive" aria-label="Failed" />
                )}
                <span className="tabular-nums text-muted-foreground">{new Date(event.at).toLocaleTimeString()}</span>
                <span>{event.ok ? "Answered" : event.label}</span>
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
    <li className="rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-left text-xs hover:bg-accent/50"
      >
        <ModelStatusBadge health={health} />
        <span className="min-w-0 break-all font-medium text-foreground">{label ?? model}</span>
        {note ? <Badge variant="secondary" className="text-[10px]">{note}</Badge> : null}
        <span className="ml-auto text-muted-foreground">{statusDetail(model, health)}</span>
        <ChevronDown
          className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
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
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Model status</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What every model has been doing since the AI service started ({ago(since)}), refreshed every 15
            seconds. Open a model for its last error in the provider&apos;s own words, what to do about it, and its
            recent calls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.map(([state, count]) =>
            count ? (
              <span key={state} className="inline-flex items-center gap-1">
                <ModelStatusBadge health={{ state }} />
                <span className="text-xs font-semibold tabular-nums">{count}</span>
              </span>
            ) : null
          )}
        </div>
      </div>
      <ul className="mt-3 grid gap-1.5">
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
    <div className="mt-2">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        Model order — each is tried when the one above it fails
      </p>
      <ol className="grid gap-1">
        {chain.map((model, index) => (
          <ModelHealthRow
            key={model}
            model={model}
            label={`${index + 1}. ${model}`}
            health={health?.[model]}
            note={model === answering ? "Answering now" : index === 0 ? "Main" : null}
            taskLabel={taskLabel}
          />
        ))}
      </ol>
      {!answering ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Every model for this feature is set aside right now, so it fails until one comes back.
        </p>
      ) : null}
    </div>
  )
}
