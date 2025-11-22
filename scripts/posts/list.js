// scripts/posts/list.js

// ========= 상태 변수 =========
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let allPosts = [];
let displayedPosts = [];
let myClubs = []; // 사용자의 동아리 목록
let currentClubFilter = 'all'; // 'all' 또는 clubId (문자열)
let currentTypeFilter = 'all'; // 'all' | 'post' | 'event'
let currentSort = 'latest';
const POSTS_PER_PAGE = 10;

// ========= 더미 제거: 실제 API 사용 권장 =========
// (임시로 API 실패시에만 dummy 사용 - 원하면 제거 가능)
const dummyPosts = []; // 빈 배열로 둠 (원하면 데이터 추가)

// ========= 유틸: 날짜 포맷 (format.js의 formatDate 사용 가능하면 그것 쓰세요) =========
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString();
  } catch (e) {
    return dateStr || '';
  }
}

// ========= 렌더링 =========
function createPostCardHTML(post) {
  const typeBadge = (post.type && post.type !== 'general')
    ? `<div class="post-type-badge ${post.type === 'notice' ? 'notice' : 'event'}">
         ${post.type === 'notice' ? '공지' : '행사'}
       </div>`
    : '';

  const image = post.image
    ? `<div class="post-image-placeholder">${post.image}</div>`
    : '<div class="post-image-placeholder">📄</div>';

  return `
    <div class="post-card" data-id="${post.postId}">
      ${typeBadge}
      <div class="post-image">${image}</div>
      <div class="post-divider"></div>
      <div class="post-content">
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-excerpt">${escapeHtml(post.content || '')}</p>
        <div class="post-meta">
          <div class="post-author">
            <span class="author-avatar">${post.authorAvatar || '👤'}</span>
            <span>${escapeHtml(post.authorName || '익명')}</span>
          </div>
          <div class="post-stats">
            <span class="stat-item">❤️ ${post.likes || 0}</span>
            <span class="stat-item">💬 ${post.comments || 0}</span>
            <span class="stat-item">👁️ ${post.views || 0}</span>
          </div>
          <span class="post-date">${formatDate(post.createdAt)}</span>
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

  setupCardClickEvents(); // 카드 클릭 이벤트 바인딩 보장
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
  endMessage.textContent = '모든 게시글을 불러왔습니다';
  container.appendChild(endMessage);
}

// ========= 보안 유틸 (간단 escape) =========
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ========= 필터/정렬 로직 =========
function applyFiltersAndSortAndRender(replace = true) {
  console.log('필터/정렬 적용:', { currentClubFilter, currentTypeFilter, currentSort });

  let filtered = [...allPosts];

  // 클럽 필터: 만약 currentClubFilter !== 'all', 필터링 조건은 post.clubId === currentClubFilter
  if (currentClubFilter && currentClubFilter !== 'all') {
    filtered = filtered.filter(p => String(p.clubId) === String(currentClubFilter));
  }

  // 타입 필터: 'post' => 일반/공지? here we assume posts have type 'event' for 행사, otherwise 'general'/'notice' => treat as post
  if (currentTypeFilter && currentTypeFilter !== 'all') {
    if (currentTypeFilter === 'event') {
      filtered = filtered.filter(p => p.type === 'event');
    } else if (currentTypeFilter === 'post') {
      filtered = filtered.filter(p => p.type !== 'event');
    }
  }

  // 정렬
  if (currentSort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (currentSort === 'views') {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  // pagination 초기화
  currentPage = 1;
  hasMorePosts = filtered.length > POSTS_PER_PAGE;

  displayedPosts = filtered.slice(0, POSTS_PER_PAGE);

  // 렌더
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  if (displayedPosts.length === 0) {
    renderEmptyState();
    return;
  }
  renderPosts(displayedPosts, true);
}

// ========= 이벤트 바인딩 =========
// ========= 이벤트 바인딩 =========
function setupFilterTabs() {
  // ❌ 틀림: document.querySelectorAll('.filter-tab')
  // ✅ 맞음: document.querySelectorAll('.type-tab')
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

// 카드 클릭 이벤트 (delegate)
function setupCardClickEvents() {
  const container = document.getElementById('postsContainer');
  if (!container) return;
  if (container.dataset.attach === 'true') return;

  container.addEventListener('click', function(e) {
    const card = e.target.closest('.post-card');
    if (card) {
      const postId = card.dataset.id;
      navigateTo(`post_detail.html?id=${postId}`);
    }
  });

  container.dataset.attach = 'true';
}

// 무한 스크롤
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

function loadMorePosts() {
  if (isLoading || !hasMorePosts) return;

  isLoading = true;
  showLoading();

  const start = currentPage * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;

  setTimeout(() => {
    // 필터&정렬을 이미 반영한 전체 목록에서 페이지네이션
    let source = [...allPosts];

    // apply same filtering as in applyFiltersAndSortAndRender but without re-render reset
    if (currentClubFilter && currentClubFilter !== 'all') {
      source = source.filter(p => String(p.clubId) === String(currentClubFilter));
    }
    if (currentTypeFilter && currentTypeFilter !== 'all') {
      if (currentTypeFilter === 'event') source = source.filter(p => p.type === 'event');
      else source = source.filter(p => p.type !== 'event');
    }

    if (currentSort === 'latest') {
      source.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === 'popular') {
      source.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSort === 'views') {
      source.sort((a, b) => (b.views || 0) - (a.views || 0));
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
  }, 400);
}

// ========= API 로드 함수 (getPosts, getMyClubs 은 scripts/common/api.js 에 구현되어 있어야 함) =========
async function loadInitialData() {
  showLoading();

  try {
    const postsResp = await getPosts(); // api.js 에 존재
    allPosts = postsResp.data || [];

    // fallback
    if (!allPosts || allPosts.length === 0) {
      allPosts = dummyPosts.slice();
    }
  } catch (err) {
    console.error('게시글 로드 실패, fallback 사용', err);
    allPosts = dummyPosts.slice();
  }

  try {
    await loadMyClubs(); // 동아리 로드 -> custom select 초기화 포함
  } catch (err) {
    console.warn('동아리 로드 실패:', err);
  }

  hideLoading();

  // 초기 렌더 (필터/정렬 반영)
  applyFiltersAndSortAndRender(true);
}

// 동아리 목록 로드 및 custom-select에 렌더링
async function loadMyClubs() {
  const wrapper = document.querySelector('.custom-select[data-target="clubFilter"]');
  const hiddenSelect = document.getElementById('clubFilter');

  // 안전 체크: 없으면 hidden select 동적 생성
  if (!hiddenSelect) {
    const sel = document.createElement('select');
    sel.id = 'clubFilter';
    sel.style.display = 'none';
    document.body.appendChild(sel);
  }

  const hidden = document.getElementById('clubFilter');
  const menu = wrapper ? wrapper.querySelector('.custom-select-menu') : null;

  // 초기 placeholder
  if (hidden) hidden.innerHTML = `<option value="all">전체</option>`;
  if (menu) menu.innerHTML = `<div class="custom-select-option" data-value="all">전체</div>`;

  try {
    const resp = await getMyClubs();
    myClubs = resp.data || [];

    console.log('🔹 동아리 목록 로드됨:', myClubs); // 디버깅

    if (!myClubs || myClubs.length === 0) {
      if (hidden) {
        hidden.innerHTML = `<option value="all">전체</option>`;
      }
      if (menu) {
        menu.innerHTML = `<div class="custom-select-option" data-value="all">전체</div>`;
      }
    } else {
      hidden.innerHTML = `<option value="all">전체</option>`;
      if (menu) menu.innerHTML = `<div class="custom-select-option" data-value="all">전체</div>`;

      myClubs.forEach((c) => {
        const id = c.clubId ?? c.id;
        const name = c.clubName || c.name || c.title || `클럽 ${id}`;

        // hidden select
        const opt = document.createElement('option');
        opt.value = String(id);
        opt.textContent = name;
        hidden.appendChild(opt);

        // custom menu
        if (menu) {
          const div = document.createElement('div');
          div.className = 'custom-select-option';
          div.dataset.value = String(id);
          div.textContent = name;
          menu.appendChild(div);
        }
      });
    }

    // 커스텀 셀렉트 재초기화
    if (window.initCustomSelects) {
      console.log('🔹 커스텀 셀렉트 초기화 중...');
      window.initCustomSelects();
    }

    // 중요: 이벤트 핸들러 등록
    console.log('🔹 동아리 필터 이벤트 핸들러 등록 중...');
    setupClubCustomSelectBehavior();

  } catch (err) {
    console.error('❌ getMyClubs 실패', err);
    if (window.initCustomSelects) window.initCustomSelects();
    setupClubCustomSelectBehavior(); // 에러 시에도 등록
  }
}

function setupClubCustomSelectBehavior() {
  const hidden = document.getElementById('clubFilter');
  if (!hidden) {
    console.warn('⚠️ clubFilter hidden select를 찾을 수 없음');
    return;
  }
  
  // ❌ DOM 교체 하지 마! custom_select.js 연결 끊어짐
  // const newHidden = hidden.cloneNode(true);
  // hidden.parentNode.replaceChild(newHidden, hidden);
  
  // ✅ 기존 리스너 제거 (만약 있다면)
  hidden.removeEventListener('change', handleClubChange);
  
  // ✅ 새 리스너 추가
  hidden.addEventListener('change', handleClubChange);
  
  console.log('✅ 동아리 필터 이벤트 핸들러 등록 완료');
}

// 핸들러를 별도 함수로 분리 (removeEventListener를 위해)
function handleClubChange(e) {
  const newValue = e.target.value || 'all';
  console.log('🔹 동아리 필터 변경:', newValue);
  currentClubFilter = newValue;
  
  updateHeroMessage();
  applyFiltersAndSortAndRender();
}

function updateHeroMessage() {
  const subtitle = document.getElementById('heroSubtitle');
  if (!subtitle) {
    console.warn('❌ heroSubtitle 요소를 찾을 수 없음');
    return;
  }
  
  const clubName = getSelectedClubName();
  console.log('🔹 히어로 메시지 업데이트:', clubName); // ← 추가
  
  subtitle.innerHTML = `${clubName} <span class="highlight">게시판</span>입니다.`;
}

function getSelectedClubName() {
  const clubFilter = document.getElementById('clubFilter');
  console.log('🔹 현재 선택된 값:', clubFilter?.value); // ← 추가
  console.log('🔹 myClubs:', myClubs); // ← 추가
  
  if (!clubFilter || clubFilter.value === 'all') {
    return 'C.Groove';
  }
  
  const selectedClub = myClubs.find(c => {
    console.log('🔹 비교:', String(c.clubId), '===', String(clubFilter.value)); // ← 추가
    return String(c.clubId) === String(clubFilter.value);
  });
  
  console.log('🔹 찾은 동아리:', selectedClub); // ← 추가
  return selectedClub ? (selectedClub.clubName || selectedClub.name) : 'C.Groove';
}

// 필터 적용 함수 수정
function applyFiltersAndSortAndRender(replace = true) {
  console.log('필터/정렬 적용:', { currentClubFilter, currentTypeFilter, currentSort });
  
  updateHeroMessage(); // ← 추가
  
  let filtered = [...allPosts];

  if (currentClubFilter && currentClubFilter !== 'all') {
    filtered = filtered.filter(p => String(p.clubId) === String(currentClubFilter));
  }

  if (currentTypeFilter && currentTypeFilter !== 'all') {
    if (currentTypeFilter === 'event') {
      filtered = filtered.filter(p => p.type === 'event');
    } else if (currentTypeFilter === 'post') {
      filtered = filtered.filter(p => p.type !== 'event');
    }
  }

  if (currentSort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (currentSort === 'views') {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  currentPage = 1;
  hasMorePosts = filtered.length > POSTS_PER_PAGE;
  displayedPosts = filtered.slice(0, POSTS_PER_PAGE);

  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  if (displayedPosts.length === 0) {
    renderEmptyState();
    return;
  }
  renderPosts(displayedPosts, true);
}

// ========= 초기화 =========
async function init() {
  console.log('게시글 목록 초기화');

  setupFilterTabs();
  setupSortButtons();
  setupInfinityScroll();
  setupCardClickEvents();

  // ❌ 여기서 initCustomSelects 호출하지 마!
  // if (window.initCustomSelects) window.initCustomSelects();

  await loadInitialData(); // ← 이 안에서 loadMyClubs()가 initCustomSelects() 호출함

  console.log('초기화 완료');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
