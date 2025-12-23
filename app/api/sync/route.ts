import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchPostsFromNotion, getPostById, updatePostsCache, updatePostDetailCache } from '@/lib/notion';

// 파일 시스템 쓰기 제거 - 메모리 캐시만 사용

export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택사항)
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.SYNC_TOKEN || process.env.REVALIDATE_TOKEN;
    
    if (expectedToken) {
      const token = authHeader?.replace('Bearer ', '') || urlToken;
      if (token !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[sync] Starting Notion sync...');

    // 1. Notion에서 모든 포스트 목록 가져오기
    const notionPosts = await fetchPostsFromNotion();
    console.log(`[sync] Fetched ${notionPosts.length} posts from Notion`);

    // 2. 각 포스트의 상세 내용 가져오기 (병렬 처리)
    const postsDetail = await Promise.all(
      notionPosts.map(async (post: any) => {
        try {
          const fullPost = await getPostById(post.id);
          if (fullPost) {
            // 상세 캐시에 저장
            updatePostDetailCache(fullPost.slug, fullPost);
            return fullPost;
          }
          return post;
        } catch (error) {
          console.error(`[sync] Error fetching post ${post.id}:`, error);
          return post;
        }
      })
    );

    // 3. 메모리 캐시 업데이트
    updatePostsCache(notionPosts);
    console.log(`[sync] Updated memory cache with ${notionPosts.length} posts`);

    // 4. 캐시 재검증 (Next.js ISR)
    revalidatePath('/');
    revalidatePath('/posts', 'page');

    console.log(`[sync] Sync completed: ${notionPosts.length} posts synced`);

    return NextResponse.json({
      success: true,
      message: 'Notion data synced to memory cache',
      stats: {
        total: notionPosts.length,
        synced: notionPosts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[sync] Error syncing Notion data:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Notion data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

