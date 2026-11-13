import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "../../src/components/theme-provider"
import Mistakes from "../../src/pages/learner/mistakes/learner-mistake-bank-page.jsx"
import Certificate from "../../src/pages/learner/learning/learner-certificate-page.jsx"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
localStorage.setItem("learnerId", "1")
localStorage.setItem("name", "Alexandra Morgan Reyes")
const client = new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}})
client.setQueryData(["learner-entitlements",1,null], {accessSource:"PERSONAL_PRO"})
client.setQueryData(["learner-mistakes"], Array.from({length:30},(_,i)=>({questionId:i+1,question:i===0?"A hospital is replacing its electronic health record system. Explain how the new system should manage patient records, prescriptions, and access controls while maintaining reliable services.":"Explain the principles of information security and risk management in a distributed system.",lessonTitle:i%2?"Information Security Measures and Technologies":"Management Principles and Organizational Structures",certificationTitle:"IT Passport Exam",questionType:"CRITICAL_THINKING",difficulty:"HARD",mistakeCount:i%3+1,reviewed:i===29,learnerAnswer:"Apply access controls",correctAnswer:"Use role-based access controls and audit logging.",explanation:"Permissions must match the responsibilities of each role.",lastMistakeAt:"2026-11-12",attemptSource:"Mock exam"})))
client.setQueryData(["learner-awards"],[{certificationId:4,certificationTitle:"IT Passport Exam",badgeAwardedAt:"2026-09-30",certificateAwardedAt:"2026-09-30",certificateNumber:"REBYU-ITP-11-20260930"}])
const scoreTrend=[{assessmentAttemptId:1,examId:10,assessmentType:"MOCK_EXAM",assessmentTitle:"Mock exam",percentage:75,submittedAt:"2026-11-01",correctCount:75,itemCount:100,attemptNumber:1}]
client.setQueryData(["learner-progress-analytics","4"],{certificationTitle:"IT Passport Exam",overallMasteryPercentage:65,averageAssessmentScore:73,scoreTrend,totalCorrectAnswers:75,totalIncorrectAnswers:25,categoryMastery:[{categoryLevel:"MAJOR",title:"Business strategy",masteryPercentage:65,completedLessonCount:4,totalLessonCount:6}],weakestTopics:[{lessonTitle:"Information Security Measures and Technologies",masteryPercentage:35,priorityTag:"HIGH",categoryTitle:"Technology"}],strongestTopics:[{lessonTitle:"Business strategy",masteryPercentage:90}]})
client.setQueryData(["attempt-result","1",1],{percentage:75,passed:true,passingScore:60,itemCount:100,correctCount:75,answeredCount:100,durationSeconds:300,questions:[]})
const route=new URLSearchParams(location.search).get("page")||"mistakes"
createRoot(document.getElementById("root")).render(<QueryClientProvider client={client}><ThemeProvider defaultTheme="light" storageKey="review-test-theme"><MemoryRouter initialEntries={["/"+route]}><div style={{padding:"16px",maxWidth:"1600px",margin:"auto"}}><Routes><Route path="mistakes" element={<Mistakes/>}/><Route path="certifications/:certificationId/certificate" element={<Certificate/>}/></Routes></div></MemoryRouter></ThemeProvider></QueryClientProvider>)
