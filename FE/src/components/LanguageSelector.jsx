import { useState, useEffect, useRef } from "react";
import "./LanguageSelector.css";

// Comprehensive catalog of languages supported by Google Translate
export const ALL_LANGUAGES = [
  // Popular / Major Global
  { code: "en", name: "English", native: "English", flag: "🇬🇧", category: "popular" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸", category: "popular" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", category: "popular" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷", category: "popular" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪", category: "popular" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", category: "popular" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文", flag: "🇨🇳", category: "popular" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", flag: "🇹🇼", category: "popular" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵", category: "popular" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹", category: "popular" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺", category: "popular" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳", category: "popular" },

  // Indian Languages (High relevance for society management)
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳", category: "indian" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳", category: "indian" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳", category: "indian" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇮🇳", category: "indian" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳", category: "indian" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳", category: "indian" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳", category: "indian" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳", category: "indian" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳", category: "indian" },
  { code: "as", name: "Assamese", native: "অসমীয়া", flag: "🇮🇳", category: "indian" },
  { code: "sd", name: "Sindhi", native: "سنڌي", flag: "🇮🇳", category: "indian" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", flag: "🇮🇳", category: "indian" },
  { code: "ne", name: "Nepali", native: "नेपाली", flag: "🇳🇵", category: "indian" },
  { code: "mai", name: "Maithili", native: "मैथिली", flag: "🇮🇳", category: "indian" },
  { code: "bho", name: "Bhojpuri", native: "भोजपुरी", flag: "🇮🇳", category: "indian" },
  { code: "doi", name: "Dogri", native: "डोगरी", flag: "🇮🇳", category: "indian" },
  { code: "gom", name: "Konkani", native: "कोंकणी", flag: "🇮🇳", category: "indian" },
  { code: "mni-Mtei", name: "Meiteilon (Manipuri)", native: "মৈতৈলোন্", flag: "🇮🇳", category: "indian" },

  // European Languages
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹", category: "european" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱", category: "european" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷", category: "european" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱", category: "european" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪", category: "european" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴", category: "european" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰", category: "european" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮", category: "european" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿", category: "european" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴", category: "european" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺", category: "european" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦", category: "european" },
  { code: "bg", name: "Bulgarian", native: "Български", flag: "🇧🇬", category: "european" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "🇭🇷", category: "european" },
  { code: "sr", name: "Serbian", native: "Српски", flag: "🇷🇸", category: "european" },
  { code: "sk", name: "Slovak", native: "Slovenčina", flag: "🇸🇰", category: "european" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", flag: "🇸🇮", category: "european" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", flag: "🇱🇹", category: "european" },
  { code: "lv", name: "Latvian", native: "Latviešu", flag: "🇱🇻", category: "european" },
  { code: "et", name: "Estonian", native: "Eesti", flag: "🇪🇪", category: "european" },
  { code: "ga", name: "Irish", native: "Gaeilge", flag: "🇮🇪", category: "european" },
  { code: "is", name: "Icelandic", native: "Íslenska", flag: "🇮🇸", category: "european" },
  { code: "ca", name: "Catalan", native: "Català", flag: "🇪🇸", category: "european" },
  { code: "eu", name: "Basque", native: "Euskara", flag: "🇪🇸", category: "european" },
  { code: "gl", name: "Galician", native: "Galego", flag: "🇪🇸", category: "european" },
  { code: "sq", name: "Albanian", native: "Shqip", flag: "🇦🇱", category: "european" },
  { code: "mk", name: "Macedonian", native: "Македонски", flag: "🇲🇰", category: "european" },
  { code: "bs", name: "Bosnian", native: "Bosanski", flag: "🇧🇦", category: "european" },
  { code: "mt", name: "Maltese", native: "Malti", flag: "🇲🇹", category: "european" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", flag: "🇱🇺", category: "european" },
  { code: "cy", name: "Welsh", native: "Cymraeg", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", category: "european" },

  // Asian & Middle Eastern
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷", category: "asian" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", category: "asian" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾", category: "asian" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭", category: "asian" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳", category: "asian" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷", category: "asian" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷", category: "asian" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱", category: "asian" },
  { code: "fil", name: "Filipino (Tagalog)", native: "Tagalog", flag: "🇵🇭", category: "asian" },
  { code: "my", name: "Burmese (Myanmar)", native: "မြန်မာစာ", flag: "🇲🇲", category: "asian" },
  { code: "km", name: "Khmer", native: "ភាសាខ្មែរ", flag: "🇰🇭", category: "asian" },
  { code: "lo", name: "Lao", native: "ພາສາລາວ", flag: "🇱🇦", category: "asian" },
  { code: "si", name: "Sinhala", native: "සිංහල", flag: "🇱🇰", category: "asian" },
  { code: "ka", name: "Georgian", native: "ქართული", flag: "🇬🇪", category: "asian" },
  { code: "hy", name: "Armenian", native: "Հայերեն", flag: "🇦🇲", category: "asian" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan", flag: "🇦🇿", category: "asian" },
  { code: "kk", name: "Kazakh", native: "Қазақ тілі", flag: "🇰🇿", category: "asian" },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha", flag: "🇺🇿", category: "asian" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча", flag: "🇰🇬", category: "asian" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ", flag: "🇹🇯", category: "asian" },
  { code: "tk", name: "Turkmen", native: "Türkmençe", flag: "🇹🇲", category: "asian" },
  { code: "mn", name: "Mongolian", native: "Монгол", flag: "🇲🇳", category: "asian" },
  { code: "ps", name: "Pashto", native: "پښتو", flag: "🇦🇫", category: "asian" },
  { code: "ku", name: "Kurdish (Kurmanji)", native: "Kurdî", flag: "🇮🇶", category: "asian" },
  { code: "ckb", name: "Kurdish (Sorani)", native: "کوردی", flag: "🇮🇶", category: "asian" },

  // African & Others
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪", category: "other" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹", category: "other" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬", category: "other" },
  { code: "yo", name: "Yoruba", native: "Èdè Yorùbá", flag: "🇳🇬", category: "other" },
  { code: "ig", name: "Igbo", native: "Asụsụ Igbo", flag: "🇳🇬", category: "other" },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦", category: "other" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦", category: "other" },
  { code: "xh", name: "Xhosa", native: "isiXhosa", flag: "🇿🇦", category: "other" },
  { code: "sn", name: "Shona", native: "chiShona", flag: "🇿🇼", category: "other" },
  { code: "so", name: "Somali", native: "Soomaaliga", flag: "🇸🇴", category: "other" },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda", flag: "🇷🇼", category: "other" },
  { code: "mg", name: "Malagasy", native: "Malagasy", flag: "🇲🇬", category: "other" },
  { code: "st", name: "Sesotho", native: "Sesotho", flag: "🇱🇸", category: "other" },
  { code: "ny", name: "Chichewa", native: "Chichewa", flag: "🇲🇼", category: "other" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ", flag: "🇪🇷", category: "other" },
  { code: "om", name: "Oromo", native: "Afaan Oromoo", flag: "🇪🇹", category: "other" },
  { code: "ln", name: "Lingala", native: "Lingála", flag: "🇨🇩", category: "other" },
  { code: "lg", name: "Luganda", native: "Oluganda", flag: "🇺🇬", category: "other" },
  { code: "ak", name: "Twi (Akan)", native: "Twi", flag: "🇬🇭", category: "other" },

  // Additional Global & Regional
  { code: "la", name: "Latin", native: "Latina", flag: "🏛️", category: "other" },
  { code: "eo", name: "Esperanto", native: "Esperanto", flag: "🌐", category: "other" },
  { code: "yi", name: "Yiddish", native: "ייִדיש", flag: "🇮🇱", category: "other" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi", flag: "🌺", category: "other" },
  { code: "sm", name: "Samoan", native: "Gagana Sāmoa", flag: "🇼🇸", category: "other" },
  { code: "mi", name: "Maori", native: "Te Reo Māori", flag: "🇳🇿", category: "other" },
  { code: "jw", name: "Javanese", native: "Basa Jawa", flag: "🇮🇩", category: "asian" },
  { code: "su", name: "Sundanese", native: "Basa Sunda", flag: "🇮🇩", category: "asian" },
  { code: "co", name: "Corsican", native: "Corsu", flag: "🇫🇷", category: "european" },
  { code: "fy", name: "Frisian", native: "Frysk", flag: "🇳🇱", category: "european" },
  { code: "gd", name: "Scots Gaelic", native: "Gàidhlig", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", category: "european" },
  { code: "hmn", name: "Hmong", native: "Hmoob", flag: "🌐", category: "asian" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl Ayisyen", flag: "🇭🇹", category: "other" },
  { code: "ceb", name: "Cebuano", native: "Binisaya", flag: "🇵🇭", category: "asian" },
  { code: "ilo", name: "Ilocano", native: "Ilokano", flag: "🇵🇭", category: "asian" },
  { code: "qu", name: "Quechua", native: "Runa Simi", flag: "🇵🇪", category: "other" },
  { code: "ay", name: "Aymara", native: "Aymar aru", flag: "🇧🇴", category: "other" },
  { code: "gn", name: "Guarani", native: "Avañe'ẽ", flag: "🇵🇾", category: "other" },
  { code: "tt", name: "Tatar", native: "Татар теле", flag: "🇷🇺", category: "asian" },
  { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە", flag: "🇨🇳", category: "asian" },
];

function getStoredLanguage() {
  try {
    const saved = localStorage.getItem("selected_lang_code");
    if (saved) return saved;

    // Check googtrans cookie: format is usually /auto/code or /en/code
    const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (err) {
    console.warn("Language storage read error:", err);
  }
  return "en";
}

export function LanguageSelector({ variant = "default", id = "language-selector" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentLangCode, setCurrentLangCode] = useState(getStoredLanguage);
  const [translating, setTranslating] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle language switch via Google Translate
  const applyGoogleTranslate = (langCode) => {
    try {
      setTranslating(true);
      setCurrentLangCode(langCode);
      localStorage.setItem("selected_lang_code", langCode);

      if (langCode === "en") {
        // Clear cookies for English reset
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      } else {
        // Set Google Translate cookie
        document.cookie = `googtrans=/auto/${langCode}; path=/;`;
        document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname};`;
        document.cookie = `googtrans=/auto/${langCode}; path=/; domain=.${window.location.hostname};`;
      }

      // Trigger Google Translate select element if present
      const selectElement = document.querySelector(".goog-te-combo");
      if (selectElement) {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event("change"));
        selectElement.dispatchEvent(new Event("input"));
      } else {
        // If element is not yet ready, reload window so the cookie applies natively
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }

      setTimeout(() => {
        setTranslating(false);
        setIsOpen(false);
      }, 400);
    } catch (err) {
      console.error("Google Translation switch error:", err);
      setTranslating(false);
      setIsOpen(false);
    }
  };

  const currentLang = ALL_LANGUAGES.find((l) => l.code === currentLangCode) || {
    code: "en",
    name: "English",
    native: "English",
    flag: "🇬🇧",
  };

  // Filter languages based on search query and category
  const filteredLanguages = ALL_LANGUAGES.filter((lang) => {
    if (selectedCategory !== "all" && lang.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = lang.name.toLowerCase().includes(q);
      const matchNative = lang.native.toLowerCase().includes(q);
      const matchCode = lang.code.toLowerCase().includes(q);
      return matchName || matchNative || matchCode;
    }
    return true;
  });

  const isTranslated = currentLangCode !== "en";

  return (
    <div
      className={`lang-selector notranslate ${isTranslated ? "lang-selector--active" : ""} ${variant === "compact" ? "lang-selector--compact" : ""}`}
      ref={dropdownRef}
      id={id}
      translate="no"
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="lang-selector__trigger notranslate"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Select language (Current: ${currentLang.name})`}
        id={`${id}-trigger`}
        title={`Current Language: ${currentLang.name} (${currentLang.native}). Click to translate into any language.`}
        translate="no"
      >
        <span className="lang-selector__icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lang-selector__globe-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>

        <span className="lang-selector__current notranslate" translate="no">
          <span className="lang-selector__flag">{currentLang.flag}</span>
          <span className="lang-selector__name notranslate" translate="no">{currentLang.native}</span>
          {isTranslated && <span className="lang-selector__gt-badge notranslate" title="Live Google Translation Active" translate="no">GT</span>}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`lang-selector__chevron ${isOpen ? "lang-selector__chevron--open" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="lang-selector__dropdown notranslate" id={`${id}-dropdown`} translate="no">
          {/* Header */}
          <div className="lang-selector__header notranslate" translate="no">
            <div className="lang-selector__header-top notranslate">
              <div className="lang-selector__title-row notranslate">
                <span className="lang-selector__header-icon">🌐</span>
                <div className="notranslate">
                  <h4 className="lang-selector__title notranslate" translate="no">Google Translator</h4>
                  <p className="lang-selector__subtitle notranslate" translate="no">Select any global or regional language</p>
                </div>
              </div>

              {isTranslated && (
                <button
                  type="button"
                  className="lang-selector__reset-btn notranslate"
                  onClick={() => applyGoogleTranslate("en")}
                  title="Reset website back to original English"
                  translate="no"
                >
                  ↺ Reset
                </button>
              )}
            </div>

            {/* Realtime Search Bar */}
            <div className="lang-selector__search-wrap notranslate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lang-selector__search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="lang-selector__search-input notranslate"
                placeholder="Search language (e.g. Hindi, Spanish, বাংলা)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id={`${id}-search`}
                translate="no"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="lang-selector__clear-search notranslate"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  translate="no"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Category Filter Pills */}
            <div className="lang-selector__categories notranslate" translate="no">
              <button
                type="button"
                className={`lang-selector__cat-btn notranslate ${selectedCategory === "all" ? "lang-selector__cat-btn--active" : ""}`}
                onClick={() => setSelectedCategory("all")}
                translate="no"
              >
                All ({ALL_LANGUAGES.length})
              </button>
              <button
                type="button"
                className={`lang-selector__cat-btn notranslate ${selectedCategory === "popular" ? "lang-selector__cat-btn--active" : ""}`}
                onClick={() => setSelectedCategory("popular")}
                translate="no"
              >
                ⭐ Popular
              </button>
              <button
                type="button"
                className={`lang-selector__cat-btn notranslate ${selectedCategory === "indian" ? "lang-selector__cat-btn--active" : ""}`}
                onClick={() => setSelectedCategory("indian")}
                translate="no"
              >
                🇮🇳 Indian
              </button>
              <button
                type="button"
                className={`lang-selector__cat-btn notranslate ${selectedCategory === "european" ? "lang-selector__cat-btn--active" : ""}`}
                onClick={() => setSelectedCategory("european")}
                translate="no"
              >
                🇪🇺 European
              </button>
              <button
                type="button"
                className={`lang-selector__cat-btn notranslate ${selectedCategory === "asian" ? "lang-selector__cat-btn--active" : ""}`}
                onClick={() => setSelectedCategory("asian")}
                translate="no"
              >
                🌏 Asian
              </button>
            </div>
          </div>

          {/* Languages Scrollable Grid / List */}
          <div className="lang-selector__list notranslate" id={`${id}-list`} translate="no">
            {translating && (
              <div className="lang-selector__translating-overlay notranslate" translate="no">
                <span className="lang-selector__spinner"></span>
                <span>Translating entire website...</span>
              </div>
            )}

            {filteredLanguages.length === 0 ? (
              <div className="lang-selector__empty notranslate" translate="no">
                <span>🔍 No language found matching "{searchQuery}"</span>
              </div>
            ) : (
              <div className="lang-selector__grid notranslate" translate="no">
                {filteredLanguages.map((lang) => {
                  const isSelected = currentLangCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      className={`lang-selector__item notranslate ${isSelected ? "lang-selector__item--selected" : ""}`}
                      onClick={() => applyGoogleTranslate(lang.code)}
                      id={`lang-opt-${lang.code}`}
                      translate="no"
                    >
                      <span className="lang-selector__item-flag notranslate">{lang.flag}</span>
                      <div className="lang-selector__item-info notranslate" translate="no">
                        <span className="lang-selector__item-native notranslate" translate="no">{lang.native}</span>
                        <span className="lang-selector__item-eng notranslate" translate="no">{lang.name}</span>
                      </div>
                      {isSelected && (
                        <span className="lang-selector__item-check notranslate">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Google Translate attribution */}
          <div className="lang-selector__footer notranslate" translate="no">
            <span className="lang-selector__powered notranslate" translate="no">
              Powered by <strong className="notranslate" translate="no">Google Translate</strong>
            </span>
            <span className="lang-selector__count notranslate" translate="no">
              {filteredLanguages.length} of {ALL_LANGUAGES.length} Languages
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
