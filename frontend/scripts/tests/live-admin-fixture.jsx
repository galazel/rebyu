import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LiveTutorSettingsCard } from "../../src/components/admin/live-tutor-settings.jsx"
import { AiUsageSummary } from "../../src/components/learner/ai-usage.jsx"
createRoot(document.getElementById("root")).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><LiveTutorSettingsCard /><AiUsageSummary /></QueryClientProvider>)
