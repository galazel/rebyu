import { MoonIcon, SunIcon } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/use-theme"

function useIsDark() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return { isDark, toggle: () => setTheme(isDark ? "light" : "dark") }
}

export function PortalThemeMenuItem() {
  const { isDark, toggle } = useIsDark()
  const label = isDark ? "Light mode" : "Dark mode"

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault()
        toggle()
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {label}
    </DropdownMenuItem>
  )
}

export function PortalThemeToggle() {
  const { isDark, toggle } = useIsDark()
  const label = isDark ? "Use light theme" : "Use dark theme"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={toggle}
        >
          {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
