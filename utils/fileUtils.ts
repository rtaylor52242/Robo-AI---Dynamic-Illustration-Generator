// This makes TypeScript aware of the JSZip library loaded from the CDN
declare const JSZip: any;
declare const GIF: any;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const base64ToFile = (dataUrl: string, filename: string): File | null => {
  const arr = dataUrl.split(',');
  if (arr.length < 2) { return null; }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) { return null; }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};


export const createZip = async (images: { name: string; data: string }[]): Promise<void> => {
  const zip = new JSZip();
  images.forEach(image => {
    zip.file(image.name, image.data, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'illustrations.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const createSpriteSheet = async (
  base64Images: string[],
  frameWidth: number,
  frameHeight: number,
  maxSheetWidth: number = 4096
): Promise<{ sheet: string; map: object }> => {
  const images: HTMLImageElement[] = await Promise.all(
    base64Images.map(b64 => {
      // FIX: Explicitly type the Promise to resolve with HTMLImageElement
      return new Promise<HTMLImageElement>(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = b64;
      });
    })
  );

  const framesPer_row = Math.floor(maxSheetWidth / frameWidth);
  const numRows = Math.ceil(images.length / framesPer_row);
  const sheetWidth = framesPer_row * frameWidth;
  const sheetHeight = numRows * frameHeight;

  const canvas = document.createElement('canvas');
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const map: { [key: string]: { x: number; y: number; w: number; h: number } } = {};

  images.forEach((img, index) => {
    const col = index % framesPer_row;
    const row = Math.floor(index / framesPer_row);
    const x = col * frameWidth;
    const y = row * frameHeight;
    ctx.drawImage(img, x, y, frameWidth, frameHeight);
    map[`frame_${index}`] = { x, y, w: frameWidth, h: frameHeight };
  });

  return {
    sheet: canvas.toDataURL('image/png'),
    map,
  };
};

export const createGif = (
  base64Images: string[],
  options: { width: number; height: number; fps: number }
): Promise<string> => {
    return new Promise(async (resolve) => {
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: options.width,
            height: options.height,
        });

        const images: HTMLImageElement[] = await Promise.all(
            base64Images.map(b64 => {
              // FIX: Explicitly type the Promise to resolve with HTMLImageElement
              return new Promise<HTMLImageElement>(resolveImg => {
                const img = new Image();
                img.onload = () => resolveImg(img);
                img.src = b64;
              });
            })
        );
        
        images.forEach(img => {
            gif.addFrame(img, { delay: 1000 / options.fps });
        });

        gif.on('finished', (blob: Blob) => {
            resolve(URL.createObjectURL(blob));
        });

        gif.render();
    });
};