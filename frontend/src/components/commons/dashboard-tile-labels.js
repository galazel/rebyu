/* Readable names for each board's tiles, and each board's default arrangement:
   tiles of a similar height share a row, so no card is stretched beside a much
   taller one. Widths are on the 6-column grid. A saved layout always wins. */

/* The learner board's default (x, y, w, h on the 6-column grid; h in 88px rows). Reset returns
   to this. Set 2026-11-11 to the arrangement the user built and approved: Study next, the streak
   and a tall Today's plan on top; study notes, Exam readiness and Exam countdown beside the plan (split apart again
   the same day); then mastery,
   "study this first", score over time and assessment history. Narrow screens reflow it. */
export const LEARNER_PRESET = [
  { id: "next-up", x: 0, y: 0, w: 3, h: 4 },
  { id: "player-card", x: 3, y: 0, w: 1, h: 4 },
  { id: "todays-plan", x: 4, y: 0, w: 2, h: 9 },
  { id: "study-notes", x: 0, y: 4, w: 2, h: 5 },
  { id: "exam-readiness", x: 2, y: 4, w: 1, h: 5 },
  { id: "exam-countdown", x: 3, y: 4, w: 1, h: 5 },
  { id: "mastery-by-topic", x: 0, y: 9, w: 3, h: 4 },
  { id: "topic-mastery", x: 3, y: 9, w: 3, h: 4 },
  { id: "score-over-time", x: 0, y: 13, w: 3, h: 5 },
  { id: "assessment-history", x: 3, y: 13, w: 3, h: 5 },
]

export const ADMIN_DEFAULT = {
  order: [
    "admin-user-activity", "admin-online",
    "admin-studying", "admin-pro-revenue",
    "admin-learners-per-cert", "admin-plan-mix",
    "admin-revenue", "admin-commercial",
    "admin-growth", "admin-catalog",
    "admin-recent-payments", "admin-recent-partnerships",
  ],
  cols: { "admin-studying": 3, "admin-pro-revenue": 3 },
}

export const INSTITUTION_DEFAULT = {
  order: [
    "ent-key-figures",
    "ent-members", "ent-group-completion",
    "ent-progress",
    "ent-activity-trend",
    "ent-seats", "ent-allocations",
    "ent-invitations",
    "ent-member-table",
  ],
  cols: { "ent-invitations": 6 },
}

export const INSTITUTION_TILE_LABELS = {
  "ent-members": "Members & certifications",
  "ent-seats": "Learner slots & capacity",
  "ent-progress": "Average progress",
  "ent-key-figures": "Key figures",
  "ent-group-completion": "Department completion",
  "ent-activity-trend": "Activity over time",
  "ent-member-table": "Member table",
  "ent-invitations": "Invitations",
  "ent-allocations": "Certifications & access windows",
}

export const ADMIN_TILE_LABELS = {
  "admin-user-activity": "Active users",
  "admin-online": "Online now",
  "admin-studying": "Taking a certification",
  "admin-pro-revenue": "Pro revenue",
  "admin-learners-per-cert": "Learners per certification",
  "admin-plan-mix": "Plan mix",
  "admin-revenue": "Revenue",
  "admin-catalog": "Catalog",
  "admin-growth": "Growth",
  "admin-commercial": "Commercial",
  "admin-recent-payments": "Recent payments",
  "admin-recent-partnerships": "Recent partnerships",
}

export const LEARNER_TILE_LABELS = {
  "player-card": "Daily streak",
  "next-up": "Study next",
  "exam-readiness": "Exam readiness",
  "exam-countdown": "Exam countdown",
  "topic-mastery": "Study this first",
  "todays-plan": "Today's plan & study week",
  "study-notes": "Study notes",
  "score-over-time": "Score over time",
  "mastery-by-topic": "Mastery by topic",
  "assessment-history": "Assessment history",
}

export const DEPARTMENT_HEAD_TILE_LABELS = {
  "dh-kpis": "Headline numbers",
  "dh-alerts": "Needs your attention",
  "dh-watchlist": "Learners to check in with",
  "dh-sections": "Sections",
  "dh-metrics": "Metrics",
  "dh-announcements": "Latest announcements",
}
