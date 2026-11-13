import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "../../src/components/ui/tooltip"
import { ThemeProvider } from "../../src/components/theme-provider"
import DashboardLayout from "../../src/layouts/DashboardLayout.jsx"
import AiSettings from "../../src/pages/admin/ai-settings-page.jsx"
import Rewards from "../../src/pages/admin/rewards-management-page.jsx"
import CreateLessons from "../../src/pages/admin/create-lessons-page.jsx"
import { LearnerAppSidebar } from "../../src/components/learner/learner-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../src/components/ui/sidebar"
import { ai, live, certification, directoryLearners, directoryInstitutions, directoryRequests } from "./admin-mobile-data.mjs"
import CertificationQuestionBankPage from "../../src/pages/admin/certification-question-bank-page.jsx"
import { InstitutionQuestionBankPanel } from "../../src/pages/institution/certifications/institution-question-bank-page.jsx"
import Payments from "../../src/pages/admin/subscriptions-page.jsx"
import Institutions from "../../src/pages/admin/institutions-page.jsx"
import AdminInstitutionDetail from "../../src/pages/admin/admin-institution-detail-page.jsx"
import Learners from "../../src/pages/admin/learners-page.jsx"
import PartnershipRequests from "../../src/pages/admin/partnership-requests-page.jsx"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
client.setQueryData(["ai-settings"], ai)
client.setQueryData(["live-tutor-settings"], live)
client.setQueryData(["admin-rewards"], { lowScoreMinXp: 10, coinsPerAiCredit: 25 })
client.setQueryData(["certification-review-levels"], Array.from({ length: 20 }, (_, i) => ({ levelNumber: i + 1, title: "Review level with a long descriptive title", requiredXp: i * 100 })))
client.setQueryData(["admin-certifications", "question-bank-page"], [certification])
client.setQueryData(["certifications", "summary"], [certification])
client.setQueryData(["certifications", "summary", "1"], [certification])
client.setQueryDefaults(["institution-overview"], { staleTime: Infinity })
client.setQueryData(["institution-overview", 1], { institutionCerts: [{ institutionCertId: 1, certificationId: 1 }] })
client.setQueryData(["admin-learners"], directoryLearners)
client.setQueryData(["admin-institutions"], directoryInstitutions)
client.setQueryDefaults(["admin-institution"], { staleTime: Infinity })
client.setQueryData(["admin-institution", 1], directoryInstitutions[0])
client.setQueryData(["admin-institution-certificates"], [{ institutionCertId: 1, institutionId: 1, certificationId: 1, totalSlots: 100, usedSlots: 1, status: "ACTIVE", accessExpiryDate: "2027-12-01" }])
client.setQueryData(["admin-institution-certification-learners"], [{ institutionCertId: 1, learnerId: 1, status: "active", progressPercentage: 50 }, { institutionCertId: 1, learnerId: 2, status: "revoked", progressPercentage: 100, completedAt: "2026-01-01" }])
client.setQueryData(["admin-institution-organisation", 1], { departments: [], pendingInvitations: 0 })
client.setQueryDefaults(["admin-partnership-requests"], { staleTime: Infinity })
client.setQueryData(["admin-partnership-requests", "ALL"], directoryRequests)
function InstitutionContext() { return <Outlet context={{ institution: { institutionId: 1 } }} /> }
client.setQueryDefaults(["admin-subscriptions"], { staleTime: Infinity })
client.setQueryDefaults(["admin-payments"], { staleTime: Infinity })
client.setQueryData(["admin-subscriptions"], [{ learnerSubscriptionId: 1, learnerId: 1, learnerName: "Test learner", email: "long.email@example.test", active: true, status: "ACTIVE", amount: 199, planName: "Pro", currentPeriodEnd: "2027-01-01" }])
client.setQueryData(["admin-payments"], { payers: 1, certificationOrders: 0, proPayments: 1, proRevenue: 199, certificationRevenue: 0, payments: [{ key: "pro-1", learnerName: "Test learner", email: "long.email@example.test", kind: "Pro", item: "Pro monthly", reference: "checkout-123", amount: 199, status: "Active" }] })
const route = new URLSearchParams(location.search).get("page") || "ai-settings"
createRoot(document.getElementById("root")).render(<QueryClientProvider client={client}><ThemeProvider defaultTheme="light" storageKey="admin-mobile-fixture-theme"><TooltipProvider><MemoryRouter initialEntries={[`/admin/${route}`]}><Routes>
  <Route path="/admin" element={<DashboardLayout />}>
    <Route path="ai-settings" element={<AiSettings />} />
    <Route path="rewards" element={<Rewards />} />
    <Route path="certification/:id/question-bank" element={<CertificationQuestionBankPage />} />
    <Route path="subscriptions" element={<Payments />} />
    <Route path="institutions" element={<Institutions />} />
    <Route path="institutions/:id" element={<AdminInstitutionDetail />} />
    <Route path="learners" element={<Learners />} />
    <Route path="partnership-requests" element={<PartnershipRequests />} />
    <Route path="builder-institution" element={<InstitutionContext />}><Route index element={<InstitutionQuestionBankPanel certificationId="1" />} /></Route>
    <Route path="builder-department" element={<InstitutionContext />}><Route index element={<InstitutionQuestionBankPanel certificationId="1" departmentId={1} />} /></Route>
    <Route path="lessons/:name/create" element={<CreateLessons />} />
    <Route path="learner-menu" element={<SidebarProvider><LearnerAppSidebar displayName="Learner With A Long Name" email="long.learner.email@example.test" onLogout={() => {}} /><SidebarInset><SidebarTrigger aria-label="Open learner drawer" /></SidebarInset></SidebarProvider>} />
    <Route path="*" element={<p>Selected admin page</p>} />
  </Route>
</Routes></MemoryRouter></TooltipProvider></ThemeProvider></QueryClientProvider>)
