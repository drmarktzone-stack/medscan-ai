/**
 * Shared vision I/O: local file first, Base44 upload only if the function exists.
 */

import { downscaleImageFile } from "../imageOptimize.js";
import { canInvokeVision, tryBase44Core } from "../medscan/llmAdapter.js";
import { isStandaloneBuild } from "./standalone.js";
import { fileToImageData, fileToObjectUrl } from "./localImage.js";

export async function resolveVisionInput({ files = [], preUploadedUrls = [] } = {}) {
  const file = files?.[0] || null;
  const imageData = file ? await fileToImageData(file) : null;
  const localUrl = file ? await fileToObjectUrl(file) : null;
  let remote = Array.isArray(preUploadedUrls) ? preUploadedUrls.filter(Boolean) : [];
  const upload = !isStandaloneBuild() ? tryBase44Core("UploadFile") : null;
  if (!remote.length && file && upload) {
    try {
      const optimized = await downscaleImageFile(file);
      const r = await upload({ file: optimized });
      if (r?.file_url) remote = [r.file_url];
    } catch {
      /* stay local */
    }
  }
  const fileUrls = remote.length ? remote : (localUrl ? [localUrl] : []);
  return {
    file,
    imageData,
    localUrl,
    fileUrls,
    fileUrl: fileUrls[0] || null,
  };
}

export async function runHostedVisionOrLocal(hostedFn, localFn) {
  if (canInvokeVision()) {
    try {
      const hosted = await hostedFn();
      if (hosted && hosted.abstain) return localFn();
      return hosted;
    } catch {
      return localFn();
    }
  }
  return localFn();
}
