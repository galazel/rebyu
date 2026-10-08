import { useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  deleteAllNotifications,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  streamNotifications,
} from "@/services/notificationService.js"

export const NOTIFICATIONS_QUERY_KEY = ["my-notifications"]

export function useNotifications() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getMyNotifications,
    staleTime: 15_000,
    retry: 1,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    [queryClient]
  )

  useEffect(() => {
    const close = streamNotifications({
      onNotification: invalidate,
      onOpen: invalidate,
    })
    return close
  }, [invalidate])

  const items = (Array.isArray(query.data) ? query.data : []).map((notification) => ({
    id: notification.id,
    title: notification.title,
    description: notification.body,
    createdAt: notification.createdAt,
    href: notification.href,
    read: notification.read,
  }))

  const unreadCount = items.filter((item) => !item.read).length

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
    onError: () => toast.error("Unable to mark everything as read."),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: invalidate,
    onError: () => toast.error("Unable to delete this notification."),
  })

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      invalidate()
      toast.success("All notifications cleared.")
    },
    onError: () => toast.error("Unable to clear your notifications."),
  })

  const open = useCallback(
    (item) => {
      if (!item) return
      if (!item.read && typeof item.id === "number") {
        markReadMutation.mutate(item.id)
      }
      if (item.href) {
        navigate(item.href)
      }
    },
    [markReadMutation, navigate]
  )

  return {
    items,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    open,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
    remove: deleteMutation.mutate,
    isRemoving: deleteMutation.isPending,
    removeAll: deleteAllMutation.mutate,
    isRemovingAll: deleteAllMutation.isPending,
  }
}
