/**
 * Menu controller — desktop Services dropdown + mobile drawer.
 * Vanilla JS, no framework. Honors reduced motion through CSS only.
 */

function initDropdowns() {
  const dropdowns = document.querySelectorAll<HTMLElement>('[data-dropdown]');

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector<HTMLElement>('[data-dropdown-toggle]');
    const menu = dropdown.querySelector<HTMLElement>('[data-dropdown-menu]');
    if (!toggle || !menu) return;

    const links = () => Array.from(menu.querySelectorAll<HTMLElement>('a'));
    const isOpen = () => dropdown.hasAttribute('data-open');
    const setOpen = (open: boolean) => {
      dropdown.toggleAttribute('data-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));

    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
        links()[0]?.focus();
      }
    });

    dropdown.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = links();
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (index === -1) return;
        event.preventDefault();
        const next =
          event.key === 'ArrowDown'
            ? (index + 1) % items.length
            : (index - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    });

    // Hover-open only on pointer devices that support hover.
    const hover = window.matchMedia('(hover: hover)');
    dropdown.addEventListener('mouseenter', () => {
      if (hover.matches) setOpen(true);
    });
    dropdown.addEventListener('mouseleave', () => {
      if (hover.matches && !dropdown.contains(document.activeElement)) setOpen(false);
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target as Node)) setOpen(false);
    });
    document.addEventListener('focusin', (event) => {
      if (!dropdown.contains(event.target as Node)) setOpen(false);
    });
  });
}

function initDrawer() {
  const drawer = document.querySelector<HTMLElement>('[data-drawer]');
  if (!drawer) return;

  const panel = drawer.querySelector<HTMLElement>('[data-drawer-panel]');
  const toggles = document.querySelectorAll<HTMLElement>('[data-drawer-toggle]');
  const closers = drawer.querySelectorAll<HTMLElement>('[data-drawer-close]');
  if (!panel) return;

  let lastFocused: HTMLElement | null = null;

  const isOpen = () => !drawer.classList.contains('hidden');

  const focusable = () =>
    Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);

  const open = () => {
    lastFocused = document.activeElement as HTMLElement;
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('drawer-open');
    toggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'true'));
    panel.querySelector<HTMLElement>('[data-drawer-close]')?.focus();
  };

  const close = () => {
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('drawer-open');
    toggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
    lastFocused?.focus();
  };

  toggles.forEach((toggle) => toggle.addEventListener('click', open));
  closers.forEach((closer) => closer.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  // Focus trap while open.
  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Close after choosing a link.
  drawer.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', () => close());
  });
}

export function initMenu() {
  initDropdowns();
  initDrawer();
}
