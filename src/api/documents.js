import mockDocumentDetail from '../data/documentDetailMock.json'
import mockPageImages from '../data/mockPageImages.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const MOCK_AI_ANALYSIS_POLLS = 3

export const isUsingMockApi = USE_MOCK_API

const mockDocuments = [
  {
    id: 1,
    title: '운영체제 5주차 강의자료',
    course: '운영체제',
    status: 'processing',
    processed_pages: 2,
    total_pages: 8,
    needs_review_count: 0,
    report_count: 0,
  },
  {
    id: 2,
    title: '자료구조: 트리와 그래프',
    course: '자료구조',
    status: 'review_pending',
    processed_pages: 12,
    total_pages: 12,
    needs_review_count: 3,
    report_count: 0,
  },
  {
    id: 3,
    title: '컴퓨터 네트워크 개요',
    course: '컴퓨터 네트워크',
    status: 'published',
    processed_pages: 16,
    total_pages: 16,
    needs_review_count: 0,
    report_count: 2,
  },
]

const mockCompletedExtractionPolls = new Map()
const mockDocumentDetails = new Map()

const wait = (milliseconds) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds)
})

function copyDocument(document) {
  return { ...document }
}

function copyDocumentDetail(document) {
  return structuredClone(document)
}

function getMockDocumentDetail(documentId) {
  const numericDocumentId = Number(documentId)

  if (!mockDocumentDetails.has(numericDocumentId)) {
    const document = copyDocumentDetail(mockDocumentDetail)
    const summary = mockDocuments.find(({ id }) => id === numericDocumentId)

    document.id = numericDocumentId
    document.status = summary?.status ?? document.status

    document.pages.forEach((page) => {
      page.elements.forEach((element) => {
        element.ai_original ??= {
          alt: element.alt,
          description: element.description,
        }
      })
    })

    mockDocumentDetails.set(numericDocumentId, document)
  }

  return mockDocumentDetails.get(numericDocumentId)
}

function findMockElement(elementId) {
  for (const document of mockDocumentDetails.values()) {
    for (const page of document.pages) {
      const element = page.elements.find(({ id }) => id === Number(elementId))

      if (element) {
        return { document, element }
      }
    }
  }

  return null
}

function updateMockDocumentCount(document) {
  const summary = mockDocuments.find(({ id }) => id === document.id)

  if (!summary) return

  summary.needs_review_count = document.pages
    .flatMap((page) => page.elements)
    .filter((element) => element.review_status === 'needs_review')
    .length
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
    needs_review_count: 0,
    report_count: 0,
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
    if (document.processed_pages < document.total_pages) {
      document.processed_pages += 1
    } else {
      const completedPolls = mockCompletedExtractionPolls.get(document.id) ?? 0

      if (completedPolls < MOCK_AI_ANALYSIS_POLLS) {
        mockCompletedExtractionPolls.set(document.id, completedPolls + 1)
      } else {
        mockCompletedExtractionPolls.delete(document.id)
        document.status = 'review_pending'
        document.needs_review_count = 3
      }
    }

    if (document.total_pages === 0) {
      document.status = 'review_pending'
      document.needs_review_count = 3
    }
  }

  return copyDocument(document)
}

export async function getDocumentDetail(documentId) {
  if (!USE_MOCK_API) {
    return request(`/api/documents/${documentId}`)
  }

  await wait(250)
  return copyDocumentDetail(getMockDocumentDetail(documentId))
}

export async function approveElement(elementId) {
  if (!USE_MOCK_API) {
    return request(`/api/elements/${encodeURIComponent(elementId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
  }

  await wait(250)
  const result = findMockElement(elementId)

  if (!result) {
    throw new Error('그림을 찾을 수 없습니다.')
  }

  const { document, element } = result

  if (!element.alt.trim() || !element.description.trim()) {
    throw new Error('한 줄 설명과 상세 설명이 비어 있으면 승인할 수 없습니다. 설명을 작성한 뒤 수정 후 승인해 주세요.')
  }

  if (element.review_status !== 'edited') {
    element.review_status = 'approved'
  }

  updateMockDocumentCount(document)
  return structuredClone(element)
}

export async function editElement(elementId, { alt, description }) {
  if (!USE_MOCK_API) {
    return request(`/api/elements/${encodeURIComponent(elementId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        alt,
        description,
      }),
    })
  }

  await wait(250)
  const trimmedAlt = alt?.trim()
  const trimmedDescription = description?.trim()

  if (!trimmedAlt || !trimmedDescription) {
    throw new Error('한 줄 설명과 상세 설명은 공백일 수 없습니다.')
  }

  const result = findMockElement(elementId)

  if (!result) {
    throw new Error('그림을 찾을 수 없습니다.')
  }

  const { document, element } = result
  element.alt = trimmedAlt
  element.description = trimmedDescription
  element.review_status = 'edited'
  updateMockDocumentCount(document)

  return structuredClone(element)
}

export async function publishDocument(documentId) {
  if (!USE_MOCK_API) {
    return request(`/api/documents/${encodeURIComponent(documentId)}/publish`, {
      method: 'POST',
    })
  }

  await wait(250)
  const numericDocumentId = Number(documentId)
  const document = getMockDocumentDetail(numericDocumentId)

  if (document.status === 'published') {
    throw new Error('이미 공개된 문서입니다.')
  }

  if (document.status !== 'review_pending') {
    throw new Error('분석이 끝난 문서만 공개할 수 있어요.')
  }

  const remaining = document.pages
    .flatMap((page) => page.elements)
    .filter((element) => element.review_status === 'needs_review')
    .length

  if (remaining > 0) {
    throw new Error(`검수 필요 그림이 ${remaining}건 남아 있어요.`)
  }

  document.status = 'published'
  const summary = mockDocuments.find(({ id }) => id === numericDocumentId)
  if (summary) summary.status = 'published'

  return { status: 'published' }
}

export function getPageImageUrl(pageId) {
  if (USE_MOCK_API) {
    return mockPageImages[pageId]
  }

  return `${API_BASE_URL}/api/pages/${encodeURIComponent(pageId)}/image`
}
