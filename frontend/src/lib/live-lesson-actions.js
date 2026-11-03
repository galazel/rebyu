const OPEN_ACTION = { tab: "open_tab", accordion: "expand_accordion", card: "reveal_card", image: "select_lesson_image", hotspot: "open_lesson_tool", video: "open_lesson_tool" }
const ACTIONS = new Set(["scroll_to_section", "open_tab", "expand_accordion", "collapse_accordion", "reveal_card", "show_card_front", "select_lesson_image", "open_lesson_tool", "highlight_element"])
const stateOf = (node) => node.getAttribute("aria-expanded") ?? node.getAttribute("aria-selected") ?? node.getAttribute("aria-pressed") ?? node.dataset.liveCardFace
const COMMON_WORDS = new Set(["the", "and", "with", "this", "that", "lesson", "explain", "example", "teaching", "demonstrate", "about", "for"])
const words = (text) => String(text ?? "").toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((word) => !COMMON_WORDS.has(word)) ?? []

/** Only registry-owned nodes in the currently authorized lesson may be manipulated. */
export function createLessonActions(root, { now = Date.now, afterPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))) } = {}) {
  let manualUntil = 0
  let tutorUntil = 0
  const highlights = new Set()
  const openedMedia = new Set()
  function closeTutorMedia(except) {
    for (const owner of openedMedia) {
      if (owner === except) continue
      const dialog = [...document.querySelectorAll("[data-live-media-owner]")].find((item) => item.dataset.liveMediaOwner === owner)
      dialog?.querySelector("[data-live-media-close]")?.click()
      openedMedia.delete(owner)
    }
  }
  function manualExplore() { if (now() > tutorUntil) manualUntil = now() + 9000 }
  root.addEventListener("wheel", manualExplore, { passive: true })
  root.addEventListener("touchmove", manualExplore, { passive: true })
  function registry() {
    const records = new Map()
    const sections = [...root.querySelectorAll("[data-live-section-id]")]
    for (const section of sections) records.set(`section:${section.dataset.liveSectionId}`, { node: section, kind: "section", label: section.dataset.liveTitle || section.querySelector("h2")?.textContent || "Section" })
    for (const [index, tool] of [...root.querySelectorAll("[data-tool-id]")].entries()) {
      const section = tool.closest("[data-live-section-id]")
      const id = `tool:${section?.dataset.liveSectionId ?? "lesson"}:${tool.dataset.toolId || index}`
      const sectionId = section?.dataset.liveSectionId
      records.set(id, { node: tool, kind: "tool", sectionId, label: `${tool.dataset.toolType}: ${tool.dataset.liveTitle || tool.textContent?.trim().slice(0, 140)}` })
      const selectors = [["[data-live-tab]", "tab"], ["[data-live-accordion]", "accordion"], ["[data-live-card]", "card"], ["[data-live-image-trigger]", "image"], ["[data-live-hotspot]", "hotspot"], ["[data-live-video-trigger]", "video"]]
      for (const [selector, kind] of selectors) for (const [itemIndex, node] of [...tool.querySelectorAll(selector)].entries()) {
        const itemId = node.dataset.liveTab ?? node.dataset.liveAccordion ?? node.dataset.liveCard ?? node.dataset.liveHotspot ?? itemIndex
        records.set(`${id}/${kind}:${itemId}`, { node, kind, sectionId, toolId: id, label: (node.getAttribute("aria-label") || node.getAttribute("alt") || node.textContent || kind).trim().slice(0, 220) })
      }
    }
    return records
  }
  function catalog() {
    return [...registry()].slice(0, 180).map(([id, item]) => ({ id, kind: item.kind, sectionId: item.sectionId, label: item.label, action: OPEN_ACTION[item.kind], state: stateOf(item.node) ?? null }))
  }
  async function execute({ action, targetId } = {}) {
    if (!ACTIONS.has(action) || typeof targetId !== "string" || targetId.length > 400) return { ok: false, error: "Unsupported lesson action." }
    const target = registry().get(targetId)
    if (!target || !root.contains(target.node)) return { ok: false, error: "That element is not available in this lesson. Refresh the catalog and choose an existing ID." }
    if (now() < manualUntil) return { ok: false, manualExploration: true, error: "The learner is scrolling the page themselves. Do not mention or acknowledge this. Silently skip the navigation and continue the current explanation." }
    const { node, kind } = target
    if (action === "open_lesson_tool" && kind === "tool") {
      const child = [...registry()].find(([, item]) => item.toolId === targetId && OPEN_ACTION[item.kind])
      if (child) return execute({ action: OPEN_ACTION[child[1].kind], targetId: child[0] })
      // A text/table/code tool is already visible; never click arbitrary buttons (e.g. quiz submission).
    }
    const expected = { scroll_to_section: "section", open_tab: "tab", expand_accordion: "accordion", collapse_accordion: "accordion", reveal_card: "card", show_card_front: "card", select_lesson_image: "image", open_lesson_tool: "tool" }[action]
    if (expected && expected !== kind && !(action === "open_lesson_tool" && ["hotspot", "video"].includes(kind))) return { ok: false, error: `This action requires a ${expected} target.` }
    tutorUntil = now() + 1500
    closeTutorMedia(node.dataset.liveMediaId)
    const before = stateOf(node)
    if (action === "open_tab" && node.getAttribute("aria-selected") !== "true") {
      // Radix selects tabs on mouse-down rather than click.
      node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }))
      node.click()
    }
    if (action === "expand_accordion" && node.getAttribute("aria-expanded") !== "true") node.click()
    if (action === "collapse_accordion" && node.getAttribute("aria-expanded") === "true") node.click()
    if (action === "reveal_card" && node.dataset.liveCardFace !== "back") node.click()
    if (action === "show_card_front" && node.dataset.liveCardFace !== "front") node.click()
    if ((action === "select_lesson_image" || (action === "open_lesson_tool" && kind === "video")) && before !== "true") {
      node.click()
      openedMedia.add(node.dataset.liveMediaId)
    }
    if (action === "open_lesson_tool" && kind === "hotspot" && before !== "true") node.click()
    const bounds = node.getBoundingClientRect()
    if (bounds.top < 90 || bounds.top > window.innerHeight - 160 || bounds.bottom > window.innerHeight - 100) node.scrollIntoView({ behavior: "smooth", block: kind === "section" ? "start" : "center" })
    await afterPaint()
    if (!root.contains(node)) return { ok: false, error: "The lesson changed during this action." }
    const after = stateOf(node)
    if ((action === "select_lesson_image" || (action === "open_lesson_tool" && ["hotspot", "video"].includes(kind))) && after !== "true") return { ok: false, error: "The requested media or image point did not open." }
    if ((action === "open_tab" || action === "expand_accordion") && after !== "true") return { ok: false, error: "The requested content did not open." }
    if (action === "collapse_accordion" && after !== "false") return { ok: false, error: "The accordion did not close." }
    if (action === "reveal_card" && after !== "back") return { ok: false, error: "The card did not reveal its content." }
    if (action === "show_card_front" && after !== "front") return { ok: false, error: "The card did not show its front." }
    if (typeof node.animate === "function") {
      const highlight = node.animate([{ outline: "3px solid rgba(115,179,233,.9)", outlineOffset: "5px" }, { outline: "3px solid transparent", outlineOffset: "5px" }], { duration: 1800 })
      highlights.add(highlight); highlight.onfinish = () => highlights.delete(highlight)
    }
    const container = node.closest("[data-tool-id]") || node
    return { ok: true, targetId, action, changed: before !== after, state: after ?? "visible", visibleText: container.innerText?.slice(0, 1800) ?? "", visualPixelsAvailable: false }
  }
  async function prepareTeachingStep(step, { canAct = () => true, navigate = true } = {}) {
    if (!canAct()) return { ok: false, error: "Teaching is paused or the learner is composing a response." }
    const sectionId = step.sectionId?.replace(/^section:/, "")
    if (!sectionId) return { ok: true, interactions: [], hint: "Choose a sectionId from lesson_catalog before discussing its tools." }
    const navigation = navigate ? await execute({ action: "scroll_to_section", targetId: `section:${sectionId}` }) : { ok: true }
    if (!navigation.ok || !canAct()) return { ...navigation, interactions: [] }
    // Match only within the stated section. Do not reveal quiz answers during oral questions.
    const interactions = []
    if (["explain", "demonstrate", "feedback"].includes(step.kind)) {
      const tokens = words(step.concept)
      const candidates = [...registry()].filter(([, item]) => item.sectionId === sectionId && OPEN_ACTION[item.kind])
      const ranked = candidates.map(([id, item]) => ({ id, item, score: words(item.label).filter((word) => tokens.includes(word)).length })).sort((a, b) => b.score - a.score)
      const match = ranked.find((item) => item.score > 0)
      if (canAct()) closeTutorMedia(match?.item.node.dataset.liveMediaId)
      if (match && canAct()) interactions.push(await execute({ action: OPEN_ACTION[match.item.kind], targetId: match.id }))
    } else if (canAct()) closeTutorMedia()
    return { ok: true, navigation, interactions, elements: catalog(), hint: "Use lesson_action with an exact catalog ID to reveal additional or newly mounted content before explaining it. Never claim a failed action succeeded." }
  }
  return { catalog, execute, prepareTeachingStep, isTutorNavigation: () => now() < tutorUntil, dispose() { closeTutorMedia(); root.removeEventListener("wheel", manualExplore); root.removeEventListener("touchmove", manualExplore); highlights.forEach((item) => item.cancel()) } }
}
