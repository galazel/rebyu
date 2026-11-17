import "./directory.css"

export function DirectoryHeader({ title, description, stats, children }) {
  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl min-w-0">
          <p className="mb-1 text-xs font-bold tracking-widest text-primary uppercase">
            Administration
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex w-full shrink-0 items-start gap-2 sm:w-auto">{children}</div>
      </div>
      <dl className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, hint, onSelect, active }) => (
          <div
            key={label}
            className={`min-w-0 rounded-xl border bg-card ${active ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
          >
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                aria-pressed={Boolean(active)}
                className="block min-h-24 sm:min-h-28 w-full rounded-xl p-3.5 sm:p-4 text-left hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="block text-xs font-semibold text-muted-foreground truncate">
                  {label}
                </span>
                <span className="mt-1.5 sm:mt-2 block text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {value}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground truncate">
                  {hint ?? "View records"}
                </span>
              </button>
            ) : (
              <div className="p-3.5 sm:p-4">
                <dt className="text-xs font-semibold text-muted-foreground truncate">
                  {label}
                </dt>
                <dd className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {value}
                </dd>
                {hint ? (
                  <p className="mt-1 text-xs text-muted-foreground truncate">{hint}</p>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </dl>
    </header>
  )
}

export function DirectoryResults({
  title,
  count,
  filtered,
  onReset,
  error,
  onRetry,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
      <div>
        <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground" role="status">
          {error
            ? "Records could not be loaded."
            : `${count.toLocaleString()} matching ${count === 1 ? "record" : "records"}`}
        </p>
      </div>
      {error ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-9 rounded-lg border px-3 text-xs font-semibold text-destructive sm:min-h-11 sm:text-sm"
        >
          Try again
        </button>
      ) : filtered ? (
        <button
          type="button"
          onClick={onReset}
          className="min-h-9 rounded-lg border px-3 text-xs font-semibold text-primary hover:bg-accent sm:min-h-11 sm:text-sm"
        >
          Clear filters
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">All records</span>
      )}
    </div>
  )
}
