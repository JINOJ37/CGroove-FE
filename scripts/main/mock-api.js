// 메인 목

import { mockPosts } from './mock-data.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockAPI = {
  // 내 클럽 최신 게시글 (3개)
  async getMyClubPosts(limit = 3) {
    await delay(500); // 로딩 시뮬레이션
    
    return mockPosts
      .filter(post => post.isMyClub === true)
      .slice(0, limit);
  },
  
  // 전체 게시글 (5개)
  async getAllPosts(limit = 5) {
    await delay(300);
    
    return mockPosts.slice(0, limit);
  }
};