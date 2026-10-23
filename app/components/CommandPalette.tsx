'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

const ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['The idea', '#about'],
  ['3D experience', '#core'],
  ['Features', '#features'],
  ['Interactive lab', '#lab'],
  ['How it works', '#experience'],
  ['Download', '#download'],
  ['FAQ', '#faq'],
];

/** Quick navigation palette. Ctrl/⌘ + K toggles it, Escape closes it. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Lock the page behind the dialog and restore focus on close. */
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [open]);

  const matches = ITEMS.filter(([name]) => name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <button
        ref={triggerRef}
        className="command-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open quick navigation"
      >
        <Search size={16} />
        <span>QUICK NAV</span>
        <kbd>⌘ K</kbd>
      </button>

      {open && (
        <div className="cmd-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            className="cmd-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cmd-input">
              <Search size={21} />
              <input
                ref={inputRef}
                autoFocus
                placeholder="Where would you like to go?"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                aria-label="Search sections"
              />
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="cmd-results">
              {matches.map(([name, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => {
                    setOpen(false);
                    setQ('');
                  }}
                >
                  <span>↗</span>
                  {name}
                  <ArrowRight size={16} />
                </a>
              ))}
              {matches.length === 0 && <p>No matching section.</p>}
            </div>
            <div className="cmd-foot">
              ORYQEN / EXPLORE WITHOUT LIMITS <span>ESC TO CLOSE</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
