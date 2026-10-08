import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "@/components/icons"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-slate-950/30 duration-200 supports-backdrop-filter:backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

const CLOSE_SIZE = 48
const VIEWPORT_MARGIN = 8

const CORNER_GAP = 8

function useCornerAnchor(
  el: HTMLElement | null,
  enabled: boolean
): React.CSSProperties | undefined {
  const [style, setStyle] = React.useState<React.CSSProperties>()

  React.useLayoutEffect(() => {
    if (!enabled || !el) return

    const clamp = (value: number, max: number) =>
      Math.min(Math.max(value, VIEWPORT_MARGIN), max - CLOSE_SIZE - VIEWPORT_MARGIN)

    const update = () => {
      const rect = el.getBoundingClientRect()
      setStyle({
        left: clamp(rect.right + CORNER_GAP, window.innerWidth),
        top: clamp(rect.top - CLOSE_SIZE / 2, window.innerHeight),
      })
    }

    update()

    let frame = 0
    const started = performance.now()
    const follow = () => {
      update()
      if (performance.now() - started < 400) frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)

    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener("resize", update)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [el, enabled])

  return style
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  overlayClassName?: string
}) {
  const [contentEl, setContentEl] = React.useState<HTMLDivElement | null>(null)
  const closeCorner = useCornerAnchor(contentEl, showCloseButton)

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      {showCloseButton && (
        <DialogPrimitive.Close data-slot="dialog-close" asChild>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            style={closeCorner}
            className={cn(
              "pointer-events-auto fixed z-51 inline-flex size-12 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-[0_4px_0_var(--border)] transition-[transform,box-shadow,filter] duration-75 hover:brightness-[0.98] active:translate-y-1 active:shadow-none motion-reduce:transition-none",
              closeCorner ? "opacity-100" : "opacity-0"
            )}
          >
            <ArrowLeftIcon className="size-4" />
          </button>
        </DialogPrimitive.Close>
      )}
      <DialogPrimitive.Content
        ref={setContentEl}
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl border border-border bg-popover p-6 text-base text-popover-foreground shadow-2xl shadow-slate-950/15 duration-200 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="sr-only">Close</DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-xl font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "max-w-prose text-[15px] leading-relaxed text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
