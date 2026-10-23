import { useEffect, useId, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, X } from "@/components/icons"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { searchPortalContent } from "@/lib/portal-content-search.js"

export function PortalTopbar({ role, items, notifications, value, onValueChange, loading = false, error = false, onRetry }) {
  const [localQuery, setLocalQuery] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const resultsId = useId()
  const navigate = useNavigate()
  const query = value ?? localQuery
  const setQuery = onValueChange ?? setLocalQuery
  const results = searchPortalContent(items, query)
  const showResults = open && query.trim().length > 0

  useEffect(() => {
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  function closeSearch() {
    setOpen(false)
    setQuery("")
  }

  return (
    <header data-slot="portal-topbar" className="sticky top-0 z-40 border-b bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80" aria-label={`${role} toolbar`}>
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <SidebarTrigger className="shrink-0 md:hidden" aria-label={`Open ${role} navigation`} />
        <div className="relative min-w-0 flex-1 sm:max-w-md" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); event.target.blur() }
          if (event.key === "ArrowDown" && showResults) {
            const links = [...(document.getElementById(resultsId)?.querySelectorAll("a") || [])]
            const next = links[(links.indexOf(document.activeElement) + 1) % links.length]
            if (next) { event.preventDefault(); next.focus() }
          }
          if (event.key === "ArrowUp" && showResults) {
            const links = [...(document.getElementById(resultsId)?.querySelectorAll("a") || [])]
            const previous = links[(links.indexOf(document.activeElement) - 1 + links.length) % links.length]
            if (previous) { event.preventDefault(); previous.focus() }
          }
        }}>
          <form role="search" onSubmit={(event) => { event.preventDefault(); if (!loading && !error && results[0]) { navigate(results[0].href, { state: results[0].state }); closeSearch(); inputRef.current?.blur() } }}>
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/40 px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input ref={inputRef} type="search" aria-label={`Search ${role} portal`} aria-controls={showResults ? resultsId : undefined} aria-expanded={showResults} autoComplete="off" placeholder="Search certifications and lessons…" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true) }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); inputRef.current?.blur() } }} className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden" />
              {query ? <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus() }} className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"><X className="size-3" /></button> : <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Ctrl K</kbd>}
            </div>
          </form>
          {showResults ? (
            <div id={resultsId} className="absolute top-full left-0 mt-2 max-h-[min(420px,60dvh)] w-full min-w-[220px] overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg">
              <p className="px-3 py-2 text-xs font-medium text-muted-foreground">{loading ? "Searching…" : "Content results"}</p>
              {loading ? <p role="status" className="px-3 py-5 text-sm text-muted-foreground">Finding certifications and lessons…</p> : error ? <div role="status" className="px-3 py-5 text-sm text-muted-foreground">Search is unavailable right now.{onRetry ? <button type="button" onClick={onRetry} className="ml-2 font-medium text-primary underline">Try again</button> : null}</div> : results.length ? results.map((item) => {
                const Icon = item.icon
                return <Link key={item.id || item.href} to={item.href} state={item.state} onClick={closeSearch} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">{Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}<span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.label}</span>{item.description ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span> : null}</span>{item.group ? <span className="shrink-0 rounded-md bg-muted px-1.5 py-1 text-[10px] text-muted-foreground">{item.group}</span> : null}</Link>
              }) : <p role="status" className="px-3 py-5 text-sm text-muted-foreground">No matching content. Try a topic or certification name.</p>}
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex shrink-0 items-center">{notifications}</div>
      </div>
    </header>
  )
}
