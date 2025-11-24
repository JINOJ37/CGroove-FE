// ============================================================
// Mock API (메인 페이지용)
// ============================================================

import { mockPosts } from './mock-data.js';

// 지연 시뮬레이션
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockAPI = {
  // 내 클럽 최신 게시글
  async getMyClubPosts(limit = 3) {
    await delay(500);
    
    return mockPosts
      .filter(post => post.isMyClub === true)
      .slice(0, limit);
  },
  
  // 전체 게시글
  async getAllPosts(limit = 5) {
    await delay(300);
    
    return mockPosts.slice(0, limit);
  }
};

console.log('main/mock-api.js 로드 완료');