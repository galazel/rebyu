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

    onSuccess: (saved, submittedLayout) => {
      queryClient.setQueryData(queryKey, saved)
      // A later edit can start while an earlier save is still in flight. Only
      // clear the local copy when this response belongs to the layout currently
      // shown, otherwise an old response would make the board jump backwards.
      setLocalLayout((current) =>
        JSON.stringify(current) === JSON.stringify(submittedLayout) ? null : current,
      )
    },

    onError: (error, submittedLayout) => {
      // Restore the last confirmed server layout, but do not discard a newer
      // rearrangement the learner may already be making.
      setLocalLayout((current) =>
        JSON.stringify(current) === JSON.stringify(submittedLayout) ? null : current,
      )
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
    // Rearrange mode is a draft. Dragging should be instant and Cancel should
    // truly cancel, so the server is only updated after the learner presses Done.
    setLocalLayout(nextLayout)
  }

  const resetLayout = () => {
    // Keep reset inside the current editing session; it can still be cancelled
    // or confirmed with Done just like a drag.
    setLocalLayout(fallbackLayout)
    toast.success("Default layout ready to apply")
  }

  const startRearranging = () => {
    // Capture the displayed layout, including a board's explicit default. This
    // lets Cancel reliably restore a new board before it has ever been saved.
    setLayoutBeforeEdit(tileLayout)
    setRearranging(true)
  }

  const finishRearranging = () => {
    const nextLayout = localLayout ?? tileLayout
    const changed = JSON.stringify(nextLayout) !== JSON.stringify(layoutBeforeEdit)
    setLayoutBeforeEdit(null)
    setRearranging(false)
    if (changed) saveLayoutMutation.mutate(nextLayout)
  }

  const cancelRearranging = () => {
    // No request has been made while editing, so cancelling is immediate and
    // cannot race a delayed save from a previous drag.
    setLayoutBeforeEdit(null)
    setRearranging(false)
    setLocalLayout(null)
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
