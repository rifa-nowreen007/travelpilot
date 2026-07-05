// Uploads an image file directly from the browser to Cloudinary's free
// tier using an *unsigned* upload preset — this is the standard, secret-free
// way to do client-side uploads (no API secret is ever exposed).
// Returns the resulting secure_url string, or null if Cloudinary isn't
// configured / the upload fails.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadToCloudinary(file) {
  if (!isCloudinaryConfigured()) return null;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface Cloudinary's actual error text (e.g. "Upload preset not
    // found", "Unknown API key") instead of always guessing it's the
    // unsigned-preset setting — that's only one of several causes.
    const reason = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Photo upload failed — ${reason}`);
  }
  return data.secure_url;
}

// Reads a File as a base64 data URL, used to send receipt photos to the
// backend's Groq-vision OCR endpoint (separate from the Cloudinary upload,
// which is purely for permanent storage).
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
