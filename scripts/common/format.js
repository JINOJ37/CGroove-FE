// 포맷팅

// 숫자를 K 단위로 포맷팅 (좋아요수, 댓글수, 조회수)
function formatNumber(num) {
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
function formatDate(date) {
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
function truncateTitle(title, maxLength = 26) {
  if (title.length > maxLength) {
    return title.substring(0, maxLength) + '...';
  }
  return title;
}

// 태그 파싱
function parseTags(tagsInput) {
  if (!tagsInput || tagsInput.trim() === '') return [];
  
  return tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

// 시간 포맷팅 (상대 시간)
function formatTimeAgo(dateString) {
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
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

console.log('common/format.js 로드 완료');