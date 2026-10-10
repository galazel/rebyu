import { Suspense, useEffect, useRef } from "react"
import { RouteErrorBoundary, lazyRoute } from "@/lib/lazy-route.jsx"
import { Navigate, Routes, Route, useLocation } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import { LoadingScreen } from "./components/loading-screen.jsx"
import { LoadingSignal } from "./components/loading-overlay.jsx"
import { isInstitutionOwner, roleHomePath, useAuth } from "./context/auth-context.jsx"

const DashboardLayout = lazyRoute(() => import("./layouts/DashboardLayout"))
const LearnerLayout = lazyRoute(() => import("./layouts/learner-layout.jsx"))
const InstitutionLayout = lazyRoute(() => import("./layouts/institution-layout.jsx"))
const LoginPage = lazyRoute(() => import("./pages/auth/login-page.jsx"))
const RegisterPage = lazyRoute(() => import("./pages/auth/register-page.jsx"))
const VerifyEmailPage = lazyRoute(() => import("./pages/auth/verify-email-page.jsx"))
const ForgotPasswordPage = lazyRoute(() => import("./pages/auth/forgot-password-page.jsx"))
const SetNewPasswordPage = lazyRoute(() => import("@/pages/auth/set-new-password-page.jsx"))
const Certifications = lazyRoute(() => import("./pages/admin/certifications-page.jsx"))
const Challenges = lazyRoute(() => import("./pages/admin/challenges-page.jsx"))
const Learners = lazyRoute(() => import("./pages/admin/learners-page.jsx"))
const Institutions = lazyRoute(() => import("./pages/admin/institutions-page.jsx"))
const AdminInstitutionDetail = lazyRoute(() => import("./pages/admin/admin-institution-detail-page.jsx"))
const ViewCertificationAdmin = lazyRoute(() => import("./pages/admin/view-certification-admin-page.jsx"))
const AdminDashboard = lazyRoute(() => import("./pages/admin/admin-dashboard-page.jsx"))
const PartnershipRequests = lazyRoute(() => import("./pages/admin/partnership-requests-page.jsx"))
const AdminSubscriptions = lazyRoute(() => import("./pages/admin/subscriptions-page.jsx"))
const ReferenceLists = lazyRoute(() => import("./pages/admin/reference-lists-page.jsx"))
const AiSettings = lazyRoute(() => import("./pages/admin/ai-settings-page.jsx"))
const CommunityModeration = lazyRoute(() => import("./pages/admin/community-moderation-page.jsx"))
const AcceptInstitutionInvitationPage = lazyRoute(() => import("./pages/admin/accept-institution-invitation-page.jsx"))
const LandingPage = lazyRoute(() => import("./pages/public/landing-page.jsx"))
const CreateLessons = lazyRoute(() => import("./pages/admin/create-lessons-page.jsx"))
const LearnerProgressPage = lazyRoute(() => import("./pages/learner/dashboard/learner-progress-page.jsx"))
const LearnerStudyPlanCalendarPage = lazyRoute(() => import("./components/learner/learner-study-plan-modal.jsx"))
const LearnerLearningPage = lazyRoute(() => import("./pages/learner/learning/learner-learning-page.jsx"))
const LearnerDiagnosticGatePage = lazyRoute(() => import("./pages/learner/assessments/learner-diagnostic-page.jsx"))
const LearnerLessonPage = lazyRoute(() => import("./pages/learner/learning/learner-lesson-page.jsx"))
const LearnerSubscriptionPage = lazyRoute(() => import("./pages/learner/subscription/learner-subscription-page.jsx"))
const SubscriptionCheckoutResultPage = lazyRoute(() => import("./pages/learner/subscription/subscription-checkout-result-page.jsx"))
const LearnerCertificationDetailPage = lazyRoute(() => import("./pages/learner/learning/learner-certification-detail-page.jsx"))
const LearnerCertificationsPage = lazyRoute(() => import("./pages/learner/learning/learner-certifications-page.jsx"))
const LearnerCertificatePage = lazyRoute(() => import("./pages/learner/learning/learner-certificate-page.jsx"))
const LearnerChallengesPage = lazyRoute(() => import("./pages/learner/learning/learner-challenges-page.jsx"))
const LearnerFilesPage = lazyRoute(() => import("./pages/learner/files/learner-files-page.jsx"))
const LearnerWorkspacePage = lazyRoute(() => import("./pages/learner/workspace/learner-workspace-page.jsx"))
const FlashcardBuilderPage = lazyRoute(() => import("./pages/learner/workspace/flashcard-builder-page.jsx"))
const QuizBuilderPage = lazyRoute(() => import("./pages/learner/workspace/quiz-builder-page.jsx"))
const UploadAndLearnPage = lazyRoute(() => import("./pages/learner/workspace/upload-and-learn-page.jsx"))
const LearnerMistakeBankPage = lazyRoute(() => import("./pages/learner/mistakes/learner-mistake-bank-page.jsx"))
const LearnerCommunityPage = lazyRoute(() => import("./pages/learner/community/learner-community-qa.jsx"))
const LearnerAccountPage = lazyRoute(() => import("./pages/learner/dashboard/learner-account-page.jsx"))
const LearnerAssessmentAttemptPage = lazyRoute(() => import("./pages/learner/assessments/learner-assessment-attempt-page.jsx"))
const AttemptPreviewPage = lazyRoute(() => import("./pages/dev/attempt-preview-page.jsx"))
const LearnerAssessmentResultPage = lazyRoute(() => import("./pages/learner/assessments/learner-assessment-result-page.jsx"))
const LearnerAssessmentHistoryPage = lazyRoute(() => import("./pages/learner/assessments/learner-assessment-history-page.jsx"))
const CommunityReviewerPage = lazyRoute(() => import("./pages/learner/community/community-reviewer-page.jsx"))
const LearnerPracticeAttemptPage = lazyRoute(() => import("./pages/learner/practice/learner-practice-attempt-page.jsx"))
const LearnerFlashcardAttemptPage = lazyRoute(() => import("./pages/learner/practice/learner-flashcard-attempt-page.jsx"))
const LearnerPracticeHistoryPage = lazyRoute(() => import("./pages/learner/practice/learner-practice-history-page.jsx"))
const LearnerPracticeReviewPage = lazyRoute(() => import("./pages/learner/practice/learner-practice-review-page.jsx"))
const InstitutionDashboardPage = lazyRoute(() => import("./pages/institution/dashboard/institution-dashboard-page.jsx"))
const DepartmentHeadDashboardPage = lazyRoute(() => import("./pages/institution/dashboard/department-head-dashboard-page.jsx"))
const DepartmentHeadProgramsPage = lazyRoute(() => import("./pages/institution/dashboard/department-head-programs-page.jsx"))
const InstitutionDepartmentWorkspacePage = lazyRoute(() => import("./pages/institution/departments/institution-department-workspace-page.jsx"))
const InstitutionDepartmentLearnerPage = lazyRoute(() => import("./pages/institution/departments/institution-department-learner-page.jsx"))
const InstitutionLearnersPage = lazyRoute(() => import("./pages/institution/departments/institution-learners-page.jsx"))
const InstitutionCertificationsPage = lazyRoute(() => import("./pages/institution/certifications/institution-certifications-page.jsx"))
const InstitutionCertificationDetailPage = lazyRoute(() => import("./pages/institution/certifications/institution-certification-detail-page.jsx"))
const InstitutionCertificationViewerPage = lazyRoute(() => import("./pages/institution/certifications/institution-certification-viewer-page.jsx"))
const InstitutionAssessmentBuilderPage = lazyRoute(() => import("./pages/institution/certifications/institution-assessment-builder-page.jsx"))
const InstitutionQuestionImportPage = lazyRoute(() => import("./pages/institution/departments/institution-question-import-page.jsx"))
const InstitutionAssessmentResultsPage = lazyRoute(() => import("./pages/institution/departments/institution-assessment-results-page.jsx"))
const DepartmentsPage = lazyRoute(() => import("./pages/institution/departments/institution-departments-page.jsx"))
const InstitutionAccountPage = lazyRoute(() => import("./pages/institution/account/institution-account-page.jsx"))
const InstitutionInvoicesPage = lazyRoute(() => import("./pages/institution/account/institution-invoices-page.jsx"))
const InstitutionRequestAccessPage = lazyRoute(() => import("./pages/public/institution-request-access-page.jsx"))
const CompilerArea = lazyRoute(() => import("./pages/challenges/compiler-area-page.jsx"))
const CodeStrikePage = lazyRoute(() => import("./pages/learner/challenges/codestrike-page.jsx"))
const BlueprintArenaPage = lazyRoute(() => import("./pages/learner/challenges/blueprint-arena-page.jsx"))
const WorldCupPage = lazyRoute(() => import("./pages/learner/challenges/world-cup-page.jsx"))
const SkeletonPreviewPage = lazyRoute(() => import("./pages/dev/skeleton-preview-page.jsx"))
const LearnerCertificationCurriculumPage = lazyRoute(() =>
    import("./pages/learner/learning/learner-certification-curriculum-page.jsx")
)
const LearnerTopicPage = lazyRoute(() => import("./pages/learner/learning/learner-topic-page.jsx"))
const ArenaConfig = lazyRoute(() => import("./pages/admin/arena-config-page.jsx"))
const ArenaDetail = lazyRoute(() => import("./pages/admin/arena-detail-page.jsx"))
const CertificationQuestionBank = lazyRoute(() => import("./pages/admin/certification-question-bank-page.jsx"))
const CertificationPdfImport = lazyRoute(() => import("./pages/admin/certification-pdf-import-page.jsx"))
const CertificationAssessments = lazyRoute(() => import("./pages/admin/certification-assessments-page.jsx"))
const PricingManagement = lazyRoute(() => import("./pages/admin/pricing-management-page.jsx"))
const RewardsManagement = lazyRoute(() => import("./pages/admin/rewards-management-page.jsx"))
const SeedChallenges = lazyRoute(() => import("./pages/admin/seed-challenges-page.jsx"))
const NotificationsPage = lazyRoute(() => import("./pages/notifications-page.jsx"))
const NotFoundPage = lazyRoute(() => import("./pages/public/not-found-page.jsx"))
const ForbiddenPage = lazyRoute(() => import("./pages/public/forbidden-page.jsx"))

function InstitutionHome() {
    const { user } = useAuth()
    const target = isInstitutionOwner(user) ? "dashboard" : "department-head"
    return <Navigate to={target} replace />
}

function NotificationsRedirect() {
    const { user } = useAuth()
    const role = String(user?.role ?? "").toUpperCase()
    const portal = role === "ADMIN" ? "admin" : role === "LEARNER" ? "learner" : "institution"
    return <Navigate to={`/${portal}/notifications`} replace />
}

function GuestOnlyRoute({ children }) {
    const { user, status } = useAuth()

    if (status === "loading") {
        return <LoadingSignal />
    }

    if (status === "authenticated") {
        return <Navigate to={roleHomePath(user?.role)} replace />
    }

    return children
}

function InstitutionDashboardEntry() {
    const { user } = useAuth()
    return isInstitutionOwner(user)
        ? <InstitutionDashboardPage />
        : <Navigate to="/institution/department-head" replace />
}

function RouteTransition({ children }) {
    const { pathname } = useLocation()
    const ref = useRef(null)

    useEffect(() => {
        if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" })

        const node = ref.current
        if (!node) return

        node.classList.remove("rb-route-enter")
        void node.offsetWidth
        node.classList.add("rb-route-enter")
    }, [pathname])

    return (
        <div ref={ref} className="rb-route-enter">
            {children}
        </div>
    )
}

export function App() {
    return (
      <RouteErrorBoundary>
      <Suspense fallback={<LoadingSignal />}>
        <RouteTransition>
        <Routes>
            <Route path="/" element={<GuestOnlyRoute><LandingPage /></GuestOnlyRoute>} />
            <Route path="/welcome" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
            <Route path="/register" element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
            <Route path="/verify-email" element={<GuestOnlyRoute><VerifyEmailPage /></GuestOnlyRoute>} />
            <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
            <Route path="/set-new-password" element={<SetNewPasswordPage />} />

            <Route
                path="/institution/request-access"
                element={<InstitutionRequestAccessPage />}
            />

            <Route
                path="/invitations/accept"
                element={<AcceptInstitutionInvitationPage />}
            />

            {import.meta.env.DEV ? (
                <Route path="/__preview/attempt/:examId" element={<AttemptPreviewPage />} />
            ) : null}

            {import.meta.env.DEV ? (
                <>
                    <Route
                        path="/__preview/workspace"
                        element={
                            <div className="netacad-portal rebyu-ds min-h-dvh bg-rb-snow">
                                <LearnerWorkspacePage />
                            </div>
                        }
                    />
                    <Route
                        path="/__preview/workspace/flashcards"
                        element={
                            <div className="netacad-portal rebyu-ds min-h-dvh bg-rb-snow">
                                <FlashcardBuilderPage />
                            </div>
                        }
                    />
                    <Route
                        path="/__preview/workspace/quiz"
                        element={
                            <div className="netacad-portal rebyu-ds min-h-dvh bg-rb-snow">
                                <QuizBuilderPage />
                            </div>
                        }
                    />
                    <Route
                        path="/__preview/workspace/learn"
                        element={
                            <div className="netacad-portal rebyu-ds min-h-dvh bg-rb-snow">
                                <UploadAndLearnPage />
                            </div>
                        }
                    />
                </>
            ) : null}

            {import.meta.env.DEV ? (
                <Route path="/__preview/loading" element={<LoadingScreen />} />
            ) : null}

            {import.meta.env.DEV ? (
                <Route path="/__preview/skeletons" element={<SkeletonPreviewPage />} />
            ) : null}

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route
                    path="/admin/certification/:id/question-bank"
                    element={<CertificationQuestionBank />}
                />

                <Route
                    path="/admin/certification/:id/question-bank/import"
                    element={<CertificationPdfImport />}
                />

                <Route
                    path="/admin/certification/:id/assessments"
                    element={<CertificationAssessments />}
                />

                <Route path="/admin/lessons/:name/create" element={<CreateLessons />} />

                <Route path="/admin" element={<DashboardLayout />}>
                    <Route index element={<Certifications />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="challenges" element={<Challenges />} />
                    <Route path="arenas" element={<ArenaConfig />} />
                    <Route path="arenas/:arenaId" element={<ArenaDetail />} />
                    <Route path="institutions" element={<Institutions />} />
                    <Route
                        path="institutions/:id"
                        element={<AdminInstitutionDetail />}
                    />
                    <Route path="partnership-requests" element={<PartnershipRequests />} />
                    <Route path="subscriptions" element={<AdminSubscriptions />} />
                    <Route path="payments" element={<AdminSubscriptions />} />
                    <Route path="community" element={<CommunityModeration />} />
                    <Route path="reference-lists" element={<ReferenceLists />} />
                    <Route path="ai-settings" element={<AiSettings />} />
                    <Route path="pricing" element={<PricingManagement />} />
                    <Route path="rewards" element={<RewardsManagement />} />
                    <Route path="seed-challenges" element={<SeedChallenges />} />
                    <Route path="learners" element={<Learners />} />
                    <Route
                        path="certification/:id"
                        element={<ViewCertificationAdmin />}
                    />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["LEARNER"]} />}>
                <Route path="/learner" element={<LearnerLayout />}>
                    <Route index element={<Navigate to="analytics" replace />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="dashboard" element={<Navigate to="/learner/analytics" replace />} />
                    <Route path="analytics" element={<LearnerProgressPage />} />
                    <Route path="progress" element={<LearnerProgressPage />} />
                    <Route path="learning" element={<LearnerLearningPage />} />

                    <Route
                        path="learning/:certificationId/diagnostic"
                        element={<LearnerDiagnosticGatePage />}
                    />

                    <Route
                        path="learning/:certificationId"
                        element={<LearnerCertificationCurriculumPage />}
                    />

                    <Route
                        path="learning/:certificationId/topics/:middleCategoryId"
                        element={<LearnerTopicPage />}
                    />
                    <Route path="lessons/:lessonId" element={<LearnerLessonPage />} />
                    <Route path="plan" element={<LearnerStudyPlanCalendarPage />} />
                    <Route
                        path="certifications"
                        element={<LearnerCertificationsPage />}
                    />
                    <Route
                        path="certifications/:certificationId"
                        element={<LearnerCertificationDetailPage />}
                    />
                    <Route
                        path="certifications/:certificationId/certificate"
                        element={<LearnerCertificatePage />}
                    />
                    <Route path="challenges" element={<LearnerChallengesPage />} />
                    <Route path="subscription" element={<LearnerSubscriptionPage />} />
                    <Route path="library" element={<LearnerFilesPage />} />


                    <Route path="mistakes" element={<LearnerMistakeBankPage />} />
                    <Route path="community" element={<LearnerCommunityPage />} />
                    <Route path="account" element={<LearnerAccountPage />} />
                </Route>


                <Route
                    path="/learner/assessments/:examId"
                    element={<LearnerAssessmentAttemptPage />}
                />
                <Route
                    path="/learner/results/:examResultId"
                    element={<LearnerAssessmentResultPage />}
                />
                <Route
                    path="/learner/assessments/:examId/history"
                    element={<LearnerAssessmentHistoryPage />}
                />
                <Route path="/learner/community/reviewer/:postId" element={<CommunityReviewerPage />} />
                <Route path="/learner/practice/:studySetId" element={<LearnerPracticeAttemptPage />} />
                <Route path="/learner/flashcards/:studySetId" element={<LearnerFlashcardAttemptPage />} />
                <Route path="/learner/practice-history" element={<LearnerPracticeHistoryPage />} />
                <Route path="/learner/practice-review/:attemptId" element={<LearnerPracticeReviewPage />} />
                <Route path="/learner/challenges/codestrike" element={<CodeStrikePage />} />
                <Route path="/learner/challenges/blueprint-arena" element={<BlueprintArenaPage />} />
                <Route path="/learner/challenges/world-cup" element={<WorldCupPage />} />

                <Route path="/challenges" element={<CompilerArea />} />


                <Route path="/subscription/success" element={<SubscriptionCheckoutResultPage />} />
                <Route
                    path="/subscription/cancel"
                    element={<SubscriptionCheckoutResultPage canceled />}
                />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["INSTITUTION", "DEPARTMENT_HEAD"]} />}>
                <Route path="/institution" element={<InstitutionLayout />}>
                    <Route index element={<InstitutionHome />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="dashboard" element={<InstitutionDashboardEntry />} />
                    <Route path="department-head" element={<DepartmentHeadDashboardPage />} />
                    <Route path="programs" element={<DepartmentHeadProgramsPage />} />
                    <Route path="head" element={<Navigate to="/institution/department-head" replace />} />
                    <Route path="learners" element={<InstitutionLearnersPage />} />
                    <Route
                        path="certifications"
                        element={<InstitutionCertificationsPage />}
                    />
                    <Route
                        path="certifications/:institutionCertId"
                        element={<InstitutionCertificationDetailPage />}
                    />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="departments/:departmentId" element={<InstitutionDepartmentWorkspacePage />} />
                    <Route
                        path="departments/:departmentId/learners/:learnerId"
                        element={<InstitutionDepartmentLearnerPage />}
                    />
                    <Route
                        path="departments/:departmentId/assessments/new"
                        element={<InstitutionAssessmentBuilderPage />}
                    />
                    <Route
                        path="departments/:departmentId/assessments/:examId/edit"
                        element={<InstitutionAssessmentBuilderPage />}
                    />
                    <Route
                        path="departments/:departmentId/question-bank/import"
                        element={<InstitutionQuestionImportPage />}
                    />
                    <Route
                        path="departments/:departmentId/assessments/:examId/results"
                        element={<InstitutionAssessmentResultsPage />}
                    />
                    <Route
                        path="certifications/:certificationId/view"
                        element={<InstitutionCertificationViewerPage />}
                    />
                    <Route path="question-bank" element={<Navigate to="/institution/certifications" replace />} />
                    <Route path="profile" element={<InstitutionAccountPage />} />
                    <Route path="license" element={<Navigate to="/institution/partnership" replace />} />
                    <Route path="files" element={<Navigate to="/institution/profile" replace />} />
                    <Route path="analytics" element={<Navigate to="/institution/dashboard" replace />} />
                    <Route path="partnership" element={<InstitutionAccountPage />} />
                    <Route path="billing" element={<Navigate to="/institution/invoices" replace />} />
                    <Route path="invoices" element={<InstitutionInvoicesPage />} />
                    <Route path="invoices/:invoiceId" element={<InstitutionInvoicesPage />} />
                    <Route path="institution" element={<InstitutionAccountPage />} />
                </Route>
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["ADMIN", "INSTITUTION", "DEPARTMENT_HEAD", "LEARNER"]}
                    />
                }
            >
                <Route path="/notifications" element={<NotificationsRedirect />} />
            </Route>

            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </RouteTransition>
      </Suspense>
      </RouteErrorBoundary>
    )
}

export default App
