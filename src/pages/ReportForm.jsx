import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

function ReportForm({ elementId, elementTitle, onReported }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/elements/${encodeURIComponent(elementId)}/reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        },
      )

      if (!response.ok) {
        let errorMessage = '신고를 접수하지 못했습니다.'

        try {
          const body = await response.json()
          if (typeof body.detail === 'string') errorMessage = body.detail
        } catch {
          // JSON이 아닌 오류 응답에는 기본 문구를 사용합니다.
        }

        throw new Error(errorMessage)
      }

      setMessage('')
      setIsOpen(false)
      setSuccess('신고가 접수되었습니다.')
      onReported()
    } catch (submitError) {
      setError(submitError.message || '신고를 접수하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        className="secondary-button"
        aria-label={`${elementTitle} 설명이 이상해요`}
        aria-expanded={isOpen}
        disabled={USE_MOCK_API || isSubmitting}
        onClick={() => {
          setIsOpen((open) => !open)
          setError('')
          setSuccess('')
        }}
      >
        설명 신고
      </button>

      {USE_MOCK_API && (
        <p>신고 기능은 실제 API 연결 모드에서 사용할 수 있습니다.</p>
      )}

      {isOpen && (
        <form onSubmit={handleSubmit}>
          <label htmlFor={`report-message-${elementId}`}>
            신고 사유 (선택)
          </label>
          <textarea
            id={`report-message-${elementId}`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '접수 중...' : '신고 보내기'}
          </button>
        </form>
      )}

      {success && <p role="status">{success}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}

export default ReportForm