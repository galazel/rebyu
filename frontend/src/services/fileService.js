import { base, API } from "./base.js"

export function saveFile(lessonId, sectionName, toolId, folderName, file) {
  const formData = new FormData()

  formData.append("lessonId", lessonId)
  formData.append("sectionName", sectionName)
  formData.append("toolId", toolId)
  formData.append("folderName", folderName)
  formData.append("file", file)

  return base("files/upload", {
    method: "POST",
    data: formData,
  })
}

export function savePhotoCertification(file) {
  const formData = new FormData()

  formData.append("file", file)

  return base("files/upload/certification", {
    method: "POST",
    data: formData,
  })
}

export function getFileViewUrl(key) {
  return `${API}/files/view?key=${encodeURIComponent(key)}`
}

/**
 * Fetches a stored file as a Blob, for callers that need to *render* it.
 *
 * `/files/view` and `/files/download` both call requireAuth, and a browser
 * attaches no Authorization header to an <iframe src>, <img src> or <a href> --
 * so those URLs cannot load a protected file however correct they look. Going
 * through base() sends the bearer token; wrap the result in URL.createObjectURL
 * and point the element at that instead (and revoke it when done).
 */
export function fetchFileBlob(key) {
  return base(`files/view?key=${encodeURIComponent(key)}`, { responseType: "blob" })
}

/**
 * A short-lived URL that a viewer element can load directly.
 *
 * Use this instead of {@link fetchFileBlob} for anything the browser renders
 * itself -- a PDF, an image. The bytes come from storage to the browser without
 * passing through the API, so a large document streams (and pages in) rather
 * than being buffered whole at both ends; `/files/view` refuses anything over
 * 12 MB for exactly that reason. The signature is in the URL, so an <iframe> or
 * <img> can load it with no Authorization header.
 *
 * Returns { url, contentType, expiresInSeconds }.
 */
export function getFileViewLink(key, filename) {
  const params = new URLSearchParams({ key })
  if (filename) params.set("filename", filename)
  return base(`files/view-url?${params.toString()}`)
}

export function getFileDownloadUrl(key) {
  return `${API}/files/download?key=${encodeURIComponent(key)}`
}
