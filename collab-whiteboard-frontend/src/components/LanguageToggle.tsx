export function LanguageToggle({ language, setLanguage }: { language: string; setLanguage: (lang: string) => void }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setLanguage("fr")}
        className={`px-3 py-1 rounded text-sm ${language === "fr" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded text-sm ${language === "en" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
      >
        EN
      </button>
    </div>
  );
}
