'use client';

import { useState } from 'react';

export default function RevalidatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRevalidate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = token ? `/api/revalidate?token=${token}` : '/api/revalidate';
      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 성공: ${data.message}`);
        // 2초 후 메인 페이지로 이동
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setResult(`❌ 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      setResult(`❌ 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-theme-article rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-theme-primary mb-6 text-center">
          캐시 재검증
        </h1>
        <p className="text-sm text-theme-muted mb-6 text-center">
          Notion 데이터를 수정한 후 이 버튼을 클릭하면 웹사이트에 반영됩니다.
        </p>
        <button
          onClick={handleRevalidate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              재검증 중...
            </span>
          ) : (
            '🔄 캐시 재검증하기'
          )}
        </button>
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.includes('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`font-medium ${
              result.includes('✅') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

