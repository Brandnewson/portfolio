// CopyEmail — the contact section's primary action. Instead of a mailto: link
// (which yanks the visitor into a mail client they may not have configured),
// this copies the address to the clipboard and confirms with a small popup, so
// a recruiter on any device gets the address in one tap with no context switch.
//
// Progressive: navigator.clipboard is the path; a hidden-textarea + execCommand
// fallback covers older / insecure-context browsers. The popup is an aria-live
// region so the confirmation is announced, not just shown.
import { useRef, useState } from 'react';
import './CopyEmail.scss';

const EMAIL = 'bransontay@gmail.com';
const RESET_MS = 1800;

export default function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // Fallback for insecure contexts / older browsers.
      const ta = document.createElement('textarea');
      ta.value = EMAIL;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* nothing more we can do — leave copied=false */
        document.body.removeChild(ta);
        return;
      }
      document.body.removeChild(ta);
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }

  return (
    <span className="copy-email">
      <button
        type="button"
        className="copy-email__btn mono"
        onClick={copy}
        aria-label={`Copy email address ${EMAIL}`}
      >
        <span className="copy-email__icon" aria-hidden="true">✉</span>
        <span className="copy-email__addr">{EMAIL}</span>
        <span className="copy-email__hint" aria-hidden="true">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <span
        className={`copy-email__pop ${copied ? 'is-shown' : ''}`}
        role="status"
        aria-live="polite"
      >
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </span>
  );
}
