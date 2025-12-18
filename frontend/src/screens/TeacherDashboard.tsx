import React, { useEffect, useState } from 'react'
import './teacher.css'
import { API_ENDPOINTS } from '../config'

type Exam = {
  id: number
  title: string
  subject: string
  duration_minutes: number
  question_count: number
}

export const TeacherDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExamTitle, setNewExamTitle] = useState('')
  const [newExamSubject, setNewExamSubject] = useState('')
  const [newExamDuration, setNewExamDuration] = useState(180)
  const [creating, setCreating] = useState(false)

  const teacherName = localStorage.getItem('teacher_name') || 'Teacher'

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('teacher_token')
        if (!token) {
          setError('Not logged in')
          return
        }

        const res = await fetch(API_ENDPOINTS.EXAMS.LIST, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to load exams: ${res.status} ${text}`)
        }

        const data: Exam[] = await res.json()
        setExams(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    void fetchExams()
  }, [])

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    const token = localStorage.getItem('teacher_token')
    if (!token) {
      setError('Not logged in')
      return
    }

    try {
      const res = await fetch(API_ENDPOINTS.EXAMS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newExamTitle,
          subject: newExamSubject,
          duration_minutes: newExamDuration,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to create exam' }))
        throw new Error(data.detail || 'Failed to create exam')
      }

      const data = await res.json()
      setExams([...exams, data])
      setShowCreateForm(false)
      setNewExamTitle('')
      setNewExamSubject('')
      setNewExamDuration(180)
      // Navigate to add questions page
      window.location.hash = `#/teacher/exam/${data.id}/questions`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam')
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('teacher_token')
    localStorage.removeItem('teacher_name')
    window.location.hash = '#/teacher/login'
  }

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <h1>Teacher Dashboard</h1>
        <div className="teacher-header-right">
          <span>Welcome, {teacherName}</span>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="teacher-main">
        {loading && <p>Loading exams...</p>}
        {error && <div className="error-message">{error}</div>}

        {!showCreateForm ? (
          <div className="dashboard-content">
            <div className="dashboard-actions">
              <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                Create New Exam
              </button>
            </div>

            {exams.length === 0 && (
              <div className="empty-state">
                <p>No exams created yet. Click "Create New Exam" to get started.</p>
              </div>
            )}

            {exams.length > 0 && (
              <div className="exams-list">
                <h2>Your Exams</h2>
                <ul>
                  {exams.map((exam) => (
                    <li key={exam.id}>
                      <div className="exam-list-item-main">
                        <strong>{exam.title}</strong> - {exam.subject} ({exam.duration_minutes} min)
                        <br />
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                          {exam.question_count} {exam.question_count === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                      <div className="exam-list-item-actions">
                        <button
                          onClick={() => {
                            window.location.hash = `#/teacher/exam/${exam.id}/questions`
                          }}
                          className="btn-secondary"
                        >
                          Edit Questions
                        </button>
                        <button
                          onClick={() => {
                            window.location.hash = `#/teacher/exam/${exam.id}/analytics`
                          }}
                          className="btn-primary"
                          style={{ marginLeft: '0.5rem' }}
                        >
                          View Results
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="create-exam-form">
            <h2>Create New Exam</h2>
            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label htmlFor="title">Exam Title</label>
                <input
                  id="title"
                  type="text"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  required
                  disabled={creating}
                  placeholder="e.g., JEE Main Physics Mock Test"
                />
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  required
                  disabled={creating}
                  placeholder="e.g., Physics, Mathematics, Chemistry"
                />
              </div>
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input
                  id="duration"
                  type="number"
                  value={newExamDuration}
                  onChange={(e) => setNewExamDuration(Number(e.target.value))}
                  required
                  min={1}
                  disabled={creating}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Exam'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setError(null)
                  }}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

