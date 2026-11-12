import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import mockDocumentDetail from '../data/documentDetailMock.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const STUDENT_VISIBLE_STATUSES = new Set([
  'approved',
  'edited',
  'auto_passed',
  'needs_review',
])

const STUDENT_STATUS_LABELS = {
  approved: '검수자 확인',
  edited: '검수자 확인',
  auto_passed: 'AI 설명(자동 통과)',
  needs_review: '검수자가 다시 확인 중',
}

const wait = (milliseconds) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds)
})

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    let message = '문서 정보를 불러오지 못했습니다.'

    try {
      const body = await response.json()
      message = typeof body.detail === 'string' ? body.detail : message
    } catch {
      // JSON이 아닌 오류 응답에는 기본 안내 문구를 사용한다.
    }

    throw new Error(message)
  }

  return response.json()
}

function createPublishedMockDocument() {
  const studentDocument = structuredClone(mockDocumentDetail)

  return {
    ...studentDocument,
    status: 'published',
  }
}

async function getStudentDocuments() {
  if (!USE_MOCK_API) {
    const documents = await request('/api/student/documents')

    if (!Array.isArray(documents)) {
      throw new Error('공개 문서 목록 형식을 확인할 수 없습니다.')
    }

    return documents
  }

  await wait(250)
  const studentDocument = createPublishedMockDocument()

  return [{
    id: studentDocument.id,
    title: studentDocument.title,
    course: studentDocument.course,
    status: studentDocument.status,
    total_pages: studentDocument.total_pages,
  }]
}

async function getStudentDocumentDetail(documentId) {
  if (!USE_MOCK_API) {
    return request(`/api/student/documents/${encodeURIComponent(documentId)}`)
  }

  await wait(250)
  const studentDocument = createPublishedMockDocument()

  if (String(studentDocument.id) !== String(documentId)) {
    throw new Error('공개된 문서를 찾을 수 없습니다.')
  }

  return studentDocument
}

function validatePublishedDocument(studentDocument) {
  if (studentDocument.status && studentDocument.status !== 'published') {
    throw new Error('아직 공개되지 않은 문서입니다.')
  }

  if (!Array.isArray(studentDocument.pages)) {
    throw new Error('문서의 페이지 정보를 확인할 수 없습니다.')
  }

  const hasUnavailableDescription = studentDocument.pages.some((page) => (
    Array.isArray(page.elements)
      && page.elements.some((element) => (
        !STUDENT_VISIBLE_STATUSES.has(element.review_status)
      ))
  ))

  if (hasUnavailableDescription) {
    throw new Error('공개 준비가 완료되지 않은 설명이 포함되어 있습니다.')
  }
}

function getStatusLabel(status) {
  return STUDENT_STATUS_LABELS[status] ?? status
}

function SemanticTable({ element }) {
  const headers = Array.isArray(element.table?.headers) ? element.table.headers : []
  const rows = Array.isArray(element.table?.rows) ? element.table.rows : []

  if (rows.length === 0) {
    return <p>표 데이터가 없습니다.</p>
  }

  return (
    <div className="table-wrapper">
      <table>
        <caption>{element.title} 데이터</caption>
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th scope="col" key={`${header}-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FigureDescription({ element }) {
  const headingId = `student-element-${element.id}`

  return (
    <article className="description-content" aria-labelledby={headingId}>
      <div className="description-title-row">
        <h3 id={headingId}>{element.title}</h3>
        <span className={`status-badge status-badge--${element.review_status}`}>
          {getStatusLabel(element.review_status)}
        </span>
      </div>

      <dl>
        <div>
          <dt>한 줄 설명</dt>
          <dd>{element.alt}</dd>
        </div>
        <div>
          <dt>상세 설명</dt>
          <dd>{element.description}</dd>
        </div>
        {Array.isArray(element.labels) && element.labels.length > 0 && (
          <div>
            <dt>그림 속 글자</dt>
            <dd>{element.labels.join(', ')}</dd>
          </div>
        )}
      </dl>

      {element.type === 'table' && element.table && (
        <SemanticTable element={element} />
      )}

      {/* F9 신고 컴포넌트는 element.id를 사용해 이 위치에 연결한다. */}
    </article>
  )
}

function StudentPage() {
  const location = useLocation()
  const documentId = new URLSearchParams(location.search).get('document')
  const headingRef = useRef(null)
  const loadRequestIdRef = useRef(0)
  const [documents, setDocuments] = useState([])
  const [studentDocument, setStudentDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadContent = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId

    setIsLoading(true)

    try {
      if (documentId) {
        const nextDocument = await getStudentDocumentDetail(documentId)

        if (requestId !== loadRequestIdRef.current) return

        validatePublishedDocument(nextDocument)
        setStudentDocument(nextDocument)
      } else {
        const nextDocuments = await getStudentDocuments()

        if (requestId !== loadRequestIdRef.current) return

        setDocuments(nextDocuments.filter((document) => (
          !document.status || document.status === 'published'
        )))
        setStudentDocument(null)
      }

      setError('')
    } catch (loadError) {
      if (requestId !== loadRequestIdRef.current) return

      setStudentDocument(null)
      setError(loadError.message)
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [documentId])

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadContent, 0)

    return () => {
      window.clearTimeout(initialLoadId)
      loadRequestIdRef.current += 1
    }
  }, [loadContent])

  useEffect(() => {
    if (!studentDocument) return undefined

    const previousTitle = window.document.title
    window.document.title = `${studentDocument.title} | 보이는 강의`
    headingRef.current?.focus()

    return () => {
      window.document.title = previousTitle
    }
  }, [studentDocument])

  if (isLoading) {
    return <p className="state-message" role="status">자료를 불러오는 중입니다.</p>
  }

  if (error) {
    return (
      <section className="state-message state-message--error" lang="ko" role="alert">
        <h1>자료를 불러오지 못했습니다</h1>
        <p>{error}</p>
        <button className="secondary-button" type="button" onClick={loadContent}>
          다시 시도
        </button>{' '}
        {documentId && <Link to="/student">공개 문서 목록으로 이동</Link>}
      </section>
    )
  }

  if (!documentId) {
    return (
      <section lang="ko" aria-labelledby="student-list-title">
        <p className="eyebrow">학생 열람 화면</p>
        <h1 id="student-list-title">공개 강의자료</h1>
        <p>검수가 끝나 학생에게 공개된 강의자료를 확인할 수 있습니다.</p>

        {documents.length > 0 ? (
          <div className="document-grid">
            {documents.map((document) => (
              <article className="document-card" key={document.id}>
                <p>{document.course}</p>
                <h2>
                  <Link to={`/student?document=${document.id}`}>{document.title}</Link>
                </h2>
                <p>전체 {document.total_pages}페이지</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="state-message">현재 공개된 강의자료가 없습니다.</p>
        )}
      </section>
    )
  }

  if (!studentDocument) {
    return <p className="state-message">문서 정보를 찾을 수 없습니다.</p>
  }

  return (
    <article lang="ko" aria-labelledby="student-document-title">
      <Link className="text-link" to="/student">← 공개 문서 목록</Link>

      <header className="review-heading-row" style={{ display: 'block' }}>
        <div style={{ width: '100%', minWidth: 0 }}>
          <p className="eyebrow">{studentDocument.course}</p>
          <h1
            id="student-document-title"
            ref={headingRef}
            tabIndex="-1"
            style={{ maxWidth: '100%', overflowWrap: 'anywhere', wordBreak: 'keep-all' }}
          >
            {studentDocument.title}
          </h1>
          <p>전체 {studentDocument.total_pages ?? studentDocument.pages.length}페이지</p>
        </div>
      </header>

      <div className="student-pages">
        {studentDocument.pages.map((page) => {
          const elements = Array.isArray(page.elements) ? page.elements : []
          const pageHeadingId = `student-page-${page.page_no}`

          return (
            <section
              className="review-panel"
              key={page.page_no}
              aria-labelledby={pageHeadingId}
            >
              <h2 id={pageHeadingId}>{page.page_no}페이지</h2>

              <div className="page-original-text">
                <strong>페이지 원문 텍스트</strong>
                <span>{page.text || '원문 텍스트가 없습니다.'}</span>
              </div>

              {elements.length > 0 ? (
                elements.map((element) => (
                  <FigureDescription key={element.id} element={element} />
                ))
              ) : (
                <p>이 페이지에는 그림 설명이 없습니다.</p>
              )}
            </section>
          )
        })}
      </div>
    </article>
  )
}

export default StudentPage
