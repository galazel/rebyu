import {createRoot} from "react-dom/client"
import {MemoryRouter,Routes,Route,Link} from "react-router-dom"
import {QueryClient,QueryClientProvider} from "@tanstack/react-query"
import {ThemeProvider} from "../../src/components/theme-provider"
import {Toaster} from "sonner"
import Community from "../../src/pages/learner/community/learner-community-qa.jsx"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
localStorage.setItem("learnerId","1");localStorage.setItem("name","Alex Morgan")
const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity}}})
client.setQueryData(["learner-entitlements",1,null],{accessSource:"PERSONAL_PRO"})
createRoot(document.getElementById("root")).render(<QueryClientProvider client={client}><ThemeProvider defaultTheme="light" storageKey="community-test-theme"><MemoryRouter initialEntries={["/learner/community"]}><nav><Link to="/away">Leave page</Link> · <Link to="/learner/community">Return to community</Link></nav><div style={{padding:16}}><Routes><Route path="/learner/community" element={<Community/>}/><Route path="/away" element={<p>Away</p>}/><Route path="*" element={<p>Destination</p>}/></Routes></div><Toaster/></MemoryRouter></ThemeProvider></QueryClientProvider>)
