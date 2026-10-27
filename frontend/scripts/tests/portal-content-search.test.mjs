import assert from "node:assert/strict"
import { buildPortalContentItems, searchPortalContent } from "../../src/lib/portal-content-search.js"

const certification = { certificationId: 4, title: "IT Passport Exam", majorCategory: [{ title: "Business", middleCategory: [{ title: "Operations", lessons: [{ lessonId: 246, name: "Decision tables" }] }] }] }
const lessons = [
  { lessonId: 246, name: "Decision tables", certificationId: 4, certificationTitle: "IT Passport Exam" },
  { lessonId: 999, name: "Private lesson", certificationId: 9 },
]
const learner = buildPortalContentItems({ role: "learner", certifications: [certification], enrolledCertifications: [certification], lessons })
assert.equal(learner.length, 2, "deduplicate certifications and exclude unenrolled lessons")
assert.deepEqual(searchPortalContent(learner, ""), [], "do not repeat navigation on empty search")
assert.equal(searchPortalContent(learner, "passport decision")[0].href, "/learner/learning/4/topics/246")
assert.equal(searchPortalContent(learner, "passport").length, 2)
assert.equal(searchPortalContent(learner, "nothing here").length, 0)
assert.equal(searchPortalContent(learner, "Private").length, 0)
const admin = buildPortalContentItems({ role: "admin", certifications: [certification] })
assert.equal(admin.length, 2)
const lesson = searchPortalContent(admin, "decision")[0]
assert.equal(lesson.href, "/admin/lessons/Decision%20tables/create")
assert.equal(lesson.state.lessonId, 246)
assert.equal(lesson.state.certification.certificationId, 4)
assert.equal(searchPortalContent(admin, "Passport")[0].group, "Certification", "prioritize title matches")
assert.deepEqual(buildPortalContentItems({ role: "learner" }), [])
assert.equal(searchPortalContent(Array.from({ length: 25 }, (_, i) => ({ label: `Match ${i}` })), "match").length, 12)
console.log("PASS: content indexing, enrollment scope, deduplication, multiword search, ranking, result cap and editor routes.")
