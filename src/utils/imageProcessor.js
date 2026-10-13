// High-Quality Image Processor with Native + WASM HEIC/HEIF Support & Progressive HD Resizing

const DB_NAME = 'mcu_alumni_media_db';
const DB_VERSION = 1;
const MEMORIES_STORE = 'custom_memories';

/**
 * Inspect first 32 bytes of a File/Blob to detect ISO-BMFF HEIC/HEIF magic headers
 * (Handles .heic/.heif files even if renamed to .jpg/.png)
 */
async function hasHeicMagicBytes(file) {
  try {
    if (!file || typeof file.slice !== 'function') return false;
    const buffer = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 12) return false;
    // Check for 'ftyp' at offset 4..8
    const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (boxType !== 'ftyp') return false;
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    const heicBrands = new Set([
      'heic',
      'heix',
      'hevc',
      'heim',
      'heis',
      'hevm',
      'hevs',
      'mif1',
      'msf1',
    ]);
    return heicBrands.has(brand);
  } catch {
    return false;
  }
}

export const MAX_MEMORY_VIDEO_BYTES = 5 * 1024 * 1024; // 5 MB max video upload size

/**
 * Check if a file is an image (including HEIC / HEIF / AVIF / WEBP / JFIF / RAW-like extensions)
 */
export function isSupportedImageFile(file) {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg|avif|jfif|heic|heif)$/i.test(file.name || '');
}

/**
 * Check if a file is a supported video file (MP4, WEBM, MOV, M4V, OGG)
 */
export function isSupportedVideoFile(file) {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name || '');
}

/**
 * Check if a URL, Data URL, or memory object represents a video
 */
export function isVideoUrlOrData(input) {
  if (!input) return false;
  if (typeof input === 'object') {
    if (input.mediaType === 'video' || input.isVideo) return true;
    const src = String(input.videoUrl || input.image || input.src || '');
    return isVideoUrlOrData(src);
  }
  const str = String(input).trim().toLowerCase();
  if (str.startsWith('data:video/')) return true;
  return /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i.test(str);
}

/**
 * Process an uploaded video file (validating <= 5MB limit) into a Data URL and optional poster frame
 */
export async function processVideoFile(file, maxBytes = MAX_MEMORY_VIDEO_BYTES, onProgress) {
  if (!file) {
    throw new Error('No video file provided');
  }
  const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
  if (file.size > maxBytes) {
    const err = new Error(`Video size (${sizeMB} MB) exceeds the 5 MB limit`);
    err.code = 'VIDEO_TOO_LARGE';
    err.sizeMB = sizeMB;
    throw err;
  }

  onProgress?.(15, `Reading video file (${sizeMB} MB)...`);

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0 && typeof onProgress === 'function') {
        const pct = Math.min(80, 15 + Math.round((e.loaded / e.total) * 65));
        onProgress(pct, `Reading video (${pct}%)...`);
      }
    };
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => reject(new Error('Failed to read video file'));
    reader.readAsDataURL(file);
  });

  onProgress?.(85, 'Extracting video preview thumbnail...');

  // Attempt to capture a thumbnail poster frame & dimensions from the video (with safe 2.5s timeout)
  const meta = await new Promise((resolve) => {
    let settled = false;
    const finish = (info) => {
      if (settled) return;
      settled = true;
      resolve(info);
    };

    const timer = setTimeout(() => {
      finish({ width: 1280, height: 720, duration: 0, posterDataUrl: '' });
    }, 2500);

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        try {
          video.currentTime = Math.min(0.5, (video.duration || 1) * 0.25);
        } catch {
          clearTimeout(timer);
          finish({
            width: video.videoWidth || 1280,
            height: video.videoHeight || 720,
            duration: video.duration || 0,
            posterDataUrl: '',
          });
        }
      };

      video.onseeked = () => {
        try {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 360;
          const targetW = Math.min(640, w);
          const targetH = Math.round((h * targetW) / w) || 360;
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, targetW, targetH);
          const posterDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          clearTimeout(timer);
          finish({
            width: w,
            height: h,
            duration: video.duration || 0,
            posterDataUrl,
          });
        } catch {
          clearTimeout(timer);
          finish({
            width: video.videoWidth || 1280,
            height: video.videoHeight || 720,
            duration: video.duration || 0,
            posterDataUrl: '',
          });
        }
      };

      video.onerror = () => {
        clearTimeout(timer);
        finish({ width: 1280, height: 720, duration: 0, posterDataUrl: '' });
      };

      video.src = dataUrl;
    } catch {
      clearTimeout(timer);
      finish({ width: 1280, height: 720, duration: 0, posterDataUrl: '' });
    }
  });

  onProgress?.(100, 'Video ready (100%)');

  return {
    dataUrl,
    sizeMB,
    width: meta.width,
    height: meta.height,
    duration: meta.duration,
    posterDataUrl: meta.posterDataUrl,
  };
}

/**
 * Check if a file is specifically HEIC / HEIF by extension, MIME, or magic bytes
 */
export async function isHeicOrHeifFile(file) {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (
    mime.includes('heic') ||
    mime.includes('heif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  ) {
    return true;
  }
  return await hasHeicMagicBytes(file);
}

/**
 * Convert a Blob/File to a Data URL
 */
function blobToDataUrl(blob, onProgressSub) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0 && typeof onProgressSub === 'function') {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgressSub(pct);
      }
    };
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Decode an image URL / Data URL into an HTMLImageElement
 */
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Browser could not decode image directly'));
    img.src = src;
  });
}

/**
 * Convert HEIC/HEIF Blob/File to high-quality JPEG Blob using heic2any
 */
async function convertHeicBlobToJpeg(fileOrBlob, quality = 0.95) {
  const heicModule = await import('heic2any');
  const heic2any = heicModule.default || heicModule;
  const result = await heic2any({
    blob: fileOrBlob,
    toType: 'image/jpeg',
    quality,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Progressive multi-step high-quality canvas resize (prevents aliasing when downscaling 4K/8K photos)
 */
function renderHighQualityCanvas(img, targetWidth, targetHeight) {
  let curWidth = img.naturalWidth || img.width || targetWidth;
  let curHeight = img.naturalHeight || img.height || targetHeight;

  // Step-down by 50% increments until close to target dimensions for ultra-crisp Lanczos-like clarity
  let currentSource = img;
  while (curWidth * 0.5 > targetWidth && curHeight * 0.5 > targetHeight) {
    curWidth = Math.max(targetWidth, Math.round(curWidth * 0.5));
    curHeight = Math.max(targetHeight, Math.round(curHeight * 0.5));
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = curWidth;
    stepCanvas.height = curHeight;
    const stepCtx = stepCanvas.getContext('2d');
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(currentSource, 0, 0, curWidth, curHeight);
    currentSource = stepCanvas;
  }

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);
  return finalCanvas;
}

/**
 * Process any uploaded image (including .HEIC / .HEIF, 4K/8K camera photos, PNG, WEBP, JPG):
 * - Automatically converts HEIC/HEIF to high-definition JPEG
 * - Only resizes if dimensions exceed maxWidth / maxHeight (preserving 100% crispness)
 * - Uses multi-step high-quality smoothing & 0.94-0.95 JPEG quality so visual quality never drops
 * - Reports real-time percentage progress (0 - 100%) via onProgress callback
 */
export async function processHighQualityImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1440,
    quality = 0.94,
    onProgress,
  } = options;

  onProgress?.(10, 'Analyzing image format...');

  let workingBlob = file;
  let wasHeicConverted = false;

  const isHeic = await isHeicOrHeifFile(file);
  if (isHeic) {
    try {
      onProgress?.(20, 'Converting HEIC to high-definition JPEG...');
      workingBlob = await convertHeicBlobToJpeg(file, 0.95);
      wasHeicConverted = true;
      onProgress?.(45, 'HEIC conversion complete');
    } catch (heicErr) {
      console.warn('Primary HEIC conversion note, trying native decode:', heicErr);
    }
  }

  const baseReadPct = wasHeicConverted ? 45 : 15;
  const readSpan = wasHeicConverted ? 25 : 45;
  onProgress?.(baseReadPct, 'Reading image data...');

  let sourceDataUrl = await blobToDataUrl(workingBlob, (subPct) => {
    const mapped = Math.min(baseReadPct + readSpan, baseReadPct + Math.round((subPct / 100) * readSpan));
    onProgress?.(mapped, `Reading file (${mapped}%)...`);
  });

  onProgress?.(65, 'Decoding image at high resolution...');
  let img;

  try {
    img = await loadImageElement(sourceDataUrl);
  } catch (decodeErr) {
    // Fallback: if browser couldn't decode the image natively (e.g., unflagged HEIC/HEIF), convert via heic2any
    if (!wasHeicConverted) {
      onProgress?.(70, 'Running HEIC fallback converter...');
      const convertedBlob = await convertHeicBlobToJpeg(file, 0.95);
      wasHeicConverted = true;
      sourceDataUrl = await blobToDataUrl(convertedBlob);
      img = await loadImageElement(sourceDataUrl);
    } else {
      throw decodeErr;
    }
  }

  const originalWidth = img.naturalWidth || img.width || 1280;
  const originalHeight = img.naturalHeight || img.height || 800;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  let wasResized = false;

  if (targetWidth > maxWidth) {
    targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
    targetWidth = maxWidth;
    wasResized = true;
  }
  if (targetHeight > maxHeight) {
    targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
    targetHeight = maxHeight;
    wasResized = true;
  }

  // If image didn't need resizing, wasn't HEIC, and original file is already compact (<= 1.2 MB),
  // preserve exact untouched original Data URL for 100% zero-loss fidelity!
  if (!wasResized && !wasHeicConverted && file.size <= 1200 * 1024) {
    onProgress?.(100, 'Original HD quality ready (100%)');
    return {
      dataUrl: sourceDataUrl,
      width: originalWidth,
      height: originalHeight,
      originalWidth,
      originalHeight,
      wasResized: false,
      wasHeicConverted: false,
    };
  }

  onProgress?.(80, 'Optimizing HD canvas dimensions...');
  const canvas = renderHighQualityCanvas(img, targetWidth, targetHeight);

  onProgress?.(92, 'Finalizing HD compression & clarity...');
  // Preserve PNG transparency if input was PNG and not huge; otherwise use high-quality 0.94 JPEG
  const isPng = (file.type || '').toLowerCase() === 'image/png' && !wasHeicConverted;
  let finalDataUrl = isPng
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', quality);

  // If PNG output is very large (> 1.8 MB), use 0.94 high-definition JPEG
  if (isPng && finalDataUrl.length > 2400000) {
    finalDataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  onProgress?.(100, 'HD Photo ready (100%)');

  return {
    dataUrl: finalDataUrl,
    width: targetWidth,
    height: targetHeight,
    originalWidth,
    originalHeight,
    wasResized,
    wasHeicConverted,
  };
}

/**
 * IndexedDB Storage for High-Resolution Campus Memories (supports 500MB+ of HD/2K photos)
 */
function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
        db.createObjectStore(MEMORIES_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomMemoriesToDB(memoriesList) {
  try {
    const db = await openMediaDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEMORIES_STORE, 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE);
      store.clear();
      (memoriesList || []).forEach((item) => {
        if (item && item.id) {
          store.put(item);
        }
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB save fallback note:', err);
  }
}

export async function loadCustomMemoriesFromDB() {
  try {
    const db = await openMediaDB();
    const items = await new Promise((resolve, reject) => {
      const tx = db.transaction(MEMORIES_STORE, 'readonly');
      const store = tx.objectStore(MEMORIES_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    // Sort newest first by created_at or id timestamp
    return items.sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tB - tA;
    });
  } catch {
    return [];
  }
}

/**
 * IndexedDB Storage for High-Resolution Events Archive, Slides & Upcoming Conclaves
 */
const EVENTS_DB_NAME = 'mcu_alumni_events_db';
const EVENTS_DB_VERSION = 1;
const EVENTS_STORE = 'events_portal_state';

function openEventsDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(EVENTS_DB_NAME, EVENTS_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        db.createObjectStore(EVENTS_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEventsStateToDB(key, data) {
  try {
    const db = await openEventsDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(EVENTS_STORE, 'readwrite');
      const store = tx.objectStore(EVENTS_STORE);
      store.put({ key, data, updated_at: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Events IndexedDB save fallback note:', err);
  }
}

export async function loadEventsStateFromDB(key) {
  try {
    const db = await openEventsDB();
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction(EVENTS_STORE, 'readonly');
      const store = tx.objectStore(EVENTS_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return record ? record.data : null;
  } catch {
    return null;
  }
}
