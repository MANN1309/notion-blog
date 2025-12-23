import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// Notion 클라이언트 초기화
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Notion 데이터베이스 ID (환경 변수에서 가져옴)
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

// Notion 블록을 마크다운으로 변환하는 함수
export async function getMarkdownFromNotionPage(pageId: string): Promise<string> {
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  return typeof mdString === 'string' ? mdString : mdString.parent || '';
}

// 본문에서 첫 번째 이미지와 텍스트 추출
async function extractFirstImageAndText(pageId: string): Promise<{ thumbnail: string | null; excerpt: string }> {
  try {
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=10`, {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!blocksResponse.ok) {
      return { thumbnail: null, excerpt: '' };
    }

    const blocksData = await blocksResponse.json();
    let thumbnail: string | null = null;
    let excerpt = '';

    for (const block of blocksData.results || []) {
      // 첫 번째 이미지 찾기
      if (!thumbnail && block.type === 'image') {
        const imageUrl = block.image?.file?.url || 
                         block.image?.external?.url ||
                         (block.image?.file?.type === 'file' ? block.image.file.url : null);
        if (imageUrl) {
          thumbnail = imageUrl;
        }
      }

      // 첫 번째 텍스트 블록에서 excerpt 추출
      if (!excerpt && (block.type === 'paragraph' || block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3')) {
        const textContent = block[block.type]?.rich_text
          ?.map((text: any) => text.plain_text)
          .join('') || '';
        if (textContent.trim()) {
          excerpt = textContent.trim().substring(0, 150);
        }
      }

      // 이미지와 텍스트를 모두 찾으면 중단
      if (thumbnail && excerpt) break;
    }

    return { thumbnail, excerpt };
  } catch (error) {
    console.error('Error extracting image and text:', error);
    return { thumbnail: null, excerpt: '' };
  }
}

// 데이터베이스에서 모든 포스트 가져오기 (동기화용)
export async function fetchPostsFromNotion() {
  try {
    // @notionhq/client 5.6.0에는 databases.query가 없으므로 직접 HTTP 요청 사용
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: '공개',
          checkbox: {
            equals: true,
          },
        },
        sorts: [
          {
            property: '날짜',
            direction: 'descending',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 성능 최적화: 이미지와 excerpt는 속성에서 먼저 가져오고, 없으면 블록에서 추출
    // 속성에 Excerpt가 있으면 블록 API 호출을 건너뛰어 성능 향상
    const postsWithContent = await Promise.all(
      data.results.map(async (page: any) => {
        const properties = page.properties;
        // 페이지 제목 가져오기 (Title 속성 또는 페이지 제목)
        const title = properties.Title?.title?.[0]?.plain_text || 
                      properties.title?.title?.[0]?.plain_text ||
                      (page.properties && Object.values(page.properties).find((p: any) => p.type === 'title') as any)?.title?.[0]?.plain_text ||
                      '제목 없음';
        
        // 속성에서 excerpt 가져오기 (있으면 블록 API 호출 생략)
        const excerptFromProperty = properties.Excerpt?.rich_text?.[0]?.plain_text || null;
        
        // Thumbnail 속성이 있는지 확인
        const thumbnailFromProperty = properties.Thumbnail?.url || 
                                      properties.thumbnail?.url || 
                                      properties.Thumbnail?.files?.[0]?.file?.url ||
                                      properties.thumbnail?.files?.[0]?.file?.url ||
                                      null;
        
        let thumbnail = thumbnailFromProperty;
        let excerpt = excerptFromProperty;
        
        // 속성에 excerpt나 thumbnail이 없을 때만 블록에서 추출 (성능 최적화)
        if (!excerpt || !thumbnail) {
          const { thumbnail: extractedThumbnail, excerpt: extractedExcerpt } = await extractFirstImageAndText(page.id);
          if (!thumbnail) thumbnail = extractedThumbnail;
          if (!excerpt) excerpt = extractedExcerpt;
        }
        
        return {
          id: page.id,
          title: title,
          slug: properties.Slug?.rich_text?.[0]?.plain_text || page.id,
          date: properties.날짜?.date?.start || properties.날짜?.date || page.created_time,
          category: properties.카테고리?.select?.name || properties.카테고리?.multi_select?.[0]?.name || null,
          tags: properties.태그?.multi_select?.map((tag: any) => tag.name) || [],
          thumbnail: thumbnail,
          excerpt: excerpt || null,
        };
      })
    );

    return postsWithContent;
  } catch (error) {
    console.error('Error fetching posts from Notion:', error);
    return [];
  }
}

// 메모리 캐시 (서버 재시작 시 초기화됨)
// 만료시간 없음 - 수동 갱신만 가능
let postsCache: any[] | null = null;
let postsDetailCache: Map<string, any> = new Map();

// 캐시 업데이트 함수 (동기화 시에만 호출)
export function updatePostsCache(posts: any[]) {
  postsCache = posts;
  console.log(`[cache] Updated posts cache: ${posts.length} posts`);
}

export function updatePostDetailCache(slug: string, post: any) {
  postsDetailCache.set(slug, post);
  console.log(`[cache] Updated post detail cache: ${slug}`);
}

// 데이터베이스에서 모든 포스트 가져오기
// 만료시간 없음 - 캐시가 있으면 반환, 없으면 빈 배열 (Notion API 호출 안 함)
export async function getPosts() {
  if (postsCache) {
    console.log('[getPosts] Using memory cache');
    return postsCache;
  }
  
  // 캐시가 없으면 빈 배열 반환 (Notion API 호출 안 함)
  // /revalidate 호출 시에만 캐시가 채워짐
  console.log('[getPosts] Cache empty, returning empty array. Please sync via /revalidate');
  return [];
}

// 특정 포스트 가져오기
export async function getPostById(pageId: string) {
  try {
    const page: any = await notion.pages.retrieve({ page_id: pageId });
    const content = await getMarkdownFromNotionPage(pageId);
    
    const properties = page.properties;
    // 페이지 제목 가져오기 (Title 속성 또는 페이지 제목)
    const title = properties.Title?.title?.[0]?.plain_text || 
                  properties.title?.title?.[0]?.plain_text ||
                  (page.properties && Object.values(page.properties).find((p: any) => p.type === 'title') as any)?.title?.[0]?.plain_text ||
                  '제목 없음';
    
    return {
      id: page.id,
      title: title,
      slug: properties.Slug?.rich_text?.[0]?.plain_text || page.id,
      date: properties.날짜?.date?.start || properties.날짜?.date || (page as any).created_time,
      category: properties.카테고리?.select?.name || properties.카테고리?.multi_select?.[0]?.name || null,
      tags: properties.태그?.multi_select?.map((tag: any) => tag.name) || [],
      content: content,
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Slug로 포스트 찾기 (캐시에서만 읽기, Notion API 호출 안 함)
export async function getPostBySlug(slug: string) {
  try {
    console.log(`[getPostBySlug] Searching for slug: ${slug}`);
    
    // 1. 상세 캐시에서 먼저 찾기
    if (postsDetailCache.has(slug)) {
      console.log(`[getPostBySlug] Found in detail cache: ${slug}`);
      return postsDetailCache.get(slug);
    }
    
    // 2. 전체 목록 캐시에서 찾기
    const allPosts = await getPosts();
    const post = allPosts.find((p: any) => p.slug === slug);
    
    if (post) {
      console.log(`[getPostBySlug] Found in posts cache: ${slug}`);
      // 상세 내용이 필요하면 getPostById 호출 (이것도 캐시에 저장됨)
      // 하지만 이미 상세 캐시에 없으므로 null 반환
      // 동기화 시에 상세 내용도 함께 저장되어야 함
      return null;
    }

    console.log(`[getPostBySlug] Not found in cache: ${slug}. Please sync via /revalidate`);
    return null;
  } catch (error) {
    console.error('[getPostBySlug] Error fetching post by slug:', error);
    return null;
  }
}
