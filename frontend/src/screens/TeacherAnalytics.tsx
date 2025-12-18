import React, { useEffect, useState } from 'react'
import './teacher.css'
import { API_ENDPOINTS } from '../config'

type Attempt = {
  attempt_id: number
  student_name: string
  roll_number: string
  class: string
  section: string
  started_at: string
  finished_at: string | null
  submitted: boolean
  total_questions?: number
  attempted?: number
  correct?: number
  wrong?: number
  not_attempted?: number
  total_score?: number
  fullscreen_exit_count?: number
}

type Statistics = {
  total_attempts: number
  submitted_count: number
  pending_count: number
  average_score: number
  max_score: number
  min_score: number
}

type ExamInfo = {
  id: number
  title: string
  subject: string
}

type AnalyticsData = {
  exam: ExamInfo
  attempts: Attempt[]
  statistics: Statistics
}

export const TeacherAnalytics: React.FC<{ examId: string }> = ({ examId }) => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('teacher_token')
        if (!token) {
          setError('Not logged in')
          return
        }

        const res = await fetch(API_ENDPOINTS.EXAMS.ATTEMPTS(Number(examId)), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to load analytics: ${res.status} ${text}`)
        }

        const analyticsData: AnalyticsData = await res.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    void fetchAnalytics()
  }, [examId])

  const handleBack = () => {
    window.location.hash = '#/teacher/dashboard'
  }

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="teacher-dashboard">
        <div style={{ padding: '2rem' }}>
          <div className="error-message">{error}</div>
          <button onClick={handleBack} className="btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="teacher-dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>No data available</div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <h1>Exam Results & Analytics</h1>
        <button onClick={handleBack} className="btn-secondary">
          Back to Dashboard
        </button>
      </header>

      <main className="teacher-main">
        <div className="analytics-container">
          {/* Exam Info */}
          <div className="analytics-exam-info">
            <h2>{data.exam.title}</h2>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>Subject: {data.exam.subject}</p>
          </div>

          {/* Statistics Summary */}
          <div className="analytics-statistics">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{data.statistics.total_attempts}</div>
                <div className="stat-label">Total Attempts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.statistics.submitted_count}</div>
                <div className="stat-label">Submitted</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.statistics.pending_count}</div>
                <div className="stat-label">Pending</div>
              </div>
              {data.statistics.submitted_count > 0 && (
                <>
                  <div className="stat-card">
                    <div className="stat-value">{data.statistics.average_score}</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{data.statistics.max_score}</div>
                    <div className="stat-label">Highest Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{data.statistics.min_score}</div>
                    <div className="stat-label">Lowest Score</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Attempts List */}
          <div className="analytics-attempts">
            <h3>Student Attempts</h3>
            {data.attempts.length === 0 ? (
              <div className="empty-state">
                <p>No attempts yet for this exam.</p>
              </div>
            ) : (
              <div className="attempts-table-container">
                <table className="attempts-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Started At</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Correct</th>
                      <th>Wrong</th>
                      <th>Not Attempted</th>
                      <th>Fullscreen Exits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attempts.map((attempt) => (
                      <tr key={attempt.attempt_id}>
                        <td>{attempt.roll_number}</td>
                        <td>{attempt.student_name}</td>
                        <td>{attempt.class}</td>
                        <td>{attempt.section}</td>
                        <td style={{ fontSize: '0.9rem' }}>{formatDate(attempt.started_at)}</td>
                        <td>
                          {attempt.submitted ? (
                            <span style={{ color: '#28a745', fontWeight: '600' }}>Submitted</span>
                          ) : (
                            <span style={{ color: '#ffc107', fontWeight: '600' }}>In Progress</span>
                          )}
                        </td>
                        {attempt.submitted ? (
                          <>
                            <td>
                              <strong
                                style={{
                                  color: attempt.total_score! >= 0 ? '#28a745' : '#dc3545',
                                }}
                              >
                                {attempt.total_score}
                              </strong>
                            </td>
                            <td style={{ color: '#28a745' }}>{attempt.correct}</td>
                            <td style={{ color: '#dc3545' }}>{attempt.wrong}</td>
                            <td>{attempt.not_attempted}</td>
                            <td>
                              <span
                                style={{
                                  color: (attempt.fullscreen_exit_count || 0) > 0 ? '#dc3545' : '#28a745',
                                  fontWeight: '600',
                                }}
                              >
                                {attempt.fullscreen_exit_count || 0}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={4} style={{ color: '#666', fontStyle: 'italic' }}>
                              Not yet submitted
                            </td>
                            <td>
                              <span
                                style={{
                                  color: (attempt.fullscreen_exit_count || 0) > 0 ? '#dc3545' : '#28a745',
                                  fontWeight: '600',
                                }}
                              >
                                {attempt.fullscreen_exit_count || 0}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

