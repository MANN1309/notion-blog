'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 기본값 제공 (초기 렌더링 시 사용)
const defaultThemeContext: ThemeContextType = {
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 초기 테마를 localStorage나 시스템 설정에서 읽기
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    
    // 시스템 설정 확인
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 초기 테마 적용
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    // classList.toggle 대신 명시적으로 add/remove 사용
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    // 함수형 업데이트로 최신 상태 사용
    setThemeState((currentTheme) => {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
      // DOM 조작도 여기서 직접 수행
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  // 항상 실제 함수 제공 (mounted와 관계없이)
  const contextValue = { theme, setTheme, toggleTheme };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

