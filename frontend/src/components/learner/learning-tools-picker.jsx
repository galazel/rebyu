import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useId, useState } from "react"
import { activityRequest } from "@/lib/learning-activity-size.js"
import { categoryClass, GameIcon, ToolInfoButton } from "@/components/learner/tutor-game-kit.jsx"

export const LEARNING_ACTIVITIES = [
  { id: 'quiz', name: 'Multiple-choice quiz', group: 'Recall', description: 'Test what you remember with multiple-choice questions.', prompt: 'Create a practice quiz based on this lesson.' },
  { id: 'true_false', name: 'True or false', group: 'Recall', description: 'Spot facts and misconceptions.', prompt: 'Create a true or false activity based on this lesson.' },
  { id: 'sorting', name: 'Sorting & categorizing', group: 'Organize', description: 'Drag items into the right groups.', prompt: 'Create a sorting and categorizing game based on this lesson.' },
  { id: 'ordering', name: 'Sequencing', group: 'Organize', description: 'Put steps or events in the correct order.', prompt: 'Sequence these process steps from this lesson.' },
  { id: 'fill_blank', name: 'Fill in the blank', group: 'Recall', description: 'Complete missing terms and ideas.', prompt: 'Create a fill in the blank activity based on this lesson.' },
  { id: 'crossword', name: 'Crossword puzzle', group: 'Word games', description: 'Use lesson clues to fill an interlocking word grid.', prompt: 'Create a crossword puzzle based on this lesson.' },
  { id: 'hangman', name: 'Hangman', group: 'Word games', description: 'Guess a keyword from its definition.', prompt: 'Create a hangman game based on this lesson.' },
  { id: 'unscramble', name: 'Unscramble', group: 'Word games', description: 'Rearrange letters to reveal a term.', prompt: 'Create an unscramble game based on this lesson.' },
  { id: 'matching', name: 'Matching pairs', group: 'Organize', description: 'Connect lesson terms with their definitions.', prompt: 'Create a matching pairs activity from this lesson.' },
  { id: 'branching_story', name: 'Branching story', group: 'Decision & scenario', description: 'Make choices and explore different outcomes.', prompt: 'Create a branching story based on this lesson.' },
  { id: 'simulation', name: 'Simulation / role-play', group: 'Decision & scenario', description: 'Make decisions within a budget and other constraints.', prompt: 'Create a simulation or role-play based on this lesson with resource constraints and an achievable goal.' },
  { id: 'two_truths_lie', name: 'Two truths and a lie', group: 'Decision & scenario', description: 'Find the false statement in each group of three.', prompt: 'Create two truths and a lie rounds from this lesson.' },
  { id: 'flashcards', name: 'Flashcards', group: 'Recall', description: 'Review at your own pace.', prompt: 'Create flashcards based on this lesson.' },
  { id: 'speed_flashcards', name: 'Flashcard speed round', group: 'Timed recall', description: 'Quick recall with a pauseable timer.', prompt: 'Create a flashcard speed round based on this lesson with 15 seconds per card.' },
]

export function LearningToolsPicker({ open, onOpenChange, onGenerate, disabled = false }) {
  const [itemCount, setItemCount] = useState(10)
  const countId = useId()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Learning tools</DialogTitle>
          <DialogDescription>Choose an activity for this lesson—no message needed. Generated activities are automatically saved to Library. Generation uses your shared AI allowance.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <label htmlFor={countId} className="text-sm font-semibold text-foreground">Items per activity<span className="mt-0.5 block text-xs font-normal text-muted-foreground">Minimum 10 · maximum 20</span></label>
          <select id={countId} aria-label="Items per activity" value={itemCount} disabled={disabled} onChange={(event) => setItemCount(Number(event.target.value))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{Array.from({ length: 11 }, (_, i) => i + 10).map((count) => <option key={count} value={count}>{count} items</option>)}</select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEARNING_ACTIVITIES.map((tool) => (
            <div key={tool.id} className={`relative ${categoryClass(tool.id)}`}>
            <button type="button" data-activity-id={tool.id} disabled={disabled} onClick={() => { onGenerate(activityRequest(tool, itemCount)); onOpenChange(false) }} className="tg-pick group block h-full w-full p-4 pr-12 text-left disabled:opacity-50">
              <span className="relative z-10 mb-3 flex items-center gap-2.5">
                <span data-activity-icon className="tg-badge-icon"><GameIcon type={tool.id} /></span>
                <span className="tg-chip">{tool.group}</span>
              </span>
              <span className="relative z-10 block text-sm font-extrabold text-foreground">{tool.name}</span>
              <span className="relative z-10 mt-1 block text-xs leading-5 text-muted-foreground">{tool.description}</span>
            </button>
            <span className="absolute top-3 right-3"><ToolInfoButton id={tool.id} name={tool.name} /></span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
