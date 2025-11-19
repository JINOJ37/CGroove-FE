// ============================================
// 메인 대시보드 - 게시글 데이터 관리
// ============================================

import { mockAPI } from '../common/mock-api.js';

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initMainDashboard();
});

async function initMainDashboard() {
  await loadDashboard();
}

// ============================================
// 대시보드 로드
// ============================================

async function loadDashboard() {
  try {
    const [myClubPosts, hotPosts, allPosts] = await Promise.all([
      mockAPI.getMyClubPosts(3),
      mockAPI.getAllPosts(5),
      mockAPI.getAllPosts(8)
    ]);
    
    renderSection('myClubSlider', myClubPosts);
    renderSection('hotSlider', hotPosts);
    renderSection('allPostsSlider', allPosts);
    
  } catch (error) {
    console.error('대시보드 로드 실패:', error);
  }
}

// ============================================
// 섹션 렌더링
// ============================================

function renderSection(sectionId, posts) {
  const container = document.getElementById(sectionId);
  
  if (!container) return;
  
  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="empty-state">게시글이 없습니다</div>';
    return;
  }
  
  container.innerHTML = posts.map(post => createCard(post)).join('');
}

// ============================================
// 카드 HTML 생성
// ============================================

function createCard(post) {
  const imageHtml = post.imageUrl ? `
    <div class="post-image">
      <img src="${post.imageUrl}" alt="${post.title}">
    </div>
  ` : '';
  
  return `
    <div class="post-card" data-post-id="${post.id}">
      ${imageHtml}
      
      <div class="post-content">
        <div class="post-meta">
          <span class="club-badge">${post.clubName}</span>
          <span class="post-time">${formatTimeAgo(post.createdAt)}</span>
        </div>
        
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${truncateText(post.content, 60)}</p>
        
        <div class="post-stats">
          <span class="stat-item">❤️ ${post.likeCount}</span>
          <span class="stat-item">💬 ${post.commentCount}</span>
        </div>
        
        <div class="post-author">
          <span class="author-avatar">👤</span>
          <span class="author-name">${post.author}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// 유틸리티
// ============================================

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

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}