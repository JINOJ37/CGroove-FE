// 포맷팅

// 숫자를 K 단위로 포맷팅 (좋아요수, 댓글수, 조회수)
function formatNumber(num) {
  if (num >= 1000) {
    return Math.floor(num / 1000) + 'k';
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

console.log('common/format.js 로드 완료');