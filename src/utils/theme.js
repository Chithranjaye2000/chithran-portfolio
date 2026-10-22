// Keep the storage key and browser-chrome colors in sync with index.html's early bootstrap.
export const THEME_STORAGE_KEY = 'portfolio-theme'

export function resolveTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

export function getInitialTheme() {
  return resolveTheme(document.documentElement.dataset.theme)
}

export function applyTheme(value) {
  const theme = resolveTheme(value)
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0b1220' : '#215be2')
}

export function saveTheme(value) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolveTheme(value))
  } catch {
    // Theme switching still works for this visit when storage is blocked or full.
  }
}
