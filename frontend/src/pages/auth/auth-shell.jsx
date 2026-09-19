import { Link } from "react-router-dom"

import { BrandWordmark } from "@/components/brand-logo"
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx"
import { BackButton } from "@/components/rebyu/rebyu-ui.jsx"

/**
 * Two-column frame shared by every auth route.
 *
 * One column is the form, on a sheet of paper held by a clipboard. The other is the
 * classroom: the painted room with a chalkboard in it, and on the board a line
 * that depends on the screen --
 *
 *   login     "class is in session" -- you are coming back
 *   register  "first day of class"  -- you are joining
 *   recovery  (forgot password, verify email, set password) -- an errand
 *
 * `side` alternates which column the form occupies, so switching between sign
 * in and sign up visibly changes the screen. The classroom column is ornament
 * and hidden from assistive tech; below `lg` it is replaced by a slim board
 * above the form rather than dropped silently.
 */

const STORIES = {
  login: {
    caption: "class is in session",
    line: "Welcome back to class!",
    note: "your seat is saved",
    banner: "Welcome back to class!",
  },
  register: {
    caption: "first day of class",
    line: "Welcome to your new classroom.",
    note: "grab a seat, let's begin",
    banner: "Welcome to your new classroom.",
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
}) {
  const formFirst = side === "left"
  const tale = STORIES[story] ?? STORIES.recovery

  return (
    <main
      className={`rebyu-ds rb-light-only public-auth-shell min-h-dvh bg-rb-polar text-rb-eel lg:grid lg:grid-cols-2 ${
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
            <BrandWordmark className="h-10" alt="REBYU" />
          </Link>

          <BackButton asChild size="sm" label="Back to home">
            <Link to="/" />
          </BackButton>
        </div>

        <div
          /* `safe center`: centred while it fits, top-aligned once it does not. */
          className={`mx-auto flex w-full max-w-[500px] flex-1 flex-col [justify-content:safe_center] ${
            compact ? "py-3" : "py-10 sm:py-12"
          }`}
        >
          {/* Below lg the classroom column is hidden; a slim board keeps the line. */}
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

        <p className={`text-xs font-semibold text-rb-wolf ${compact ? "lg:hidden" : ""}`}>© {new Date().getFullYear()} Rebyu</p>
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
