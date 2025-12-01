// ==================== 포맷팅 유틸 ====================

// 숫자를 K 단위로 포맷팅 (좋아요수, 댓글수, 조회수)
export function formatNumber(num) {
  if (num >= 100000) {
    return Math.floor(num / 1000) + 'k';
  } else if (num >= 10000) {
    return Math.floor(num / 1000) + 'k';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toString();
}

// 날짜를 yyyy-mm-dd hh:mm:ss 형식으로 포맷팅
export function formatDate(date) {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 제목을 지정된 길이로 제한 (초과 시 ... 표시)
export function truncateTitle(title, maxLength = 26) {
  if (title.length > maxLength) {
    return title.substring(0, maxLength) + '...';
  }
  return title;
}

// 태그 파싱
export function parseTags(tagsInput) {
  if (!tagsInput || tagsInput.trim() === '') return [];
  
  return tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

// 시간 포맷팅 (상대 시간)
export function formatTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return past.toLocaleDateString('ko-KR');
}

// 텍스트 자르기
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 게시물 목록: 날짜 포맷 (상대 시간)
export function formatRelativeTime(dateStr) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateStr || '';
  }
}

// HTML 이스케이프 (XSS 방지)
export function escapeHtml(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('common/util/format.js 로드 완료');