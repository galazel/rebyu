import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AlertTriangle, CheckCircle2, Loader2 } from "@/components/icons"
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

/** "$0.30 / $2.50 per 1M tokens (in / out)", or "Free". */
function priceOf(model) {
  if (!model) return ""
  if (model.free) return "Free"
  return `$${model.promptPrice} / $${model.completionPrice} per 1M tokens`
}

/**
 * Everything about the AI the app uses: what is left to spend, which model
 * each feature runs on and where that feature is, and a model picker per
 * feature with the models recommended for it listed first.
 */
export default function AiSettingsPage() {
  const query = useQuery({
    queryKey: ["ai-settings"],
    queryFn: getAiSettings,
    staleTime: 30_000,
  })
  const data = query.data

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
          {data.catalogueError ? (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{data.catalogueError}</p>
          ) : null}
          <section className="grid gap-4">
            <h2 className="text-base font-semibold">Models by feature</h2>
            {data.tasks.map((task) => (
              <TaskCard key={task.task} task={task} models={data.models} />
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

function TaskCard({ task, models }) {
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
          {task.fallbacks.length ? (
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
