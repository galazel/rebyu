import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import LearnersPage from "../../src/pages/admin/learners-page.jsx"
import { TooltipProvider } from "../../src/components/ui/tooltip"
import { Table } from "../../src/components/ui/table"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
import "../../src/styles/rebyu-print.css"

const client = new QueryClient()
client.setQueryData(["admin-learners"], Array.from({ length: 80 }, (_, index) => ({
  learnerId: index + 1, firstName: `Learner ${String(index + 1).padStart(2, "0")}`,
  lastName: "With a long family name", email: `learner${index + 1}.averylongemailaddress@example.test`,
  institutionName: "Cebu Institute of Technology — University with a long institution name",
  learnerType: "institution", certificationCount: 12, progressPercentage: 78,
  status: "active", joinedAt: "2026-06-18",
})))

const role = new URLSearchParams(location.search).get("role") || "admin"
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={client}><TooltipProvider><MemoryRouter>
    <div className={`netacad-portal rebyu-ds ${role}-portal`}>
      <main className="rebyu-page" data-route-content>
        <LearnersPage />
        <section aria-label="Native institution table" className="min-w-0 rounded-xl border bg-card">
          <Table aria-label="Certification results"><thead><tr><th>Certification</th><th>Result</th><th>Actions</th></tr></thead>
            <tbody><tr><td>Information Technology Passport with a very long title</td><td>Passed</td><td><button type="button">View result</button></td></tr></tbody>
          </Table>
        </section>
      </main>
    </div>
  </MemoryRouter></TooltipProvider></QueryClientProvider>
)
