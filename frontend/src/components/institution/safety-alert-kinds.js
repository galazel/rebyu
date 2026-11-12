/** Labels and colours for each kind of AI tutor safety alert (used by the admin's Safety alerts page). */
export const SAFETY_KIND = {
  SELF_HARM: {
    label: "Wellbeing: self-harm",
    tone: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200",
    action: "Check on this learner today. If they may be in immediate danger, follow your school's safeguarding process.",
  },
  ABUSE: {
    label: "Wellbeing: abuse disclosure",
    tone: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200",
    action: "Follow your safeguarding process and involve the guidance counselor. Don't ask the learner to repeat details.",
  },
  THREAT: {
    label: "Threat of violence",
    tone: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
    action: "Review it now and speak with the learner. Escalate to school security or authorities if it may be real.",
  },
  DATA_PROBE: {
    label: "Data access attempt",
    tone: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
    action: "The tutor shared nothing. Remind the learner of the acceptable-use rules.",
  },
}
