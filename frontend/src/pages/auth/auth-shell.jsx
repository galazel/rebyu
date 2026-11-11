import { Link, useNavigate } from "react-router-dom"

import { ArrowLeft, MoonIcon, SunIcon } from "@/components/icons"
import { BrandLogo } from "@/components/brand-logo"
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx"
import { useTheme } from "@/hooks/use-theme"


function AuthThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  const label = isDark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="rb-btn rb-btn-ghost rb-btn-sm !min-h-[38px] !h-9.5 !w-9.5 !px-0 sm:!min-h-[42px] sm:!h-10 sm:!w-10 grid place-items-center text-rb-wolf hover:text-rb-eel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw cursor-pointer"
    >
      {isDark ? <SunIcon className="size-4" aria-hidden="true" /> : <MoonIcon className="size-4" aria-hidden="true" />}
    </button>
  )
}


const STORIES = {
  login: {
    caption: "your learning space is ready",
    line: "Ready to learn?",
    note: "sign in to continue your journey",
    banner: "Ready to learn?",
  },
  register: {
    caption: "a new journey begins",
    line: "Create your REBYU space.",
    note: "choose how you want to learn and lead",
    banner: "Create your REBYU space.",
  },
  recovery: {
    caption: "office hours",
    line: "Lost your key? We'll let you back in.",
    note: "one quick step",
    banner: "We'll let you back in.",
  },
}

export default function AuthShell({
  title,
  description,
  children,
  footer,
  compact = false,
  side = "left",
  story = "recovery",
  showBackButton = false,
  backTo = "/",
  backLabel = "Back",
  onBack,
}) {
  const navigate = useNavigate()
  const formFirst = side === "left"
  const tale = STORIES[story] ?? STORIES.recovery

  const handleBack = (e) => {
    if (onBack) {
      e.preventDefault()
      onBack()
      return
    }
    // Always go to the named target, never browser history: after logout the
    // previous entry is a protected page that bounces straight back to /login.
    e.preventDefault()
    navigate(backTo, { replace: true })
  }

  return (
    <main
      className={`rebyu-ds public-auth-shell min-h-dvh bg-rb-polar text-rb-eel lg:grid lg:grid-cols-2 ${
        compact ? "lg:h-dvh lg:overflow-hidden" : ""
      }`}
    >
      <section
        className={`relative flex min-h-dvh flex-col px-5 sm:px-8 lg:px-12 xl:px-16 ${
          compact ? "py-4 sm:py-5 lg:h-dvh lg:min-h-0 lg:overflow-y-auto" : "py-5 sm:py-7"
        } ${formFirst ? "lg:order-1" : "lg:order-2"}`}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw"
          >
            <BrandLogo className="size-9" />
            <span className="font-rb-display text-2xl leading-none text-rb-eel">REBYU</span>
          </Link>

          <div className="flex items-center gap-2">
            <AuthThemeToggle />
            {showBackButton ? (
              <Link
                to={backTo}
                onClick={handleBack}
                id="auth-back-button"
                className="rb-btn rb-btn-ghost rb-btn-sm !min-h-[38px] !h-9.5 px-3 sm:!min-h-[42px] sm:!h-10 sm:px-4 gap-1.5 text-xs sm:text-sm font-bold normal-case text-rb-eel hover:text-rb-eel transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw"
                aria-label={backLabel}
              >
                <ArrowLeft className="size-3.5 sm:size-4 shrink-0" aria-hidden="true" />
                <span>{backLabel}</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div
          className={`mx-auto flex w-full max-w-[500px] flex-1 flex-col [justify-content:safe_center] ${
            compact ? "py-3" : "py-10 sm:py-12"
          }`}
        >
          <div aria-hidden="true" className="rb-chalkboard mb-10 !border-8 px-4 py-3 text-center lg:hidden">
            <p className="rb-chalk text-xl">{tale.banner}</p>
          </div>

          <div className="rb-clipboard">
          <div className={`rb-auth-card ${compact ? "rb-auth-card-compact" : ""}`}>
            <div className={compact ? "mb-3" : "mb-7"}>
              {compact ? null : <p className="rb-eyebrow">certification preparation</p>}
              <h1 className={`rb-display ${compact ? "rb-display-md" : "rb-display-lg mt-2"}`}>{title}</h1>
              {description ? <p className={`rb-body max-w-md ${compact ? "mt-1.5" : "mt-3"}`}>{description}</p> : null}
            </div>

            {children}

            {footer ? (
              <div className={`rb-auth-card-footer rb-body text-center text-sm ${compact ? "mt-3 pt-3" : "mt-7 pt-6"}`}>
                {footer}
              </div>
            ) : null}
          </div>
          </div>
        </div>

        <p className={`text-xs font-semibold text-rb-wolf ${compact ? "lg:hidden" : ""}`}>© {new Date().getFullYear()} REBYU</p>
      </section>

      <aside
        aria-hidden="true"
        className={`rb-classroom-photo relative hidden min-h-dvh items-center justify-center overflow-hidden p-10 lg:flex ${
          compact ? "lg:h-dvh lg:min-h-0" : ""
        } ${formFirst ? "lg:order-2" : "lg:order-1"}`}
      >
        <div className="rb-chalkboard w-full max-w-lg px-10 pb-12 pt-9 text-center">
          <p className="rb-chalk-label mx-auto">{tale.caption}</p>
          <p className="rb-chalk mt-6 text-[clamp(2rem,3vw,3rem)] leading-tight">{tale.line}</p>
          <p className="rb-chalk mt-4 text-xl text-[var(--rb-chalk-yellow)]">{tale.note}</p>
          <TraySupplies />
        </div>
      </aside>
    </main>
  )
}
