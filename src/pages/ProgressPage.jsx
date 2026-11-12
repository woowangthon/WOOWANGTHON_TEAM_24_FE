import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDocumentProgress } from '../api/documents.js'
import ProgressSteps from '../components/common/ProgressSteps.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'

function formatElapsedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function ProgressPage() {
  const { id } = useParams()
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [analysisTimer, setAnalysisTimer] = useState({ documentId: null, elapsedSeconds: 0 })

  const loadProgress = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const nextProgress = await getDocumentProgress(id)
      setProgress(nextProgress)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    const initialLoadId = window.setTimeout(
      () => loadProgress({ showLoading: true }),
      0,
    )

    return () => window.clearTimeout(initialLoadId)
  }, [loadProgress])

  useEffect(() => {
    if (progress?.status !== 'processing') {
      return undefined
    }

    const intervalId = window.setInterval(loadProgress, 2000)
    return () => window.clearInterval(intervalId)
  }, [loadProgress, progress?.status])

  const processedPages = progress?.processed_pages ?? 0
  const totalPages = progress?.total_pages ?? 0
  const isExtractionComplete = totalPages > 0 && processedPages >= totalPages
  const isAnalysisRunning = progress?.status === 'processing' && isExtractionComplete

  useEffect(() => {
    if (!isAnalysisRunning) {
      return undefined
    }

    const startedAt = Date.now()
    const updateElapsedTime = () => {
      setAnalysisTimer({
        documentId: id,
        elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
      })
    }
    const initialTimerId = window.setTimeout(updateElapsedTime, 0)
    const elapsedTimerId = window.setInterval(updateElapsedTime, 1000)

    return () => {
      window.clearTimeout(initialTimerId)
      window.clearInterval(elapsedTimerId)
    }
  }, [id, isAnalysisRunning])

  if (isLoading && !progress) {
    return <p className="state-message" role="status">진행 상태를 불러오는 중입니다.</p>
  }

  if (error && !progress) {
    return (
      <section className="state-message state-message--error" role="alert">
        <h1>진행 상태를 불러오지 못했습니다</h1>
        <p>{error}</p>
        <button className="secondary-button" type="button" onClick={() => loadProgress({ showLoading: true })}>
          다시 시도
        </button>
      </section>
    )
  }

  const percentage = totalPages === 0
    ? 0
    : Math.round((processedPages / totalPages) * 100)
  const isFailed = progress?.status === 'failed'
  const failedStage = isExtractionComplete ? 'AI 설명 분석' : '페이지 추출'

  return (
    <section className="progress-page">
      <div className="progress-heading-row">
        <div>
          <p className="eyebrow">문서 #{id}</p>
          <h1>강의자료 처리 현황</h1>
          <p>처리 중에는 페이지를 벗어나지 않아도 2초마다 진행 상태가 자동으로 갱신됩니다.</p>
        </div>
        <StatusBadge status={progress.status} />
      </div>

      {error && (
        <p className="inline-error" role="alert">
          최신 상태를 가져오지 못했습니다. 기존 정보를 표시합니다: {error}
        </p>
      )}

      <ProgressSteps
        status={progress.status}
        processedPages={processedPages}
        totalPages={totalPages}
      />

      {isFailed ? (
        <section className="progress-card progress-failed" role="alert">
          <h2>{failedStage}을 완료하지 못했습니다</h2>
          <p>
            {failedStage} 중 오류가 발생했습니다. 다시 조회해도 실패 상태가 계속되면
            담당자에게 문의하거나 자료를 다시 등록해 주세요.
          </p>
          <div className="progress-actions">
            <button className="secondary-button" type="button" onClick={() => loadProgress({ showLoading: true })}>
              다시 조회
            </button>
            <Link className="text-link" to="/dashboard">대시보드로 돌아가기</Link>
          </div>
        </section>
      ) : (
        <>
          <section className="progress-card" aria-labelledby="page-progress-title">
            <div className="progress-card-heading">
              <div>
                <p className="progress-card-label">페이지 추출 현황</p>
                <h2 id="page-progress-title">{processedPages} / {totalPages}페이지</h2>
              </div>
              <strong className="progress-percentage">{percentage}%</strong>
            </div>
            <progress value={processedPages} max={totalPages || 1}>
              {percentage}%
            </progress>
            <p className="progress-help" aria-live="polite">
              {progress.status === 'processing' && !isExtractionComplete
                && '페이지에서 이미지와 텍스트를 추출하고 있습니다.'}
              {progress.status === 'processing' && isExtractionComplete
                && '페이지 추출이 완료되었습니다. AI가 그림 설명을 분석하고 있습니다.'}
              {progress.status === 'review_pending' && '분석이 끝났습니다. 검수가 필요한 설명을 확인해 주세요.'}
              {progress.status === 'published' && '검수와 공개가 완료되어 학생이 자료를 볼 수 있습니다.'}
            </p>
            {isAnalysisRunning && (
              <div className="analysis-wait-status" role="status">
                <span className="analysis-spinner" aria-hidden="true" />
                <div>
                  <strong>AI 설명을 분석하고 있습니다</strong>
                  <p>
                    경과 시간 {formatElapsedTime(analysisTimer.documentId === id ? analysisTimer.elapsedSeconds : 0)} · 페이지 수에 따라 몇 분 정도 걸릴 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </section>

          <div className="progress-actions">
            {progress.status === 'review_pending' && (
              <Link className="primary-link-button" to={`/review/${id}`}>
                검수 화면으로 이동
              </Link>
            )}
            {progress.status === 'published' && (
              <Link className="primary-link-button" to="/student">
                공개된 화면 확인
              </Link>
            )}
            <Link className="text-link" to="/dashboard">대시보드로 돌아가기</Link>
          </div>
        </>
      )}
    </section>
  )
}

export default ProgressPage
