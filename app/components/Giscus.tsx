'use client';

import { useEffect, useRef } from 'react';

interface GiscusProps {
  repo: string; // 예: "username/repo"
  repoId: string; // Giscus에서 제공하는 repo ID
  category: string; // Giscus에서 제공하는 category
  categoryId: string; // Giscus에서 제공하는 category ID
  mapping?: string; // "pathname" | "url" | "title" | "og:title"
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: 'top' | 'bottom';
  theme?: 'light' | 'dark' | 'preferred_color_scheme';
  lang?: string;
}

export default function Giscus({
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  reactionsEnabled = true,
  emitMetadata = false,
  inputPosition = 'bottom',
  theme = 'preferred_color_scheme',
  lang = 'ko',
}: GiscusProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const isThemeLoading = useRef(false);

  useEffect(() => {
    if (!commentsRef.current || isThemeLoading.current) return;

    // 기존 스크립트 제거
    const existingScript = document.getElementById('giscus-script');
    if (existingScript) {
      existingScript.remove();
    }

    // 테마 감지
    const getTheme = () => {
      if (theme === 'preferred_color_scheme') {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      }
      return theme;
    };

    // Giscus 스크립트 생성
    const script = document.createElement('script');
    script.id = 'giscus-script';
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-reactions-enabled', reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', emitMetadata ? '1' : '0');
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', getTheme());
    script.setAttribute('data-lang', lang);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    commentsRef.current.appendChild(script);
    isThemeLoading.current = true;

    // 테마 변경 감지
    const observer = new MutationObserver(() => {
      const giscusFrame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (giscusFrame) {
        giscusFrame.contentWindow?.postMessage(
          {
            giscus: {
              setConfig: {
                theme: getTheme(),
              },
            },
          },
          'https://giscus.app'
        );
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    theme,
    lang,
  ]);

  return (
    <div className="mt-16 pt-8 border-t border-theme">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-theme-primary mb-2">댓글</h2>
        <p className="text-sm text-theme-secondary">
          GitHub 계정으로 로그인하여 댓글을 남길 수 있습니다.
        </p>
      </div>
      <div ref={commentsRef} className="giscus" />
    </div>
  );
}

