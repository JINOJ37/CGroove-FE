// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast, showModal } from '../common/util/utils.js';
import { navigateTo, smartBack } from '../common/util/utils.js';
import { formatDate } from '../common/util/format.js';
import { escapeHtml } from '../common/util/format.js';
import { getEventParticipants, rejectParticipation } from '../common/api/event.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상태 관리 ====================

let eventId = null;
let participants = [];

// ==================== API 호출 ====================

async function loadParticipants() {
  const urlParams = new URLSearchParams(window.location.search);
  eventId = urlParams.get('id');
  
  if (!eventId) {
    showToast('행사를 찾을 수 없습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500); // event_list가 없다면 post_list로
    return;
  }
  
  showLoading();
  
  try {
    const response = await getEventParticipants(eventId);
    participants = response.data || [];
    
    console.log('참여자 로드:', participants.length, '명');
    
    hideLoading();
    renderParticipants();
    
  } catch (error) {
    hideLoading();
    console.error('참여자 로드 실패:', error);
    showToast('참여자 목록을 불러오는데 실패했습니다', 2000, 'error');
  }
}

async function handleReject(participantId, nickname) {
  showModal(
    '참여 거절', // 제목 수정
    `${nickname}님의 참여를 거절하시겠습니까?`,
    async () => {
      try {
        showLoading();
        await rejectParticipation(eventId, participantId);
        hideLoading();
        
        showToast('참여가 거절되었습니다', 1500);
        
        // 목록에서 제거
        participants = participants.filter(p => p.userId !== participantId);
        renderParticipants();
        
      } catch (error) {
        hideLoading();
        console.error('거절 실패:', error);
        
        if (error.status === 403) {
            showToast('권한이 없습니다', 2000, 'error');
        } else {
            showToast('거절 중 오류가 발생했습니다', 2000, 'error');
        }
      }
    }
  );
}

// ==================== UI 렌더링 ====================

function renderParticipants() {
  const container = document.getElementById('participantsList');
  const countEl = document.getElementById('participantCount');
  
  if(countEl) countEl.textContent = participants.length;
  if(!container) return;

  container.innerHTML = '';
  
  if (participants.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-text">아직 참여자가 없습니다</div>
      </div>
    `;
    return;
  }
  
  // [수정] admin-common.css 스타일 적용 (participant-card 구조)
  container.innerHTML = participants.map(p => {

    console.log(`멤버 [${p.nickname}]:`, {
      userId: p.userId,
    });

    // 프로필 이미지 처리
    const profileImg = p.profileImage 
      ? `${API_BASE_URL}${p.profileImage}` 
      : '/assets/images/default-profile.png'; // 기본 이미지 경로 확인 필요

    return `
      <div class="participant-card" data-user-id="${p.userId}">
        <div class="participant-info">
          <img src="${profileImg}" alt="프로필" class="profile-image">
          <div class="participant-details">
            <div class="participant-name">
              ${escapeHtml(p.nickname || '익명')}
            </div>
            <div class="participant-email">${escapeHtml(p.email)}</div>
            <div class="join-date">신청일: ${formatDate(p.createdAt)}</div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="btn btn-outline kick-btn reject-btn" 
                  data-user-id="${p.userId}" 
                  data-nickname="${escapeHtml(p.nickname)}">
            거절
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== 이벤트 핸들러 ====================

function setupBackButton() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // 뒤로가기 시 상세 페이지로 이동
      smartBack(`event_detail.html?id=${eventId}`);
    });
  }
}

function setupRejectButtons() {
  const container = document.getElementById('participantsList');
  if(!container) return;
  
  container.addEventListener('click', (e) => {
    if (e.target.closest('.reject-btn')) {
      const btn = e.target.closest('.reject-btn');
      const userId = Number(btn.dataset.userId);
      const nickname = btn.dataset.nickname;
      handleReject(userId, nickname);
    }
  });
}

// ==================== 초기화 ====================

async function init() {
  console.log('참여자 관리 페이지 초기화');
  
  await initHeader();
  
  setupBackButton();
  setupRejectButtons();
  
  await loadParticipants();
  
  console.log('참여자 관리 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('events/participants.js 로드 완료');