import mockDocumentDetail from '../data/documentDetailMock.json'
import mockPageImages from '../data/mockPageImages.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const isUsingMockApi = USE_MOCK_API

const mockDocuments = [
  {
    id: 1,
    title: '운영체제 5주차 강의자료',
    course: '운영체제',
    status: 'processing',
    processed_pages: 2,
    total_pages: 8,
    review_count: 0,
    student_report_count: null,
  },
  {
    id: 2,
    title: '자료구조: 트리와 그래프',
    course: '자료구조',
    status: 'review_pending',
    processed_pages: 12,
    total_pages: 12,
    review_count: 3,
    student_report_count: null,
  },
  {
    id: 3,
    title: '컴퓨터 네트워크 개요',
    course: '컴퓨터 네트워크',
    status: 'published',
    processed_pages: 16,
    total_pages: 16,
    review_count: 0,
    student_report_count: 2,
  },
]

const wait = (milliseconds) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds)
})

function copyDocument(document) {
  return { ...document }
}

function copyDocumentDetail(document) {
  return structuredClone(document)
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

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

export async function uploadDocument({ course, title, file }) {
  if (!USE_MOCK_API) {
    const formData = new FormData()
    formData.append('course', course)
    formData.append('title', title)
    formData.append('file', file)

    return request('/api/documents', {
      method: 'POST',
      body: formData,
    })
  }

  await wait(700)
  const nextId = Math.max(...mockDocuments.map(({ id }) => id), 0) + 1
  mockDocuments.unshift({
    id: nextId,
    title,
    course,
    filename: file.name,
    status: 'processing',
    processed_pages: 0,
    total_pages: 8,
    review_count: 0,
    student_report_count: null,
  })

  return { id: nextId }
}

export async function getDocuments() {
  if (!USE_MOCK_API) {
    return request('/api/documents')
  }

  await wait(250)
  return mockDocuments.map(copyDocument)
}

export async function getDocumentProgress(documentId) {
  if (!USE_MOCK_API) {
    return request(`/api/documents/${documentId}/progress`)
  }

  await wait(250)
  const document = mockDocuments.find(({ id }) => id === Number(documentId))

  if (!document) {
    throw new Error('문서를 찾을 수 없습니다.')
  }

  if (document.status === 'processing') {
    document.processed_pages = Math.min(
      document.processed_pages + 1,
      document.total_pages,
    )

    if (document.processed_pages === document.total_pages) {
      document.status = 'review_pending'
      document.review_count = 2
    }
  }

  return copyDocument(document)
}

export async function getDocumentDetail(documentId) {
  if (!USE_MOCK_API) {
    return request(`/api/documents/${documentId}`)
  }

  await wait(250)
  return copyDocumentDetail(mockDocumentDetail)
}

export function getPageImageUrl(pageId) {
  if (USE_MOCK_API) {
    return mockPageImages[pageId]
  }

  return `${API_BASE_URL}/api/pages/${encodeURIComponent(pageId)}/image`
}
