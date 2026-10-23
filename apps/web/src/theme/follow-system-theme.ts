/** Applies the system's light or dark theme to the whole document and follows its changes. */
export function followSystemTheme(): void {
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    document.documentElement.classList.toggle('dark', darkScheme.matches);
    document.documentElement.classList.toggle('light', !darkScheme.matches);
  };
  apply();
  darkScheme.addEventListener('change', apply);
}
