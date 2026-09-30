import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  DollarSign,
  Gauge,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Zap,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
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
  getAdminPartnershipPricing,
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
  "Social & competitions": ["BATTLES_ACCESS", "CHALLENGES_ACCESS", "COMMUNITY_FULL_ACCESS", "WORLD_CUP_ACCESS"],
  "AI": ["AI_TUTOR", "AI_TUTOR_DAILY_GENERATIONS"],
}

const INSTITUTIONAL_CATEGORIES = {
  "Management": ["GROUP_MANAGEMENT", "AUTHORITY_MANAGEMENT", "LEARNER_ASSIGNMENT"],
  "Analytics & reporting": ["BASIC_MONITORING", "DETAILED_GROUP_ANALYTICS", "EXPORT_REPORTS", "ORG_WIDE_ANALYTICS", "AUDIT_LOGS"],
  "Capacity": ["SEAT_LIMIT", "CERTIFICATION_ALLOCATION_LIMIT", "GROUP_LIMIT", "AUTHORITY_LIMIT", "ORG_ADMIN_LIMIT"],
}

function formatMoney(amount, currency = "PHP") {
  const value = Number(amount)
  if (!Number.isFinite(value)) return "—"
  return value.toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 0 })
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
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

  const queryClient = useQueryClient()

  const planMutation = useMutation({
    mutationFn: () => updateAdminPlan(plan.subscriptionPlanId, {
      planName: editName,
      description: editDesc,
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
      toast.success("Entitlements saved")
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

  const entChanged = entitlements.some((e) => {
    const edit = entEdits[e.entitlementCode]
    return edit && (edit.enabled !== e.enabled || edit.limitValue !== e.limitValue)
  })

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {editing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 max-w-xs text-base font-semibold"
              />
            ) : (
              <h3 className="text-base font-semibold">{plan.planName}</h3>
            )}
            {plan.isFree ? (
              <Badge variant="secondary" className="text-[10px]">Free</Badge>
            ) : (
              <Badge className="gap-1 bg-primary/10 text-[10px] text-primary hover:bg-primary/10">
                <Crown className="size-2.5" /> Premium
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{plan.planCode}</Badge>
          </div>
          {editing ? (
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              placeholder="Plan description"
            />
          ) : plan.description ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{plan.description}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          {editing ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="h-8 w-28 tabular-nums"
                min={0}
              />
            </div>
          ) : plan.isCustomPricing ? (
            <span className="text-sm font-medium text-muted-foreground">Custom pricing</span>
          ) : (
            <>
              <p className="text-2xl font-bold tabular-nums">
                {formatMoney(plan.amount, plan.currency)}
              </p>
              {plan.billingInterval && plan.billingInterval !== "NONE" ? (
                <p className="text-xs text-muted-foreground">
                  / {plan.billingInterval.toLowerCase().replace("_", " ")}
                </p>
              ) : null}
            </>
          )}
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
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
            ) : null}
            {editing ? "Save plan" : "Edit"}
          </Button>
          {editing ? (
            <Button variant="ghost" size="sm" onClick={() => {
              setEditing(false)
              setEditName(plan.planName)
              setEditDesc(plan.description ?? "")
              setEditAmount(String(plan.amount ?? 0))
            }}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-3 border-t px-5 py-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Interval</Label>
            <Select value={editInterval} onValueChange={setEditInterval}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["NONE", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "CUSTOM"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Status</Label>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 border-t px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
            {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            {entitlements.length} entitlements
            {limitEntitlements.length > 0 ? ` · ${limitEntitlements.length} with limits` : ""}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t px-5 py-4">
            {Object.entries(categories).map(([category, codes]) => {
              const matching = entitlements.filter((e) => codes.includes(e.entitlementCode))
              if (matching.length === 0) return null
              return (
                <div key={category}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{category}</p>
                  <div className="grid gap-1.5">
                    {codes.map((code) => {
                      const ent = entitlements.find((e) => e.entitlementCode === code)
                      if (!ent) return null
                      const edit = entEdits[code] ?? { enabled: ent.enabled, limitValue: ent.limitValue }
                      return (
                        <div key={code} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Switch
                              checked={edit.enabled}
                              onCheckedChange={() => toggleEntitlement(code)}
                              className="scale-75"
                            />
                            <span className={edit.enabled ? "" : "text-muted-foreground line-through"}>
                              {FEATURE_LABELS[code] ?? code}
                            </span>
                          </div>
                          {ent.limitValue != null || code === "AI_TUTOR_DAILY_GENERATIONS" || code.endsWith("_LIMIT") ? (
                            <Input
                              type="number"
                              value={edit.limitValue ?? ""}
                              onChange={(e) => setEntLimit(code, e.target.value)}
                              className="h-7 w-20 tabular-nums text-xs"
                              placeholder="—"
                              min={0}
                            />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {(() => {
              const categorised = new Set(Object.values(categories).flat())
              const uncategorised = entitlements.filter((e) => !categorised.has(e.entitlementCode))
              if (uncategorised.length === 0) return null
              return (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Other</p>
                  <div className="grid gap-1.5">
                    {uncategorised.map((ent) => {
                      const edit = entEdits[ent.entitlementCode] ?? { enabled: ent.enabled, limitValue: ent.limitValue }
                      return (
                        <div key={ent.entitlementCode} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Switch
                              checked={edit.enabled}
                              onCheckedChange={() => toggleEntitlement(ent.entitlementCode)}
                              className="scale-75"
                            />
                            <span className={edit.enabled ? "" : "text-muted-foreground line-through"}>
                              {FEATURE_LABELS[ent.entitlementCode] ?? ent.entitlementCode}
                            </span>
                          </div>
                          {ent.limitValue != null ? (
                            <Input
                              type="number"
                              value={edit.limitValue ?? ""}
                              onChange={(e) => setEntLimit(ent.entitlementCode, e.target.value)}
                              className="h-7 w-20 tabular-nums text-xs"
                              placeholder="—"
                              min={0}
                            />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-end pt-2">
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
                Save entitlements
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {!editing ? (
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3 text-[11px] text-muted-foreground">
          <span>Status: <Badge variant={plan.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">{plan.status}</Badge></span>
          <span className="text-border">·</span>
          <span>Order: {plan.displayOrder ?? 0}</span>
          <span className="text-border">·</span>
          <span>Currency: {plan.currency}</span>
          <span className="text-border">·</span>
          <span>Interval: {plan.billingInterval}</span>
        </div>
      ) : null}
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

  return (
    <div className="rounded-xl border bg-card p-5">
      <SectionHeading
        icon={DollarSign}
        title="Partnership pricing"
        description="The per-slot price charged when an institution requests certification access for its learners."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-dashed p-4">
          <Label className="text-xs text-muted-foreground">Price per learner slot</Label>
          {editing ? (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-lg font-bold">₱</span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 w-32 text-lg font-bold tabular-nums"
                min={0}
              />
            </div>
          ) : (
            <p className="mt-1.5 text-2xl font-bold tabular-nums">
              {formatMoney(pricing?.pricePerSlot, pricing?.currency)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Per learner, per certification, flat rate
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-4">
          <Label className="text-xs text-muted-foreground">Currency</Label>
          <p className="mt-1.5 text-2xl font-bold">{pricing?.currency ?? "PHP"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            All invoices are issued in this currency
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {editing ? (
          <>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save
            </Button>
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
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit price
          </Button>
        )}
      </div>
    </div>
  )
}

function UsagePreviewCard({ dailyLimit }) {
  const usedToday = 4
  const remaining = Math.max(dailyLimit - usedToday, 0)
  const percentage = dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 0
  const weeklyLimit = dailyLimit * 7
  const weeklyUsed = 28

  return (
    <div className="rounded-xl border bg-card p-5">
      <SectionHeading
        icon={Gauge}
        title="Learner usage display"
        description="What Pro learners see on their subscription page — daily AI generation usage with progress bars and reset times."
      />

      <div className="mx-auto mt-5 max-w-md rounded-xl border bg-muted/30 p-5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Your usage</p>
          <Badge className="gap-1 bg-primary/10 text-[10px] text-primary hover:bg-primary/10">
            <Crown className="size-2.5" /> Pro
          </Badge>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">AI tutor generations</span>
              <span className="tabular-nums text-muted-foreground">{usedToday} / {dailyLimit} used</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Resets daily at 12:00 AM · {remaining} generation{remaining !== 1 ? "s" : ""} left today
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">This week</span>
              <span className="tabular-nums text-muted-foreground">{weeklyUsed} / {weeklyLimit} used</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${weeklyLimit > 0 ? (weeklyUsed / weeklyLimit) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Resets Monday 12:00 AM
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            This is how the usage card appears to Pro learners.
            The daily limit of <strong className="text-foreground">{dailyLimit}</strong> is
            set by the <code className="rounded bg-muted px-1 py-0.5 text-[10px]">AI_TUTOR_DAILY_GENERATIONS</code> entitlement
            on the Pro plan — change it in the entitlements above and it updates here.
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PricingManagementPage() {
  const queryClient = useQueryClient()

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

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-plans"] })
    queryClient.invalidateQueries({ queryKey: ["individual-plans"] })
    queryClient.invalidateQueries({ queryKey: ["institutional-plans"] })
    queryClient.invalidateQueries({ queryKey: ["partnership-pricing"] })
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto pb-10">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold">Pricing & plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscription plans, partnership pricing, plan features, and AI credit limits.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {apiMessage(error, "Could not load pricing data.")}
        </p>
      ) : (
        <>
          <section className="space-y-4">
            <SectionHeading
              icon={Crown}
              title="Individual plans"
              description="B2C subscription plans available to learners. Free and Pro tiers."
            />
            {individualPlans.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No individual plans found.
              </p>
            ) : (
              <div className="grid gap-4">
                {individualPlans.map((plan) => (
                  <PlanCard key={plan.subscriptionPlanId} plan={plan} type="individual" onRefresh={refresh} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <SectionHeading
              icon={Zap}
              title="Institutional plans"
              description="B2B licensing plans for partnered institutions. Capacity limits and management features."
            />
            {institutionalPlans.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No institutional plans configured. Institutional access is granted through partnership requests.
              </p>
            ) : (
              <div className="grid gap-4">
                {institutionalPlans.map((plan) => (
                  <PlanCard key={plan.subscriptionPlanId} plan={plan} type="institutional" onRefresh={refresh} />
                ))}
              </div>
            )}
          </section>

          <PartnershipPricingCard pricing={pricingQuery.data} onRefresh={refresh} />

          <UsagePreviewCard dailyLimit={dailyLimit} />
        </>
      )}
    </div>
  )
}
