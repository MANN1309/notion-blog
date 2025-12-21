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

// 데이터베이스에서 모든 포스트 가져오기
async function fetchPostsFromNotion() {
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

    // 각 포스트에 대해 이미지와 텍스트 추출 (병렬 처리)
    const postsWithContent = await Promise.all(
      data.results.map(async (page: any) => {
        const properties = page.properties;
        // 페이지 제목 가져오기 (Title 속성 또는 페이지 제목)
        const title = properties.Title?.title?.[0]?.plain_text || 
                      properties.title?.title?.[0]?.plain_text ||
                      (page.properties && Object.values(page.properties).find((p: any) => p.type === 'title') as any)?.title?.[0]?.plain_text ||
                      '제목 없음';
        
        // 본문에서 첫 번째 이미지와 텍스트 추출
        const { thumbnail, excerpt } = await extractFirstImageAndText(page.id);
        
        return {
          id: page.id,
          title: title,
          slug: properties.Slug?.rich_text?.[0]?.plain_text || page.id,
          date: properties.날짜?.date?.start || properties.날짜?.date || page.created_time,
          category: properties.카테고리?.select?.name || properties.카테고리?.multi_select?.[0]?.name || null,
          tags: properties.태그?.multi_select?.map((tag: any) => tag.name) || [],
          thumbnail: thumbnail,
          excerpt: excerpt || properties.Excerpt?.rich_text?.[0]?.plain_text || null,
        };
      })
    );

    return postsWithContent;
  } catch (error) {
    console.error('Error fetching posts from Notion:', error);
    return [];
  }
}

// 데이터베이스에서 모든 포스트 가져오기
export async function getPosts() {
  return await fetchPostsFromNotion();
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

// Slug로 포스트 찾기
export async function getPostBySlug(slug: string) {
  try {
    console.log(`[getPostBySlug] Searching for slug: ${slug}`);
    
    // 먼저 Slug 속성으로 검색 시도
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: '공개',
              checkbox: {
                equals: true,
              },
            },
            {
              property: 'Slug',
              rich_text: {
                equals: slug,
              },
            },
          ],
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results.length > 0) {
        console.log(`[getPostBySlug] Found by Slug property: ${slug}`);
        const page = data.results[0];
        return await getPostById(page.id);
      }
    } else {
      console.log(`[getPostBySlug] Slug property search failed: ${response.status} ${response.statusText}`);
    }

    // Slug 속성으로 찾지 못한 경우, 전체 목록에서 찾기 (fallback)
    // slug가 page.id인 경우를 처리하기 위해
    console.log(`[getPostBySlug] Trying fallback: searching in all posts`);
    const allPosts = await getPosts();
    console.log(`[getPostBySlug] Total posts: ${allPosts.length}`);
    const post = allPosts.find((p: any) => p.slug === slug);
    
    if (post) {
      console.log(`[getPostBySlug] Found in all posts: ${slug} -> ${post.id}`);
      return await getPostById(post.id);
    }

    // 여전히 찾지 못한 경우, slug가 직접 page.id인지 확인
    // Notion page ID는 32자리 hex 문자열
    if (slug.length === 32 && /^[a-f0-9-]+$/i.test(slug.replace(/-/g, ''))) {
      console.log(`[getPostBySlug] Trying as page ID: ${slug}`);
      try {
        const postById = await getPostById(slug);
        if (postById) {
          console.log(`[getPostBySlug] Found by page ID: ${slug}`);
          return postById;
        }
      } catch (error) {
        console.log(`[getPostBySlug] Page ID lookup failed: ${error}`);
      }
    }

    console.log(`[getPostBySlug] Not found: ${slug}`);
    return null;
  } catch (error) {
    console.error('[getPostBySlug] Error fetching post by slug:', error);
    return null;
  }
}
