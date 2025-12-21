import { NextResponse } from 'next/server';
import { getPostsFromNotion, getPostById } from '@/lib/notion';
import { saveAllCachedPosts } from '@/lib/cache';

// Notion에서 데이터를 가져와서 캐시에 저장하는 API
export async function POST(request: Request) {
  try {
    // 토큰 검증 (헤더 또는 쿼리 파라미터에서)
    const url = new URL(request.url);
    const token = request.headers.get('x-api-key') || 
                  request.headers.get('x-sync-token') ||
                  url.searchParams.get('token') ||
                  url.searchParams.get('x-api-key');
    const expectedToken = process.env.SYNC_API_KEY || process.env.SYNC_TOKEN;
    
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting Notion sync...');

    // Notion에서 포스트 목록 가져오기 (캐시 무시)
    const posts = await getPostsFromNotion();
    console.log(`Fetched ${posts.length} posts from Notion`);

    // 각 포스트의 상세 정보 가져오기 (병렬 처리)
    const postsDetail = await Promise.all(
      posts.map(async (post: any) => {
        try {
          const detail = await getPostById(post.id);
          return detail || post; // 상세 정보가 없으면 목록 정보 사용
        } catch (error) {
          console.error(`Error fetching post ${post.id}:`, error);
          return post; // 에러 시 목록 정보만 사용
        }
      })
    );

    // 캐시에 저장
    saveAllCachedPosts(posts, postsDetail);
    console.log('Cache saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Notion data synced to cache',
      postsCount: posts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing Notion data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync Notion data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET 요청도 허용 (Notion Button에서 사용 가능)
export async function GET(request: Request) {
  return POST(request);
}

