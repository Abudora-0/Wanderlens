import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about Wanderlens.",
};

const CHANNELS = [
  {
    label: "GitHub profile",
    value: "github.com/Abudora-0",
    href: "https://github.com/Abudora-0",
    hint: "The maintainer. Follow or open a discussion.",
  },
  {
    label: "Project issues",
    value: "github.com/Abudora-0/Wanderlens/issues",
    href: "https://github.com/Abudora-0/Wanderlens/issues",
    hint: "Bugs, feature ideas, and questions about the code.",
  },
  {
    label: "Report a bad recommendation",
    value: "Open an issue",
    href: "https://github.com/Abudora-0/Wanderlens/issues/new",
    hint: "The picks come from open travel guides. If one looks wrong, flag it here.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-28 pt-28">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
        Contact
      </p>
      <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] text-[var(--color-ink)]">
        Say hello
      </h1>
      <p className="mt-6 text-base leading-relaxed text-[var(--color-ink-soft)]">
        Wanderlens is a solo, open-source project. There is no form and no
        mailing list, everything runs through GitHub.
      </p>

      <div className="mt-10 space-y-3">
        {CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring group flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-teal)]"
          >
            <span>
              <span className="block font-display text-base text-[var(--color-ink)]">
                {channel.label}
              </span>
              <span className="mt-0.5 block text-sm text-[var(--color-ink-soft)]">
                {channel.value}
              </span>
              <span className="mt-1 block text-xs text-[var(--color-ink-mute)]">
                {channel.hint}
              </span>
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              aria-hidden
              className="shrink-0 text-[var(--color-ink-mute)] transition-colors group-hover:text-[var(--color-teal)]"
            >
              <path
                d="M5 11 11 5M11 5H6M11 5v5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
