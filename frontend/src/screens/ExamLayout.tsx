import React, { useEffect, useMemo, useState } from 'react'
import './exam-layout.css'
import { StudentDetailsForm } from './StudentDetailsForm'

type QuestionStatus = 'notVisited' | 'notAnswered' | 'answered' | 'marked' | 'answeredMarked'

type Question = {
  id: number
  text: string
  options: string[]
  image_url?: string
}

type ExamMeta = {
  candidateName: string
  examName: string
  subjectName: string
  remainingTime: string
}

type QuestionState = {
  selectedOptionIndex: number | null
  status: QuestionStatus
}

type StudentDetails = {
  name: string
  rollNumber: string
  className: string
  section: string
}

export const ExamLayout: React.FC<{ examId: number }> = ({ examId }) => {

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examTitle, setExamTitle] = useState<string>('')
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [examMeta, setExamMeta] = useState<ExamMeta>({
    candidateName: 'Your Name',
    examName: '',
    subjectName: '',
    remainingTime: '00:00:00',
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [questionState, setQuestionState] = useState<QuestionState[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // in seconds
  const [timeOver, setTimeOver] = useState(false)
  const [attemptId, setAttemptId] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [results, setResults] = useState<{
    total_score: number
    total_questions: number
    attempted: number
    correct: number
    wrong: number
    not_attempted: number
  } | null>(null)

  // Fetch exam data (but don't start attempt yet)
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`http://127.0.0.1:4000/exams/${examId}`)

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to load exam: ${res.status} ${text}`)
        }

        const data = await res.json()
        setExamTitle(data.title)
        
        const apiQuestions: Question[] = data.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          image_url: q.image_url,
        }))

        setQuestions(apiQuestions)
        
        // Initialize timer with duration in seconds
        const totalSeconds = data.duration_minutes * 60
        setTimeRemaining(totalSeconds)
        
        const formatTime = (seconds: number): string => {
          const hours = Math.floor(seconds / 3600)
          const minutes = Math.floor((seconds % 3600) / 60)
          const secs = seconds % 60
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        }
        
        setExamMeta({
          candidateName: 'Your Name', // Will be updated when student details are submitted
          examName: data.title,
          subjectName: data.subject,
          remainingTime: formatTime(totalSeconds),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exam')
      } finally {
        setLoading(false)
      }
    }

    void fetchExam()
  }, [examId])

  // Fullscreen management functions
  const requestFullscreen = async () => {
    try {
      const element = document.documentElement
      let success = false
      
      // Try standard fullscreen API first
      if (element.requestFullscreen) {
        try {
          await element.requestFullscreen()
          success = true
          setIsFullscreen(true)
        } catch (e) {
          console.log('Standard fullscreen failed, trying alternatives:', e)
        }
      }
      
      // Try WebKit (Safari, Chrome)
      if (!success && (element as any).webkitRequestFullscreen) {
        try {
          await (element as any).webkitRequestFullscreen()
          success = true
          setIsFullscreen(true)
        } catch (e) {
          console.log('Webkit fullscreen failed:', e)
        }
      }
      
      // Try Mozilla (Firefox)
      if (!success && (element as any).mozRequestFullScreen) {
        try {
          await (element as any).mozRequestFullScreen()
          success = true
          setIsFullscreen(true)
        } catch (e) {
          console.log('Moz fullscreen failed:', e)
        }
      }
      
      // Try MS (IE/Edge)
      if (!success && (element as any).msRequestFullscreen) {
        try {
          await (element as any).msRequestFullscreen()
          success = true
          setIsFullscreen(true)
        } catch (e) {
          console.log('MS fullscreen failed:', e)
        }
      }
      
      if (!success) {
        // If all methods fail, show alert
        alert('⚠️ Fullscreen mode is required for this exam. Please click OK and then allow fullscreen when your browser prompts you.')
        // Retry after user acknowledges
        setTimeout(() => {
          requestFullscreen()
        }, 1000)
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err)
      alert('⚠️ Please allow fullscreen mode to continue with the exam. Click OK to retry.')
      // Retry after user acknowledges
      setTimeout(() => {
        requestFullscreen()
      }, 500)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
      setIsFullscreen(false)
    } catch (err) {
      console.error('Error exiting fullscreen:', err)
    }
  }

  // Start exam after student details are submitted
  const handleStudentDetailsSubmit = async (details: StudentDetails) => {
    try {
      setError(null)
      
      // Start attempt with student details FIRST (before showing exam)
      let attemptRes: Response
      try {
        attemptRes = await fetch('http://127.0.0.1:4000/attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exam_id: examId,
            student_name: details.name,
            roll_number: details.rollNumber,
            class_name: details.className,
            section: details.section,
          }),
        })
      } catch (fetchErr) {
        // Network error (backend not reachable)
        console.error('Network error:', fetchErr)
        throw new Error('Cannot connect to server. Please make sure the backend server is running on http://127.0.0.1:4000')
      }

      if (!attemptRes.ok) {
        const errorData = await attemptRes.json().catch(() => ({ detail: 'Failed to start attempt' }))
        throw new Error(errorData.detail || `Server error: ${attemptRes.status} ${attemptRes.statusText}`)
      }

      const attemptData = await attemptRes.json()
      
      // Only proceed if attempt was created successfully
      if (!attemptData.id) {
        throw new Error('Failed to get attempt ID from server')
      }
      
      setAttemptId(attemptData.id)
      
      // Update exam meta with student name
      setExamMeta((prev) => ({
        ...prev,
        candidateName: details.name,
      }))
      
      setStudentDetails(details)

      // Initialize question state
      const initialState: QuestionState[] = questions.map((_q, index) => ({
        selectedOptionIndex: null,
        status: index === 0 ? 'notAnswered' : 'notVisited',
      }))
      setQuestionState(initialState)
      setCurrentIndex(0)
      
      // Note: Fullscreen will be requested via useEffect after state updates
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start exam'
      setError(errorMessage)
      console.error('Error starting exam:', err)
      // Don't set studentDetails if attempt creation failed
    }
  }

  // Request fullscreen automatically when exam starts
  useEffect(() => {
    if (studentDetails && attemptId && !submitted && !timeOver) {
      // Check if already in fullscreen
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      
      if (!isCurrentlyFullscreen) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          requestFullscreen()
        }, 500)
        return () => clearTimeout(timer)
      } else {
        setIsFullscreen(true)
      }
    }
  }, [studentDetails, attemptId, submitted, timeOver])

  // Track fullscreen exit and re-enter fullscreen
  useEffect(() => {
    if (!studentDetails || !attemptId || submitted || timeOver) {
      return
    }

    const handleFullscreenChange = async () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )

      if (!isCurrentlyFullscreen && isFullscreen) {
        // Student exited fullscreen - record it, show warning, then force back
        setIsFullscreen(false)
        
        // Report to backend
        if (attemptId) {
          try {
            await fetch(`http://127.0.0.1:4000/attempts/${attemptId}/fullscreen-exit`, {
              method: 'POST',
            })
          } catch (err) {
            console.error('Failed to record fullscreen exit:', err)
          }
        }
        
        // Show warning dialog - this will block until user clicks OK
        alert('⚠️ WARNING: You have exited fullscreen mode. This action has been recorded. Please return to fullscreen to continue the exam.')
        
        // Force back to fullscreen after user acknowledges warning (clicks OK)
        // Small delay to ensure alert is fully dismissed
        setTimeout(() => {
          requestFullscreen()
        }, 100)
      } else if (isCurrentlyFullscreen) {
        setIsFullscreen(true)
      }
    }

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // Also check periodically (in case events don't fire)
    // Use a flag to prevent multiple simultaneous warnings
    let isHandlingExit = false
    const checkInterval = setInterval(() => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )

      if (!isCurrentlyFullscreen && isFullscreen && !submitted && !timeOver && !isHandlingExit) {
        isHandlingExit = true
        void handleFullscreenChange().then(() => {
          // Reset flag after a delay to allow re-checking
          setTimeout(() => {
            isHandlingExit = false
          }, 2000)
        })
      }
    }, 500)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      clearInterval(checkInterval)
    }
  }, [studentDetails, attemptId, submitted, timeOver, isFullscreen])

  // Exit fullscreen when exam is submitted or time is over
  useEffect(() => {
    if ((submitted || timeOver) && isFullscreen) {
      exitFullscreen()
    }
  }, [submitted, timeOver, isFullscreen])

  // Auto-submit when time expires
  useEffect(() => {
    if (timeRemaining === 0 && !timeOver && !submitted && attemptId) {
      setTimeOver(true)
      // Auto-submit answers
      const autoSubmit = async () => {
        try {
          const answers = questions.map((q, index) => ({
            question_id: q.id,
            selected_option:
              questionState[index]?.selectedOptionIndex !== null && questionState[index]?.selectedOptionIndex !== undefined
                ? questionState[index].selectedOptionIndex! + 1
                : null,
          }))

          const submitRes = await fetch(`http://127.0.0.1:4000/attempts/${attemptId}/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers }),
          })

          if (submitRes.ok) {
            setSubmitted(true)
            // Fetch results
            try {
              const resultsRes = await fetch(`http://127.0.0.1:4000/attempts/${attemptId}/results`)
              if (resultsRes.ok) {
                const resultsData = await resultsRes.json()
                setResults({
                  total_score: resultsData.total_score,
                  total_questions: resultsData.total_questions,
                  attempted: resultsData.attempted,
                  correct: resultsData.correct,
                  wrong: resultsData.wrong,
                  not_attempted: resultsData.not_attempted,
                })
              }
            } catch (err) {
              console.error('Failed to fetch results:', err)
            }
          }
        } catch (err) {
          console.error('Auto-submit failed:', err)
        }
      }
      void autoSubmit()
    }
  }, [timeRemaining, timeOver, submitted, attemptId, questions, questionState])

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining <= 0 || timeOver || submitted) {
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        return newTime < 0 ? 0 : newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, timeOver, submitted])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Update displayed time
  useEffect(() => {
    setExamMeta((prev) => ({
      ...prev,
      remainingTime: formatTime(timeRemaining),
    }))
  }, [timeRemaining])

  const currentQuestion = questions[currentIndex]

  const statusCounts = useMemo(() => {
    return questionState.reduce(
      (acc, q) => {
        acc[q.status] += 1
        return acc
      },
      {
        notVisited: 0,
        notAnswered: 0,
        answered: 0,
        marked: 0,
        answeredMarked: 0,
      } as Record<QuestionStatus, number>,
    )
  }, [questionState])

  const handleSelectOption = (optionIndex: number) => {
    setQuestionState((prev) => {
      const next = [...prev]
      const current = { ...next[currentIndex] }
      current.selectedOptionIndex = optionIndex
      if (current.status === 'notVisited' || current.status === 'notAnswered') {
        current.status = 'answered'
      }
      next[currentIndex] = current
      return next
    })
  }

  const moveToQuestion = (index: number) => {
    setQuestionState((prev) => {
      const next = [...prev]
      // if leaving a notVisited question, mark as notAnswered
      if (next[currentIndex] && next[currentIndex].status === 'notVisited') {
        next[currentIndex] = { ...next[currentIndex], status: 'notAnswered' }
      }
      if (next[index] && next[index].status === 'notVisited') {
        next[index] = { ...next[index], status: 'notAnswered' }
      }
      return next
    })
    setCurrentIndex(index)
  }

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      moveToQuestion(currentIndex + 1)
    }
  }

  const handleClear = () => {
    setQuestionState((prev) => {
      const next = [...prev]
      next[currentIndex] = {
        ...next[currentIndex],
        selectedOptionIndex: null,
        status: 'notAnswered',
      }
      return next
    })
  }

  const handleSaveAndMarkForReview = () => {
    setQuestionState((prev) => {
      const next = [...prev]
      next[currentIndex] = {
        ...next[currentIndex],
        status: 'answeredMarked',
      }
      return next
    })
  }

  const handleMarkForReviewAndNext = () => {
    setQuestionState((prev) => {
      const next = [...prev]
      const current = { ...next[currentIndex] }
      // If there's already a selected answer, mark as answeredMarked, otherwise just marked
      if (current.selectedOptionIndex !== null && current.selectedOptionIndex !== undefined) {
        current.status = 'answeredMarked'
      } else {
        current.status = 'marked'
      }
      next[currentIndex] = current
      return next
    })
    if (currentIndex < questions.length - 1) {
      moveToQuestion(currentIndex + 1)
    }
  }

  const paletteClassForStatus = (status: QuestionStatus): string => {
    switch (status) {
      case 'answered':
        return 'answered'
      case 'notAnswered':
        return 'not-answered'
      case 'marked':
        return 'marked'
      case 'answeredMarked':
        return 'answered-marked'
      default:
        return 'not-visited'
    }
  }

  const handleSubmit = async () => {
    if (!attemptId) {
      setError('Attempt not started. Please refresh the page and try again.')
      alert('Attempt not started. Please refresh the page and try again.')
      return
    }

    if (submitted) {
      return
    }

    if (!confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return
    }

    setSubmitting(true)
    setError(null)
    
    console.log('Submitting attempt:', attemptId)

    try {
      // Prepare answers
      const answers = questions.map((q, index) => ({
        question_id: q.id,
        selected_option:
          questionState[index]?.selectedOptionIndex !== null && questionState[index]?.selectedOptionIndex !== undefined
            ? questionState[index].selectedOptionIndex! + 1 // Convert 0-based to 1-based
            : null,
      }))

      const res = await fetch(`http://127.0.0.1:4000/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to submit answers' }))
        throw new Error(data.detail || 'Failed to submit answers')
      }

      setSubmitted(true)

      // Fetch results
      try {
        const resultsRes = await fetch(`http://127.0.0.1:4000/attempts/${attemptId}/results`)
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json()
          setResults({
            total_score: resultsData.total_score,
            total_questions: resultsData.total_questions,
            attempted: resultsData.attempted,
            correct: resultsData.correct,
            wrong: resultsData.wrong,
            not_attempted: resultsData.not_attempted,
          })
        }
      } catch (err) {
        console.error('Failed to fetch results:', err)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="exam-root">Loading exam…</div>
  }

  // Show student details form if not yet submitted
  if (!studentDetails) {
    return (
      <>
        <StudentDetailsForm examName={examTitle || 'Exam'} onSubmit={handleStudentDetailsSubmit} />
        {error && (
          <div style={{ 
            position: 'fixed', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            background: '#dc3545', 
            color: 'white', 
            padding: '1.5rem 2rem', 
            borderRadius: '6px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
            {error.includes('Cannot connect') && (
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                <p>Make sure the backend server is running:</p>
                <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>
                  cd backend && uvicorn main:app --reload --port 4000
                </code>
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  if (!currentQuestion) {
    return <div className="exam-root">No questions available for this exam.</div>
  }

  if (error) {
    return (
      <div className="exam-root">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545' }}>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (timeOver || submitted) {
    const isTimeOver = timeOver && !submitted
    const showResults = submitted && results !== null

    return (
      <div className="exam-root">
        <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: isTimeOver ? '#dc3545' : '#28a745', marginBottom: '1rem' }}>
            {isTimeOver ? 'Time Over!' : showResults ? 'Exam Results' : 'Exam Submitted!'}
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            {isTimeOver
              ? 'The exam time has expired. Your answers have been locked.'
              : showResults
                ? 'Your exam has been evaluated. Here are your results:'
                : 'Your exam has been submitted successfully.'}
          </p>

          {showResults ? (
            <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <div
                style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: results.total_score >= 0 ? '#28a745' : '#dc3545',
                  marginBottom: '1rem',
                }}
              >
                Score: {results.total_score}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{results.total_questions}</div>
                  <div>Total Questions</div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>{results.attempted}</div>
                  <div>Attempted</div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{results.correct}</div>
                  <div>Correct</div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{results.wrong}</div>
                  <div>Wrong</div>
                </div>
              </div>
              {results.not_attempted > 0 && (
                <div style={{ marginTop: '1rem', color: '#666' }}>
                  {results.not_attempted} question{results.not_attempted === 1 ? '' : 's'} not attempted
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h3>Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
                <div>
                  <strong>{statusCounts.answered}</strong>
                  <div>Answered</div>
                </div>
                <div>
                  <strong>{statusCounts.notAnswered}</strong>
                  <div>Not Answered</div>
                </div>
                <div>
                  <strong>{statusCounts.marked + statusCounts.answeredMarked}</strong>
                  <div>Marked for Review</div>
                </div>
              </div>
            </div>
          )}

          <p style={{ color: '#666' }}>
            {isTimeOver
              ? 'Please wait for further instructions or contact your teacher.'
              : showResults
                ? 'Thank you for taking the exam!'
                : 'Results will be available soon. Please wait for further instructions.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="exam-root">
      <header className="exam-header">
        <div className="exam-header-left">
          <div className="candidate-info">
            <div>
              <span className="label">Candidate Name :</span>
              <span className="value">{examMeta.candidateName}</span>
            </div>
            <div>
              <span className="label">Exam Name :</span>
              <span className="value">{examMeta.examName}</span>
            </div>
            <div>
              <span className="label">Subject Name :</span>
              <span className="value">{examMeta.subjectName}</span>
            </div>
            <div>
              <span className="label">Remaining Time :</span>
              <span
                className="value time"
                style={{
                  color: timeRemaining <= 300 ? '#dc3545' : timeRemaining <= 600 ? '#ffc107' : 'inherit',
                  fontWeight: timeRemaining <= 300 ? 'bold' : 'normal',
                }}
              >
                {examMeta.remainingTime}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="exam-main">
        <section className="exam-question-area">
          <div className="question-number">Question {currentIndex + 1}:</div>
          <div className="question-body">
            <p>{currentQuestion.text}</p>
            {currentQuestion.image_url && (
              <div style={{ margin: '1rem 0' }}>
                <img
                  src={currentQuestion.image_url}
                  alt="Question"
                  style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            <ol className="options-list">
              {currentQuestion.options.map((option, idx) => (
                <li key={option}>
                  <label>
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={questionState[currentIndex]?.selectedOptionIndex === idx}
                      onChange={() => handleSelectOption(idx)}
                      disabled={timeOver}
                    />{' '}
                    {option}
                  </label>
                </li>
              ))}
            </ol>
          </div>

          <div className="exam-actions">
            <button type="button" className="btn primary" onClick={handleSaveAndNext} disabled={timeOver}>
              Save &amp; Next
            </button>
            <button type="button" className="btn secondary" onClick={handleClear} disabled={timeOver}>
              Clear
            </button>
            <button type="button" className="btn primary outline" onClick={handleSaveAndMarkForReview} disabled={timeOver}>
              Save &amp; Mark for Review
            </button>
            <button type="button" className="btn secondary outline" onClick={handleMarkForReviewAndNext} disabled={timeOver}>
              Mark for Review &amp; Next
            </button>
            <button
              type="button"
              className="btn submit"
              onClick={handleSubmit}
              disabled={submitted || submitting || !attemptId}
            >
              {submitting ? 'Submitting...' : submitted ? 'Submitted' : 'Submit'}
            </button>
          </div>

          <div className="exam-nav">
            <button
              type="button"
              className="btn nav"
              disabled={currentIndex === 0 || timeOver}
              onClick={() => moveToQuestion(Math.max(0, currentIndex - 1))}
            >
              &lt;&lt; Back
            </button>
            <button
              type="button"
              className="btn nav"
              disabled={currentIndex === questions.length - 1 || timeOver}
              onClick={() => moveToQuestion(Math.min(questions.length - 1, currentIndex + 1))}
            >
              Next &gt;&gt;
            </button>
          </div>
        </section>

        <aside className="exam-sidebar">
          <div className="status-panel">
            <div className="status-row">
              <span className="badge not-visited">{statusCounts.notVisited}</span>
              <span>Not Visited</span>
            </div>
            <div className="status-row">
              <span className="badge answered">{statusCounts.answered}</span>
              <span>Answered</span>
            </div>
            <div className="status-row">
              <span className="badge not-answered">{statusCounts.notAnswered}</span>
              <span>Not Answered</span>
            </div>
            <div className="status-row">
              <span className="badge marked">{statusCounts.marked}</span>
              <span>Marked for Review</span>
            </div>
            <div className="status-row">
              <span className="badge answered-marked">{statusCounts.answeredMarked}</span>
              <span>Answered &amp; Marked for Review</span>
            </div>
          </div>

          <div className="palette">
            {questions.map((q, index) => (
              <button
                key={q.id}
                type="button"
                className={`palette-item ${paletteClassForStatus(questionState[index]?.status)}`}
                onClick={() => moveToQuestion(index)}
                disabled={timeOver}
              >
                {(index + 1).toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

