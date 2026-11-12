import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getBoardLayout,
  saveBoardLayout,
} from "@/services/dashboardLayoutService.js"

export function useDashboardLayout(board, defaultLayout = []) {
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
  const [layoutBeforeEdit, setLayoutBeforeEdit] = useState(null)

  // Keep the board's intended arrangement in one place. A new board and Reset
  // now receive the same explicit grid instead of rebuilding an uneven
  // auto-flow layout from the individual card dimensions.
  const fallbackLayout = useMemo(() => defaultLayout, [defaultLayout])
  const savedLayout = localLayout ?? layoutQuery.data?.tiles ?? null
  const tileLayout = savedLayout ?? fallbackLayout

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
    setRearranging(false)
    setLayoutBeforeEdit(null)
    setLocalLayout(fallbackLayout)
    queryClient.setQueryData(queryKey, { tiles: fallbackLayout })
    saveLayoutMutation.mutate(fallbackLayout)
    toast.success("Layout reset to default")
  }

  const startRearranging = () => {
    // Capture the displayed layout, including a board's explicit default. This
    // lets Cancel reliably restore a new board before it has ever been saved.
    setLayoutBeforeEdit(tileLayout)
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
