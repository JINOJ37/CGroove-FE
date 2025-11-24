// 메인 페이지

import { mockAPI } from './mock-api.js';

// 대시보드 데이터 로드
async function loadDashboard() {
  console.log('메인 대시보드 로드');

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

// 섹션 렌더링
function renderSection(sectionId, posts) {
  const container = document.getElementById(sectionId);
  
  if (!container) return;
  
  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="empty-state">게시글이 없습니다</div>';
    return;
  }
  
  container.innerHTML = posts.map(post => createPostCard(post)).join('');
}

// 게시글 카드 생성
function createPostCard(post) {
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

// 슬라이더 좌우 버튼
function setupSlider() {
  const arrows = document.querySelectorAll('.slider-arrow');
  
  arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      const target = arrow.dataset.target;
      const isLeft = arrow.classList.contains('left');
      
      if (target) {
        const slider = document.getElementById(target);
        if (slider) {
          const scrollAmount = isLeft ? -350 : 350;
          slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    });
  });
}

// TOP 버튼
function setupTopButton() {
  const topButton = document.getElementById('topButton');
  
  if (!topButton) {
    console.warn('TOP 버튼을 찾을 수 없습니다');
    return;
  }

  topButton.addEventListener('click', () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  });
}

// 스크롤 감지 (TOP 버튼 표시/숨김)
function setupScrollDetection() {
  const topButton = document.getElementById('topButton');
  
  if (!topButton) {
    console.warn('TOP 버튼을 찾을 수 없습니다');
    return;
  }
  
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 전체 문서의 70% 이상 스크롤했을 때 버튼 표시
    const scrollPercentage = (scrollPosition + windowHeight) / documentHeight;
    
    if (scrollPercentage > 0.7) {
      topButton.classList.add('show');
    } else {
      topButton.classList.remove('show');
    }
  });
}

// 게시글 카드 클릭
function setupPostCardClick() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return;
    
    const postId = card.dataset.postId;
    if (postId) {
      navigateTo(`post_detail.html?id=${postId}`);
    }
  });
}

async function initMainPage() {
  console.log('메인 페이지 초기화');

  await loadDashboard();
  setupSlider();
  setupTopButton();
  setupScrollDetection();
  setupPostCardClick();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainPage);
} else {
  initMainPage();
}

console.log('main/main.js 로드 완료');