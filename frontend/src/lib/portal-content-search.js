const list = (value) => Array.isArray(value) ? value : []

export function buildPortalContentItems({ role, certifications = [], enrolledCertifications = [], lessons = [] }) {
  const items = new Map()
  const enrolled = new Set(list(enrolledCertifications).map((cert) => String(cert.certificationId)))
  for (const certification of [...list(certifications), ...list(enrolledCertifications)]) {
    const id = certification?.certificationId
    if (id == null || !certification.title) continue
    items.set(`certification:${id}`, {
      id: `certification:${id}`,
      label: certification.title,
      group: "Certification",
      description: certification.department || (role === "learner" && enrolled.has(String(id)) ? "Enrolled" : ""),
      href: role === "admin" ? `/admin/certification/${id}` : `/learner/certifications/${id}`,
    })
    if (role !== "admin") continue
    for (const majorCategory of list(certification.majorCategory)) {
      for (const middleCategory of list(majorCategory.middleCategory)) {
        for (const lesson of list(middleCategory.lessons)) {
          const name = lesson?.name || lesson?.title
          if (lesson?.lessonId == null || !name) continue
          items.set(`lesson:${lesson.lessonId}`, {
            id: `lesson:${lesson.lessonId}`, label: name, group: "Lesson", description: `${certification.title} · ${middleCategory.title || majorCategory.title || "Lesson editor"}`,
            href: `/admin/lessons/${encodeURIComponent(name)}/create`,
            state: { lessonId: lesson.lessonId, lessonName: name, certification, majorCategory, middleCategory },
          })
        }
      }
    }
  }
  if (role === "learner") {
    for (const lesson of list(lessons)) {
      const name = lesson?.name || lesson?.title
      if (lesson?.lessonId == null || !name || !enrolled.has(String(lesson.certificationId))) continue
      items.set(`lesson:${lesson.lessonId}`, {
        id: `lesson:${lesson.lessonId}`, label: name, group: "Lesson",
        description: [lesson.certificationTitle, lesson.middleCategoryTitle].filter(Boolean).join(" · "),
        href: `/learner/learning/${lesson.certificationId}/topics/${lesson.lessonId}`,
      })
    }
  }
  return [...items.values()]
}

export function searchPortalContent(items, query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return items.filter((item) => {
    const text = `${item.label} ${item.description || ""}`.toLocaleLowerCase()
    return terms.every((term) => text.includes(term))
  }).sort((a, b) => {
    const rank = (item) => {
      const label = item.label.toLocaleLowerCase()
      const value = query.trim().toLocaleLowerCase()
      return label === value ? 0 : label.startsWith(value) ? 1 : terms.every((term) => label.includes(term)) ? 2 : 3
    }
    return rank(a) - rank(b) || a.label.localeCompare(b.label)
  }).slice(0, 12)
}
