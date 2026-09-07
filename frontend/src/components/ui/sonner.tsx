import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "@/components/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-left"
      /* Lifted clear of the learner portal's bottom navigation bar, which is
         fixed to the foot of the screen below `lg` and is 4rem tall plus the
         home-indicator inset. At sonner's own mobile offset a toast landed on
         top of the first two tabs, so the confirmation of what you just did
         covered the control you would use next. Only the mobile offset moves:
         on a desktop there is no bar and the toast sits where it always did. */
      mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))", left: "1rem", right: "1rem" }}
      richColors={false}
      gap={10}
      visibleToasts={4}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        ),
        info: (
          <InfoIcon className="size-4 text-sky-600 dark:text-sky-400" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600 dark:text-red-400" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4500,
        classNames: {
          toast: "cn-toast netacad-toast",
          content: "netacad-toast-content",
          title: "netacad-toast-title",
          description: "netacad-toast-description",
          icon: "netacad-toast-icon",
          actionButton: "netacad-toast-action",
          cancelButton: "netacad-toast-cancel",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
