import { setLocale, useLocale } from "../i18n";
import type { Locale } from "../i18n";

export function LanguageSwitcher() {
  const locale = useLocale();
  const labels: Record<Locale, string> = {
    es: "Español",
    en: "English",
    pt: "Português",
  };

  return (
    <div
      aria-label={locale === "en" ? "Language" : "Idioma"}
      className="inline-flex shrink-0 rounded-sm border border-white/30 bg-black/20 p-0.5 text-xs font-bold text-white"
      role="group"
    >
      {(["es", "en", "pt"] as Locale[]).map((option) => (
        <button
          aria-label={labels[option]}
          aria-pressed={locale === option}
          className={`h-9 min-w-9 rounded-sm px-1.5 transition ${locale === option ? "bg-[#e8b45f] text-zinc-950" : "text-zinc-200 hover:bg-white/10"}`}
          key={option}
          onClick={() => setLocale(option)}
          title={labels[option]}
          type="button"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
