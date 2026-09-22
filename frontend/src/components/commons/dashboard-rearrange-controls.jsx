import { Check, GripHorizontal, RotateCcw } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * The control cluster that puts a board into arrange mode.
 *
 * Read left to right:
 * 1. Reset layout (ghost, low emphasis)
 * 2. Cancel (outline, neutral dismiss)
 * 3. Done (primary solid with checkmark)
 *
 * All controls share identical 32px (h-8) height, text-xs font sizing,
 * and harmonious padding to prevent visual disproportions.
 */
export function DashboardRearrangeControls({
  rearranging,
  onStart,
  onFinish,
  onCancel,
  onReset,
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {rearranging ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3 text-muted-foreground/80" aria-hidden="true" />
            <span>Reset layout</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 px-3 text-xs font-medium rounded-lg border-border/80 bg-background hover:bg-muted/70 text-foreground transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onFinish}
                className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                aria-pressed={true}
                aria-label="Keep this arrangement"
              >
                <Check className="size-3.5" aria-hidden="true" />
                <span>Done</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Keep this arrangement
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 h-8 p-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              aria-pressed={false}
              aria-label="Rearrange tiles"
              onClick={onStart}
            >
              <GripHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Rearrange tiles
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
