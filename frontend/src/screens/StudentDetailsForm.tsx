import React, { useState } from 'react'
import './student-details-form.css'

type StudentDetails = {
  name: string
  rollNumber: string
  className: string
  section: string
}

type StudentDetailsFormProps = {
  examName: string
  onSubmit: (details: StudentDetails) => void
}

export const StudentDetailsForm: React.FC<StudentDetailsFormProps> = ({ examName, onSubmit }) => {
  const [formData, setFormData] = useState<StudentDetails>({
    name: '',
    rollNumber: '',
    className: '',
    section: '',
  })
  const [errors, setErrors] = useState<Partial<StudentDetails>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof StudentDetails]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Partial<StudentDetails> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = 'Roll number is required'
    }
    if (!formData.className.trim()) {
      newErrors.className = 'Class is required'
    }
    if (!formData.section.trim()) {
      newErrors.section = 'Section is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="student-details-form-container">
      <div className="student-details-form-card">
        <h1>Student Information</h1>
        <p className="exam-name">Exam: {examName}</p>
        <p className="form-instruction">Please fill in your details to start the exam.</p>
        
        <form onSubmit={handleSubmit} className="student-details-form">
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="rollNumber">
              Roll Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              className={errors.rollNumber ? 'error' : ''}
              placeholder="Enter your roll number"
            />
            {errors.rollNumber && <span className="error-message">{errors.rollNumber}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="className">
              Class <span className="required">*</span>
            </label>
            <input
              type="text"
              id="className"
              name="className"
              value={formData.className}
              onChange={handleChange}
              className={errors.className ? 'error' : ''}
              placeholder="e.g., 10th, 11th, 12th"
            />
            {errors.className && <span className="error-message">{errors.className}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="section">
              Section <span className="required">*</span>
            </label>
            <input
              type="text"
              id="section"
              name="section"
              value={formData.section}
              onChange={handleChange}
              className={errors.section ? 'error' : ''}
              placeholder="e.g., A, B, C"
            />
            {errors.section && <span className="error-message">{errors.section}</span>}
          </div>

          <button type="submit" className="btn-start-exam">
            Start Exam
          </button>
        </form>
      </div>
    </div>
  )
}

