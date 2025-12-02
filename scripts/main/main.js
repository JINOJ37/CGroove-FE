// ==================== Import ====================

// 실제 API Import
import { getHotPosts, getMyClubPosts } from '../common/api/post.js';
import { getUpcomingEvents } from '../common/api/event.js';

// 헤더
import { initHeader } from '../common/component/header.js';

// 유틸 함수
import { navigateTo } from '../common/util/utils.js';
import { getImageUrl } from '../common/util/image_util.js';
import { API_BASE_URL } from '../common/api/core.js';

// 포맷 함수
import { formatTimeAgo } from '../common/util/format.js';

// ==================== 메인 페이지 ====================

// ✅ 디폴트 이미지 대신 사용할 이모지 상수
const EMOJI_POST = '📄';
const EMOJI_EVENT = '🎉';

// 대시보드 데이터 로드
async function loadDashboard() {
  console.log('메인 대시보드 로드 (Real Data)');

  try {
    // 3개 API 병렬 호출
    const [upcomingResp, hotResp, myClubResp] = await Promise.all([
      getUpcomingEvents(),
      getHotPosts(),
      getMyClubPosts()
    ]);
    
    // 1. Upcoming Event (행사)
    renderSection('allPostsSlider', upcomingResp.data, 'event');

    // 2. Hot Groove (게시글)
    renderSection('hotSlider', hotResp.data, 'post');

    // 3. My Club News (게시글)
    renderSection('myClubSlider', myClubResp.data, 'post');
    
  } catch (error) {
    console.error('대시보드 로드 실패:', error);
  }
}

// 섹션 렌더링
function renderSection(sectionId, items, type) {
  const container = document.getElementById(sectionId);
  
  if (!container) return;
  
  // 데이터가 없을 때 표시할 문구
  if (!items || items.length === 0) {
    const emptyText = type === 'event' ? '예정된 행사가 없습니다' : '게시글이 없습니다';
    container.innerHTML = `<div class="empty-state" style="width:100%; text-align:center; padding:40px; color:#999;">${emptyText}</div>`;
    return;
  }
  
  container.innerHTML = items.map(item => createCard(item, type)).join('');
}

// 카드 생성 (게시글/행사 공용)
function createCard(item, type) {
  const isEvent = type === 'event';

  // ============================================================
  // ✅ [수정됨] 이미지 처리 로직 (이미지 없으면 이모지)
  // ============================================================
  const fallbackEmoji = isEvent ? EMOJI_EVENT : EMOJI_POST;
  let imageHTML = '';

  if (item.images && item.images.length > 0) {
    // 이미지가 있는 경우
    const imageUrl = getImageUrl(item.images[0]);
    // 이미지 로드 실패 시(onerror) -> 부모 요소를 이모지 박스로 교체
    imageHTML = `
      <img src="${imageUrl}" 
           alt="${escapeHtml(item.title)}" 
           onerror="this.parentElement.innerHTML='<div class=\\'post-image-placeholder\\'>${fallbackEmoji}</div>'">
    `;
  } else {
    // 이미지가 없는 경우 -> 처음부터 이모지 박스
    imageHTML = `<div class="post-image-placeholder">${fallbackEmoji}</div>`;
  }
  // ============================================================

  // 데이터 매핑 (DTO 차이 처리)
  const id = isEvent ? (item.eventId || item.id) : (item.postId || item.id);
  const title = item.title;
  const content = item.content || '';
  
  // 작성자 정보 매핑
  let authorName = '익명';
  let profileImage = null;

  if (isEvent) {
    authorName = item.hostNickname || '주최자';
    profileImage = item.hostProfileImage;
  } else {
    authorName = item.authorNickname || '익명';
    profileImage = item.authorProfileImage;
  }

  // 프로필 이미지 처리
  let authorAvatarHTML = '👤';
  if (profileImage) {
    const profileUrl = `${API_BASE_URL}${profileImage}`;
    authorAvatarHTML = `<img src="${profileUrl}" alt="${authorName}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.outerHTML='👤'">`;
  }

  // 날짜 표시
  let dateDisplay = '';
  if (isEvent && item.startsAt) {
    const d = new Date(item.startsAt);
    dateDisplay = `📅 ${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  } else {
    dateDisplay = formatTimeAgo(item.createdAt);
  }

  // 뱃지
  let badgeHtml = '';
  if (isEvent) {
    const eventType = item.type || 'EVENT';
    badgeHtml = `<span class="club-badge event">${eventType}</span>`;
  } else {
    if (item.clubName) {
      badgeHtml = `<span class="club-badge">${item.clubName}</span>`;
    }
  }

  // 통계
  const likeCount = item.likeCount || 0;
  const subCount = isEvent ? (item.currentParticipants || 0) : (item.commentCount || 0);
  const subIcon = isEvent ? '👥' : '💬';

  return `
    <div class="post-card" data-id="${id}" data-type="${type}">
      <div class="post-image">
        ${imageHTML}
      </div>
      
      <div class="post-content">
        <div class="post-meta">
          ${badgeHtml}
          <span class="post-time">${dateDisplay}</span>
        </div>
        
        <h3 class="post-title">${escapeHtml(title)}</h3>
        <p class="post-excerpt">${truncateText(content, 50)}</p>
        
        <div class="post-stats">
          <span class="stat-item">❤️ ${likeCount}</span>
          <span class="stat-item">${subIcon} ${subCount}</span>
        </div>
        
        <div class="post-author">
          <span class="author-avatar">${authorAvatarHTML}</span>
          <span class="author-name">${escapeHtml(authorName)}</span>
        </div>
      </div>
    </div>
  `;
}

// 텍스트 말줄임 유틸
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// HTML 이스케이프 유틸 (보안)
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 슬라이더 설정
function setupSlider() {
  const arrows = document.querySelectorAll('.slider-arrow');
  
  arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      const target = arrow.dataset.target;
      const isLeft = arrow.classList.contains('left');
      
      if (target) {
        const slider = document.getElementById(target);
        if (slider) {
          const scrollAmount = isLeft ? -320 : 320; 
          slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    });
  });
}

// TOP 버튼
function setupTopButton() {
  const topButton = document.getElementById('topButton');
  if (!topButton) return;

  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 스크롤 감지
function setupScrollDetection() {
  const topButton = document.getElementById('topButton');
  if (!topButton) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      topButton.classList.add('show');
    } else {
      topButton.classList.remove('show');
    }
  });
}

// 카드 클릭 이벤트
function setupCardClick() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return;
    
    const id = card.dataset.id;
    const type = card.dataset.type;
    
    if (id) {
      if (type === 'event') {
        navigateTo(`event_detail.html?id=${id}`);
      } else {
        navigateTo(`post_detail.html?id=${id}`);
      }
    }
  });
}

function setupLogoClick() {
  const logoBtn = document.getElementById('logoBtn');
  if (logoBtn) {
    logoBtn.style.cursor = 'pointer';
    logoBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// ==================== 초기화 ====================

async function initMainPage() {
  console.log('메인 페이지 초기화');

  await initHeader();
  setupLogoClick();
  
  await loadDashboard(); 
  
  setupSlider();
  setupTopButton();
  setupScrollDetection();
  setupCardClick();
  
  console.log('메인 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainPage);
} else {
  initMainPage();
}

console.log('main/main.js 로드 완료');