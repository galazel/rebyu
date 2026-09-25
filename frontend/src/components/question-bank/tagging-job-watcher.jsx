import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { getTagJob } from "@/services/pdfImportService.js"
import { activeJobs, notify, removeActiveJob } from "@/utils/tag-job-registry.js"

const POLL_MS = 20000
const FINISHED = new Set(["done", "failed", "cancelled", "interrupted"])

/**
 * Says when a background tagging job finishes, from anywhere in the admin
 * area: the admin started "Tag with AI" on the import page and went on to
 * other work. The import page applies the results itself when it is next
 * opened; this only tells the admin it is time to.
 */
export function TaggingJobWatcher() {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        let stopped = false
        async function check() {
            for (const job of activeJobs()) {
                const page = `/admin/certification/${job.certificationId}/question-bank/import`
                // The import page reports its own job.
                if (location.pathname === page) continue
                let current
                try {
                    current = await getTagJob(job.id)
                } catch (error) {
                    if (error?.response?.status === 404) removeActiveJob(job.id)
                    continue
                }
                if (stopped || !FINISHED.has(current.status)) continue
                removeActiveJob(job.id)
                const what = job.title ? ` for ${job.title}` : ""
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
