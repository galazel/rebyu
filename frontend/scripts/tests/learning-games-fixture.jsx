import { useState } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TutorWidgets } from "../../src/components/learner/tutor-widgets.jsx"
import { LearningToolsPicker } from "../../src/components/learner/learning-tools-picker.jsx"
import LearnerActivityPage from "../../src/pages/learner/learner-activity-page.jsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../src/components/ui/dropdown-menu"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
const words = [{ word: 'COST', clue: 'An expense' }, { word: 'INCOME', clue: 'Earnings' }]
const objects = [{ label: 'Computer', symbol: '💻', changedSymbol: '🖥️', position: 0 }, { label: 'Lock', symbol: '🔒', changedSymbol: '', position: 3 }, { label: 'Book', symbol: '📗', changedSymbol: '', position: 8 }, { label: 'Server', symbol: '🗄️', changedSymbol: '', position: 12 }]
const widgets = [
  { type: 'sorting', groups: [{ name: 'Fixed', items: ['Rent'] }, { name: 'Variable', items: ['Materials'] }] },
  ...['word_search', 'crossword', 'hangman', 'unscramble'].map((variant) => ({ type: 'word_game', variant, words })),
  ...['jigsaw', 'sliding'].map((variant) => ({ type: 'puzzle', variant, labels: ['Plan','Design','Build','Test','Review','Deploy','Monitor','Improve','Repeat'] })),
  ...['spot_difference', 'hidden_objects'].map((variant) => ({ type: 'visual_game', variant, objects, targets: ['Computer'] })),
  { type: 'speed_flashcards', seconds: 5, cards: [{ front: 'Contribution?', back: 'Price minus variable cost' }, { front: 'Break-even?', back: 'Fixed cost divided by contribution' }] },
  {type:'branching_story',startId:'start',role:'Developer',nodes:[{id:'start',text:'You need to reuse software.',choices:[{text:'Get a licence',nextId:'safe',feedback:'The licence defines your permitted uses.'},{text:'Copy without permission',nextId:'risk',feedback:'Permission matters.'}]},{id:'safe',text:'Your reuse is licensed.',choices:[]},{id:'risk',text:'Your reuse risks infringement.',choices:[]}]},
  {type:'simulation',role:'Project manager',goal:'Reach quality 8 within the budget.',targetResource:'Quality',targetMinimum:8,resources:[{name:'Budget',initial:100,minimum:0},{name:'Quality',initial:0,minimum:0}],rounds:[{situation:'Choose training',choices:[{text:'Train the team',effects:[{resource:'Budget',delta:-60},{resource:'Quality',delta:6}],feedback:'Training improves quality.'},{text:'Skip training',effects:[],feedback:'You saved your budget.'}]},{situation:'Choose a review',choices:[{text:'Hire an expert',effects:[{resource:'Budget',delta:-80},{resource:'Quality',delta:10}],feedback:'Expert review improves quality.'},{text:'Peer review',effects:[{resource:'Budget',delta:-30},{resource:'Quality',delta:3}],feedback:'Peer review adds quality affordably.'}]}]},
  {type:'two_truths_lie',rounds:[{statements:['Patents expire.','Copyright protects original expression.','A trademark protects every invention.'],falseIndex:2,explanation:'Patents protect qualifying inventions; trademarks distinguish sources.'},{statements:['Trade secrets require secrecy.','All open-source code has no licence.','Licences grant defined permissions.'],falseIndex:1,explanation:'Open-source licences still impose terms.'}]},
].map((widget, i) => ({ ...widget, title: widget.variant || widget.type, library: { id: i + 1, route: `/learner/activities/${i + 1}` } }))
window.fixtureWidgets = widgets
function Games() { const [open, setOpen] = useState(false); return <main className="rebyu-ds netacad-portal mx-auto max-w-3xl bg-background p-4 text-foreground"><DropdownMenu><DropdownMenuTrigger asChild><button>Learning tools</button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setOpen(true)}>Practice & games</DropdownMenuItem></DropdownMenuContent></DropdownMenu><LearningToolsPicker open={open} onOpenChange={setOpen} onGenerate={(prompt) => { window.selectedActivityPrompt = prompt }} /><TutorWidgets widgets={widgets} persistenceScope="learner9:games-tests" /></main> }
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={[new URLSearchParams(location.search).has('saved') ? '/learner/activities/42' : '/']}><Routes><Route path="/" element={<Games />} /><Route path="/learner/activities/:libraryItemId" element={<LearnerActivityPage />} /></Routes></MemoryRouter></QueryClientProvider>)
