import React, { useEffect, useState } from 'react'
import './exam-selection.css'

type Exam = {
  id: number
  title: string
  subject: string
  duration_minutes: number
  question_count: number
}

export const ExamSelection: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('http://127.0.0.1:4000/exams')
        if (!res.ok) {
          throw new Error('Failed to load exams')
        }

        const data = await res.json()
        setExams(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    void fetchExams()
  }, [])

  const handleSelectExam = (examId: number) => {
    window.location.hash = `#/exam/${examId}`
  }

  if (loading) {
    return (
      <div className="exam-selection-container">
        <div className="exam-selection-content">
          <h1>Loading available exams...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="exam-selection-container">
        <div className="exam-selection-content">
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="exam-selection-container">
      <div className="exam-selection-content">
        <h1>Select an Exam</h1>
        {exams.length === 0 ? (
          <div className="empty-state">
            <p>No exams available at the moment.</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Please check back later or contact your teacher.
            </p>
          </div>
        ) : (
          <div className="exams-grid">
            {exams.map((exam) => (
              <div key={exam.id} className="exam-card" onClick={() => handleSelectExam(exam.id)}>
                <div className="exam-card-header">
                  <h2>{exam.title}</h2>
                  <span className="exam-subject">{exam.subject}</span>
                </div>
                <div className="exam-card-details">
                  <div className="exam-detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      {Math.floor(exam.duration_minutes / 60)}h {exam.duration_minutes % 60}m
                    </span>
                  </div>
                  <div className="exam-detail-item">
                    <span className="detail-label">Questions:</span>
                    <span className="detail-value">{exam.question_count}</span>
                  </div>
                </div>
                <button className="exam-card-button">Start Exam</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

