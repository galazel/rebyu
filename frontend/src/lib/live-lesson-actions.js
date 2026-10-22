const ACTIONS = new Set(["scroll_to_section", "open_tab", "expand_accordion", "collapse_accordion", "reveal_card", "show_card_front", "select_lesson_image", "open_lesson_tool", "highlight_element"])

/** Only registry-owned nodes in the currently authorized lesson may be manipulated. */
export function createLessonActions(root, { now = Date.now, afterPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))) } = {}) {
  let manualUntil = 0
  let tutorUntil = 0
  const highlights = new Set()
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
      records.set(id, { node: tool, kind: "tool", label: `${tool.dataset.toolType}: ${tool.textContent?.trim().slice(0, 140)}` })
      const selectors = [["[data-live-tab]", "tab"], ["[data-live-accordion]", "accordion"], ["[data-live-card]", "card"], ["img", "image"]]
      for (const [selector, kind] of selectors) for (const [itemIndex, node] of [...tool.querySelectorAll(selector)].entries()) {
        const itemId = node.dataset.liveTab ?? node.dataset.liveAccordion ?? node.dataset.liveCard ?? itemIndex
        records.set(`${id}/${kind}:${itemId}`, { node, kind, label: (node.getAttribute("aria-label") || node.getAttribute("alt") || node.textContent || kind).trim().slice(0, 220) })
      }
    }
    return records
  }
  function catalog() {
    return [...registry()].slice(0, 180).map(([id, item]) => ({ id, kind: item.kind, label: item.label, state: item.node.getAttribute("aria-expanded") ?? item.node.getAttribute("aria-selected") ?? item.node.dataset.liveCardFace ?? null }))
  }
  async function execute({ action, targetId } = {}) {
    if (!ACTIONS.has(action) || typeof targetId !== "string" || targetId.length > 400) return { ok: false, error: "Unsupported lesson action." }
    const target = registry().get(targetId)
    if (!target || !root.contains(target.node)) return { ok: false, error: "That element is not available in this lesson. Refresh the catalog and choose an existing ID." }
    if (now() < manualUntil) return { ok: false, manualExploration: true, error: "The learner is exploring manually. Keep teaching without moving their view for a few seconds." }
    const { node, kind } = target
    const expected = { scroll_to_section: "section", open_tab: "tab", expand_accordion: "accordion", collapse_accordion: "accordion", reveal_card: "card", show_card_front: "card", select_lesson_image: "image", open_lesson_tool: "tool" }[action]
    if (expected && expected !== kind) return { ok: false, error: `This action requires a ${expected} target.` }
    tutorUntil = now() + 1500
    const before = node.getAttribute("aria-expanded") ?? node.getAttribute("aria-selected") ?? node.dataset.liveCardFace
    if (action === "open_tab" && node.getAttribute("aria-selected") !== "true") {
      // Radix selects tabs on mouse-down rather than click.
      node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }))
      node.click()
    }
    if (action === "expand_accordion" && node.getAttribute("aria-expanded") !== "true") node.click()
    if (action === "collapse_accordion" && node.getAttribute("aria-expanded") === "true") node.click()
    if (action === "reveal_card" && node.dataset.liveCardFace !== "back") node.click()
    if (action === "show_card_front" && node.dataset.liveCardFace !== "front") node.click()
    const bounds = node.getBoundingClientRect()
    if (bounds.top < 90 || bounds.top > window.innerHeight - 160 || bounds.bottom > window.innerHeight - 100) node.scrollIntoView({ behavior: "smooth", block: kind === "section" ? "start" : "center" })
    await afterPaint()
    if (!root.contains(node)) return { ok: false, error: "The lesson changed during this action." }
    const after = node.getAttribute("aria-expanded") ?? node.getAttribute("aria-selected") ?? node.dataset.liveCardFace
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
  return { catalog, execute, isTutorNavigation: () => now() < tutorUntil, dispose() { root.removeEventListener("wheel", manualExplore); root.removeEventListener("touchmove", manualExplore); highlights.forEach((item) => item.cancel()) } }
}
