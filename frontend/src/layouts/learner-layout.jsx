import React, { Suspense, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpenCheck,
  CalendarDays,
  LogOutIcon,
  FilesIcon,
  SettingsIcon,
  Target,
  UserIcon,
} from "@/components/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatarUrl } from "@/hooks/use-avatar-url.js"
import { LearnerMobileNavigation, PortalTopNavigation } from "@/components/navigation/portal-navigation.jsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LearnerErrorState,
  LearnerLoadingSkeleton,
  getLearnerDisplayName,
} from "@/components/learner/learner-ui.jsx"
import {
  PROGRESS_ANALYTICS_PARAM,
  PROGRESS_ANALYTICS_STALE_TIME,
  getLearnerPortalData,
  getProgressAnalytics,
  progressAnalyticsQueryKey,
  readLearnerPortalSnapshot,
  writeLearnerPortalSnapshot,
} from "@/services/learnerAnalyticsService.js"
import { useAuth } from "@/context/auth-context.jsx"
import { NotificationBell } from "@/components/notification-bell.jsx"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"
import { useNotifications } from "@/hooks/use-notifications.js"
import { PortalThemeMenuItem } from "@/components/portal-theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"
import { StudyActivityHost } from "@/components/learner/study-activity-host.jsx"
import { PomodoroOverlay } from "@/components/learner/pomodoro-overlay.jsx"
import {
  CurriculumPageSkeleton,
  TopicPageSkeleton,
} from "@/components/learner/learning-skeletons.jsx"
import { LoadingSignal } from "@/components/loading-overlay.jsx"

function getInitials(name = "", email = "") {
  const source = name || email || "Learner"
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export default function LearnerLayout() {
  usePortalTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isTopicPage = /^\/learner\/learning\/[^/]+\/topics\/[^/]+$/.test(location.pathname)
  const isCurriculumPage = /^\/learner\/learning\/[^/]+$/.test(location.pathname)
  const isCertificationDetailPage = /^\/learner\/certifications\/[^/]+$/.test(location.pathname)
  const { user: authUser, logout: authLogout } = useAuth()
  const [searchValue, setSearchValue] = useState("")
  const entitlements = useLearnerEntitlements()

  const query = useQuery({
    queryKey: ["learner-portal-data"],
    queryFn: getLearnerPortalData,
    initialData: readLearnerPortalSnapshot,
    initialDataUpdatedAt: 0,
    staleTime: 30_000,
    gcTime: 60 * 60_000,
  })

  useEffect(() => {
    if (query.data) {
      writeLearnerPortalSnapshot(query.data)
    }
  }, [query.data])




  const queryClient = useQueryClient()
  const isProgressBoardRoute = /^\/learner\/(analytics|progress)\/?$/.test(location.pathname)
  const prefetchCertificationId = isProgressBoardRoute
    ? new URLSearchParams(location.search).get(PROGRESS_ANALYTICS_PARAM)
    : null

  useEffect(() => {
    if (!prefetchCertificationId) {
      return
    }

    queryClient.prefetchQuery({
      queryKey: progressAnalyticsQueryKey(prefetchCertificationId),
      queryFn: () => getProgressAnalytics(prefetchCertificationId),
      staleTime: PROGRESS_ANALYTICS_STALE_TIME,
    })
  }, [queryClient, prefetchCertificationId])

  const shellData = query.data ?? {
    user: authUser,
    identity: authUser,
    learner: authUser,
  }
  const displayName = getLearnerDisplayName(shellData)
  const avatarUrl = useAvatarUrl(
    shellData?.learner?.avatarKey ?? shellData?.identity?.avatarKey ?? null
  )
  const email =
    query.data?.user?.email ??
    query.data?.identity?.email ??
    authUser?.email ??
    ""
  const inbox = useNotifications()

  const outletContext = useMemo(
    () => ({
      data: shellData,
      searchValue,
      setSearchValue,
      refetch: query.refetch,
    }),
    [query.data, query.refetch, searchValue, shellData]
  )

  const logout = async () => {
    await authLogout()
    localStorage.removeItem("learner_id")
    localStorage.removeItem("userId")
    localStorage.removeItem("user_id")
    navigate("/login", { replace: true })
  }

  function RouteSkeleton() {
  return <LoadingSignal />
}


  return (
    <div className="rebyu-ds netacad-portal learner-portal flex min-h-screen flex-col">
      {!isTopicPage ? (
      <PortalTopNavigation role="LEARNER" actions={<>
            <NotificationBell
              items={inbox.items}
              unreadCount={inbox.unreadCount}
              loading={inbox.isLoading}
              emptyMessage="Certification invitations and assignments will appear here."
              onItemOpen={inbox.open}
              onMarkAllRead={inbox.markAllRead}
              onDelete={(item) => inbox.remove(item.id)}
            />

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Open account menu"
                    >
                      <Avatar>
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
                        <AvatarFallback>
                          {getInitials(displayName, email)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Account menu</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-56 p-2"
              >
                <DropdownMenuLabel>
                  <span className="block truncate">{displayName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {email || "Learner"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/learner/account")}>
                  <UserIcon />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/learner/plan")}>
                  <CalendarDays />
                  Study calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/learner/library")}>
                  <FilesIcon />
                  Library
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/learner/learning")}>
                  <BookOpenCheck />
                  My Learning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/learner/mistakes")}>
                  <Target />
                  Mistake bank
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/learner/subscription")}>
                  <SettingsIcon />
                  Plan and billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <PortalThemeMenuItem />
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
      </>} />
      ) : null}

        <main
          className={`rebyu-page ${isTopicPage ? "" : "pb-24 lg:pb-8"} ${
            isTopicPage || isCurriculumPage || isCertificationDetailPage
              ? "!max-w-none !gap-0 !p-0"
              : ""
          } ${
            !isTopicPage && (isCurriculumPage || isCertificationDetailPage)
              ? "!pb-24 lg:!pb-8"
              : ""
          }`}
        >
          {query.isError && !query.data ? (
            <LearnerErrorState error={query.error} onRetry={query.refetch} />
          ) : !query.data ? (
            <RouteSkeleton />
          ) : (
            <>
              {query.isFetching ? (
                <div className="mb-4 flex items-center gap-2 rounded-rb-card border border-border bg-card/80 px-4 py-2 text-xs text-muted-foreground">
                  <span className="size-2 animate-pulse rounded-full bg-rb-macaw-lip" />
                  Updating your learner data...
                </div>
              ) : null}
              <Suspense fallback={<RouteSkeleton />}>
                <Outlet context={outletContext} />
              </Suspense>
            </>
          )}
        </main>
      {!isTopicPage ? <LearnerMobileNavigation /> : null}


      <StudyActivityHost />
      <PomodoroOverlay />
    </div>
  )
}
