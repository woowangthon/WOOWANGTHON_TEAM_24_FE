import { useState } from 'react'
import StatusBadge from '../components/common/StatusBadge.jsx'
import mockDocument from '../data/documentDetailMock.json'
import mockPageImages from '../data/mockPageImages.js'

const elementTypeLabels = {
  diagram: '도식',
  table: '표',
  graph: '그래프',
  photo: '사진',
  other: '기타',
}

const reviewStatusLabels = {
  needs_review: '검수 필요',
  auto_passed: '자동 통과',
  approved: '승인 완료',
  edited: '수정 후 승인',
}

function sortReviewItems(elements) {
  return [...elements].sort((first, second) => Number(second.flagged) - Number(first.flagged))
}

function ReviewPage() {
  const firstPage = mockDocument.pages[0]
  const firstElement = sortReviewItems(firstPage.elements)[0]
  const [document, setDocument] = useState(mockDocument)
  const [selectedPageId, setSelectedPageId] = useState(firstPage.id)
  const [selectedElementId, setSelectedElementId] = useState(firstElement?.id ?? null)

  const selectedPage = document.pages.find((page) => page.id === selectedPageId)
  const reviewItems = sortReviewItems(selectedPage.elements)
  const selectedElement = reviewItems.find((element) => element.id === selectedElementId) ?? reviewItems[0]
  const requiredItems = document.pages.flatMap((page) => page.elements).filter((element) => element.flagged)
  const reviewedItems = requiredItems.filter((element) => ['approved', 'edited'].includes(element.review_status))

  function selectPage(page) {
    const pageItems = sortReviewItems(page.elements)
    setSelectedPageId(page.id)
    setSelectedElementId(pageItems[0]?.id ?? null)
  }

  function approveSelectedElement() {
    if (!selectedElement) return

    setDocument((currentDocument) => ({
      ...currentDocument,
      pages: currentDocument.pages.map((page) => ({
        ...page,
        elements: page.elements.map((element) => (
          element.id === selectedElement.id
            ? { ...element, review_status: 'approved' }
            : element
        )),
      })),
    }))
  }

  return (
    <section className="review-page" aria-labelledby="review-heading">
      <div className="review-heading-row">
        <div>
          <p className="eyebrow">{document.course}</p>
          <h1 id="review-heading">{document.title} 검수</h1>
          <p>원본 자료와 AI 설명을 비교해 주세요.</p>
        </div>
        <p className="review-count" aria-live="polite">
          검수 완료 {reviewedItems.length} / {requiredItems.length}
        </p>
      </div>

      <div className="review-workspace">
        <nav className="review-panel page-navigation" aria-label="문서 페이지 선택">
          <div className="panel-heading">
            <h2>페이지</h2>
            <span>{document.total_pages}개</span>
          </div>
          <ol className="page-list">
            {document.pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className="page-select-button"
                  aria-pressed={selectedPage.id === page.id}
                  onClick={() => selectPage(page)}
                >
                  <span>{page.page_no}페이지</span>
                  <span className="item-count">{page.elements.length}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section className="review-panel original-panel" aria-labelledby="original-heading">
          <div className="panel-heading">
            <h2 id="original-heading">원본 페이지</h2>
            <span>{selectedPage.page_no}페이지</span>
          </div>
          <img
            className="page-preview"
            src={mockPageImages[selectedPage.id]}
            alt={`${selectedPage.page_no}페이지 원본 강의자료`}
          />
          <p className="page-original-text">
            <strong>페이지 원문</strong>
            <span>{selectedPage.text}</span>
          </p>
        </section>

        <section className="review-panel description-panel" aria-labelledby="description-heading">
          <div className="panel-heading">
            <h2 id="description-heading">AI 설명</h2>
            <span>{reviewItems.length}개</span>
          </div>

          {reviewItems.length > 0 ? (
            <>
              <div className="review-item-tabs" aria-label="AI 설명 항목 선택">
                {reviewItems.map((element) => (
                  <button
                    type="button"
                    key={element.id}
                    className="review-item-button"
                    aria-pressed={selectedElement.id === element.id}
                    onClick={() => setSelectedElementId(element.id)}
                  >
                    {reviewStatusLabels[element.review_status] ?? element.review_status} · {element.title}
                  </button>
                ))}
              </div>

              <article className="description-content">
                <div className="description-title-row">
                  <div>
                    <p className="element-type">{elementTypeLabels[selectedElement.type] ?? selectedElement.type}</p>
                    <h3>{selectedElement.title}</h3>
                  </div>
                  <StatusBadge status={selectedElement.review_status} />
                </div>

                {selectedElement.flag_reasons.length > 0 && (
                  <div className="warning-message" role="status">
                    <strong>검수 필요 사유</strong>
                    <ul>
                      {selectedElement.flag_reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <dl>
                  <div>
                    <dt>한 줄 설명</dt>
                    <dd>{selectedElement.alt}</dd>
                  </div>
                  <div>
                    <dt>상세 설명</dt>
                    <dd>{selectedElement.description}</dd>
                  </div>
                  <div>
                    <dt>그림 속 글자</dt>
                    <dd>{selectedElement.labels.join(', ') || '없음'}</dd>
                  </div>
                </dl>

                {selectedElement.table && (
                  <div className="table-wrapper">
                    <table>
                      <caption className="sr-only">{selectedElement.title}</caption>
                      <thead>
                        <tr>
                          {selectedElement.table.headers.map((header) => (
                            <th scope="col" key={header}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedElement.table.rows.map((row, rowIndex) => (
                          <tr key={`${selectedElement.id}-${rowIndex}`}>
                            {row.map((cell, cellIndex) => (
                              <td key={`${cell}-${cellIndex}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedElement.flagged && (
                  <div className="review-actions">
                    <button
                      type="button"
                      className="approve-button"
                      disabled={selectedElement.review_status === 'approved'}
                      onClick={approveSelectedElement}
                    >
                      {selectedElement.review_status === 'approved' ? '승인 완료' : '이 설명 승인'}
                    </button>
                  </div>
                )}
              </article>
            </>
          ) : (
            <div className="empty-elements" role="status">
              <h3>검수할 그림이 없습니다</h3>
              <p>이 페이지에는 원문 텍스트만 있습니다.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default ReviewPage
