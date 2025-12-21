'use client';

import { useEffect, useState } from 'react';

export default function SyncButtonPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    postsCount?: number;
  } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 쿼리 파라미터에서 토큰 가져오기
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setResult({
          success: false,
          message: '토큰이 필요합니다.',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/sync?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          postsCount: data.postsCount,
        });
      } else {
        setResult({
          success: false,
          message: data.error || '동기화 실패',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    } finally {
      setLoading(false);
    }
  };

  // 자동 실행 옵션 (쿼리 파라미터에 auto=true가 있으면)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto') === 'true') {
      handleSync();
    }
  }, []);

  return (
    <div style={{
      margin: 0,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background, #fff)',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <button
          onClick={handleSync}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s',
            opacity: loading ? 0.7 : 1,
            width: '100%',
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? '동기화 중...' : '🔄 웹사이트 데이터 동기화'}
        </button>

        {result && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
            color: result.success ? '#065f46' : '#991b1b',
            fontSize: '14px',
          }}>
            {result.success ? '✅' : '❌'} {result.message}
            {result.success && result.postsCount !== undefined && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                {result.postsCount}개의 포스트 동기화됨
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

