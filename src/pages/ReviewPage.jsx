import StatusBadge from '../components/common/StatusBadge.jsx'
import mockDocument from '../data/mockDocument.js'

function ReviewPage() {
  const page = mockDocument.pages[0]
  const element = page.elements[0]

  return (
    <section className="review-page" aria-labelledby="review-heading">
      <div className="review-heading-row">
        <div>
          <p className="eyebrow">{mockDocument.course}</p>
          <h1 id="review-heading">{mockDocument.title} 검수</h1>
          <p>원본 자료와 AI 설명을 비교해 주세요.</p>
        </div>
        <p className="review-count" aria-live="polite">
          검수 완료 0 / 1
        </p>
      </div>

      <div className="review-layout">
        <section className="review-panel" aria-labelledby="original-heading">
          <div className="panel-heading">
            <h2 id="original-heading">원본 페이지</h2>
            <span>{page.page_no}페이지</span>
          </div>
          <img
            className="page-preview"
            src={page.image_url}
            alt="TCP 연결 설정 과정을 설명하는 예시 강의 슬라이드"
          />
        </section>

        <section className="review-panel" aria-labelledby="description-heading">
          <div className="panel-heading">
            <h2 id="description-heading">AI 설명</h2>
            <StatusBadge status={element.review_status} />
          </div>

          <div className="warning-message" role="status">
            <strong>검수 필요 사유</strong>
            <ul>
              {element.flag_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <article className="description-content">
            <h3>{element.title}</h3>
            <dl>
              <div>
                <dt>한 줄 설명</dt>
                <dd>{element.alt}</dd>
              </div>
              <div>
                <dt>상세 설명</dt>
                <dd>{element.description}</dd>
              </div>
              <div>
                <dt>그림 속 글자</dt>
                <dd>{element.labels.join(', ')}</dd>
              </div>
            </dl>
          </article>
        </section>
      </div>
    </section>
  )
}

export default ReviewPage
