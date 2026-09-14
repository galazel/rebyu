import { Link } from "react-router-dom"

import { BrandLogo } from "@/components/brand-logo"
import { BackButton } from "@/components/rebyu/rebyu-ui.jsx"

/**
 * Two-column frame shared by every auth route.
 *
 * One column is the form, printed on an inked comic card over halftone
 * newsprint. The other is a single full-height sky panel whose caption and
 * speech bubble depend on the screen:
 *
 *   login     "previously on rebyu…"  -- the recap page: you are returning.
 *   register  "chapter 1: origin story" -- you vs. the exam, and the four
 *             real steps the product walks a new learner through.
 *   recovery  (forgot password, verify email, set password) -- a shorter page;
 *             these are errands, not a welcome.
 *
 * `side` alternates which column the form occupies. Sign-in and sign-up are
 * the two screens people bounce between, and moving the form across on the
 * switch makes the change of screen unmistakable.
 *
 * The comic page is ornament -- every word a learner needs is in the form
 * column -- so it is hidden from assistive tech, and below `lg` it is replaced
 * by a one-panel banner above the form instead of being dropped silently.
 */

const STORIES = {
  login: {
    caption: "previously on rebyu…",
    bubble: "welcome back, hero!",
    hand: "pick up where you left off",
    banner: "welcome back, hero!",
  },
  register: {
    caption: "chapter 1: origin story",
    bubble: "every hero has an origin story.",
    hand: "yours starts here",
    banner: "every hero starts somewhere.",
  },
  recovery: {
    caption: "a small detour…",
    bubble: "lost your way? we'll get you back.",
    hand: "one quick step",
    banner: "we'll get you back in.",
  },
}

function SkyPanel({ story, className = "" }) {
  return (
    <div className={`rb-panel relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[url('/brand/sky-2560.webp')] bg-cover bg-[center_72%]" />
      <p className="rb-caption-box absolute left-[8%] top-[7%]">{story.caption}</p>
      <div className="rb-bubble rb-bubble-tail-left absolute left-[8%] top-[17%] max-w-[26rem] px-7 py-6">
        <p className="rb-display text-[clamp(2rem,3vw,3rem)] !leading-[1.05]">{story.bubble}</p>
        <p className="rb-hand mt-3">{story.hand}</p>
      </div>
    </div>
  )
}

/* One panel, the whole height of the column: the anime sky and this screen's
   line. The multi-panel page it replaced was too busy beside a form. */
function ComicPage({ storyKey }) {
  return (
    <div className="rb-comic-page h-full">
      <SkyPanel story={STORIES[storyKey]} className="h-full" />
    </div>
  )
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
  const storyKey = STORIES[story] ? story : "recovery"

  return (
    <main
      className={`rebyu-ds rb-light-only public-auth-shell min-h-dvh bg-rb-polar text-rb-eel lg:grid lg:grid-cols-2 ${
        compact ? "lg:h-dvh lg:overflow-hidden" : ""
      }`}
    >
      <section
        className={`rb-halftone relative flex min-h-dvh flex-col px-5 sm:px-8 lg:px-12 xl:px-16 ${
          compact ? "py-4 sm:py-5 lg:h-dvh lg:min-h-0 lg:overflow-y-auto" : "py-5 sm:py-7"
        } ${formFirst ? "lg:order-1" : "lg:order-2"}`}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw"
          >
            <BrandLogo className="size-9" />
            <span className="font-rb-display text-2xl leading-none text-rb-eel">rebyu</span>
          </Link>

          <BackButton asChild size="sm" label="Back to home">
            <Link to="/" />
          </BackButton>
        </div>

        <div
          /* `safe center`: centred while it fits, top-aligned once it does not, so
              a tall form scrolls instead of losing its heading off the top. */
          className={`mx-auto flex w-full max-w-[500px] flex-1 flex-col [justify-content:safe_center] ${
            compact ? "py-3" : "py-10 sm:py-12"
          }`}
        >
          {/* Below lg the comic page is hidden, so the screen keeps one panel
              of it: the sky and this screen's line. */}
          <div aria-hidden="true" className="rb-comic-frame mb-6 !p-2 lg:hidden">
            <div className="rb-comic-page">
              <div className="rb-panel relative h-28 overflow-hidden sm:h-32">
                <div className="absolute inset-0 bg-[url('/brand/sky-1280.webp')] bg-cover bg-[center_70%]" />
                <div className="rb-bubble rb-bubble-tail-left absolute left-4 top-4 max-w-[80%] !rounded-[22px] px-4 py-2.5">
                  <p className="rb-display text-xl !leading-[1.05]">{STORIES[storyKey].banner}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rb-auth-card ${compact ? "rb-auth-card-compact" : ""}`}>
            <div className={compact ? "mb-3" : "mb-7"}>
              {/* Dropped on the long form: every line it takes is a line the
                  submit button loses on a laptop screen. */}
              {compact ? null : <p className="rb-caption-box">certification preparation</p>}
              <h1 className={`rb-display ${compact ? "rb-display-md" : "rb-display-lg mt-4"}`}>{title}</h1>
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

        <p className={`text-xs font-semibold text-rb-wolf ${compact ? "lg:hidden" : ""}`}>© {new Date().getFullYear()} Rebyu</p>
      </section>

      <aside
        aria-hidden="true"
        className={`relative hidden min-h-dvh overflow-hidden bg-white p-4 lg:block ${
          compact ? "lg:h-dvh lg:min-h-0" : ""
        } ${formFirst ? "lg:order-2" : "lg:order-1"}`}
      >
        <ComicPage storyKey={storyKey} />
      </aside>
    </main>
  )
}
