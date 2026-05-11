import { useStore } from '@nanostores/react';
import { $theme, toggleTheme } from '../stores/theme';

export default function ThemeToggle() {
  const theme = useStore($theme);

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={theme === 'night'}
      aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`}
      onClick={toggleTheme}
    >
      <span className={`label ${theme === 'day' ? 'is-active' : ''}`}>DAY</span>
      <span className={`label ${theme === 'night' ? 'is-active' : ''}`}>NIGHT</span>
      <span
        className="slider"
        aria-hidden="true"
        data-position={theme}
      />
    </button>
  );
}
