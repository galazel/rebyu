import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  deleteAllCommunityNotifications,
  deleteCommunityNotification,
  getCommunityNotifications,
  markAllCommunityNotificationsRead,
  markCommunityNotificationRead,
} from "@/services/communityService.js"

export const COMMUNITY_NOTIFICATIONS_QUERY_KEY = ["learner-community-notifications"]

export function useCommunityNotifications({ enabled = true } = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: COMMUNITY_NOTIFICATIONS_QUERY_KEY,
    queryFn: getCommunityNotifications,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: COMMUNITY_NOTIFICATIONS_QUERY_KEY }),
    [queryClient]
  )

  const items = (Array.isArray(query.data) ? query.data : []).map((notification) => ({
    ...notification,
    source: "community",
  }))

  const unreadCount = items.filter((item) => item.read === false).length

  const markReadMutation = useMutation({
    mutationFn: markCommunityNotificationRead,
    onSuccess: invalidate,
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllCommunityNotificationsRead,
    onSuccess: invalidate,
    onError: () => toast.error("Unable to mark everything as read."),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCommunityNotification,
    onSuccess: invalidate,
    onError: () => toast.error("Unable to delete this notification."),
  })

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllCommunityNotifications,
    onSuccess: invalidate,
    onError: () => toast.error("Unable to clear your notifications."),
  })

  return {
    items,
    unreadCount,
    isLoading: enabled && query.isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutateAsync,
    remove: deleteMutation.mutate,
    removeAll: deleteAllMutation.mutateAsync,
    isRemovingAll: deleteAllMutation.isPending,
  }
}
