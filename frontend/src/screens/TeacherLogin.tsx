import React, { useState } from 'react'
import './teacher.css'

export const TeacherLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://127.0.0.1:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Login failed' }))
        throw new Error(data.detail || 'Invalid credentials')
      }

      const data = await res.json()
      if (data.role !== 'TEACHER') {
        throw new Error('Only teachers can access this page')
      }

      localStorage.setItem('teacher_token', data.token)
      localStorage.setItem('teacher_name', data.name)
      window.location.hash = '#/teacher/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="teacher-login-container">
      <div className="teacher-login-box">
        <h1>Teacher Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="hint">
          Don't have an account? Register via{' '}
          <a href="http://127.0.0.1:4000/docs" target="_blank" rel="noopener noreferrer">
            Swagger
          </a>
        </p>
      </div>
    </div>
  )
}

