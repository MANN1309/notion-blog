'use client';

import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 하이드레이션 에러 방지를 위해 mounted 전에는 고정 아이콘 사용
  if (!mounted) {
    // 서버와 클라이언트 초기 렌더링 시 동일한 아이콘 표시 (Moon 아이콘)
    return (
      <button
        className="p-2 rounded-lg bg-theme-tag text-theme-secondary hover:bg-theme-hover transition-colors"
        aria-label="Switch theme"
        title="Switch theme"
        suppressHydrationWarning
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>
    );
  }

  // mounted 후에는 실제 테마에 맞는 아이콘 표시
  const targetMode = theme === 'light' ? 'dark' : 'light';
  const ariaLabel = `Switch to ${targetMode} mode`;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-theme-tag text-theme-secondary hover:bg-theme-hover transition-colors"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {theme === 'light' ? (
        // Sun icon for light mode
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

