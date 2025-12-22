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

    // /api/sync를 호출하여 Notion 데이터를 정적 파일로 동기화
    const baseUrl = request.nextUrl.origin;
    const syncUrl = `${baseUrl}/api/sync${urlToken ? `?token=${urlToken}` : ''}`;
    
    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const syncData = await syncResponse.json();

    if (!syncResponse.ok) {
      return NextResponse.json(
        { error: 'Sync failed', details: syncData },
        { status: syncResponse.status }
      );
    }
    
    return NextResponse.json({ 
      revalidated: true, 
      message: 'Notion data synced and cache revalidated',
      sync: syncData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { error: 'Error revalidating', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

