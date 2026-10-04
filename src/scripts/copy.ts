/**
 * Copy-to-clipboard controller (phone banner).
 * Degrades silently when the Clipboard API is unavailable.
 */
export function initCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy-phone]').forEach((button) => {
    if (button.dataset.initialized === 'true') return;
    button.dataset.initialized = 'true';

    const label = button.querySelector<HTMLElement>('[data-copy-label]') ?? button;
    const original = label.textContent;

    button.addEventListener('click', async () => {
      const value = button.dataset.copyPhone || '';
      try {
        await navigator.clipboard.writeText(value);
        label.textContent = button.dataset.copiedLabel || 'Copied!';
        window.setTimeout(() => {
          label.textContent = original;
        }, 2000);
      } catch {
        /* clipboard unavailable — the number is still selectable */
      }
    });
  });
}
