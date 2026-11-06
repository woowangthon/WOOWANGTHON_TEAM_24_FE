const mockDocument = {
  id: 1,
  title: '컴퓨터네트워크 3주차',
  course: '컴퓨터네트워크',
  status: 'review_pending',
  total_pages: 1,
  processed_pages: 1,
  pages: [
    {
      id: 'page-3',
      page_no: 3,
      image_url: '/mock/tcp-handshake-page.svg',
      elements: [
        {
          id: 'p3-e1',
          type: 'diagram',
          title: 'TCP 연결 설정 과정',
          alt: '클라이언트와 서버가 메시지 세 번으로 연결을 맺는 순서도',
          description:
            '왼쪽에 클라이언트, 오른쪽에 서버가 있습니다. 클라이언트가 SYN을 보내고, 서버가 SYN-ACK로 답합니다. 마지막으로 클라이언트가 ACK를 보내면 연결됩니다.',
          labels: ['Client', 'Server', 'SYN', 'SYN-ACK', 'ACK'],
          table: null,
          uncertain_parts: ['두 번째 화살표의 방향'],
          flagged: true,
          flag_reasons: ['R1: AI가 확신하지 못한 부분: 두 번째 화살표의 방향'],
          review_status: 'needs_review',
          ai_original: null,
        },
      ],
    },
  ],
}

export default mockDocument
