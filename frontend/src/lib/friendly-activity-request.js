/** Display old picker-generated requests naturally without changing stored chat history. */
export function friendlyActivityRequest(value) {
  if (typeof value !== 'string' || !/^(Create|Sequence)\b/.test(value) || !/\bthis lesson\b/.test(value)) return value
  return value.replace(/\s+using\s+show_[a-z_]+(?:\s+with\s+variant\s+[a-z_]+)?(?=[\s.]|$)/g, '')
}
