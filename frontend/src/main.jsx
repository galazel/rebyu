import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./styles/rebyu-classroom.css"
import "./styles/rebyu-print.css"
import App from "./App.jsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { XpAwardModal } from "@/components/learner/xp-award-modal.jsx"
import { CertificationCompletionHost } from "@/components/learner/certification-completion-host.jsx"
import "@/lib/supabase.js"
import { AuthProvider } from "@/context/auth-context.jsx"
import { LoadingOverlayProvider } from "@/components/loading-overlay.jsx"
import { MotionConfig } from "framer-motion"


const rootElement = document.getElementById("root")


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
if (!rootElement) throw new Error("Root element not found")

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <TooltipProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <LoadingOverlayProvider>
                  <App />
                </LoadingOverlayProvider>
                <Toaster />
                <XpAwardModal />
                <CertificationCompletionHost />
              </AuthProvider>
            </QueryClientProvider>
          </TooltipProvider>
        </BrowserRouter>
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
)
