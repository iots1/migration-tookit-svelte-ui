type Theme = 'light' | 'dark';

function createThemeState() {
  const STORAGE_KEY = 'theme';

  function getInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  let theme = $state<Theme>('light');

  function apply(t: Theme) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  function init() {
    apply(getInitialTheme());
  }

  function toggle() {
    apply(theme === 'light' ? 'dark' : 'light');
  }

  return {
    get theme() {
      return theme;
    },
    get isDark() {
      return theme === 'dark';
    },
    init,
    toggle,
  };
}

export const themeState = createThemeState();
export type ThemeState = ReturnType<typeof createThemeState>;
