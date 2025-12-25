import { NextRequest, NextResponse } from 'next/server';

// CORS 헤더 설정
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택사항)
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.REVALIDATE_TOKEN || process.env.SYNC_TOKEN;
    
    if (expectedToken) {
      const token = authHeader?.replace('Bearer ', '') || urlToken;
      if (token !== expectedToken) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return setCorsHeaders(response);
      }
    }

    // GitHub Actions를 트리거하기 위한 repository_dispatch 호출
    const ghToken = process.env.GH_TOKEN;
    if (!ghToken) {
      const response = NextResponse.json(
        { error: 'GH_TOKEN not configured' },
        { status: 500 }
      );
      return setCorsHeaders(response);
    }

    // 리포지토리 정보 (환경변수로 설정 가능, 기본값: MANN1309/notion-blog)
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'MANN1309';
    const repoName = process.env.GITHUB_REPO_NAME || 'notion-blog';
    const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`;

    console.log('[revalidate] Triggering GitHub Actions workflow...');
    
    const dispatchResponse = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'notion-sync',
      }),
    });

    if (!dispatchResponse.ok) {
      const errorData = await dispatchResponse.json().catch(() => ({ message: dispatchResponse.statusText }));
      console.error('[revalidate] GitHub dispatch failed:', errorData);
      const response = NextResponse.json(
        { 
          error: 'Failed to trigger GitHub Actions',
          details: errorData,
          status: dispatchResponse.status
        },
        { status: dispatchResponse.status }
      );
      return setCorsHeaders(response);
    }

    const dispatchData = await dispatchResponse.json().catch(() => ({}));
    
    const response = NextResponse.json({ 
      revalidated: true, 
      message: 'GitHub Actions workflow triggered successfully. Posts will be synced and deployed in 1-2 minutes.',
      dispatch: dispatchData,
      timestamp: new Date().toISOString()
    });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('[revalidate] Error:', error);
    const response = NextResponse.json(
      { error: 'Error triggering workflow', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}

export async function GET(request: NextRequest) {
  const response = await POST(request);
  return setCorsHeaders(response);
}

