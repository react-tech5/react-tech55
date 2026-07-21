/**
 * Duplicate-image detection utilities — computed in the commenter's browser before upload
 * Used together with the submit_task_proof() database function
 */

// 1) SHA-256 of the exact file content — detects byte-for-byte duplicates
export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 2) Average Hash (aHash) — a 64-bit perceptual fingerprint that catches near-duplicate images
// (works even after re-compression or format changes, but not heavy cropping)
export async function averageHash(file: File): Promise<string> {
  const img = await loadImage(file);
  const size = 8; // 8x8 grid = 64 bits
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const grays: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    grays.push(gray);
  }
  const avg = grays.reduce((a, b) => a + b, 0) / grays.length;
  return grays.map((g) => (g >= avg ? "1" : "0")).join("");
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Full usage example when submitting proof:
 *
 * const file = event.target.files[0];
 * const fileHash = await sha256Hex(file);
 * const phash = await averageHash(file);
 * // Upload the file to Supabase Storage first to get screenshot_url
 * const { data, error } = await supabase.rpc('submit_task_proof', {
 *   p_task_id: taskId,
 *   p_proof_url: commentUrl,
 *   p_screenshot_url: screenshotUrl,
 *   p_file_hash: fileHash,
 *   p_phash: phash,
 * });
 * if (error) alert(error.message); // e.g. "Rejected: this exact image was already used..."
 */
