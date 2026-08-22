/**
 * Read an uploaded file on this device. No Base44 UploadFile.
 */

export async function fileToObjectUrl(file) {
  if (!file || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;
  return URL.createObjectURL(file);
}

export async function fileToImageData(file, maxEdge = 768) {
  if (!file || typeof document === "undefined") return null;
  let bitmap = null;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    }
  } catch {
    bitmap = null;
  }
  if (!bitmap) {
    const url = await fileToObjectUrl(file);
    if (!url) return null;
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image_load_failed"));
      img.src = url;
    }).catch(() => null);
  }
  if (!bitmap) return null;
  const w0 = bitmap.width || bitmap.naturalWidth || 0;
  const h0 = bitmap.height || bitmap.naturalHeight || 0;
  if (!w0 || !h0) return null;
  const scale = Math.min(1, maxEdge / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  try {
    return ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }
}
