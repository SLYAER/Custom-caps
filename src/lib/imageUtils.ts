export const processAndCropImage = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    if (!dataUrl.startsWith('data:')) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1;
        canvas.height = img.height || 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 0) {
              // Remove white-ish backgrounds
              if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; 
              } else {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        if (minX > maxX || minY > maxY) {
          return resolve(canvas.toDataURL('image/png'));
        }
        
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);
          resolve(cropCanvas.toDataURL('image/png'));
        } else {
          resolve(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error("Image processing error:", err);
        resolve(dataUrl); // Fallback to original image if processing fails
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};
