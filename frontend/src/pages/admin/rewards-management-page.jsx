import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Upload,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { apiMessage } from "@/services/base.js"
import { getAdminRewards, getCertificationReviewLevels, updateAdminRewards, updateCertificationReviewLevels, uploadCertificationReviewLevelImage } from "@/services/subscriptionService.js"

const REWARD_CATEGORIES = [
  {
    title: "Assessment XP",
    description: "XP awarded when a learner attempts, passes, or perfects a full exam.",
    icon: Target,
    fields: [
      { key: "assessmentAttemptedXp", label: "Attempted", unit: "XP", hint: "Awarded for submitting any exam attempt" },
      { key: "assessmentPassedTopupXp", label: "Passed top-up", unit: "XP", hint: "Extra XP added when the learner passes" },
      { key: "assessmentPerfectTopupXp", label: "Perfect top-up", unit: "XP", hint: "Extra XP added when the learner gets a perfect score" },
    ],
  },
  {
    title: "Knowledge check XP",
    description: "XP for pop-up quizzes and lesson knowledge checks (smaller scale than full exams).",
    icon: BookOpenCheck,
    fields: [
      { key: "checkAttemptedXp", label: "Attempted", unit: "XP", hint: "Awarded for submitting any knowledge check" },
      { key: "checkPassedTopupXp", label: "Passed top-up", unit: "XP", hint: "Extra XP added when the learner passes" },
      { key: "checkPerfectTopupXp", label: "Perfect top-up", unit: "XP", hint: "Extra XP added when the learner gets a perfect score" },
    ],
  },
  {
    title: "Lesson completion",
    description: "XP awarded when a learner finishes a lesson.",
    icon: Award,
    fields: [
      { key: "lessonCompletionXp", label: "Lesson completed", unit: "XP", hint: "Flat XP for finishing a lesson" },
    ],
  },
  {
    title: "Practice rewards",
    description: "XP and coins for tutor quizzes, community quizzes, and flashcard recall.",
    icon: Swords,
    fields: [
      { key: "tutorQuizXp", label: "Tutor quiz XP", unit: "XP" },
      { key: "tutorQuizCoins", label: "Tutor quiz coins", unit: "coins" },
      { key: "communityQuizXp", label: "Community quiz XP", unit: "XP" },
      { key: "communityQuizCoins", label: "Community quiz coins", unit: "coins" },
      { key: "flashcardXp", label: "Flashcard XP", unit: "XP" },
      { key: "flashcardCoins", label: "Flashcard coins", unit: "coins" },
    ],
  },
  {
    title: "Score thresholds",
    description: "When a learner scores below the threshold, XP is halved and coins are withheld.",
    icon: Trophy,
    fields: [
      { key: "lowScoreThresholdPercent", label: "Low score threshold", unit: "%", hint: "Below this percentage, rewards are reduced" },
      { key: "lowScoreMinXp", label: "Minimum XP", unit: "XP", hint: "Floor XP for a low-scoring attempt (at least this much)" },
    ],
  },
  {
    title: "AI credits & coins",
    description: "Exchange rate, generation cost, and monthly Pro grants.",
    icon: Sparkles,
    fields: [
      { key: "coinsPerAiCredit", label: "Coins per AI credit", unit: "coins", hint: "How many coins a learner trades for 1 AI credit" },
      { key: "aiGenerationCost", label: "Generation cost", unit: "credits", hint: "AI credits charged per generation" },
      { key: "monthlyProAiCredits", label: "Monthly Pro grant", unit: "credits", hint: "Free AI credits given to Pro subscribers each month" },
    ],
  },
]

function RewardField({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium">{field.label}</Label>
        {field.hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="h-9 w-24 tabular-nums text-right"
          min={0}
        />
        <span className="w-14 text-xs text-muted-foreground">{field.unit}</span>
      </div>
    </div>
  )
}

function CategoryCard({ category, values, onChange }) {
  const Icon = category.icon
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{category.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>
      <div className="border-t px-2 py-2">
        {category.fields.map((field) => (
          <RewardField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
      </div>
    </div>
  )
}

function ReviewLevelEditor({ levels, onChange, onUpload, uploading }) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div>
        <div><h2 className="text-base font-semibold">Certification review levels</h2><p className="mt-0.5 text-sm text-muted-foreground">The shared 20-level system used for every learner’s certification review progress. Uploading a badge is optional; learners see the default trophy when none is set.</p></div>
      </div>
      <div className="border-t divide-y">
        {levels.map((level, index) => (
          <div key={level.levelNumber} className="grid gap-3 p-3 sm:grid-cols-[5rem_minmax(10rem,1fr)_8rem_10rem] sm:items-center">
            <div className="text-sm font-semibold text-primary">Level {level.levelNumber}</div>
            <Input aria-label={`Level ${level.levelNumber} title`} value={level.title} onChange={(event) => onChange(index, "title", event.target.value)} />
            <Input aria-label={`Level ${level.levelNumber} XP`} type="number" min={index === 0 ? 0 : levels[index - 1].requiredXp + 1} value={level.requiredXp} onChange={(event) => onChange(index, "requiredXp", Number(event.target.value || 0))} />
            <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">
              <Upload className="size-3.5" /> {uploading === level.levelNumber ? "Uploading…" : level.imageKey ? "Replace badge" : "Add badge"}
              <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={uploading != null} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(level.levelNumber, file); event.target.value = "" }} />
            </label>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function RewardsManagementPage() {
  const queryClient = useQueryClient()
  const [edits, setEdits] = useState(null)
  const [levelEdits, setLevelEdits] = useState(null)

  const query = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: getAdminRewards,
    staleTime: 30_000,
  })
  const levelsQuery = useQuery({ queryKey: ["certification-review-levels"], queryFn: getCertificationReviewLevels, staleTime: 30_000 })

  const mutation = useMutation({
    mutationFn: (data) => updateAdminRewards(data),
    onSuccess: (result) => {
      toast.success("Rewards updated")
      setEdits(null)
      queryClient.setQueryData(["admin-rewards"], result)
    },
    onError: (err) => toast.error(apiMessage(err, "Could not update rewards")),
  })
  const levelsMutation = useMutation({
    mutationFn: updateCertificationReviewLevels,
    onSuccess: (result) => { queryClient.setQueryData(["certification-review-levels"], result); setLevelEdits(null); toast.success("Certification review levels updated") },
    onError: (err) => toast.error(apiMessage(err, "Could not update review levels")),
  })
  const imageMutation = useMutation({
    mutationFn: ({ levelNumber, file }) => uploadCertificationReviewLevelImage(levelNumber, file),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["certification-review-levels"] }); toast.success("Level badge uploaded") },
    onError: (err) => toast.error(apiMessage(err, "Could not upload level badge")),
  })

  const serverValues = query.data ?? {}
  const currentValues = edits ?? serverValues

  const hasChanges = edits != null && Object.keys(edits).some((k) => edits[k] !== serverValues[k])
  const serverLevels = levelsQuery.data ?? []
  const currentLevels = levelEdits ?? serverLevels
  const levelsChanged = levelEdits != null && JSON.stringify(levelEdits) !== JSON.stringify(serverLevels)

  function handleChange(key, value) {
    setEdits((prev) => ({ ...(prev ?? serverValues), [key]: value }))
  }

  function handleReset() {
    setEdits(null)
  }

  function handleSave() {
    if (!edits) return
    const changed = {}
    for (const key of Object.keys(edits)) {
      if (edits[key] !== serverValues[key]) changed[key] = edits[key]
    }
    if (Object.keys(changed).length === 0) return
    mutation.mutate(changed)
  }

  function changeLevel(index, key, value) { setLevelEdits((previous) => (previous ?? serverLevels).map((level, itemIndex) => itemIndex === index ? { ...level, [key]: value } : level)) }
  function saveLevels() {
    if (currentLevels.length !== 20 || currentLevels.some((level, index) => !String(level.title).trim() || Number(level.requiredXp) < (index === 0 ? 0 : Number(currentLevels[index - 1].requiredXp)))) { toast.error("Keep all 20 levels named and their XP thresholds increasing."); return }
    levelsMutation.mutate(currentLevels.map(({ id, levelNumber, title, requiredXp, description, imageKey }) => ({ id, levelNumber, title, requiredXp: Number(requiredXp), description, imageKey })))
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">Rewards & XP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure XP, coins, and AI credit amounts for every activity. Changes apply immediately and reset on server restart.
          </p>
        </div>
        {hasChanges ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
              <RotateCcw className="size-3.5" />
              Discard
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save changes
            </Button>
          </div>
        ) : null}
      </div>

      {query.isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : query.error ? (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {apiMessage(query.error, "Could not load reward settings.")}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {REWARD_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.title}
              category={category}
              values={currentValues}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Shared certification-review ranks</h2><p className="text-sm text-muted-foreground">Applied per certification, not as a scholarship or global account rank.</p></div>{levelsChanged ? <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setLevelEdits(null)}>Discard</Button><Button size="sm" onClick={saveLevels} disabled={levelsMutation.isPending}>{levelsMutation.isPending ? "Saving…" : "Save review levels"}</Button></div> : null}</div>
        {levelsQuery.isLoading ? <Skeleton className="h-96 w-full" /> : levelsQuery.error ? <p className="text-sm text-destructive">{apiMessage(levelsQuery.error, "Could not load review levels.")}</p> : <ReviewLevelEditor levels={currentLevels} onChange={changeLevel} onUpload={(levelNumber, file) => imageMutation.mutate({ levelNumber, file })} uploading={imageMutation.isPending ? imageMutation.variables?.levelNumber : null} />}
      </div>
    </div>
  )
}
