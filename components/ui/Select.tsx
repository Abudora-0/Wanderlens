"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const openMenu = () => {
    const current = options.findIndex((option) => option.value === value);
    setActiveIndex(current === -1 ? 0 : current);
    setOpen(true);
  };

  const toggleMenu = () => {
    if (open) setOpen(false);
    else openMenu();
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) commit(activeIndex);
      else openMenu();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggleMenu}
        onKeyDown={onKeyDown}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-2.5 text-left text-sm text-[var(--color-ink)] transition-colors hover:border-[var(--color-iris)]"
      >
        <span className="truncate">{selected?.label}</span>
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 text-[var(--color-iris)]"
        >
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface-raised)] p-1 shadow-[var(--shadow-lift)]"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(index)}
                    className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-[color-mix(in_oklab,var(--color-iris)_22%,transparent)] text-[var(--color-ink)]"
                        : "text-[var(--color-ink-soft)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-teal)]" />
                      )}
                      {option.label}
                    </span>
                    {option.hint && (
                      <span className="text-[11px] text-[var(--color-ink-mute)]">
                        {option.hint}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
