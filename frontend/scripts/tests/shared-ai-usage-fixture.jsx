import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AiUsageSummary, AiUsageBreakdown, AiLimitNotice } from "../../src/components/learner/ai-usage.jsx"
import AiSettingsPage from "../../src/pages/admin/ai-settings-page.jsx"
createRoot(document.getElementById("root")).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AiUsageSummary /><AiUsageBreakdown /><AiLimitNotice /><AiSettingsPage /></QueryClientProvider>)
