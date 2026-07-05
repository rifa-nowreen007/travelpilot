import { useRef, useState } from 'react';
import { HiOutlinePhotograph, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import { uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary';
import { compressImageFile } from '../lib/image';

// onUploaded receives the resulting secure_url string.
export default function PhotoUploader({ onUploaded, label = 'Add a photo' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState('');

  if (!isCloudinaryConfigured()) {
    return (
      <p className="text-xs text-midnight-900/40 dark:text-white/40 flex items-center gap-1">
        <HiOutlineExclamationCircle /> Photo uploads need Cloudinary configured (see frontend/.env.example)
      </p>
    );
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const compressed = await compressImageFile(file);
      const url = await uploadToCloudinary(compressed);
      setUploadedUrl(url);
      onUploaded(url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1.5 disabled:opacity-60"
      >
        {uploadedUrl ? <HiOutlineCheckCircle /> : <HiOutlinePhotograph />}
        {uploading ? 'Uploading…' : uploadedUrl ? 'Photo added — change' : label}
      </button>
      {uploadedUrl && (
        <img src={uploadedUrl} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
