import { useRef, useState } from 'react';
import { HiOutlineCamera, HiOutlineExclamationCircle } from 'react-icons/hi';
import api from '../api/axios';
import { fileToDataUrl, uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary';
import { compressImageFile } from '../lib/image';

// onScanned receives { amount, merchant, date, category, receiptImage }
// receiptImage is the permanent Cloudinary URL (or null if Cloudinary isn't
// configured — scanning still works, it just isn't saved as a photo).
export default function ReceiptScanner({ onScanned, label = 'Scan Receipt', className = '' }) {
  const inputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setScanning(true);
    setError('');
    try {
      const compressed = await compressImageFile(file);
      const dataUrl = await fileToDataUrl(compressed);

      // Run both in parallel: OCR extraction (always available via Groq)
      // and permanent storage (only if Cloudinary is configured).
      const [scanRes, receiptImage] = await Promise.all([
        api.post('/expenses/scan-receipt', { imageBase64: dataUrl }),
        isCloudinaryConfigured() ? uploadToCloudinary(compressed).catch(() => null) : Promise.resolve(null),
      ]);

      onScanned({
        amount: scanRes.data.amount,
        merchant: scanRes.data.merchant,
        date: scanRes.data.date,
        category: scanRes.data.category,
        receiptImage,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't read that receipt — try a clearer photo or enter details manually");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="text-sm text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 disabled:opacity-60"
      >
        <HiOutlineCamera /> {scanning ? 'Reading receipt…' : label}
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <HiOutlineExclamationCircle /> {error}
        </p>
      )}
    </div>
  );
}
