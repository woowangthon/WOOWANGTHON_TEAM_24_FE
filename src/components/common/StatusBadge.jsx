const statusLabels = {
  needs_review: '검수 필요',
  auto_passed: '자동 통과',
  approved: '승인 완료',
  edited: '수정 후 승인',
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

export default StatusBadge
