const steps = [
  { key: 'uploaded', label: '업로드', description: 'PDF 접수 완료' },
  { key: 'extracting', label: '페이지 추출', description: '이미지와 텍스트 추출' },
  { key: 'analyzing', label: 'AI 분석', description: '그림 설명 생성' },
  { key: 'review_pending', label: '검수 대기', description: '설명 확인 및 승인' },
  { key: 'published', label: '공개', description: '학생에게 제공' },
]

function ProgressSteps({ status, processedPages = 0, totalPages = 0 }) {
  const isExtractionComplete = processedPages >= totalPages
  const processingStepIndex = isExtractionComplete ? 2 : 1
  const currentStepIndex = {
    processing: processingStepIndex,
    failed: processingStepIndex,
    review_pending: 3,
    published: 4,
  }
  const activeIndex = currentStepIndex[status] ?? 0

  return (
    <ol className="progress-steps" aria-label="문서 처리 단계">
      {steps.map((step, index) => {
        let stepState = index < activeIndex
          ? 'complete'
          : index === activeIndex
            ? 'current'
            : 'upcoming'

        if (status === 'failed' && index === activeIndex) {
          stepState = 'failed'
        }

        return (
          <li
            className={`progress-step progress-step--${stepState}`}
            key={step.key}
            aria-current={['current', 'failed'].includes(stepState) ? 'step' : undefined}
          >
            <span className="progress-step-number" aria-hidden="true">
              {stepState === 'complete' ? '✓' : stepState === 'failed' ? '!' : index + 1}
            </span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
              <span className="sr-only">
                {stepState === 'complete' && ' 완료'}
                {stepState === 'current' && ' 현재 단계'}
                {stepState === 'failed' && ' 처리 실패'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default ProgressSteps
