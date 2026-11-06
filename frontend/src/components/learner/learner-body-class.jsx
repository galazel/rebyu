import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/** Marks <body> while a /learner route is open, so the learner-wide styles in
 *  styles/learner-ui.css also reach dialogs and sheets rendered into <body>. */
export function LearnerBodyClass() {
  const { pathname } = useLocation()
  const learner = pathname === "/learner" || pathname.startsWith("/learner/")
  useEffect(() => {
    document.body.classList.toggle("learner-portal", learner)
    return () => document.body.classList.remove("learner-portal")
  }, [learner])
  return null
}
