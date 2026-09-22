import { base } from "./base"

/**
 * Importing an official past paper into a certification's question bank.
 *
 * Two calls, not one. `parsePastPaper` writes nothing: it returns a draft per
 * question, each carrying the lesson it was matched to, the confidence of
 * that match, and any problem found while reading it. `importPastPaper`
 * writes only what the admin approved.
 *
 * The split exists because both failure modes are quiet ones. The lesson is
 * chosen by embedding similarity, which is right about eight times in ten, and
 * a handful of questions per paper do not come out of the PDF's text layer
 * intact. Importing straight from an upload would hide both behind a count.
 */

/**
 * @param paperName what the required source citation is built from --
 *   "2025A_FE-A", "2023S_FE_AM", "2024A_IP". Not derived from the filename:
 *   these papers are published under terms that require accurate attribution,
 *   and a filename is not evidence of which sitting a paper is from.
 */
export function parsePastPaper({
  certificationId,
  paperName,
  kind = "subject_a",
  questionsFile,
  answersFile,
  onUploadProgress,
}) {
  const formData = new FormData()
  formData.append("certificationId", String(certificationId))
  formData.append("paperName", paperName)
  formData.append("kind", kind)
  formData.append("questions", questionsFile)
  formData.append("answers", answersFile)

  return base("ai/past-papers/parse", {
    method: "POST",
    data: formData,
    onUploadProgress,
    // Rendering every figure in a hundred-question paper takes minutes, and
    // the default timeout turns that into a failure the admin cannot
    // distinguish from a bad upload.
    timeout: 6 * 60 * 1000,
  })
}

export function importPastPaper({ certificationId, questions }) {
  return base("ai/past-papers/import", {
    method: "POST",
    data: { certificationId, questions },
    timeout: 3 * 60 * 1000,
  })
}
