import { NextResponse } from 'next/server';

// Vercel Deploy Hook을 통한 재배포
export async function POST(request: Request) {
  try {
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    
    if (!deployHookUrl) {
      return NextResponse.json(
        { error: 'Deploy hook URL not configured' },
        { status: 500 }
      );
    }

    // Vercel Deploy Hook 호출
    const response = await fetch(deployHookUrl, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Deploy hook failed: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Deployment triggered successfully',
      jobId: data.jobId || null,
    });
  } catch (error) {
    console.error('Error triggering deployment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger deployment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET 요청도 허용 (Notion Button에서 사용 가능)
export async function GET() {
  return POST(new Request(''));
}

