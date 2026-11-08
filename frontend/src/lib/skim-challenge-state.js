// Nested chat, inputs and scrollable lesson widgets are not page-reading gestures.
export function isLessonScrollGesture(event, root) {
  const target = event.target
  if (event.type === "keydown" && target === document.body && root && !document.querySelector('[role="dialog"][aria-modal="true"]')) return true
  if (!root || !target || !root.contains(target)) return false
  if (target.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return false
  for (let node = target; node && node !== root; node = node.parentElement) {
    const style = getComputedStyle(node)
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return false
  }
  return true
}
