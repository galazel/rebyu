import { useEffect } from "react"
import axios from "axios"

import LearnerAssessmentAttemptPage from "@/pages/learner/assessments/learner-assessment-attempt-page.jsx"
import { buildAttemptFixture, resolveShowcaseId } from "./attempt-preview-fixtures.js"

const PREVIEW_LEARNER_ID = "999001"

if (localStorage.getItem("learnerId") !== PREVIEW_LEARNER_ID) {
  localStorage.setItem("learnerId", PREVIEW_LEARNER_ID)
  localStorage.setItem("userId", PREVIEW_LEARNER_ID)
  localStorage.setItem("role", "LEARNER")
  localStorage.setItem("name", "Preview Learner")
}

sessionStorage.clear()

function localResponse(config, data) {
  return Promise.resolve({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  })
}

function installPreviewAdapter() {
  if (axios.defaults.__rebyuPreviewAdapter) return
  axios.defaults.__rebyuPreviewAdapter = true

  axios.interceptors.request.use((config) => {
    const url = config.url ?? ""
    if (!url.includes("/api/")) return config

    if (/\/learner\/assessments\/[^/]+\/attempts$/.test(url)) {
      const requested = new URLSearchParams(window.location.search).get("item")
      config.adapter = (request) =>
        localResponse(request, buildAttemptFixture(resolveShowcaseId(requested)))
      return config
    }

    if (/\/learner\/assessment-attempts\//.test(url)) {
      if (/\/executions/.test(url)) {
        config.adapter = (request) => localResponse(request, [])
        return config
      }
      if (/\/run$/.test(url)) {
        config.adapter = (request) =>
          localResponse(request, {
            mode: "RUN",
            status: "COMPLETED",
            message: null,
            language: "Python",
            passedTests: null,
            totalTests: null,
            stdout: "True\nFalse\nTrue\n",
            stderr: null,
            tests: [],
          })
        return config
      }
      if (/\/(check|check-diagram)$/.test(url)) {
        config.adapter = (request) =>
          localResponse(request, {
            status: "NOT_RUN",
            message: "The executor is not enabled in preview.",
            testCases: [],
            rubric: [],
          })
        return config
      }
      config.adapter = (request) => localResponse(request, {})
      return config
    }

    config.adapter = (request) => localResponse(request, {})
    return config
  })
}

installPreviewAdapter()

export default function AttemptPreviewPage() {
  useEffect(() => {
    const stop = (event) => {
      event.stopImmediatePropagation()
    }
    window.addEventListener("beforeunload", stop, true)
    return () => window.removeEventListener("beforeunload", stop, true)
  }, [])

  return <LearnerAssessmentAttemptPage />
}
