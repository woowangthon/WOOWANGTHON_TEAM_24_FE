import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadDocument } from '../api/documents.js'

const MAX_PDF_BYTES = 20_000_000

function formatFileSize(bytes) {
  if (bytes < 1_000_000) {
    return `${Math.ceil(bytes / 1_000)}KB`
  }

  return `${(bytes / 1_000_000).toFixed(1)}MB`
}

function validateForm({ course, title, file }) {
  const errors = {}

  if (!course.trim()) {
    errors.course = '과목명을 입력해 주세요.'
  }

  if (!title.trim()) {
    errors.title = '강의 제목을 입력해 주세요.'
  }

  if (!file) {
    errors.file = '업로드할 PDF 파일을 선택해 주세요.'
  } else {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      errors.file = 'PDF 형식의 파일만 업로드할 수 있습니다.'
    } else if (file.size > MAX_PDF_BYTES) {
      errors.file = 'PDF 파일은 20MB 이하여야 합니다.'
    }
  }

  return errors
}

function HomePage() {
  const navigate = useNavigate()
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(setValue, fieldName, value) {
    setValue(value)
    setErrors((currentErrors) => ({ ...currentErrors, [fieldName]: '' }))
    setSubmitError('')
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setErrors((currentErrors) => ({ ...currentErrors, file: '' }))
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForm({ course, title, file })

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitError('입력한 내용을 확인해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setSubmitError('')

    try {
      const uploadedDocument = await uploadDocument({
        course: course.trim(),
        title: title.trim(),
        file,
      })
      navigate(`/progress/${uploadedDocument.id}`)
    } catch (uploadError) {
      setErrors({ file: uploadError.message })
      setSubmitError('업로드하지 못했습니다. 파일을 확인한 후 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="upload-page">
      <div className="upload-introduction">
        <p className="eyebrow">AI 강의자료 접근성 서비스</p>
        <h1>PDF 강의자료를<br />보이는 설명으로</h1>
        <p>
          강의자료를 올리면 AI가 그림과 표를 분석합니다.
          분석이 끝난 뒤 설명을 검수하고 학생에게 공개할 수 있습니다.
        </p>
        <ul className="upload-requirements" aria-label="업로드 조건">
          <li>PDF 파일만 가능</li>
          <li>최대 20MB</li>
          <li>1~30페이지</li>
        </ul>
      </div>

      <form className="upload-form" onSubmit={handleSubmit} noValidate>
        <div className="upload-form-heading">
          <h2>새 강의자료 등록</h2>
          <p>과목 정보와 PDF 파일을 입력해 주세요.</p>
        </div>

        {submitError && (
          <p className="form-error-summary" role="alert">{submitError}</p>
        )}

        <div className="form-field">
          <label htmlFor="course">과목명 <span aria-hidden="true">*</span></label>
          <input
            id="course"
            name="course"
            type="text"
            value={course}
            placeholder="예: 운영체제"
            aria-invalid={Boolean(errors.course)}
            aria-describedby={errors.course ? 'course-error' : undefined}
            onChange={(event) => updateField(setCourse, 'course', event.target.value)}
          />
          {errors.course && <p className="field-error" id="course-error">{errors.course}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="lecture-title">강의 제목 <span aria-hidden="true">*</span></label>
          <input
            id="lecture-title"
            name="title"
            type="text"
            value={title}
            placeholder="예: 5주차 프로세스와 스레드"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            onChange={(event) => updateField(setTitle, 'title', event.target.value)}
          />
          {errors.title && <p className="field-error" id="title-error">{errors.title}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="pdf-file">강의자료 PDF <span aria-hidden="true">*</span></label>
          <div className={`file-input-area${errors.file ? ' file-input-area--error' : ''}`}>
            <input
              id="pdf-file"
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              aria-invalid={Boolean(errors.file)}
              aria-describedby={`file-help${errors.file ? ' file-error' : ''}`}
              onChange={handleFileChange}
            />
            <p id="file-help">PDF · 최대 20MB · 1~30페이지</p>
          </div>
          {file && (
            <p className="selected-file" role="status">
              <span>{file.name}</span>
              <strong>{formatFileSize(file.size)}</strong>
            </p>
          )}
          {errors.file && <p className="field-error" id="file-error">{errors.file}</p>}
        </div>

        <button className="upload-submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '업로드 중…' : '분석 시작'}
        </button>
      </form>
    </section>
  )
}

export default HomePage
