import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { getImportJob, getTagJob } from "@/services/pdfImportService.js"
import { activeJobs, addActiveJob, notify, removeActiveJob } from "@/utils/tag-job-registry.js"

const POLL_MS = 20000
const FINISHED = new Set(["done", "failed", "cancelled", "interrupted"])

export function TaggingJobWatcher() {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        let stopped = false
        async function check() {
            for (const job of activeJobs()) {
                const page = job.page ?? `/admin/certification/${job.certificationId}/question-bank/import`
                if (location.pathname === page) continue
                let current
                try {
                    current = job.kind === "import" ? await getImportJob(job.id) : await getTagJob(job.id)
                } catch (error) {
                    if (error?.response?.status === 404) removeActiveJob(job.id)
                    continue
                }
                if (stopped || !FINISHED.has(current.status)) continue
                const what = job.title ? ` for ${job.title}` : ""
                if (job.kind === "import") {
                    // Left in the registry: the import page still has to build
                    // the questions from the job when it is next opened.
                    if (job.notified) continue
                    addActiveJob({ ...job, notified: true })
                    const questions = current.papers.reduce((sum, entry) => sum + (entry.stage === "done" ? entry.questions : 0), 0)
                    const text = current.status === "done"
                        ? `The import${what} is finished: ${questions} questions read, checked and tagged. Open it to review and save them.`
                        : `The import${what} stopped (${current.status}). Open it to see what was finished.`
                    notify("REBYU import", text)
                    toast(current.status === "done" ? "Import finished" : "Import stopped", {
                        description: text,
                        duration: 30000,
                        action: { label: "Open", onClick: () => navigate(page) },
                    })
                    continue
                }
                removeActiveJob(job.id)
                const text =
                    current.status === "done"
                        ? `Tagging${what} is finished: ${current.tagged} questions. Open the import to review and save them.`
                        : `Tagging${what} stopped (${current.status}). Open the import to see what was tagged.`
                notify("REBYU import", text)
                toast(current.status === "done" ? "Tagging finished" : "Tagging stopped", {
                    description: text,
                    duration: 30000,
                    action: { label: "Open", onClick: () => navigate(page) },
                })
            }
        }
        check()
        const timer = setInterval(check, POLL_MS)
        return () => {
            stopped = true
            clearInterval(timer)
        }
    }, [location.pathname, navigate])

    return null
}
