import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '../../src/components/ui/tooltip'
import { LessonAiTutor } from '../../src/components/learner/lesson-ai-tutor.jsx'
import '../../src/index.css'
import '../../src/styles/rebyu-classroom.css'
createRoot(document.getElementById('root')).render(<MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><TooltipProvider><main className="rebyu-ds netacad-portal h-dvh bg-background text-foreground"><div className="mx-auto h-full w-full max-w-2xl border-x border-border"><LessonAiTutor lessonId={246} learnerId={9} learnerName="Alex" lessonName="Operations research" onClose={()=>{}} onStartSnip={()=>{window.snipRequested=true}} /></div></main></TooltipProvider></QueryClientProvider></MemoryRouter>)
