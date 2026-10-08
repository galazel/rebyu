
export function returnState(location) {
  const path = pathOf(location)
  return path ? { returnTo: path } : undefined
}

export function returnPath(location) {
  const value = location?.state?.returnTo
  if (typeof value !== "string" || value.length === 0) {
    return null
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null
  }
  return value
}

function pathOf(location) {
  if (!location || typeof location.pathname !== "string") {
    return null
  }
  return `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`
}
