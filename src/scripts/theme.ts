/**
 * Theme controller — system-follow by default, persistent manual choice.
 * The no-flash inline script in BaseLayout sets the initial attribute.
 */
export const THEME_KEY = 'tbfc-theme';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage unavailable — session-only */
  }
}

export function initTheme() {
  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  // Keep following the device only while the user has no stored preference.
  try {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (event) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  } catch {
    /* matchMedia unavailable */
  }
}
