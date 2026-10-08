import { useState } from "react"
import {
  Award,
  Bell,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  Handshake,
  Loader2,
  Mail,
  RotateCcw,
  Trash2,
  Trophy
} from "@/components/icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/use-notifications.js"

const KINDS = [
  {
    test: /^results ready/i,
    icon: ClipboardCheck,
    tone: "bg-rb-macaw-wash text-rb-macaw-lip",
  },
  {
    test: /^retake started|^attempt #/i,
    icon: RotateCcw,
    tone: "bg-rb-beetle-wash text-rb-beetle-lip",
  },
  {
    test: /^achievement unlocked/i,
    icon: Trophy,
    tone: "bg-rb-bee-wash text-rb-bee-ink",
  },
  {
    test: /invit/i,
    icon: Mail,
    tone: "bg-rb-feather-wash text-rb-feather-lip",
  },
  {
    test: /partnership/i,
    icon: Handshake,
    tone: "bg-rb-fox-wash text-rb-fox-lip",
  },
  {
    test: /certification/i,
    icon: Award,
    tone: "bg-rb-leaf-wash text-rb-leaf",
  },
]

const DEFAULT_KIND = { icon: Bell, tone: "bg-rb-macaw-wash text-rb-macaw-lip" }

function kindOf(item) {
  const title = String(item?.title ?? "")
  return KINDS.find((kind) => kind.test.test(title)) ?? DEFAULT_KIND
}

function formatClock(value) {
  const date = new Date(value ?? "")
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date)
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function formatDayLabel(value) {
  const date = new Date(value ?? "")
  if (Number.isNaN(date.getTime())) return "Earlier"

  const now = new Date()
  const today = startOfDay(now)
  const day = startOfDay(date)

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()

  if (day === today) return "Today"
  if (day === yesterday) return "Yesterday"

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date)
}

function groupByDay(items) {
  const groups = []

  for (const item of items) {
    const label = formatDayLabel(item.createdAt)
    const current = groups[groups.length - 1]

    if (current && current.label === label) {
      current.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  }

  return groups
}

export default function NotificationsPage() {
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const inbox = useNotifications()

  const items = [...inbox.items].sort(
    (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
  )
  const unreadCount = inbox.unreadCount
  const isLoading = inbox.isLoading
  const isError = inbox.isError
  const isMarkingAllRead = inbox.isMarkingAllRead
  const isRemovingAll = inbox.isRemovingAll

  const open = (item) => {
    inbox.open(item)
  }

  const remove = (item) => {
    inbox.remove(item.id)
  }

  const markAllRead = () => {
    if (inbox.unreadCount > 0) inbox.markAllRead()
  }

  const removeAll = () => {
    if (inbox.items.length > 0) inbox.removeAll()
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-6">

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-rb-display text-2xl font-extrabold lowercase text-foreground">
            notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length
              ? `${items.length} notification${items.length === 1 ? "" : "s"}${
                  unreadCount ? ` · ${unreadCount} unread` : ""
                }`
              : "Updates about your account will appear here."}
          </p>
        </div>

        {items.length ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead()}
              disabled={unreadCount === 0 || isMarkingAllRead}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearAll(true)}
              disabled={isRemovingAll}
              className="text-muted-foreground hover:text-destructive"
            >
              {isRemovingAll ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Clear all
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading notifications">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-20 rounded-rb-card" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                Unable to load your notifications
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Bell className="size-8 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-rb-display font-extrabold lowercase text-foreground">
                  nothing here yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invitations, partnership updates, and other account activity land here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupByDay(items).map((group, index) => (
              <section key={`${group.label}-${index}`}>
                <h2 className="mb-1 font-rb-display text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  {group.label}
                </h2>

                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <li
                      key={`${item.source ?? "inbox"}-${item.id}`}
                      className="group relative flex items-start"
                    >
                      <button
                        type="button"
                        onClick={() => open(item)}
                        className="flex min-w-0 flex-1 items-start gap-3 rounded-rb-tile py-4 pl-3 pr-11 text-left transition-colors hover:bg-accent"
                      >
                        <span
                          className={`relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-rb-tile ${kindOf(item).tone}`}
                        >
                          {(() => {
                            const KindIcon = kindOf(item).icon
                            return <KindIcon className="size-4" aria-hidden="true" />
                          })()}
                          {item.read ? null : (
                            <span
                              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-rb-macaw ring-2 ring-background"
                              aria-hidden="true"
                            />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-3">
                            <span
                              className={`min-w-0 flex-1 truncate text-sm ${
                                item.read
                                  ? "font-medium text-foreground"
                                  : "font-semibold text-foreground"
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {formatClock(item.createdAt)}
                            </span>
                          </span>

                          {item.description ? (
                            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </span>
                          ) : null}
                        </span>

                        {item.href ? (
                          <ChevronRight
                            className="mt-1.5 size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(item)}
                        aria-label={`Delete notification: ${item.title}`}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              All {items.length} notification{items.length === 1 ? "" : "s"} will be permanently
              removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeAll()
                setConfirmClearAll(false)
              }}
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
