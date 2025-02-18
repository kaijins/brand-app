function getImageData(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;  // 比較用に画像サイズを標準化
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, 100, 100);
        resolve(ctx.getImageData(0, 0, 100, 100));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
  
  export async function compareImages(image1: string, image2: string): Promise<number> {
    const [data1, data2] = await Promise.all([
      getImageData(image1),
      getImageData(image2)
    ]);
  
    let diff = 0;
    const pixels = data1.data.length;
  
    for (let i = 0; i < pixels; i += 4) {
      diff += Math.abs(data1.data[i] - data2.data[i]);       // Red
      diff += Math.abs(data1.data[i + 1] - data2.data[i + 1]); // Green
      diff += Math.abs(data1.data[i + 2] - data2.data[i + 2]); // Blue
    }
  
    // 類似度を0-100の範囲で返す（100が完全一致）
    return 100 - (diff / (pixels * 3) / 255 * 100);
  }