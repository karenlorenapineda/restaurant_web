import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { useLocale } from "../i18n";
import { legalCopy, legalUpdated } from "../legal/legalCopy";
import type { NavigationHandlers } from "../navigation";

export function LegalPage({
  kind,
  navigate,
}: { kind: "privacy" | "terms" } & Pick<NavigationHandlers, "navigate">) {
  const locale = useLocale();
  const copy = legalCopy[locale];
  const title = copy[kind];
  const sections =
    kind === "privacy" ? copy.privacySections : copy.termsSections;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} · Picasso`;
    heading.current?.focus();
    return () => {
      document.title = "Picasso";
    };
  }, [title]);
  function link(path: string, event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    )
      navigate(path, event);
  }
  return (
    <section
      className="px-5 pb-20 pt-28 sm:px-6 sm:pt-36"
      aria-labelledby="legal-title"
    >
      <div className="mx-auto max-w-4xl">
        <a
          href="/"
          onClick={(e) => link("/", e)}
          className="text-sm font-semibold text-[#e8b45f] underline underline-offset-4"
        >
          {copy.back}
        </a>
        <header className="mt-8 border-b border-white/15 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#e8b45f]">
            Picasso
          </p>
          <h1
            id="legal-title"
            ref={heading}
            tabIndex={-1}
            className="mt-4 break-words font-display text-4xl font-bold focus:outline-none sm:text-6xl"
          >
            {title}
          </h1>
          <p className="mt-5 text-sm text-zinc-400">
            {copy.updated}:{" "}
            <time dateTime={legalUpdated}>
              {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                new Date(2026, 10, 5),
              )}
            </time>
          </p>
          <p className="mt-6 text-base leading-8 text-zinc-200">
            {kind === "privacy" ? copy.privacyIntro : copy.termsIntro}
          </p>
        </header>
        <nav
          aria-label={copy.contents}
          className="mt-8 rounded-sm border border-white/15 bg-[#333333] p-5 sm:p-6"
        >
          <p className="font-semibold text-white">{copy.contents}</p>
          <ol className="mt-4 grid list-inside list-decimal gap-3 text-sm text-[#e8b45f] sm:grid-cols-2">
            {sections.map(([name], index) => (
              <li key={index}>
                <a
                  href={`#${kind}-${index}`}
                  className="underline underline-offset-4"
                >
                  {name}
                </a>
              </li>
            ))}
            <li>
              <a href="#legal-contact" className="underline underline-offset-4">
                {copy.contact}
              </a>
            </li>
          </ol>
        </nav>
        <article className="mt-10 space-y-10">
          {sections.map(([name, text], index) => (
            <section
              id={`${kind}-${index}`}
              key={index}
              className="scroll-mt-28"
              aria-labelledby={`${kind}-${index}-title`}
            >
              <h2
                id={`${kind}-${index}-title`}
                className="font-display text-2xl font-bold text-white sm:text-3xl"
              >
                {name}
              </h2>
              <p className="mt-4 whitespace-normal break-words text-base leading-8 text-zinc-300">
                {text}
              </p>
            </section>
          ))}
          <section
            id="legal-contact"
            className="scroll-mt-28 border-t border-white/15 pt-8"
            aria-labelledby="legal-contact-title"
          >
            <h2
              id="legal-contact-title"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {copy.contact}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {copy.contactText}
            </p>
          </section>
        </article>
        <a
          href={kind === "privacy" ? "/terminos" : "/privacidad"}
          onClick={(e) =>
            link(kind === "privacy" ? "/terminos" : "/privacidad", e)
          }
          className="mt-10 inline-flex font-semibold text-[#e8b45f] underline underline-offset-4"
        >
          {kind === "privacy" ? copy.terms : copy.privacy}
        </a>
      </div>
    </section>
  );
}
