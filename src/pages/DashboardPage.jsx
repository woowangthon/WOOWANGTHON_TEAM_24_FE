import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDocuments } from '../api/documents.js'
import StatusBadge from '../components/common/StatusBadge.jsx'

function DashboardPage() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDocuments = useCallback(async () => {
    try {
      const nextDocuments = await getDocuments()
      setDocuments(nextDocuments)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadDocuments, 0)
    const intervalId = window.setInterval(loadDocuments, 2000)

    return () => {
      window.clearTimeout(initialLoadId)
      window.clearInterval(intervalId)
    }
  }, [loadDocuments])

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">검수자 대시보드</p>
          <h1>강의자료 관리</h1>
          <p>처리 상태와 검수 요청을 한눈에 확인할 수 있습니다.</p>
        </div>
        <span className="auto-refresh-label" role="status">2초마다 자동 갱신</span>
      </div>

      {error && (
        <div className="inline-error" role="alert">
          <p>문서 목록을 갱신하지 못했습니다: {error}</p>
          <button className="secondary-button" type="button" onClick={loadDocuments}>다시 시도</button>
        </div>
      )}

      {isLoading ? (
        <p className="state-message" role="status">문서 목록을 불러오는 중입니다.</p>
      ) : (
        <div className="document-grid">
          {documents.map((document) => {
            const percentage = document.total_pages === 0
              ? 0
              : Math.round((document.processed_pages / document.total_pages) * 100)
            const canOpenReview = ['review_pending', 'published'].includes(document.status)
            const destination = canOpenReview
              ? `/review/${document.id}`
              : `/progress/${document.id}`
            const linkLabel = document.status === 'review_pending'
              ? '검수하기'
              : document.status === 'published'
                ? '검수 화면 확인'
                : '상태 확인'

            return (
              <article className="document-card" key={document.id}>
                <div className="document-card-heading">
                  <div>
                    <p>{document.course}</p>
                    <h2>{document.title}</h2>
                  </div>
                  <StatusBadge status={document.status} />
                </div>

                <div className="document-progress-summary">
                  <span>페이지 추출률</span>
                  <strong>{document.processed_pages}/{document.total_pages} ({percentage}%)</strong>
                </div>
                <progress value={document.processed_pages} max={document.total_pages || 1}>
                  {percentage}%
                </progress>

                <dl className="document-counts">
                  <div>
                    <dt>검수 필요</dt>
                    <dd>{document.needs_review_count}건</dd>
                  </div>
                  <div>
                    <dt>학생 신고</dt>
                    <dd>{document.report_count}건</dd>
                  </div>
                </dl>

                <Link className="document-card-link" to={destination}>
                  {linkLabel}
                </Link>
              </article>
            )
          })}
          {documents.length === 0 && (
            <div className="state-message" role="status">
              <h2>등록된 강의자료가 없습니다</h2>
              <p>자료 등록 화면에서 PDF 강의자료를 등록해 주세요.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default DashboardPage
