---
id: copy-email
title: Copy-email contact action
panel: UI/CONTACT
component: src/islands/CopyEmail.tsx
mechanism: clipboard-copy
substrate: contact-email
---

The closing section's primary action is a copy-to-clipboard email control rather
than a `mailto:` link. The goal is the recruiter's first want — the address in
hand — with no context switch into a mail client that may not be configured
(common on a borrowed laptop or a phone signed into a different account).

## The interaction

The button shows the address with a quiet `Copy` hint. On click it writes
`bransontay@gmail.com` to the clipboard and the hint flips to `Copied`, while a
small tooltip pops above the button confirming **Copied to clipboard**. Both
revert after ~1.8s. The tooltip is an `aria-live="polite"` status region, so the
confirmation is announced to assistive tech, not only shown.

## Why an island

Clipboard access is a runtime browser capability, so this is the one interactive
piece in an otherwise static section and lives in `src/islands/` as a `.tsx`
component, hydrated with `client:visible` (it sits at the bottom of the page, so
it only needs to wake when scrolled into view).

## Progressive enhancement

The primary path is `navigator.clipboard.writeText`. Older browsers and
insecure contexts fall back to a hidden `<textarea>` + `document.execCommand`,
so the copy still works without a secure-context Clipboard API. If even the
fallback throws, the label simply stays on `Copy` rather than falsely claiming
success.

## Styling discipline

Companion styles live in `CopyEmail.scss` (imported by the island, so global)
and are namespaced under `.copy-email`. They mirror the section's
`.btn--primary` so the control reads as the same burgundy-tinted CTA it replaced,
keeping it the prominent contact action. The confirmation tooltip uses the
`--fg` / `--bg` tokens, so it inverts correctly in both day and night without
introducing new tokens.
