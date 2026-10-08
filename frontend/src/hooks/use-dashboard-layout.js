import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getBoardLayout,
  saveBoardLayout,
} from "@/services/dashboardLayoutService.js"

export function useDashboardLayout(board) {
  const queryClient = useQueryClient()
  const queryKey = ["dashboard-layout", board]

  const layoutQuery = useQuery({
    queryKey,
    queryFn: () => getBoardLayout(board),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const [rearranging, setRearranging] = useState(false)
  const [localLayout, setLocalLayout] = useState(null)

  const savedLayout = localLayout ?? layoutQuery.data?.tiles ?? null
  const tileLayout = savedLayout ?? []

  const saveLayoutMutation = useMutation({
    mutationFn: (tiles) => saveBoardLayout(board, tiles),

    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved)
      setLocalLayout(null)
    },

    onError: (error) => {
      setLocalLayout(null)
      console.warn("Saving the dashboard layout failed.", error)
      toast.error("Could not save your layout", {
        description:
          error?.response?.status === 404
            ? "The layout service isn't available, so arrangements cannot be saved yet."
            : "Your tiles have been put back where they were.",
      })
    },
  })

  const handleLayoutChange = (nextLayout) => {
    setLocalLayout(nextLayout)
    saveLayoutMutation.mutate(nextLayout)
  }

  const resetLayout = () => {
    setLocalLayout([])
    saveLayoutMutation.mutate([])
  }

  const [layoutBeforeEdit, setLayoutBeforeEdit] = useState(null)

  const startRearranging = () => {
    setLayoutBeforeEdit(savedLayout)
    setRearranging(true)
  }

  const finishRearranging = () => {
    setLayoutBeforeEdit(null)
    setRearranging(false)
  }

  const cancelRearranging = () => {
    const previous = layoutBeforeEdit
    finishRearranging()
    if (previous != null && JSON.stringify(previous) !== JSON.stringify(tileLayout)) {
      setLocalLayout(previous)
      saveLayoutMutation.mutate(previous)
    }
  }

  return {
    tileLayout,
    rearranging,
    handleLayoutChange,
    resetLayout,
    startRearranging,
    finishRearranging,
    cancelRearranging,
  }
}
