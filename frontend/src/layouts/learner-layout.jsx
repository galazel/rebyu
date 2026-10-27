import React, { Suspense, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAvatarUrl } from "@/hooks/use-avatar-url.js"
import { LearnerAppSidebar } from "@/components/learner/learner-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PortalTopbar } from "@/components/navigation/portal-topbar.jsx"
import { buildPortalContentItems } from "@/lib/portal-content-search.js"
import {
  LearnerErrorState,
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
import { pendingAccountSetup } from "@/services/authService.js"
import { NotificationBell } from "@/components/notification-bell.jsx"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"
import { useNotifications } from "@/hooks/use-notifications.js"
import { DepartmentCodeCard } from "@/components/learner/department-code-card.jsx"
import { StudyActivityHost } from "@/components/learner/study-activity-host.jsx"
import { PomodoroOverlay } from "@/components/learner/pomodoro-overlay.jsx"
import { LoadingSignal } from "@/components/loading-overlay.jsx"

export default function LearnerLayout() {
  usePortalTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isTopicPage = /^\/learner\/learning\/[^/]+\/topics\/[^/]+$/.test(location.pathname)
  const isCurriculumPage = /^\/learner\/learning\/[^/]+$/.test(location.pathname)
  const isCertificationDetailPage = /^\/learner\/certifications\/[^/]+$/.test(location.pathname)
  const showProfileSidebar = !isTopicPage
  const { user: authUser, logout: authLogout } = useAuth()
  const [searchValue, setSearchValue] = useState("")

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

  const [awaitingDepartmentCode, setAwaitingDepartmentCode] = useState(false)
  useEffect(() => {
    let cancelled = false
    pendingAccountSetup()
      .then((setup) => {
        if (cancelled || !setup) return
        // Department heads enter their code on the dashboard; institutions finish on the setup page.
        if (setup.type === "department") setAwaitingDepartmentCode(setup.code || true)
        else navigate(`/account-setup?type=${setup.type}`, { replace: true })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [navigate])




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
  const searchItems = useMemo(() => buildPortalContentItems({ role: "learner", ...shellData }), [shellData])
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
    <div className="rebyu-ds netacad-portal learner-portal min-h-screen">
      <SidebarProvider>
        {showProfileSidebar ? (
          <LearnerAppSidebar
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            onLogout={logout}
          />
        ) : null}
        <SidebarInset className="min-w-0">
          {!isTopicPage ? (
            <PortalTopbar role="learner" items={searchItems} loading={query.isPending} error={query.isError && !query.data} onRetry={() => query.refetch()} notifications={
                <NotificationBell
                  items={inbox.items}
                  unreadCount={inbox.unreadCount}
                  loading={inbox.isLoading}
                  emptyMessage="Certification invitations and assignments will appear here."
                  onItemOpen={inbox.open}
                  onMarkAllRead={inbox.markAllRead}
                  onDelete={(item) => inbox.remove(item.id)}
                />
            } />
          ) : null}
          <main data-route-content
          className={`rebyu-page ${isTopicPage ? "" : "pb-8"} ${
            isTopicPage || isCurriculumPage || isCertificationDetailPage
              ? "!max-w-none !gap-0 !p-0"
              : ""
          } ${
            !isTopicPage && (isCurriculumPage || isCertificationDetailPage)
              ? "!pb-8"
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
                <div
                  role="status"
                  aria-live="polite"
                  className="pointer-events-none fixed bottom-20 left-4 z-[70] flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-lg animate-in fade-in-0 slide-in-from-left-8 duration-300 sm:bottom-5 sm:left-5"
                >
                  <span
                    className="size-3.5 animate-spin rounded-full border-2 border-rb-feather/25 border-t-rb-feather"
                    aria-hidden="true"
                  />
                  Updating your learner data…
                </div>
              ) : null}
              {awaitingDepartmentCode ? (
                <DepartmentCodeCard
                  initialCode={typeof awaitingDepartmentCode === "string" ? awaitingDepartmentCode : ""}
                  onDismiss={() => setAwaitingDepartmentCode(false)} />
              ) : null}
              <Suspense fallback={<RouteSkeleton />}>
                <Outlet context={outletContext} />
              </Suspense>
            </>
          )}
          </main>
        </SidebarInset>
      </SidebarProvider>


      <StudyActivityHost />
      <PomodoroOverlay />
    </div>
  )
}
