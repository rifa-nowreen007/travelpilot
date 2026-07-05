import { useTranslation } from 'react-i18next';
import { HiOutlineTranslate } from 'react-icons/hi';

// Add a locales/<code>/common.json file and register it in src/i18n.js
// before adding it here.
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function LanguageSwitcher({ className = '', compact = false }) {
  const { i18n } = useTranslation();

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      {!compact && <HiOutlineTranslate className="text-lg text-midnight-900/50 dark:text-white/50 flex-shrink-0" />}
      <select
        value={i18n.resolvedLanguage || i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label="Change language"
        className={`bg-transparent font-medium text-midnight-900/70 dark:text-white/70 focus:outline-none cursor-pointer ${compact ? 'text-xs max-w-[4.5rem]' : 'text-sm'}`}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-midnight-900">
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
