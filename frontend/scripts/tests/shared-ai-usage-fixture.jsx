import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AiUsageSummary, AiUsageBreakdown, AiLimitNotice } from "../../src/components/learner/ai-usage.jsx"
import { LiveTutorSettingsCard } from "../../src/components/admin/live-tutor-settings.jsx"
createRoot(document.getElementById("root")).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AiUsageSummary /><AiUsageBreakdown /><AiLimitNotice /><LiveTutorSettingsCard /></QueryClientProvider>)
