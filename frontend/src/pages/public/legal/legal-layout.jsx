import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft } from "@/components/icons"

import { BrandLogo } from "@/components/brand-logo"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"

export const LEGAL_LAST_UPDATED = "November 11, 2026"

/** Placeholder shown wherever the owner still has to supply a real address. */
export function ContactPlaceholder({ children = "[contact email to be added]" }) {
  return (
    <span className="rounded bg-rb-bee-wash px-1.5 py-0.5 font-bold text-rb-eel">{children}</span>
  )
}

const LEGAL_LINKS = [
  { to: "/terms", label: "Terms of use" },
  { to: "/privacy", label: "Privacy policy" },
  { to: "/guidelines", label: "Guidelines" },
]

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Shared shell for the public legal pages: chalkboard hero, a sticky table of
 * contents, and the sections on a graded sheet.
 *
 * sections: [{ title, body: ReactNode }]
 */
export function LegalLayout({ eyebrow, title, intro, sections }) {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = `${title} · REBYU`
    window.scrollTo(0, 0)
  }, [title])

  const withIds = sections.map((section, index) => ({
    ...section,
    id: `${index + 1}-${slugify(section.title)}`,
  }))

  return (
    <main className="rebyu-ds rb-light-only min-h-dvh bg-rb-polar text-rb-eel">
      <header className="sticky top-0 z-50 w-full border-b border-rb-swan bg-rb-snow/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo className="size-9" />
            <span className="rb-wordmark text-2xl leading-none text-rb-eel">REBYU</span>
          </Link>
          <nav aria-label="Legal pages" className="hidden gap-1 sm:flex">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={pathname === link.to ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                  pathname === link.to
                    ? "bg-rb-feather-wash text-rb-feather-lip"
                    : "text-rb-wolf hover:text-rb-eel"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="rb-classroom-photo px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto max-w-[1120px]">
          <div className="rb-chalkboard px-6 pb-12 pt-10 text-center sm:px-12">
            <p className="rb-chalk-label mx-auto">{eyebrow}</p>
            <h1 className="rb-chalk mt-5 text-[clamp(2.2rem,5vw,4rem)] leading-tight">{title}</h1>
            <p className="rb-chalk-body mx-auto mt-4 max-w-2xl text-lg">{intro}</p>
            <p className="rb-chalk-body mx-auto mt-4 text-sm opacity-80">
              Last updated {LEGAL_LAST_UPDATED}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="On this page" className="rb-graded-sheet p-5">
            <p className="rb-eyebrow">on this page</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {withIds.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 py-0.5 font-medium text-rb-wolf underline-offset-4 hover:text-rb-feather hover:underline"
                  >
                    <span className="rb-numeric w-5 shrink-0 text-rb-hare">{index + 1}.</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0 space-y-8">
          <div
            role="note"
            className="rounded-rb-tile border-2 border-rb-bee bg-rb-bee-wash px-5 py-4 text-sm leading-6 text-rb-eel"
          >
            <strong>Template notice.</strong> This page is a working draft written for the REBYU
            capstone platform. It has not been reviewed by a lawyer and must be checked and adapted by
            the platform owner before it is relied on. Bracketed items such as{" "}
            <ContactPlaceholder /> still need real details.
          </div>

          <div className="rb-graded-sheet space-y-10 p-6 sm:p-10">
            {withIds.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-t-2 border-rb-swan pt-10 first:border-t-0 first:pt-0"
              >
                <h2 className="rb-display rb-display-md !normal-case">
                  <span className="rb-numeric mr-2 text-rb-hare">{index + 1}.</span>
                  {section.title}
                </h2>
                <div className="legal-prose mt-4 space-y-4 text-[0.97rem] leading-7 text-rb-wolf [&_li]:pl-1 [&_strong]:text-rb-eel [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                  {section.body}
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <TactileButton asChild variant="ghost">
              <Link to="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to home
              </Link>
            </TactileButton>
            <nav aria-label="Other legal pages" className="flex flex-wrap gap-4 text-sm font-bold">
              {LEGAL_LINKS.filter((link) => link.to !== pathname).map((link) => (
                <Link key={link.to} to={link.to} className="text-rb-feather hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </article>
      </div>

      <footer className="border-t-2 border-rb-swan bg-rb-snow px-5 py-6 text-center text-sm text-rb-hare">
        © {new Date().getFullYear()} REBYU. All rights reserved.
      </footer>
    </main>
  )
}
