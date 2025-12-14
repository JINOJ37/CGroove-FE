// ==================== Import ====================

import { API_BASE_URL } from '../api/core.js';

// ========== 이미지 URL 처리 ==========

const DEFAULT_IMAGES = {
  profile: '/assets/images/default-profile.png',
  club: '/assets/images/default-profile.png',
  post: '/assets/images/default-profile.png',
  event: '/assets/images/default-profile.png'
};

// 이미지 경로를 절대 URL로 변환
export function getImageUrl(imagePath, type = 'profile') {
  if (!imagePath || imagePath === 'null') {
    return DEFAULT_IMAGES[type] || DEFAULT_IMAGES.profile;
  }
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  return `${API_BASE_URL}${imagePath}`;
}

// img 엘리먼트에 이미지 설정 (에러 처리 포함)
export function setImageSrc(imgElement, imagePath, type = 'profile') {
  if (!imgElement) return;
  
  const url = getImageUrl(imagePath, type);
  imgElement.src = url;
  
  imgElement.onerror = () => {
    imgElement.src = DEFAULT_IMAGES[type];
    imgElement.onerror = null;
  };
}

// ========== 이미지 파일 검증 ==========

// 이미지 파일 유효성 검사
export function validateImageFile(file, options = {}) {
  const {
    maxSizeBytes = 30 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  if (!file) {
    return { valid: false, error: '파일이 없습니다' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '이미지 파일만 허용됩니다' };
  }

  if (!allowedTypes.includes(file.type)) {
    const types = allowedTypes.map(t => t.split('/')[1]).join(', ');
    return { valid: false, error: `허용된 형식: ${types}` };
  }

  if (file.size > maxSizeBytes) {
    const sizeMB = (maxSizeBytes / 1024 / 1024).toFixed(1);
    return { valid: false, error: `파일 크기는 ${sizeMB}MB 이하여야 합니다` };
  }

  return { valid: true };
}

// ========== 이미지 압축/리사이징 ==========

// 이미지 파일을 압축하고 리사이징
export function processImageFile(
  file,
  {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    maxSizeBytes = 2 * 1024 * 1024
  } = {}
) {
  return new Promise((resolve, reject) => {
    // 파일 유효성 검사
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    // 파일 크기 확인
    if (file.size <= maxSizeBytes) {
      const previewUrl = URL.createObjectURL(file);
      return resolve({ file, previewUrl });
    }

    // 압축 필요 - 이미지 로드
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      
      img.onload = function() {
        // 리사이징 비율 계산
        const width = img.width;
        const height = img.height;
        
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);
        
        const targetWidth = Math.round(width * ratio);
        const targetHeight = Math.round(height * ratio);
        
        // Canvas에 그리기
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // JPEG로 압축
        canvas.toBlob(
          blob => {
            if (!blob) {
              return reject(new Error('이미지 압축 실패'));
            }
            
            // File 객체 생성
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, '.jpg'), // 확장자를 .jpg로
              { type: 'image/jpeg' }
            );
            
            // 미리보기 URL 생성
            const previewUrl = URL.createObjectURL(compressedFile);
            resolve({ file: compressedFile, previewUrl });
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

console.log('common/image_util.js 로드 완료');