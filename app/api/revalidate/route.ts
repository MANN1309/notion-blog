import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택사항)
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.REVALIDATE_TOKEN || process.env.SYNC_TOKEN;
    
    if (expectedToken) {
      const token = authHeader?.replace('Bearer ', '') || urlToken;
      if (token !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // GitHub Actions를 트리거하기 위한 repository_dispatch 호출
    const ghToken = process.env.GH_TOKEN;
    if (!ghToken) {
      return NextResponse.json(
        { error: 'GH_TOKEN not configured' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { 
          error: 'Failed to trigger GitHub Actions',
          details: errorData,
          status: dispatchResponse.status
        },
        { status: dispatchResponse.status }
      );
    }

    const dispatchData = await dispatchResponse.json().catch(() => ({}));
    
    return NextResponse.json({ 
      revalidated: true, 
      message: 'GitHub Actions workflow triggered successfully. Posts will be synced and deployed in 1-2 minutes.',
      dispatch: dispatchData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      { error: 'Error triggering workflow', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

