import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'

import { ExamLayout } from './screens/ExamLayout'
import { ExamSelection } from './screens/ExamSelection'
import { TeacherLogin } from './screens/TeacherLogin'
import { TeacherDashboard } from './screens/TeacherDashboard'
import { AddQuestions } from './screens/AddQuestions'
import { TeacherAnalytics } from './screens/TeacherAnalytics'

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/exam/select')

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/exam/select')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Teacher routes
  if (route.startsWith('#/teacher/login')) {
    return <TeacherLogin />
  }

  if (route.startsWith('#/teacher/dashboard')) {
    const token = localStorage.getItem('teacher_token')
    if (!token) {
      window.location.hash = '#/teacher/login'
      return <TeacherLogin />
    }
    return <TeacherDashboard />
  }

  const examQuestionsMatch = route.match(/^#\/teacher\/exam\/(\d+)\/questions$/)
  if (examQuestionsMatch) {
    const token = localStorage.getItem('teacher_token')
    if (!token) {
      window.location.hash = '#/teacher/login'
      return <TeacherLogin />
    }
    const examId = Number(examQuestionsMatch[1])
    return <AddQuestions examId={examId} />
  }

  const examAnalyticsMatch = route.match(/^#\/teacher\/exam\/(\d+)\/analytics$/)
  if (examAnalyticsMatch) {
    const token = localStorage.getItem('teacher_token')
    if (!token) {
      window.location.hash = '#/teacher/login'
      return <TeacherLogin />
    }
    const examId = examAnalyticsMatch[1]
    return <TeacherAnalytics examId={examId} />
  }

  // Student exam selection
  if (route === '#/exam/select' || route === '#/exam') {
    return <ExamSelection />
  }

  // Student exam view with specific exam ID
  const examMatch = route.match(/^#\/exam\/(\d+)$/)
  if (examMatch) {
    const examId = Number(examMatch[1])
    return <ExamLayout examId={examId} />
  }

  // Default: exam selection
  return <ExamSelection />
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


