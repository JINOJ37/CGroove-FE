function processImageFile(
  file,
  {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    maxSizeBytes = 2 * 1024 * 1024
  } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('이미지 파일만 허용됩니다.'));
    }

    if (file.size <= maxSizeBytes) {
      const previewUrl = URL.createObjectURL(file);
      return resolve({ file, previewUrl });
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const width = img.width;
        const height = img.height;

        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);

        const targetWidth = Math.round(width * ratio);
        const targetHeight = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          blob => {
            if (!blob) return reject(new Error('이미지 압축 실패'));

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, '.jpg'),
              { type: 'image/jpeg' }
            );

            const previewUrl = URL.createObjectURL(compressedFile);
            resolve({ file: compressedFile, previewUrl });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 전역에서 쓸 수 있게
window.processImageFile = processImageFile;