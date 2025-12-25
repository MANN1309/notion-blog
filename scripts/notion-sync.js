/**
 * Notion -> Markdown sync script
 * - Reads Notion DB (공개=true)
 * - Saves posts to content/posts/{slug}.md with frontmatter + markdown body
 *
 * Required env:
 * - NOTION_API_KEY
 * - NOTION_DATABASE_ID
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const DATA_DIR = path.join(process.cwd(), 'content', 'posts');

async function fetchPosts() {
  // @notionhq/client 5.6.0에는 databases.query가 제대로 작동하지 않으므로 직접 HTTP 요청 사용
  const response = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`, {
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
            checkbox: { equals: true },
          },
        ],
      },
      sorts: [
        { property: '날짜', direction: 'descending' },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // 디버깅: 첫 번째 페이지의 구조 확인
  if (data.results && data.results.length > 0) {
    const firstPage = data.results[0];
    console.log('[fetchPosts] First page structure:');
    console.log('[fetchPosts] Page ID:', firstPage.id);
    console.log('[fetchPosts] Page properties keys:', Object.keys(firstPage.properties || {}));
    console.log('[fetchPosts] First page properties:', JSON.stringify(firstPage.properties, null, 2));
  }
  
  return data.results;
}

async function pageToMarkdown(pageId) {
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  return typeof mdString === 'string' ? mdString : mdString.parent || '';
}

async function buildPost(page) {
  const props = page.properties || {};

  // Title 속성 찾기 (다양한 형식 지원)
  // Notion 데이터베이스의 제목 속성 이름은 사용자가 설정한 이름일 수 있음
  let title = '제목 없음';
  
  // 디버깅: 모든 속성 정보 출력
  console.log(`[buildPost] Processing page ${page.id}`);
  console.log(`[buildPost] Available property names:`, Object.keys(props));
  
  // 방법 1: 먼저 일반적인 이름들 확인 (Notion 데이터베이스의 실제 속성 이름 포함)
  const commonTitleNames = ['게시물', 'Title', 'title', '제목', '이름', 'Name', 'name'];
  for (const name of commonTitleNames) {
    if (props[name]) {
      console.log(`[buildPost] Checking property "${name}":`, {
        type: props[name].type,
        hasTitle: props[name].type === 'title',
        titleValue: props[name].title?.[0]?.plain_text
      });
      
      if (props[name]?.type === 'title' && props[name]?.title?.[0]?.plain_text) {
        title = props[name].title[0].plain_text;
        console.log(`[buildPost] Found title in "${name}": ${title}`);
        break;
      }
    }
  }
  
  // 방법 2: title을 찾지 못한 경우, 모든 속성 중에서 type이 'title'인 속성 찾기
  if (title === '제목 없음') {
    console.log(`[buildPost] Title not found in common names, searching all properties...`);
    const titleProps = Object.entries(props).filter(([name, prop]) => {
      const isTitle = prop?.type === 'title';
      if (isTitle) {
        console.log(`[buildPost] Found title type property: "${name}"`, {
          type: prop.type,
          titleArray: prop.title,
          titleText: prop.title?.[0]?.plain_text
        });
      }
      return isTitle;
    });
    
    if (titleProps.length > 0) {
      const [propName, titleProp] = titleProps[0];
      if (titleProp?.title && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
        const titleText = titleProp.title[0]?.plain_text;
        if (titleText) {
          title = titleText;
          console.log(`[buildPost] Found title in property "${propName}": ${title}`);
        } else {
          console.warn(`[buildPost] Title property "${propName}" exists but has no text`);
        }
      }
    }
  }
  
  // 방법 3: 여전히 찾지 못한 경우 디버깅 정보 출력
  if (title === '제목 없음') {
    const propInfo = Object.entries(props).map(([name, prop]) => ({
      name,
      type: prop?.type,
      hasTitle: prop?.type === 'title' ? (prop.title?.[0]?.plain_text || 'empty') : 'not title type',
      fullProp: JSON.stringify(prop, null, 2)
    }));
    console.error(`[buildPost] Title not found for page ${page.id}`);
    console.error(`[buildPost] Property info:`, JSON.stringify(propInfo, null, 2));
    
    // 방법 4: 페이지 객체 자체에 title이 있는지 확인
    if (page.title) {
      if (typeof page.title === 'string') {
        title = page.title;
        console.log(`[buildPost] Found title in page.title (string): ${title}`);
      } else if (Array.isArray(page.title) && page.title.length > 0) {
        title = page.title[0]?.plain_text || '제목 없음';
        console.log(`[buildPost] Found title in page.title (array): ${title}`);
      }
    }
  }

  // Slug 속성 찾기
  let slug = page.id; // 기본값: UUID
  if (props.Slug?.rich_text?.[0]?.plain_text) {
    slug = props.Slug.rich_text[0].plain_text;
    console.log(`[buildPost] Using Slug property: ${slug}`);
  } else if (props.slug?.rich_text?.[0]?.plain_text) {
    slug = props.slug.rich_text[0].plain_text;
    console.log(`[buildPost] Using slug property: ${slug}`);
  } else if (title && title !== '제목 없음') {
    // Slug가 없으면 제목에서 slug 생성
    // 영문/숫자만 있는 경우에만 slug 생성, 한글이 포함된 경우 UUID 사용
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title);
    
    if (!hasKorean) {
      // 영문/숫자만 있는 경우 slug 생성
      slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // 특수문자 제거
        .replace(/\s+/g, '-') // 공백을 하이픈으로
        .replace(/-+/g, '-') // 연속된 하이픈 제거
        .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
      
      // slug가 비어있거나 너무 짧거나 '-'만 있으면 UUID 사용
      if (!slug || slug.length < 2 || slug === '-') {
        console.log(`[buildPost] Generated slug is invalid (${slug}), using UUID`);
        slug = page.id;
      } else {
        console.log(`[buildPost] Generated slug from title: ${slug}`);
      }
    } else {
      // 한글이 포함된 경우 UUID 사용 (의미있는 slug 생성 불가)
      console.log(`[buildPost] Title contains Korean, using UUID as slug`);
      slug = page.id;
    }
  } else {
    console.log(`[buildPost] No title found, using UUID as slug`);
  }
  
  // 최종 slug 검증: 빈 문자열이나 '-'만 있으면 UUID 사용
  if (!slug || slug.trim() === '' || slug === '-') {
    console.warn(`[buildPost] Invalid slug detected (${slug}), forcing UUID`);
    slug = page.id;
  }

  // 날짜 처리
  let date = page.created_time;
  if (props.날짜?.date?.start) {
    date = props.날짜.date.start;
  } else if (props.날짜?.date) {
    date = props.날짜.date;
  } else if (props.date?.date?.start) {
    date = props.date.date.start;
  }

  // 카테고리 처리
  const category =
    props.카테고리?.select?.name ||
    props.카테고리?.multi_select?.[0]?.name ||
    props.category?.select?.name ||
    props.category?.multi_select?.[0]?.name ||
    null;

  // 태그 처리
  const tags =
    props.태그?.multi_select?.map((t) => t.name) ||
    props.tags?.multi_select?.map((t) => t.name) ||
    [];

  // 썸네일 처리
  const thumbnail =
    props.Thumbnail?.url ||
    props.thumbnail?.url ||
    props.Thumbnail?.files?.[0]?.file?.url ||
    props.thumbnail?.files?.[0]?.file?.url ||
    null;

  // Excerpt 처리
  const excerpt =
    props.Excerpt?.rich_text?.[0]?.plain_text ||
    props.excerpt?.rich_text?.[0]?.plain_text ||
    null;

  const content = await pageToMarkdown(page.id);

  console.log(`[buildPost] ${title} (slug: ${slug})`);

  return {
    id: page.id,
    title,
    slug,
    date,
    category,
    tags,
    thumbnail,
    excerpt,
    content,
  };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function savePost(post) {
  // YAML frontmatter 생성 (null 값은 따옴표 없이 null로)
  const frontmatterLines = [
    '---',
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `slug: "${post.slug}"`,
    `date: "${post.date}"`,
    post.category ? `category: "${post.category}"` : 'category: null',
    `tags: [${(post.tags || []).map((t) => `"${t}"`).join(', ')}]`,
    post.thumbnail ? `thumbnail: "${post.thumbnail}"` : 'thumbnail: null',
    post.excerpt ? `excerpt: "${post.excerpt.replace(/"/g, '\\"')}"` : 'excerpt: null',
    `published: true`,
    '---',
    '',
  ];

  const frontmatter = frontmatterLines.join('\n');
  const filePath = path.join(DATA_DIR, `${post.slug}.md`);
  fs.writeFileSync(filePath, `${frontmatter}${post.content}`, 'utf8');
  console.log(`[save] ${filePath}`);
}

async function main() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.error('NOTION_API_KEY and NOTION_DATABASE_ID are required.');
    process.exit(1);
  }

  ensureDir();

  console.log('Fetching posts from Notion...');
  const pages = await fetchPosts();
  console.log(`Found ${pages.length} pages.`);

  for (const page of pages) {
    const post = await buildPost(page);
    savePost(post);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


