'use server';

import { getPostsFromNotion, getPostById } from '@/lib/notion';
import { saveAllCachedPosts } from '@/lib/cache';

export async function syncNotionData() {
  try {
    console.log('Starting Notion sync from admin page...');

    // Notion에서 포스트 목록 가져오기 (캐시 무시)
    const posts = await getPostsFromNotion();
    console.log(`Fetched ${posts.length} posts from Notion`);

    // 각 포스트의 상세 정보 가져오기 (병렬 처리)
    const postsDetail = await Promise.all(
      posts.map(async (post: any) => {
        try {
          const detail = await getPostById(post.id);
          return detail || post;
        } catch (error) {
          console.error(`Error fetching post ${post.id}:`, error);
          return post;
        }
      })
    );

    // 캐시에 저장
    saveAllCachedPosts(posts, postsDetail);
    console.log('Cache saved successfully');

    return {
      success: true,
      message: 'Notion data synced to cache',
      postsCount: posts.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error syncing Notion data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      postsCount: 0,
    };
  }
}

