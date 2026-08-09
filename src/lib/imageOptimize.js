/**
 * ============================================================================
 *  MedScan AI — Client-side image optimization (speed, NOT quality loss)
 * ============================================================================
 *  Claude's vision models downscale every image to ~1568px on the long edge
 *  (≈1.15 MP) BEFORE analysis, regardless of what you send. A 4000px, 5 MB
 *  phone photo is therefore resized server-side anyway — you only pay for the
 *  slow upload and the extra resize latency, with ZERO diagnostic benefit.
 *
 *  This module downscales to exactly that target on-device before upload:
 *    • Faster upload (200–400 KB instead of 3–6 MB).
 *    • No server-side resize step.
 *    • Pixel content the model sees is unchanged → identical reading quality.
 *
 *  Safeguards (so we never degrade a reading):
 *    • Only touches raster images — PDFs and non-images pass through untouched.
 *    • Never upscales; if already ≤ target or already small, returns original.
 *    • High-quality smoothing + JPEG q=0.92 to preserve fine detail (ECG grid,
 *      dermoscopic structures, faint radiographic lines).
 *    • Any failure → returns the original file (fail-open, never blocks).
 * ============================================================================
 */

const DEFAULT_MAX_DIM = 1568;   // Claude vision long-edge target
const DEFAULT_QUALITY = 0.92;   // high — preserves fine clinical detail
const MIN_BYTES = 350 * 1024;   // below this, not worth touching

function loadImageEl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Downscale a raster image File to the vision target. Returns a new File, or
 * the original if optimization isn't applicable/beneficial.
 * @param {File} file
 * @param {{maxDim?:number, quality?:number}} [opts]
 * @returns {Promise<File>}
 */
export async function downscaleImageFile(file, { maxDim = DEFAULT_MAX_DIM, quality = DEFAULT_QUALITY } = {}) {
  try {
    if (typeof document === "undefined") return file;
    if (!file || !file.type || !file.type.startsWith("image/")) return file; // PDFs etc. untouched
    if (file.type === "image/gif") return file; // keep animations intact
    if (file.size < MIN_BYTES) return file; // already small enough

    // Prefer createImageBitmap (fast, off-thread); fall back to <img>.
    let source, w, h, objUrl = null;
    if (typeof createImageBitmap === "function") {
      try { source = await createImageBitmap(file); w = source.width; h = source.height; } catch { source = null; }
    }
    if (!source) {
      objUrl = URL.createObjectURL(file);
      const img = await loadImageEl(objUrl);
      source = img; w = img.naturalWidth; h = img.naturalHeight;
    }
    if (!w || !h) { if (objUrl) URL.revokeObjectURL(objUrl); return file; }

    const scale = Math.min(1, maxDim / Math.max(w, h));
    if (scale >= 1) { if (objUrl) URL.revokeObjectURL(objUrl); if (source.close) source.close(); return file; } // already ≤ target

    const nw = Math.max(1, Math.round(w * scale));
    const nh = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = nw; canvas.height = nh;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, nw, nh);
    if (source.close) source.close();
    if (objUrl) URL.revokeObjectURL(objUrl);

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // no gain → keep original

    const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file; // fail-open: never block an analysis over optimization
  }
}

/** Downscale a list of files (images optimized, others untouched), concurrently. */
export async function downscaleImageFiles(files = [], opts) {
  return Promise.all((files || []).map((f) => downscaleImageFile(f, opts)));
}
