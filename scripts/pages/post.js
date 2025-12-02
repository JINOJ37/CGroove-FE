// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { initCustomSelects } from '../common/component/customSelect.js';
import { navigateTo } from '../common/util/utils.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast } from '../common/util/utils.js';
import { formatRelativeTime } from '../common/util/format.js';
import { escapeHtml } from '../common/util/format.js';
import { getImageUrl } from '../common/util/image_util.js';
import { getPosts, togglePostLike } from '../common/api/post.js';
import { getEvents, toggleEventLike } from '../common/api/event.js';
import { getMyClubs } from '../common/api/club.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상수 ====================

// 이미지가 없을 때 보여줄 기본 아이콘 (이모지)
const DEFAULT_POST_IMAGE = '📄';
const DEFAULT_EVENT_IMAGE = '🎉';
const POSTS_PER_PAGE = 10;

// ==================== 상태 관리 ====================

let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let allPosts = [];
let displayedPosts = [];
let myClubs = [];
let currentClubFilter = 'all';
let currentTypeFilter = 'all';
let currentSort = 'latest';

// ==================== API 호출 ====================

async function loadInitialData() {
  showLoading();

  try {
    // 1. 게시글과 행사 데이터를 병렬로 가져옴
    const [postsResp, eventsResp] = await Promise.all([
      getPosts(),
      getEvents()
    ]);
    
    // 2. 게시글 데이터 가공
    const posts = (postsResp.data || []).map(p => ({
      ...p,
      type: 'post', // 타입 명시
      id: p.postId,
      displayId: p.postId,
      // 정렬 및 렌더링을 위한 공통 필드 매핑
      createdAt: p.createdAt,
      likeCount: p.likeCount || 0,
      subCount: p.commentCount || 0, // 댓글 수
      viewCount: p.viewCount || 0
    }));
    
    // 3. 행사 데이터 가공
    const events = (eventsResp.data || []).map(e => ({
      ...e,
      type: 'event', // 타입 명시
      id: e.eventId,
      displayId: e.eventId,
      // 정렬 및 렌더링을 위한 공통 필드 매핑
      createdAt: e.createdAt, // 생성일 기준 정렬을 위해 필요
      likeCount: e.likeCount || 0,
      subCount: e.currentParticipants || e.participantCount || 0, // 참여자 수
      viewCount: e.viewCount || 0
    }));
    
    // 4. 통합 및 최신순 정렬 (기본값)
    allPosts = [...posts, ...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('데이터 로드 완료:', posts.length, '개 포스트,', events.length, '개 행사');
    
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    allPosts = [];
  }

  try {
    await loadMyClubs();
  } catch (err) {
    console.warn('동아리 로드 실패:', err);
  }

  hideLoading();
  
  // 초기 렌더링
  applyFiltersAndSortAndRender(true);
}

async function loadMyClubs() {
  const wrapper = document.querySelector('.custom-select[data-target="clubFilter"]');
  const hiddenSelect = document.getElementById('clubFilter');

  if (!hiddenSelect) return;

  // 초기화
  hiddenSelect.innerHTML = `<option value="all">전체</option>`;
  if (wrapper) {
    const menu = wrapper.querySelector('.custom-select-menu');
    if (menu) menu.innerHTML = `<div class="custom-select-option" data-value="all">전체</div>`;
  }

  try {
    const resp = await getMyClubs();
    myClubs = resp.data || [];

    if (myClubs.length > 0) {
      const menu = wrapper ? wrapper.querySelector('.custom-select-menu') : null;
      
      myClubs.forEach((c) => {
        const id = c.clubId ?? c.id;
        const name = c.clubName || c.name || `클럽 ${id}`;

        const opt = document.createElement('option');
        opt.value = String(id);
        opt.textContent = name;
        hiddenSelect.appendChild(opt);

        if (menu) {
          const div = document.createElement('div');
          div.className = 'custom-select-option';
          div.dataset.value = String(id);
          div.textContent = name;
          menu.appendChild(div);
        }
      });
    }

    initCustomSelects();
    setupClubCustomSelectBehavior();

  } catch (err) {
    console.error('동아리 로드 실패:', err);
  }
}

async function toggleLike(itemId, itemType) {
  try {
    let response;
    
    if (itemType === 'event') {
      response = await toggleEventLike(itemId);
    } else {
      response = await togglePostLike(itemId);
    }
    
    console.log('좋아요 토글 성공');
    
    // UI 즉시 업데이트
    const likeBtn = document.querySelector(`.like-btn[data-id="${itemId}"][data-type="${itemType}"]`);
    if (!likeBtn) return;
    
    const isLiked = response.data.isLiked;
    const likeCount = response.data.likeCount;
    
    const icon = likeBtn.querySelector('.like-icon');
    icon.textContent = isLiked ? '❤️' : '🤍';
    
    const count = likeBtn.querySelector('.like-count');
    count.textContent = formatNumber(likeCount);
    
    if (isLiked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
    
  } catch (error) {
    console.error('좋아요 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else {
      showToast('좋아요 처리 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

// 숫자 포맷팅 (1000 -> 1k 등 필요시 구현, 현재는 단순 문자열)
function formatNumber(num) {
  return num;
}

// ==================== UI 렌더링 ====================

function createPostCardHTML(item) {
  const isEvent = item.type === 'event';
  
  // 1. 타입 뱃지 (행사일 경우만 표시)
  const typeBadge = isEvent
    ? `<div class="post-type-badge event">행사</div>`
    : '';

  // 2. 이미지 처리 (이미지 없으면 이모지 아이콘 표시)
  let imageHTML = '';
  const fallbackIcon = isEvent ? DEFAULT_EVENT_IMAGE : DEFAULT_POST_IMAGE;
  
  if (item.images && item.images.length > 0) {
    const imageUrl = getImageUrl(item.images[0]);
    // 이미지가 깨질 경우 대비해 onerror 처리
    imageHTML = `<img src="${imageUrl}" alt="${escapeHtml(item.title)}" onerror="this.parentElement.innerHTML='<div class=\\'post-image-placeholder\\'>${fallbackIcon}</div>'">`;
  } else {
    // 이미지가 아예 없는 경우
    imageHTML = `<div class="post-image-placeholder">${fallbackIcon}</div>`;
  }

  // 3. 작성자/주최자 정보 처리
  let authorName = '익명';
  let profileImage = null;

  if (isEvent) {
    // 행사: hostName 필드 또는 host 객체 확인
    authorName = item.hostName || item.host?.nickname || item.host?.username || '주최자';
    profileImage = item.host?.profileImage;
  } else {
    // 게시글: authorName 필드 또는 author 객체 확인
    authorName = item.authorName || item.author?.nickname || item.author?.username || '익명';
    profileImage = item.author?.profileImage;
  }

  // 4. 프로필 이미지 HTML 생성
  let authorAvatarHTML = '👤'; // 기본 아이콘
  if (profileImage) {
    const profileUrl = `${API_BASE_URL}${profileImage}`;
    authorAvatarHTML = `<img src="${profileUrl}" alt="${escapeHtml(authorName)}" class="author-avatar-img" onerror="this.outerHTML='👤'">`;
  }

  // 5. 좋아요 상태 및 통계
  const isLiked = item.isLiked || false;
  const likeClass = isLiked ? 'liked' : '';
  const likeIcon = isLiked ? '❤️' : '🤍';
  
  // 서브 통계 (댓글 or 참여자)
  const subCount = item.subCount || 0; // loadInitialData에서 미리 매핑해둠
  const subIcon = isEvent ? '👥' : '💬'; // 행사면 사람 아이콘, 글이면 말풍선

  // 6. 날짜 표시 (행사는 시작일, 글은 작성일)
  let dateStr = '';
  if (isEvent && item.startsAt) {
    const startDate = new Date(item.startsAt);
    dateStr = `📅 ${startDate.getMonth()+1}/${startDate.getDate()}`;
  } else {
    dateStr = formatRelativeTime(item.createdAt);
  }

  return `
    <div class="post-card" 
         data-id="${item.displayId}" 
         data-type="${item.type}">
      ${typeBadge}
      <div class="post-image">${imageHTML}</div>
      <div class="post-divider"></div>
      <div class="post-content">
        <h3 class="post-title">${escapeHtml(item.title)}</h3>
        <p class="post-excerpt">${escapeHtml(item.content || '')}</p>
        <div class="post-meta">
          <div class="post-author">
            <span class="author-avatar">${authorAvatarHTML}</span>
            <span>${escapeHtml(authorName)}</span>
          </div>
          <div class="post-stats">
            <button class="stat-item like-btn ${likeClass}" 
                    data-id="${item.displayId}" 
                    data-type="${item.type}">
              <span class="like-icon">${likeIcon}</span>
              <span class="like-count">${item.likeCount}</span>
            </button>
            <span class="stat-item right">${subIcon} ${subCount}</span>
            <span class="stat-item right">👁️ ${item.viewCount}</span>
          </div>
          <span class="post-date">${dateStr}</span>
        </div>
      </div>
      <div class="post-arrow">
        <span class="post-arrow-icon">→</span>
      </div>
    </div>
  `;
}

function renderPosts(posts, replace = false) {
  const container = document.getElementById('postsContainer');
  if (replace) container.innerHTML = '';

  if (!posts || posts.length === 0) {
    if (replace) renderEmptyState();
    return;
  }

  posts.forEach(p => {
    container.insertAdjacentHTML('beforeend', createPostCardHTML(p));
  });
}

function renderEmptyState() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-text">아직 게시글이 없습니다</div>
    </div>
  `;
}

function renderEndMessage() {
  const container = document.getElementById('postsContainer');
  const endMessage = document.createElement('div');
  endMessage.className = 'end-message';
  endMessage.style.textAlign = 'center';
  endMessage.style.padding = '40px';
  endMessage.style.color = '#999';
  endMessage.textContent = '모든 목록을 불러왔습니다';
  container.appendChild(endMessage);
}

function updateHeroMessage() {
  const subtitle = document.getElementById('heroSubtitle');
  if (!subtitle) return;
  
  const clubName = getSelectedClubName();
  subtitle.innerHTML = `${clubName} <span class="highlight">게시판</span>입니다.`;
}

function getSelectedClubName() {
  if (currentClubFilter === 'all') {
    return 'C.Groove';
  }
  
  const club = myClubs.find(c => String(c.clubId) === String(currentClubFilter));
  return club ? club.clubName : 'C.Groove';
}

// ==================== 필터 & 정렬 ====================

function applyFiltersAndSortAndRender(replace = true) {
  console.log('필터/정렬 적용:', { currentClubFilter, currentTypeFilter, currentSort });
  
  updateHeroMessage();
  
  let filtered = [...allPosts];

  // 1. 클럽 필터
  if (currentClubFilter && currentClubFilter !== 'all') {
    filtered = filtered.filter(p => String(p.clubId) === String(currentClubFilter));
  }

  // 2. 타입 필터 (게시글/행사)
  if (currentTypeFilter && currentTypeFilter !== 'all') {
    filtered = filtered.filter(p => p.type === currentTypeFilter);
  }

  // 3. 정렬 로직
  if (currentSort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    // 좋아요 순
    filtered.sort((a, b) => b.likeCount - a.likeCount);
  } else if (currentSort === 'views') {
    // 조회수 순
    filtered.sort((a, b) => b.viewCount - a.viewCount);
  }

  // 페이지네이션 초기화
  currentPage = 1;
  hasMorePosts = filtered.length > POSTS_PER_PAGE;
  displayedPosts = filtered.slice(0, POSTS_PER_PAGE);

  // 렌더링
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  
  if (displayedPosts.length === 0) {
    renderEmptyState();
    return;
  }
  
  renderPosts(displayedPosts, true);
}

function loadMorePosts() {
  if (isLoading || !hasMorePosts) return;

  isLoading = true;
  showLoading();

  const start = currentPage * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;

  setTimeout(() => {
    let source = [...allPosts];

    // 필터 & 정렬 (위와 동일 로직 적용)
    if (currentClubFilter && currentClubFilter !== 'all') {
      source = source.filter(p => String(p.clubId) === String(currentClubFilter));
    }
    if (currentTypeFilter && currentTypeFilter !== 'all') {
      source = source.filter(p => p.type === currentTypeFilter);
    }

    if (currentSort === 'latest') {
      source.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === 'popular') {
      source.sort((a, b) => b.likeCount - a.likeCount);
    } else if (currentSort === 'views') {
      source.sort((a, b) => b.viewCount - a.viewCount);
    }

    const next = source.slice(start, end);
    
    if (next.length === 0) {
      hasMorePosts = false;
      renderEndMessage();
      hideLoading();
      isLoading = false;
      return;
    }

    renderPosts(next);
    currentPage++;
    hideLoading();
    isLoading = false;
  }, 400); // 약간의 지연 효과
}

// ==================== 이벤트 핸들러 ====================

function setupLogoClick() {
  const logoBtn = document.getElementById('logoBtn');
  if (logoBtn) {
    logoBtn.style.cursor = 'pointer';
    logoBtn.addEventListener('click', () => {
      navigateTo('main.html');
    });
  }
}

function setupActionButtons() {
  const createPostBtn = document.getElementById('createPostBtn');
  const createEventBtn = document.getElementById('createEventBtn');

  if (createPostBtn) {
    createPostBtn.addEventListener('click', () => {
      navigateTo('post_create.html');
    });
  }

  if (createEventBtn) {
    createEventBtn.addEventListener('click', () => {
      navigateTo('event_create.html');
    });
  }
}

function setupFilterTabs() {
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentTypeFilter = tab.dataset.filter || 'all';
      applyFiltersAndSortAndRender();
    });
  });
}

function setupSortButtons() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentSort = btn.dataset.sort || 'latest';
      applyFiltersAndSortAndRender();
    });
  });
}

function setupCardClickEvents() {
  const container = document.getElementById('postsContainer');
  if (!container) return;
  if (container.dataset.attached === 'true') return;

  container.addEventListener('click', function(e) {
    // 1. 좋아요 버튼 클릭 시
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      e.stopPropagation();
      const itemId = likeBtn.dataset.id;
      const itemType = likeBtn.dataset.type;
      toggleLike(itemId, itemType);
      return;
    }
    
    // 2. 카드 전체 클릭 시 상세 이동
    const card = e.target.closest('.post-card');
    if (card) {
      const itemId = card.dataset.id;
      const itemType = card.dataset.type;
      
      if (itemType === 'event') {
        navigateTo(`event_detail.html?id=${itemId}`);
      } else {
        navigateTo(`post_detail.html?id=${itemId}`);
      }
    }
  });

  container.dataset.attached = 'true';
  console.log('카드 클릭 이벤트 등록 완료');
}

function setupInfinityScroll() {
  window.addEventListener('scroll', function() {
    if (isLoading || !hasMorePosts) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 120) {
      loadMorePosts();
    }
  });
}

function setupClubCustomSelectBehavior() {
  const hidden = document.getElementById('clubFilter');
  if (!hidden) return;
  
  hidden.removeEventListener('change', handleClubChange);
  hidden.addEventListener('change', handleClubChange);
}

function handleClubChange(e) {
  const newValue = e.target.value || 'all';
  currentClubFilter = newValue;
  applyFiltersAndSortAndRender();
}

// ==================== 초기화 ====================

async function init() {
  console.log('게시글 목록 페이지 초기화');

  await initHeader();

  setupLogoClick();
  setupActionButtons();
  setupFilterTabs();
  setupSortButtons();
  setupInfinityScroll();
  setupCardClickEvents();

  await loadInitialData();

  console.log('게시글 목록 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/list.js 로드 완료');