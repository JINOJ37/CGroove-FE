// ========================================
// 게시글 상세
// ========================================

// Mock 데이터
const mockPostData = {
  id: 1,
  title: '제목 1',
  content: '무엇을 해야할까요? 아무말입니다...',
  author: '더미 작성자 1',
  authorId: 1,
  date: '2021-01-01 00:00:00',
  image: 'https://via.placeholder.com/800x400',
  likes: 123,
  views: 456,
  comments: 3,
  isLiked: false
};

// 현재 사용자 (Mock)
const currentUser = {
  id: 1,
  name: '더미 작성자 1'
};

// 상태
let isEditingComment = false;
let editingCommentId = null;

/**
 * 숫자 포맷팅 (1k, 10k, 100k)
 */
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

/**
 * 좋아요 버튼 설정
 */
function setupLikeButton() {
  console.log('게시글 상세 : 좋아요 버튼 설정 중');
  
  const likeButton = document.getElementById('likeButton');
  const likeCount = document.getElementById('likeCount');
  
  // 초기 상태 설정
  updateLikeButton();
  
  likeButton.addEventListener('click', function() {
    mockPostData.isLiked = !mockPostData.isLiked;
    mockPostData.likes += mockPostData.isLiked ? 1 : -1;
    updateLikeButton();
    
    console.log('좋아요 상태:', mockPostData.isLiked ? '활성화' : '비활성화');
    
    // Phase 2: 실제 API 호출
    // await fetch(`/api/posts/${mockPostData.id}/like`, {
    //   method: mockPostData.isLiked ? 'POST' : 'DELETE'
    // });
  });
  
  function updateLikeButton() {
    if (mockPostData.isLiked) {
      likeButton.className = 'stat-item like-button active';
    } else {
      likeButton.className = 'stat-item like-button inactive';
    }
    likeCount.textContent = formatNumber(mockPostData.likes);
  }
}

/**
 * 게시글 수정/삭제 버튼
 */
function setupPostActions() {
  console.log('게시글 상세 : 수정/삭제 버튼 설정 중');
  
  const editBtn = document.querySelector('.detail-actions .btn:first-child');
  const deleteBtn = document.querySelector('.detail-actions .btn:last-child');
  
  // 수정 버튼
  editBtn.addEventListener('click', function() {
    console.log('게시글 수정으로 이동');
    navigateTo(`post_edit.html?id=${mockPostData.id}`);
  });
  
  // 삭제 버튼
  deleteBtn.addEventListener('click', function() {
    console.log('게시글 삭제 모달');
    
    showModal(
      '게시글을 삭제하시겠습니까?',
      '삭제한 내용은 복구 할 수 없습니다.',
      function() {
        console.log('✅ 게시글 삭제 확인');
        
        showToast('게시글이 삭제되었습니다');
        
        setTimeout(() => {
          navigateTo('main.html');
        }, 2000);
        
        // Phase 2: 실제 API 호출
        // await fetch(`/api/posts/${mockPostData.id}`, {
        //   method: 'DELETE'
        // });
      },
      function() {
        console.log('❌ 게시글 삭제 취소');
      }
    );
  });
}

/**
 * 댓글 입력 이벤트
 */
function setupCommentInput() {
  console.log('게시글 상세 : 댓글 입력 설정 중');
  
  const commentInput = document.getElementById('commentInput');
  const commentSubmit = document.getElementById('commentSubmit');
  const commentForm = document.getElementById('commentForm');
  
  // 입력 시 버튼 상태 변경
  commentInput.addEventListener('input', function() {
    const hasContent = this.value.trim() !== '';
    
    if (hasContent) {
      commentSubmit.disabled = false;
      commentSubmit.className = 'btn btn-primary comment-submit active';
    } else {
      commentSubmit.disabled = true;
      commentSubmit.className = 'btn btn-primary comment-submit';
    }
  });
  
  // 폼 제출
  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const content = commentInput.value.trim();
    if (!content) return;
    
    if (isEditingComment) {
      // 댓글 수정
      updateComment(editingCommentId, content);
    } else {
      // 댓글 등록
      addComment(content);
    }
    
    // 초기화
    commentInput.value = '';
    commentSubmit.disabled = true;
    commentSubmit.className = 'btn btn-primary comment-submit';
    commentSubmit.textContent = '댓글 등록';
    isEditingComment = false;
    editingCommentId = null;
  });
}

/**
 * 댓글 추가
 */
function addComment(content) {
  console.log('댓글 추가:', content);
  
  // Mock 댓글 데이터
  const newComment = {
    id: Date.now(),
    content: content,
    author: currentUser.name,
    authorId: currentUser.id,
    date: new Date().toLocaleString('ko-KR')
  };
  
  // DOM에 추가
  const commentsList = document.querySelector('.comments-list');
  const commentElement = createCommentElement(newComment);
  commentsList.appendChild(commentElement);
  
  showToast('댓글이 등록되었습니다');
  
  // Phase 2: 실제 API 호출
  // await fetch(`/api/posts/${mockPostData.id}/comments`, {
  //   method: 'POST',
  //   body: JSON.stringify({ content })
  // });
}

/**
 * 댓글 수정
 */
function updateComment(commentId, newContent) {
  console.log('댓글 수정:', commentId, newContent);
  
  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
  const contentElement = commentElement.querySelector('.comment-content');
  
  contentElement.textContent = newContent;
  commentElement.classList.remove('editing');
  
  showToast('댓글이 수정되었습니다');
  
  // Phase 2: 실제 API 호출
  // await fetch(`/api/posts/${mockPostData.id}/comments/${commentId}`, {
  //   method: 'PATCH',
  //   body: JSON.stringify({ content: newContent })
  // });
}

/**
 * 댓글 DOM 요소 생성
 */
function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.id;
  
  const isOwnComment = comment.authorId === currentUser.id;
  
  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-author-wrapper">
        <span class="author-avatar">👤</span>
        <div>
          <div class="author-name">${comment.author}</div>
          <span class="post-date">${comment.date}</span>
        </div>
      </div>
      ${isOwnComment ? `
        <div class="comment-actions">
          <button class="btn btn-secondary btn-small comment-edit-btn">수정</button>
          <button class="btn btn-secondary btn-small comment-delete-btn">삭제</button>
        </div>
      ` : ''}
    </div>
    <p class="comment-content">${comment.content}</p>
    <textarea class="comment-edit-input">${comment.content}</textarea>
  `;
  
  // 이벤트 연결
  setupCommentActions(commentDiv, comment.id);
  
  return commentDiv;
}

/**
 * 댓글 수정/삭제 액션 설정
 */
function setupCommentActions(commentElement, commentId) {
  const editBtn = commentElement.querySelector('.comment-edit-btn');
  const deleteBtn = commentElement.querySelector('.comment-delete-btn');
  
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      console.log('댓글 수정 모드:', commentId);
      
      // 수정 모드 활성화
      commentElement.classList.add('editing');
      isEditingComment = true;
      editingCommentId = commentId;
      
      // 댓글 입력창에 기존 내용 넣기
      const commentInput = document.getElementById('commentInput');
      const commentSubmit = document.getElementById('commentSubmit');
      const currentContent = commentElement.querySelector('.comment-content').textContent;
      
      commentInput.value = currentContent;
      commentSubmit.disabled = false;
      commentSubmit.className = 'btn btn-primary comment-submit active';
      commentSubmit.textContent = '댓글 수정';
      
      // 포커스
      commentInput.focus();
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      console.log('댓글 삭제 모달:', commentId);
      
      showModal(
        '댓글을 삭제하시겠습니까?',
        '삭제한 내용은 복구 할 수 없습니다.',
        function() {
          console.log('✅ 댓글 삭제 확인');
          
          commentElement.remove();
          showToast('댓글이 삭제되었습니다');
          
          // Phase 2: 실제 API 호출
          // await fetch(`/api/posts/${mockPostData.id}/comments/${commentId}`, {
          //   method: 'DELETE'
          // });
        },
        function() {
          console.log('❌ 댓글 삭제 취소');
        }
      );
    });
  }
}

/**
 * 기존 댓글들에 이벤트 연결
 */
function setupExistingComments() {
  console.log('게시글 상세 : 기존 댓글 이벤트 설정 중');
  
  const commentItems = document.querySelectorAll('.comment-item');
  commentItems.forEach((commentElement, index) => {
    const commentId = index + 1; // Mock ID
    commentElement.dataset.commentId = commentId;
    
    // 수정/삭제 버튼에 이벤트 연결
    setupCommentActions(commentElement, commentId);
  });
}

/**
 * 초기화
 */
function init() {
  console.log('게시글 상세 페이지 불러오는 중');
  
  // 통계 업데이트
  document.querySelector('.detail-stats .stat-item:nth-child(2) .stat-value').textContent = formatNumber(mockPostData.views);
  document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value').textContent = formatNumber(mockPostData.comments);
  
  // 이벤트 설정
  setupLikeButton();
  setupPostActions();
  setupCommentInput();
  setupExistingComments();
  
  console.log('게시글 상세 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('post/detail.js 로드 완료');