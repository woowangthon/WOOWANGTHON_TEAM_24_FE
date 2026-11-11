const steps = [
  { key: 'uploaded', label: '업로드', description: 'PDF 접수 완료' },
  { key: 'processing', label: '분석 중', description: '페이지와 그림 분석' },
  { key: 'review_pending', label: '검수 대기', description: '설명 확인 및 승인' },
  { key: 'published', label: '공개', description: '학생에게 제공' },
]

const currentStepIndex = {
  processing: 1,
  review_pending: 2,
  published: 3,
}

function ProgressSteps({ status }) {
  const activeIndex = currentStepIndex[status] ?? 0

  return (
    <ol className="progress-steps" aria-label="문서 처리 단계">
      {steps.map((step, index) => {
        const stepState = index < activeIndex
          ? 'complete'
          : index === activeIndex
            ? 'current'
            : 'upcoming'

        return (
          <li
            className={`progress-step progress-step--${stepState}`}
            key={step.key}
            aria-current={stepState === 'current' ? 'step' : undefined}
          >
            <span className="progress-step-number" aria-hidden="true">
              {stepState === 'complete' ? '✓' : index + 1}
            </span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
              <span className="sr-only">
                {stepState === 'complete' && ' 완료'}
                {stepState === 'current' && ' 현재 단계'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default ProgressSteps
