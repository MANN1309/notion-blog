import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택사항)
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.REVALIDATE_TOKEN;
    
    if (expectedToken) {
      const token = authHeader?.replace('Bearer ', '') || urlToken;
      if (token !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 모든 경로 재검증
    revalidatePath('/');
    revalidatePath('/posts', 'page');
    
    return NextResponse.json({ 
      revalidated: true, 
      message: 'Cache revalidated successfully',
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

