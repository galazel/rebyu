/**
 * Where an assessment should hand the learner back to.
 *
 * A learner working through a topic takes its quiz and expects to land back on
 * that topic afterwards. Before this, every finished assessment sent them to
 * the certification's curriculum roadmap instead -- the right certification,
 * but the wrong place inside it, so they had to find their way back to the unit
 * they had been reading a minute earlier.
 *
 * The origin is carried in router state rather than derived on the results
 * page, because the results payload knows the certification an attempt belongs
 * to and not the screen the learner opened it from. The same exam is reachable
 * from a topic, from the curriculum roadmap and from an attempt history, and
 * only the navigation itself knows which of those happened.
 *
 * State is deliberately not a query parameter: it never needs to be shared,
 * bookmarked or restored, and a stale one in a copied link would send somebody
 * to a page they were never on.
 */

/**
 * Router state for a link or navigate() that opens an assessment.
 *
 * Pass the location the learner is leaving. `useLocation()` gives one directly:
 *
 *     <Link to={path} state={returnState(location)} />
 */
export function returnState(location) {
  const path = pathOf(location)
  return path ? { returnTo: path } : undefined
}

/**
 * The return path carried by a location, or null when there is none.
 *
 * Null is the normal case rather than an error: an assessment opened from a
 * bookmark, a notification or a page refresh carries no origin, and callers
 * fall back to their own default.
 */
export function returnPath(location) {
  const value = location?.state?.returnTo
  if (typeof value !== "string" || value.length === 0) {
    return null
  }
  /* Only same-origin application paths. The value reaches here from router
     state, which a page can set from anything it was handed, so a protocol or
     a host in it would turn "continue learning" into a link off the site.
     A leading "//" is rejected for the same reason: browsers read it as a
     protocol-relative URL. */
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null
  }
  return value
}

/** Serializes a location the way the router would render it as a path. */
function pathOf(location) {
  if (!location || typeof location.pathname !== "string") {
    return null
  }
  return `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`
}
