// ============================================
// 메인 페이지 UI 인터랙션
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initMainUI();
});

function initMainUI() {
  setupSlider();
  setupTopButton();
  setupPostCardClick();
  setupScrollDetection();
}

// ============================================
// 슬라이더 설정
// ============================================

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

// ============================================
// TOP 버튼 설정
// ============================================

function setupTopButton() {
  const topButton = document.getElementById('topButton');
  
  if (topButton) {
    topButton.addEventListener('click', scrollToTop);
  } else {
    console.error('TOP 버튼을 찾을 수 없습니다!');
  }
}

function scrollToTop() {
  window.scrollTo({ 
    top: 0, 
    behavior: 'smooth' 
  });
}

// ============================================
// 스크롤 감지 (TOP 버튼 표시/숨김)
// ============================================

function setupScrollDetection() {
  const topButton = document.getElementById('topButton');
  
  if (!topButton) {
    console.error('TOP 버튼을 찾을 수 없습니다!');
    return;
  }
  
  let lastScrollPosition = 0;
  
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 전체 문서의 70% 이상 스크롤했을 때 버튼 표시
    const scrollPercentage = (scrollPosition + windowHeight) / documentHeight;
    
    console.log('Scroll %:', (scrollPercentage * 100).toFixed(1)); // 디버깅용
    
    if (scrollPercentage > 0.7) {
      topButton.classList.add('show');
    } else {
      topButton.classList.remove('show');
    }
    
    lastScrollPosition = scrollPosition;
  });
}

// ============================================
// 게시글 카드 클릭
// ============================================

function setupPostCardClick() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (card) {
      const postId = card.dataset.postId;
      if (postId) {
        goToDetail(postId);
      }
    }
  });
}

function goToDetail(postId) {
  location.href = `post_detail.html?id=${postId}`;
}