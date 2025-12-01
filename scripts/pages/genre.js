// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { navigateTo } from '../common/util/utils.js';

// ==================== 이벤트 핸들러 ====================

function setupButtons() {
  const toClubsBtn = document.getElementById('toClubsBtn');
  const toMainBtn = document.getElementById('toMainBtn');

  if (toClubsBtn) {
    toClubsBtn.addEventListener('click', () => {
      navigateTo('club_list.html');
    });
  }

  if (toMainBtn) {
    toMainBtn.addEventListener('click', () => {
      navigateTo('main.html');
    });
  }
}

function setupLogoClick() {
  const logoBtn = document.getElementById('logoBtn');
  if (logoBtn) {
    logoBtn.style.cursor = 'pointer';
    logoBtn.addEventListener('click', () => {
      navigateTo('main.html');
    });
  }
}

// ==================== 초기화 ====================

async function init() {
  console.log('장르 페이지 초기화');

  await initHeader();

  setupLogoClick();
  setupButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('pages/genre.js 로드 완료');