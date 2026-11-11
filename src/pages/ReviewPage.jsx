import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  approveElement,
  editElement,
  getDocumentDetail,
  getPageImageUrl,
  publishDocument as publishDocumentRequest,
} from '../api/documents.js'
import StatusBadge from '../components/common/StatusBadge.jsx'

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

const completedReviewStatuses = ['approved', 'edited']

function sortReviewItems(elements) {
  return [...elements].sort((first, second) => {
    const firstNeedsReview = Number(first.review_status === 'needs_review')
    const secondNeedsReview = Number(second.review_status === 'needs_review')

    if (firstNeedsReview !== secondNeedsReview) {
      return secondNeedsReview - firstNeedsReview
    }

    return Number(second.flagged) - Number(first.flagged)
  })
}

function ReviewPage() {
  const { id } = useParams()
  const [document, setDocument] = useState(null)
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftAlt, setDraftAlt] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [actionError, setActionError] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const loadRequestIdRef = useRef(0)

  const loadDocument = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId

    setDocument(null)
    setSelectedPageId(null)
    setSelectedElementId(null)
    setIsEditing(false)
    setDraftAlt('')
    setDraftDescription('')
    setStatusMessage('')
    setLoadError('')
    setImageError(false)
    setActionError('')
    setIsSubmittingAction(false)
    setIsLoading(true)

    try {
      const nextDocument = await getDocumentDetail(id)
      if (requestId !== loadRequestIdRef.current) return

      const firstPage = nextDocument.pages[0]
      const firstElement = firstPage
        ? sortReviewItems(firstPage.elements)[0]
        : null

      setDocument(nextDocument)
      setSelectedPageId(firstPage?.id ?? null)
      setSelectedElementId(firstElement?.id ?? null)
      setLoadError('')
      setImageError(false)
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return
      setLoadError(error.message)
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadDocument, 0)
    return () => {
      window.clearTimeout(initialLoadId)
      loadRequestIdRef.current += 1
    }
  }, [loadDocument])

  if (isLoading && !document) {
    return <p className="state-message" role="status">검수 자료를 불러오는 중입니다.</p>
  }

  if (loadError && !document) {
    return (
      <section className="state-message state-message--error" role="alert">
        <h1>검수 자료를 불러오지 못했습니다</h1>
        <p>{loadError}</p>
        <button className="secondary-button" type="button" onClick={loadDocument}>
          다시 시도
        </button>
      </section>
    )
  }

  if (!document?.pages?.length) {
    return (
      <section className="state-message" role="status">
        <h1>검수할 페이지가 없습니다</h1>
        <p>문서 분석 결과에 페이지가 포함되지 않았습니다.</p>
      </section>
    )
  }

  const selectedPage = document.pages.find((page) => page.id === selectedPageId) ?? document.pages[0]
  const reviewItems = sortReviewItems(selectedPage.elements)
  const selectedElement = reviewItems.find((element) => element.id === selectedElementId) ?? reviewItems[0]
  const allElements = document.pages.flatMap((page) => page.elements)
  const requiredItems = allElements.filter((element) => element.flagged)
  const reviewedItems = requiredItems.filter((element) => completedReviewStatuses.includes(element.review_status))
  const pendingItems = allElements.filter((element) => element.review_status === 'needs_review')
  const canPublish = document.status === 'review_pending' && pendingItems.length === 0
  const isPublished = document.status === 'published'

  function resetEditForm() {
    setIsEditing(false)
    setDraftAlt('')
    setDraftDescription('')
  }

  function selectPage(page) {
    const pageItems = sortReviewItems(page.elements)
    setSelectedPageId(page.id)
    setSelectedElementId(pageItems[0]?.id ?? null)
    setStatusMessage('')
    setActionError('')
    setImageError(false)
    resetEditForm()
  }

  function selectElement(element) {
    setSelectedElementId(element.id)
    setStatusMessage('')
    setActionError('')
    resetEditForm()
  }

  function replaceElement(nextElement) {
    setDocument((currentDocument) => ({
      ...currentDocument,
      pages: currentDocument.pages.map((page) => ({
        ...page,
        elements: page.elements.map((element) => (
          element.id === nextElement.id ? nextElement : element
        )),
      })),
    }))
  }

  async function approveSelectedElement() {
    if (!selectedElement || isSubmittingAction) return

    setIsSubmittingAction(true)
    setStatusMessage('')
    setActionError('')

    try {
      const nextElement = await approveElement(selectedElement.id)
      replaceElement(nextElement)
      setStatusMessage(`${selectedElement.title} 설명을 승인했습니다.`)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  function startEditing() {
    setDraftAlt(selectedElement.alt)
    setDraftDescription(selectedElement.description)
    setStatusMessage('')
    setActionError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    resetEditForm()
    setStatusMessage('설명 수정을 취소했습니다.')
  }

  async function saveEditedElement(event) {
    event.preventDefault()

    const trimmedAlt = draftAlt.trim()
    const trimmedDescription = draftDescription.trim()

    if (!trimmedAlt || !trimmedDescription) {
      setActionError('한 줄 설명과 상세 설명을 모두 입력해 주세요.')
      return
    }

    setIsSubmittingAction(true)
    setStatusMessage('')
    setActionError('')

    try {
      const nextElement = await editElement(selectedElement.id, {
        alt: trimmedAlt,
        description: trimmedDescription,
      })
      replaceElement(nextElement)
      resetEditForm()
      setStatusMessage(`${selectedElement.title} 설명을 수정하고 승인했습니다.`)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  async function publishDocument() {
    if (!canPublish || isPublished || isSubmittingAction) return

    setIsSubmittingAction(true)
    setStatusMessage('')
    setActionError('')

    try {
      const result = await publishDocumentRequest(id)
      setDocument((currentDocument) => ({
        ...currentDocument,
        status: result.status,
      }))
      setStatusMessage('검수가 완료된 자료를 학생에게 공개했습니다.')
    } catch (error) {
      setActionError(error.message)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  return (
    <section className="review-page" aria-labelledby="review-heading">
      <div className="review-heading-row">
        <div>
          <p className="eyebrow">{document.course}</p>
          <h1 id="review-heading">{document.title} 검수</h1>
          <p>원본 자료와 AI 설명을 비교해 주세요.</p>
        </div>
        <div className="review-summary">
          <p className="review-count">
            검수 완료 {reviewedItems.length} / {requiredItems.length}
          </p>
          <button
            type="button"
            className="publish-button"
            disabled={!canPublish || isPublished || isSubmittingAction}
            onClick={publishDocument}
          >
            {isPublished ? '공개 완료' : isSubmittingAction ? '처리 중…' : '학생에게 공개'}
          </button>
        </div>
      </div>

      <p className="review-status-message" aria-live="polite">
        {statusMessage}
      </p>

      {actionError && (
        <p className="inline-error" role="alert">
          {actionError}
        </p>
      )}

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
          {imageError ? (
            <div className="page-image-error" role="alert">
              <strong>페이지 이미지를 불러오지 못했습니다.</strong>
              <span>백엔드 서버와 이미지 API 상태를 확인해 주세요.</span>
            </div>
          ) : (
            <img
              className="page-preview"
              src={getPageImageUrl(selectedPage.id)}
              alt={`${selectedPage.page_no}페이지 원본 강의자료`}
              onError={() => setImageError(true)}
            />
          )}
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
                    onClick={() => selectElement(element)}
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
                  <div className="warning-message">
                    <strong>검수 필요 사유</strong>
                    <ul>
                      {selectedElement.flag_reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {isEditing ? (
                  <form className="edit-description-form" onSubmit={saveEditedElement}>
                    <label htmlFor="edit-alt">한 줄 설명</label>
                    <textarea
                      id="edit-alt"
                      value={draftAlt}
                      onChange={(event) => setDraftAlt(event.target.value)}
                      rows="3"
                      disabled={isSubmittingAction}
                      required
                    />

                    <label htmlFor="edit-description">상세 설명</label>
                    <textarea
                      id="edit-description"
                      value={draftDescription}
                      onChange={(event) => setDraftDescription(event.target.value)}
                      rows="7"
                      disabled={isSubmittingAction}
                      required
                    />

                    <div className="edit-form-actions">
                      <button type="button" className="secondary-button" disabled={isSubmittingAction} onClick={cancelEditing}>
                        취소
                      </button>
                      <button type="submit" className="approve-button" disabled={isSubmittingAction}>
                        {isSubmittingAction ? '저장 중…' : '수정 후 승인'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
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
                          {selectedElement.table.headers.length > 0 && (
                            <thead>
                              <tr>
                                {selectedElement.table.headers.map((header, headerIndex) => (
                                  <th scope="col" key={`${header}-${headerIndex}`}>{header}</th>
                                ))}
                              </tr>
                            </thead>
                          )}
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

                    {selectedElement.review_status === 'edited' && selectedElement.ai_original && (
                      <details className="ai-original">
                        <summary>수정 전 AI 원문 보기</summary>
                        <p><strong>한 줄 설명</strong>{selectedElement.ai_original.alt}</p>
                        <p><strong>상세 설명</strong>{selectedElement.ai_original.description}</p>
                      </details>
                    )}

                    <div className="review-actions">
                      <button type="button" className="secondary-button" disabled={isSubmittingAction} onClick={startEditing}>
                        설명 수정
                      </button>
                      {selectedElement.review_status === 'needs_review' && (
                        <button
                          type="button"
                          className="approve-button"
                          disabled={isSubmittingAction}
                          onClick={approveSelectedElement}
                        >
                          {isSubmittingAction ? '승인 중…' : '이 설명 승인'}
                        </button>
                      )}
                    </div>
                  </>
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
