import React, { useEffect, useState } from 'react'
import './teacher.css'

type Question = {
  id: number
  text: string
  options: string[]
  correct_option?: number
  marks?: number
  negative_marks?: number
  image_url?: string
}

export const AddQuestions: React.FC<{ examId: number }> = ({ examId }) => {
  const [examInfo, setExamInfo] = useState<{ title: string; subject: string } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [option1, setOption1] = useState('')
  const [option2, setOption2] = useState('')
  const [option3, setOption3] = useState('')
  const [option4, setOption4] = useState('')
  const [correctOption, setCorrectOption] = useState(1)
  const [marks, setMarks] = useState(4)
  const [negativeMarks, setNegativeMarks] = useState(1)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem('teacher_token')
        const headers: HeadersInit = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        const res = await fetch(`http://127.0.0.1:4000/exams/${examId}`, { headers })
        if (!res.ok) throw new Error('Failed to load exam')
        const data = await res.json()
        setExamInfo({ title: data.title, subject: data.subject })
        setQuestions(data.questions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exam')
      } finally {
        setLoading(false)
      }
    }
    void fetchExam()
  }, [examId])

  const resetForm = () => {
    setQuestionText('')
    setOption1('')
    setOption2('')
    setOption3('')
    setOption4('')
    setCorrectOption(1)
    setMarks(4)
    setNegativeMarks(1)
    setImageUrl('')
    setEditingQuestionId(null)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setUploadingImage(true)
    setError(null)

    const token = localStorage.getItem('teacher_token')
    if (!token) {
      setError('Not logged in')
      setUploadingImage(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('http://127.0.0.1:4000/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to upload image' }))
        throw new Error(data.detail || 'Failed to upload image')
      }

      const data = await res.json()
      setImageUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setQuestionText(question.text)
    setOption1(question.options[0] || '')
    setOption2(question.options[1] || '')
    setOption3(question.options[2] || '')
    setOption4(question.options[3] || '')
    setCorrectOption(question.correct_option || 1)
    setMarks(question.marks || 4)
    setNegativeMarks(question.negative_marks || 1)
    setImageUrl(question.image_url || '')
    setEditingQuestionId(question.id)
    // Scroll to form
    document.querySelector('.questions-form-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError(null)

    const token = localStorage.getItem('teacher_token')
    if (!token) {
      setError('Not logged in')
      return
    }

    try {
      const isEditing = editingQuestionId !== null
      const url = isEditing
        ? `http://127.0.0.1:4000/exams/${examId}/questions/${editingQuestionId}`
        : `http://127.0.0.1:4000/exams/${examId}/questions`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: questionText,
          option1,
          option2,
          option3,
          option4,
          correct_option: correctOption,
          marks,
          negative_marks: negativeMarks,
          image_url: imageUrl || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to save question' }))
        throw new Error(data.detail || 'Failed to save question')
      }

      const data = await res.json()
      if (isEditing) {
        // Update existing question in list
        setQuestions(
          questions.map((q) =>
            q.id === editingQuestionId
              ? {
                  id: q.id,
                  text: data.text,
                  options: [data.option1, data.option2, data.option3, data.option4],
                  correct_option: data.correct_option,
                  marks: data.marks,
                  negative_marks: data.negative_marks,
                  image_url: data.image_url,
                }
              : q,
          ),
        )
      } else {
        // Add new question
        setQuestions([
          ...questions,
          {
            id: data.id,
            text: data.text,
            options: [data.option1, data.option2, data.option3, data.option4],
            correct_option: data.correct_option,
            marks: data.marks,
            negative_marks: data.negative_marks,
            image_url: data.image_url,
          },
        ])
      }

      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    setDeleting(questionId)
    setError(null)

    const token = localStorage.getItem('teacher_token')
    if (!token) {
      setError('Not logged in')
      return
    }

    try {
      const res = await fetch(`http://127.0.0.1:4000/exams/${examId}/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Failed to delete question' }))
        throw new Error(data.detail || 'Failed to delete question')
      }

      setQuestions(questions.filter((q) => q.id !== questionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="teacher-dashboard">Loading...</div>
  }

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <h1>Add Questions - {examInfo?.title || 'Loading...'}</h1>
        <button onClick={() => (window.location.hash = '#/teacher/dashboard')} className="btn-secondary">
          Back to Dashboard
        </button>
      </header>

      <main className="teacher-main">
        {error && <div className="error-message">{error}</div>}

        <div className="add-questions-layout">
          <div className="questions-form-section">
            <h2>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h2>
            <form onSubmit={handleSubmitQuestion} className="question-form">
              <div className="form-group">
                <label htmlFor="question-text">Question Text</label>
                <textarea
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                  disabled={adding}
                  rows={4}
                  placeholder="Enter the question..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="option1">Option 1</label>
                <input
                  id="option1"
                  type="text"
                  value={option1}
                  onChange={(e) => setOption1(e.target.value)}
                  required
                  disabled={adding}
                />
              </div>
              <div className="form-group">
                <label htmlFor="option2">Option 2</label>
                <input
                  id="option2"
                  type="text"
                  value={option2}
                  onChange={(e) => setOption2(e.target.value)}
                  required
                  disabled={adding}
                />
              </div>
              <div className="form-group">
                <label htmlFor="option3">Option 3</label>
                <input
                  id="option3"
                  type="text"
                  value={option3}
                  onChange={(e) => setOption3(e.target.value)}
                  required
                  disabled={adding}
                />
              </div>
              <div className="form-group">
                <label htmlFor="option4">Option 4</label>
                <input
                  id="option4"
                  type="text"
                  value={option4}
                  onChange={(e) => setOption4(e.target.value)}
                  required
                  disabled={adding}
                />
              </div>

              <div className="form-group">
                <label htmlFor="image-file">Question Image (optional)</label>
                <input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={adding || uploadingImage}
                />
                {uploadingImage && <p style={{ color: '#666', fontSize: '0.9rem' }}>Uploading image...</p>}
                {imageUrl && !uploadingImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('')
                        const fileInput = document.getElementById('image-file') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                      }}
                      style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      className="btn-secondary"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="correct-option">Correct Option (1-4)</label>
                <input
                  id="correct-option"
                  type="number"
                  min={1}
                  max={4}
                  value={correctOption}
                  onChange={(e) => setCorrectOption(Number(e.target.value))}
                  required
                  disabled={adding}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="marks">Marks</label>
                  <input
                    id="marks"
                    type="number"
                    min={1}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    required
                    disabled={adding}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="negative-marks">Negative Marks</label>
                  <input
                    id="negative-marks"
                    type="number"
                    min={0}
                    step={0.5}
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    required
                    disabled={adding}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={adding}>
                  {adding
                    ? editingQuestionId
                      ? 'Updating...'
                      : 'Adding...'
                    : editingQuestionId
                      ? 'Update Question'
                      : 'Add Question'}
                </button>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                    disabled={adding}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="questions-list-section">
            <h2>Questions Added ({questions.length})</h2>
            {questions.length === 0 ? (
              <p className="empty-state">No questions added yet.</p>
            ) : (
              <ul className="questions-list">
                {questions.map((q, idx) => (
                  <li key={q.id}>
                    <div className="question-item">
                      <div className="question-header">
                        <strong>Q{idx + 1}:</strong>
                        <div className="question-actions">
                          <button
                            type="button"
                            onClick={() => handleEditQuestion(q)}
                            className="btn-edit"
                            disabled={deleting === q.id}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="btn-delete"
                            disabled={deleting === q.id}
                          >
                            {deleting === q.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                      <p>{q.text}</p>
                      {q.image_url && (
                        <div style={{ margin: '0.5rem 0' }}>
                          <img
                            src={q.image_url}
                            alt="Question image"
                            style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }}
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <div className="question-options">
                        {q.options.map((opt, i) => (
                          <span key={i} className={i + 1 === q.correct_option ? 'correct-option' : ''}>
                            {i + 1}. {opt}
                            {i + 1 === q.correct_option && ' ✓'}
                          </span>
                        ))}
                      </div>
                      <div className="question-meta">
                        Marks: {q.marks || 4} | Negative: {q.negative_marks || 1}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  window.location.hash = '#/teacher/dashboard'
                }}
              >
                Finish Exam Setup
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

