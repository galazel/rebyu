import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { DirectoryHeader } from "@/components/admin/directory-header.jsx"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CheckIcon,
  ChevronDown,
  ChevronRight,
  Crown,
  DollarSign,
  Gauge,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { apiMessage } from "@/services/base.js"
import {
  getAdminPlans,
  updateAdminPlan,
  updatePlanEntitlements,
  updateAdminPartnershipPricing,
} from "@/services/subscriptionService.js"
import { getPartnershipPricing } from "@/services/partnershipService.js"

const FEATURE_LABELS = {
  CERTIFICATION_BROWSING: "Certification browsing",
  LESSON_ACCESS: "Lesson access",
  BASIC_LEARNING: "Basic learning",
  BASIC_COMPLETION_TRACKING: "Basic completion tracking",
  DETAILED_PROGRESS: "Detailed progress",
  PROGRESS_ANALYTICS: "Progress analytics",
  MASTERY_ANALYTICS: "Mastery analytics",
  WEAKNESS_ANALYSIS: "Weakness analysis",
  PERSONALIZED_STUDY_PLAN: "Personalised study plan",
  MOCK_EXAM_ACCESS: "Mock exam access",
  BATTLES_ACCESS: "Battles access",
  CHALLENGES_ACCESS: "Challenges access",
  READINESS_ANALYSIS: "Readiness analysis",
  ADVANCED_RECOMMENDATIONS: "Advanced recommendations",
  QUIZ_RETAKES: "Quiz retakes",
  AI_TUTOR: "AI tutor",
  COMMUNITY_FULL_ACCESS: "Full community access",
  MISTAKE_BANK: "Mistake bank",
  WORLD_CUP_ACCESS: "Champions Cup access",
  AI_TUTOR_DAILY_GENERATIONS: "AI tutor daily generations",
  GROUP_MANAGEMENT: "Group management",
  AUTHORITY_MANAGEMENT: "Authority management",
  LEARNER_ASSIGNMENT: "Learner assignment",
  BASIC_MONITORING: "Basic monitoring",
  DETAILED_GROUP_ANALYTICS: "Detailed group analytics",
  EXPORT_REPORTS: "Export reports",
  ORG_WIDE_ANALYTICS: "Org-wide analytics",
  AUDIT_LOGS: "Audit logs",
  SEAT_LIMIT: "Seat limit",
  CERTIFICATION_ALLOCATION_LIMIT: "Certification allocation limit",
  GROUP_LIMIT: "Group limit",
  AUTHORITY_LIMIT: "Authority limit",
  ORG_ADMIN_LIMIT: "Org admin limit",
}

const FEATURE_CATEGORIES = {
  "Core access": ["CERTIFICATION_BROWSING", "LESSON_ACCESS", "BASIC_LEARNING", "BASIC_COMPLETION_TRACKING"],
  "Analytics": ["DETAILED_PROGRESS", "PROGRESS_ANALYTICS", "MASTERY_ANALYTICS", "WEAKNESS_ANALYSIS", "READINESS_ANALYSIS"],
  "Learning tools": ["PERSONALIZED_STUDY_PLAN", "MOCK_EXAM_ACCESS", "QUIZ_RETAKES", "ADVANCED_RECOMMENDATIONS", "MISTAKE_BANK"],
  "Social & competitions": ["BATTLES_ACCESS", "CHALLENGES_ACCESS", "COMMUNITY_FULL_ACCESS"],
  "AI": ["AI_TUTOR", "AI_TUTOR_DAILY_GENERATIONS"],
}

const INSTITUTIONAL_CATEGORIES = {
  "Management": ["GROUP_MANAGEMENT", "AUTHORITY_MANAGEMENT", "LEARNER_ASSIGNMENT"],
  "Analytics & reporting": ["BASIC_MONITORING", "DETAILED_GROUP_ANALYTICS", "EXPORT_REPORTS", "ORG_WIDE_ANALYTICS", "AUDIT_LOGS"],
  "Capacity": ["SEAT_LIMIT", "CERTIFICATION_ALLOCATION_LIMIT", "GROUP_LIMIT", "AUTHORITY_LIMIT", "ORG_ADMIN_LIMIT"],
}

// Champions Cup is hidden for now, so its entitlement is not shown on plans.
const HIDDEN_ENTITLEMENTS = new Set(["WORLD_CUP_ACCESS"])

function formatMoney(amount, currency = "PHP") {
  const value = Number(amount)
  if (!Number.isFinite(value)) return "—"
  return value.toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 0 })
}

function SectionHeading({ icon: Icon, title, description, badge }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
            {badge ? <Badge variant="secondary" className="text-xs">{badge}</Badge> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, type, onRefresh }) {
  const entitlements = Array.isArray(plan.entitlements) ? plan.entitlements : []
  const limitEntitlements = entitlements.filter((e) => e.limitValue != null)
  const categories = type === "institutional" ? INSTITUTIONAL_CATEGORIES : FEATURE_CATEGORIES

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [searchEnt, setSearchEnt] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [editName, setEditName] = useState(plan.planName)
  const [editDesc, setEditDesc] = useState(plan.description ?? "")
  const [editAmount, setEditAmount] = useState(String(plan.amount ?? 0))
  const [editInterval, setEditInterval] = useState(plan.billingInterval)
  const [editStatus, setEditStatus] = useState(plan.status)

  const [entEdits, setEntEdits] = useState(() => {
    const map = {}
    for (const e of entitlements) {
      map[e.entitlementCode] = { enabled: e.enabled, limitValue: e.limitValue }
    }
    return map
  })

  const planMutation = useMutation({
    mutationFn: () =>
      updateAdminPlan(plan.subscriptionPlanId, {
        planName: editName.trim(),
        description: editDesc.trim(),
        amount: Number(editAmount),
        billingInterval: editInterval,
        status: editStatus,
      }),
    onSuccess: () => {
      toast.success(`${plan.planName} updated`)
      setEditing(false)
      onRefresh()
    },
    onError: (err) => toast.error(apiMessage(err, "Could not update plan")),
  })

  const entMutation = useMutation({
    mutationFn: () => {
      const list = Object.entries(entEdits).map(([code, val]) => ({
        entitlementCode: code,
        enabled: val.enabled,
        limitValue: val.limitValue,
      }))
      return updatePlanEntitlements(plan.subscriptionPlanId, list)
    },
    onSuccess: () => {
      toast.success("Entitlements saved successfully")
      onRefresh()
    },
    onError: (err) => toast.error(apiMessage(err, "Could not save entitlements")),
  })

  function toggleEntitlement(code) {
    setEntEdits((prev) => ({
      ...prev,
      [code]: { ...prev[code], enabled: !prev[code]?.enabled },
    }))
  }

  function setEntLimit(code, value) {
    const parsed = value === "" ? null : Number(value)
    setEntEdits((prev) => ({
      ...prev,
      [code]: { ...prev[code], limitValue: Number.isFinite(parsed) ? parsed : null },
    }))
  }

  function resetEntitlements() {
    const map = {}
    for (const e of entitlements) {
      map[e.entitlementCode] = { enabled: e.enabled, limitValue: e.limitValue }
    }
    setEntEdits(map)
  }

  function resetPlanForm() {
    setEditing(false)
    setEditName(plan.planName)
    setEditDesc(plan.description ?? "")
    setEditAmount(String(plan.amount ?? 0))
    setEditInterval(plan.billingInterval)
    setEditStatus(plan.status)
  }

  const entChanged = useMemo(() => {
    return entitlements.some((e) => {
      const edit = entEdits[e.entitlementCode]
      return edit && (edit.enabled !== e.enabled || edit.limitValue !== e.limitValue)
    })
  }, [entitlements, entEdits])

  const enabledCount = entitlements.filter((e) => entEdits[e.entitlementCode]?.enabled).length

  const aiTutorEnt = entitlements.find((e) => e.entitlementCode === "AI_TUTOR_DAILY_GENERATIONS")
  const mockExamEnt = entitlements.find((e) => e.entitlementCode === "MOCK_EXAM_ACCESS")
  const analyticsEnt = entitlements.find((e) => e.entitlementCode === "DETAILED_PROGRESS")

  const filteredCategories = useMemo(() => {
    const term = searchEnt.trim().toLowerCase()
    const result = {}

    for (const [catName, codes] of Object.entries(categories)) {
      if (selectedCategory !== "all" && selectedCategory !== catName) continue

      const matchingCodes = codes.filter((code) => {
        if (HIDDEN_ENTITLEMENTS.has(code)) return false
        if (!entitlements.some((e) => e.entitlementCode === code)) return false
        if (!term) return true
        const label = (FEATURE_LABELS[code] ?? code).toLowerCase()
        return label.includes(term) || code.toLowerCase().includes(term)
      })

      if (matchingCodes.length > 0) {
        result[catName] = matchingCodes
      }
    }

    if (selectedCategory === "all" || selectedCategory === "Other") {
      const categorised = new Set(Object.values(categories).flat())
      const otherCodes = entitlements
        .filter((e) => !categorised.has(e.entitlementCode) && !HIDDEN_ENTITLEMENTS.has(e.entitlementCode))
        .map((e) => e.entitlementCode)
        .filter((code) => {
          if (!term) return true
          const label = (FEATURE_LABELS[code] ?? code).toLowerCase()
          return label.includes(term) || code.toLowerCase().includes(term)
        })
      if (otherCodes.length > 0) {
        result["Other"] = otherCodes
      }
    }

    return result
  }, [categories, entitlements, searchEnt, selectedCategory])

  const isPro = !plan.isFree && plan.planCode === "PRO"

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all shadow-xs",
        isPro
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-border/80 hover:border-border"
      )}
    >
      {isPro ? (
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  isPro ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {isPro ? <Crown className="size-4" /> : plan.isFree ? <Sparkles className="size-4" /> : <Building2 className="size-4" />}
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                {plan.planName}
              </h3>
              {plan.isFree ? (
                <Badge variant="secondary" className="text-xs font-semibold">
                  Free Forever
                </Badge>
              ) : isPro ? (
                <Badge className="gap-1 bg-primary/10 text-xs font-semibold text-primary border-primary/25 hover:bg-primary/15">
                  <Crown className="size-2.5" /> Recommended
                </Badge>
              ) : null}
              <code className="rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {plan.planCode}
              </code>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  plan.status === "ACTIVE"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                {plan.status}
              </Badge>
            </div>

            {plan.description ? (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {plan.description}
              </p>
            ) : null}

            {!editing ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {aiTutorEnt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1 text-muted-foreground">
                    <Sparkles className="size-3 text-primary" />
                    <span>AI Tutor: <strong>{aiTutorEnt.enabled ? `${aiTutorEnt.limitValue ?? 10}/day` : "Disabled"}</strong></span>
                  </span>
                ) : null}
                {mockExamEnt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1 text-muted-foreground">
                    <CheckIcon className={cn("size-3", mockExamEnt.enabled ? "text-primary" : "text-muted-foreground/40")} />
                    <span>Mock Exams</span>
                  </span>
                ) : null}
                {analyticsEnt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1 text-muted-foreground">
                    <CheckIcon className={cn("size-3", analyticsEnt.enabled ? "text-primary" : "text-muted-foreground/40")} />
                    <span>Full Analytics</span>
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1 text-muted-foreground tabular-nums">
                  {enabledCount} of {entitlements.length} features active
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border/60 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
            {plan.isCustomPricing ? (
              <div className="text-left sm:text-right">
                <span className="text-lg font-bold text-foreground sm:text-xl">Custom Pricing</span>
                <span className="block text-[11px] text-muted-foreground">Contact for enterprise tier</span>
              </div>
            ) : plan.isFree ? (
              <div className="text-left sm:text-right">
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">₱0</span>
                <span className="block text-[11px] text-muted-foreground">Free for all learners</span>
              </div>
            ) : (
              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1 sm:justify-end">
                  <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
                    {formatMoney(plan.amount, plan.currency)}
                  </span>
                  {plan.billingInterval && plan.billingInterval !== "NONE" ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      / {plan.billingInterval.toLowerCase().replace("_", " ")}
                    </span>
                  ) : null}
                </div>
                <span className="block text-[11px] text-muted-foreground">
                  Order priority: {plan.displayOrder ?? 0}
                </span>
              </div>
            )}

            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs font-medium"
              onClick={() => {
                if (editing) planMutation.mutate()
                else setEditing(true)
              }}
              disabled={planMutation.isPending}
            >
              {planMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : editing ? (
                <Save className="size-3.5" />
              ) : (
                <Pencil className="size-3.5" />
              )}
              {editing ? "Save Details" : "Edit Plan"}
            </Button>
          </div>
        </div>

        {editing ? (
          <div className="mt-5 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Edit Plan Details
                </p>
                <h4 className="text-sm font-semibold text-foreground">
                  Configure plan pricing and metadata
                </h4>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={resetPlanForm}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${plan.subscriptionPlanId}`} className="text-xs font-semibold text-muted-foreground">
                  Plan Name
                </Label>
                <Input
                  id={`name-${plan.subscriptionPlanId}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                  placeholder="e.g. REBYU Pro"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`price-${plan.subscriptionPlanId}`} className="text-xs font-semibold text-muted-foreground">
                  Price ({plan.currency ?? "PHP"})
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    ₱
                  </span>
                  <Input
                    id={`price-${plan.subscriptionPlanId}`}
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-9 pl-7 text-xs tabular-nums sm:text-sm"
                    min={0}
                    step={1}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Billing Interval</Label>
                <Select value={editInterval} onValueChange={setEditInterval}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["NONE", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "CUSTOM"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Plan Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`desc-${plan.subscriptionPlanId}`} className="text-xs font-semibold text-muted-foreground">
                  Plan Description
                </Label>
                <Textarea
                  id={`desc-${plan.subscriptionPlanId}`}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="text-xs sm:text-sm"
                  placeholder="Summary shown to learners on subscription selection..."
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetPlanForm}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => planMutation.mutate()}
                disabled={planMutation.isPending || !editName.trim()}
                className="gap-1.5"
              >
                {planMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between border-t border-border/70 bg-muted/15 px-5 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground sm:px-6 sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <Settings className="size-3.5 text-primary" />
              <span>
                Feature Entitlements & Access Limits ({entitlements.length} features
                {limitEntitlements.length > 0 ? `, ${limitEntitlements.length} with limits` : ""})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {entChanged ? (
                <Badge variant="destructive" className="text-[10px]">
                  Unsaved changes
                </Badge>
              ) : null}
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t border-border/70 bg-muted/10 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchEnt}
                  onChange={(e) => setSearchEnt(e.target.value)}
                  placeholder="Filter features..."
                  className="h-8 pl-8 pr-7 text-xs"
                />
                {searchEnt ? (
                  <button
                    type="button"
                    onClick={() => setSearchEnt("")}
                    className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  All
                </button>
                {Object.keys(categories).map((catName) => (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setSelectedCategory(catName)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
                      selectedCategory === catName
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {catName}
                  </button>
                ))}
              </div>
            </div>

            {entChanged ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <span className="font-semibold text-foreground">
                    You have modified entitlement configurations
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={resetEntitlements}>
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => entMutation.mutate()}
                    disabled={entMutation.isPending}
                    className="gap-1.5 shadow-xs"
                  >
                    {entMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save Entitlements
                  </Button>
                </div>
              </div>
            ) : null}

            {Object.keys(filteredCategories).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground sm:text-sm">
                No features match that filter.
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(filteredCategories).map(([category, codes]) => (
                  <div key={category} className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {category} ({codes.length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {codes.map((code) => {
                        const ent = entitlements.find((e) => e.entitlementCode === code)
                        if (!ent) return null
                        const edit = entEdits[code] ?? { enabled: ent.enabled, limitValue: ent.limitValue }
                        const hasLimit =
                          ent.limitValue != null ||
                          code === "AI_TUTOR_DAILY_GENERATIONS" ||
                          code.endsWith("_LIMIT")

                        return (
                          <div
                            key={code}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors",
                              edit.enabled
                                ? "border-border/80 hover:border-primary/40"
                                : "border-border/40 opacity-75 hover:opacity-100"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Switch
                                checked={edit.enabled}
                                onCheckedChange={() => toggleEntitlement(code)}
                                aria-label={`Toggle ${FEATURE_LABELS[code] ?? code}`}
                              />
                              <div className="min-w-0">
                                <p className={cn("text-xs font-medium sm:text-sm truncate", edit.enabled ? "text-foreground" : "text-muted-foreground")}>
                                  {FEATURE_LABELS[code] ?? code}
                                </p>
                                <p className="font-mono text-[10px] text-muted-foreground truncate">
                                  {code}
                                </p>
                              </div>
                            </div>

                            {hasLimit ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Label htmlFor={`limit-${plan.subscriptionPlanId}-${code}`} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Limit
                                </Label>
                                <Input
                                  id={`limit-${plan.subscriptionPlanId}-${code}`}
                                  type="number"
                                  value={edit.limitValue ?? ""}
                                  onChange={(e) => setEntLimit(code, e.target.value)}
                                  className="h-8 w-20 text-center text-xs font-semibold tabular-nums"
                                  placeholder="None"
                                  min={0}
                                />
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
              <span className="text-xs text-muted-foreground">
                Configured {enabledCount} of {entitlements.length} entitlements active
              </span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => entMutation.mutate()}
                disabled={entMutation.isPending || !entChanged}
              >
                {entMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save Entitlements
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function PartnershipPricingCard({ pricing, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(String(pricing?.pricePerSlot ?? 149))

  const mutation = useMutation({
    mutationFn: () => updateAdminPartnershipPricing(Number(price)),
    onSuccess: () => {
      toast.success("Partnership pricing updated")
      setEditing(false)
      onRefresh()
    },
    onError: (err) => toast.error(apiMessage(err, "Could not update pricing")),
  })

  const currentPrice = Number(pricing?.pricePerSlot ?? 149)
  const currency = pricing?.currency ?? "PHP"

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          icon={Building2}
          title="Partnership & Institutional Seat Pricing"
          description="The flat per-learner seat fee charged when partner universities request certification access for cohorts."
        />
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          className="shrink-0 gap-1.5 text-xs font-medium"
          onClick={() => {
            if (editing) mutation.mutate()
            else setEditing(true)
          }}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : editing ? (
            <Save className="size-3.5" />
          ) : (
            <Pencil className="size-3.5" />
          )}
          {editing ? "Save Rate" : "Edit Rate"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Price Per Learner Slot
          </p>
          {editing ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">₱</span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 w-36 text-lg font-bold tabular-nums"
                min={0}
                step={5}
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() => setPrice(String(Math.max(0, Number(price) - 10)))}
                >
                  -10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-2 text-xs"
                  onClick={() => setPrice(String(Number(price) + 10))}
                >
                  +10
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
              {formatMoney(currentPrice, currency)}
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            Per learner · Flat rate · All included certifications
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Invoicing Currency
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {currency}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            All institutional partnership quotations and invoices issued in PHP
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cohort Quotation Guide
          </p>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between border-b border-border/60 pb-1">
              <span className="text-muted-foreground">50 Learner Cohort:</span>
              <strong className="font-semibold text-foreground tabular-nums">
                {formatMoney(currentPrice * 50, currency)}
              </strong>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-1">
              <span className="text-muted-foreground">100 Learner Cohort:</span>
              <strong className="font-semibold text-foreground tabular-nums">
                {formatMoney(currentPrice * 100, currency)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">250 Learner Cohort:</span>
              <strong className="font-semibold text-foreground tabular-nums">
                {formatMoney(currentPrice * 250, currency)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 flex justify-end gap-2 border-t border-border/70 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false)
              setPrice(String(pricing?.pricePerSlot ?? 149))
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save Rate
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function UsagePreviewCard({ dailyLimit }) {
  const usedToday = 4
  const remaining = Math.max(dailyLimit - usedToday, 0)
  const percentage = dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 0
  const weeklyLimit = dailyLimit * 7
  const weeklyUsed = 28
  const weeklyPercentage = weeklyLimit > 0 ? (weeklyUsed / weeklyLimit) * 100 : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <SectionHeading
        icon={Gauge}
        title="Learner Portal Usage Preview"
        description="Visual preview of what Pro learners see on their personal dashboard and subscription usage card."
      />

      <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-border/80 bg-muted/20 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground sm:text-base">Your Quota Usage</h4>
            <Badge className="gap-1 bg-primary/10 text-xs font-semibold text-primary border-primary/25">
              <Crown className="size-3" /> Pro Active
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Live Widget</span>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-foreground">AI Tutor Daily Generations</span>
              <span className="tabular-nums font-semibold text-foreground">
                {usedToday} / {dailyLimit} used
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Resets daily at 12:00 AM</span>
              <span className="font-medium text-foreground">
                {remaining} generation{remaining !== 1 ? "s" : ""} left today
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-foreground">Weekly Aggregate</span>
              <span className="tabular-nums text-muted-foreground">
                {weeklyUsed} / {weeklyLimit} used
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-500/80 transition-all duration-500"
                style={{ width: `${Math.min(weeklyPercentage, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Weekly cycle resets every Monday at 12:00 AM
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            This quota is controlled directly by the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">AI_TUTOR_DAILY_GENERATIONS</code> limit
            on the Pro plan. Adjusting it in the Entitlements section above immediately changes the maximum available to subscribers.
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PricingManagementPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("all")

  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: getAdminPlans,
    staleTime: 30_000,
  })

  const pricingQuery = useQuery({
    queryKey: ["partnership-pricing"],
    queryFn: getPartnershipPricing,
    staleTime: 60_000,
  })

  const plans = Array.isArray(plansQuery.data) ? plansQuery.data : []
  const individualPlans = plans.filter((p) => p.customerType === "INDIVIDUAL")
  const institutionalPlans = plans.filter((p) => p.customerType === "INSTITUTION")
  const isLoading = plansQuery.isLoading || pricingQuery.isLoading
  const error = plansQuery.error || pricingQuery.error

  const proPlan = individualPlans.find((p) => !p.isFree)
  const aiLimitEnt = proPlan?.entitlements?.find((e) => e.entitlementCode === "AI_TUTOR_DAILY_GENERATIONS")
  const dailyLimit = aiLimitEnt?.limitValue ?? 10

  const activePlansCount = plans.filter((p) => p.status === "ACTIVE").length

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-plans"] })
    queryClient.invalidateQueries({ queryKey: ["individual-plans"] })
    queryClient.invalidateQueries({ queryKey: ["institutional-plans"] })
    queryClient.invalidateQueries({ queryKey: ["partnership-pricing"] })
  }

  const headerStats = [
    {
      label: "Active Plans",
      value: activePlansCount,
      hint: `${individualPlans.length} learner · ${institutionalPlans.length} institutional`,
      onSelect: () => setActiveTab("individual"),
      active: activeTab === "individual",
    },
    {
      label: "Pro Subscription",
      value: proPlan ? formatMoney(proPlan.amount, proPlan.currency) : "—",
      hint: proPlan?.billingInterval ? `per ${proPlan.billingInterval.toLowerCase()}` : "Monthly B2C tier",
      onSelect: () => setActiveTab("individual"),
      active: activeTab === "individual",
    },
    {
      label: "Partner Seat Rate",
      value: pricingQuery.data?.pricePerSlot != null ? formatMoney(pricingQuery.data.pricePerSlot, pricingQuery.data.currency) : "—",
      hint: "Per learner per certification",
      onSelect: () => setActiveTab("partnership"),
      active: activeTab === "partnership",
    },
    {
      label: "AI Tutor Daily Cap",
      value: `${dailyLimit} / day`,
      hint: "Configured on Pro plan",
      onSelect: () => setActiveTab("preview"),
      active: activeTab === "preview",
    },
  ]

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto pb-10">
      <DirectoryHeader
        title="Plans & Pricing"
        description="Configure learner subscription tiers, feature entitlements, institutional seat rates, and AI generation quotas."
        stats={headerStats}
      />

      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/70 pb-3">
        {[
          { id: "all", label: "All Pricing" },
          { id: "individual", label: "Individual Plans" },
          { id: "institutional", label: "Institutional Plans" },
          { id: "partnership", label: "Partner Seat Rates" },
          { id: "preview", label: "Usage Experience" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <h4 className="font-semibold">Failed to load pricing data</h4>
            <p className="mt-1 text-xs">{apiMessage(error, "Could not load pricing data.")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === "all" || activeTab === "individual" ? (
            <section className="space-y-4">
              <SectionHeading
                icon={Crown}
                title="Individual Subscription Plans"
                description="B2C subscription tiers available directly to learners. Free and Pro tiers."
                badge={`${individualPlans.length} configured`}
              />
              {individualPlans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                  No individual subscription plans found.
                </div>
              ) : (
                <div className="grid gap-4">
                  {individualPlans.map((plan) => (
                    <PlanCard
                      key={plan.subscriptionPlanId}
                      plan={plan}
                      type="individual"
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "all" || activeTab === "institutional" ? (
            <section className="space-y-4">
              <SectionHeading
                icon={Zap}
                title="Institutional Licensing Plans"
                description="B2B organizational tiers for partnered universities with cohort capacity limits and administrative controls."
                badge={`${institutionalPlans.length} configured`}
              />
              {institutionalPlans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 text-center text-xs sm:text-sm text-muted-foreground">
                  No standalone institutional plans configured. Institutional access is granted per-seat via Partnership Requests.
                </div>
              ) : (
                <div className="grid gap-4">
                  {institutionalPlans.map((plan) => (
                    <PlanCard
                      key={plan.subscriptionPlanId}
                      plan={plan}
                      type="institutional"
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "all" || activeTab === "partnership" ? (
            <section className="space-y-4">
              <PartnershipPricingCard
                pricing={pricingQuery.data}
                onRefresh={refresh}
              />
            </section>
          ) : null}

          {activeTab === "all" || activeTab === "preview" ? (
            <section className="space-y-4">
              <UsagePreviewCard dailyLimit={dailyLimit} />
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
