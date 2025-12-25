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

  // 날짜 처리 (slug 생성에 필요하므로 먼저 처리)
  let date = page.created_time;
  if (props.날짜?.date?.start) {
    date = props.날짜.date.start;
  } else if (props.날짜?.date) {
    date = props.날짜.date;
  } else if (props.date?.date?.start) {
    date = props.date.date.start;
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
    // 날짜에서 YYYY-MM-DD 형식 추출
    let dateStr = '';
    if (date) {
      try {
        const d = new Date(date);
        dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      } catch (e) {
        // 날짜 파싱 실패 시 빈 문자열
      }
    }
    
    // 제목에서 slug 생성 (영문, 숫자, 하이픈만 사용 - Google sitemap 지침 준수)
    // 한글은 제거하고 영문/숫자만 추출하여 sitemap 호환성 보장
    let titleSlug = title
      .trim()
      .replace(/[^\w\s-]/g, '') // 영문, 숫자, 하이픈, 공백만 유지 (한글 및 특수문자 제거)
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/-+/g, '-') // 연속된 하이픈 제거
      .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
      .toLowerCase(); // 소문자로 변환
    
    // slug가 비어있거나 너무 짧거나 '-'만 있거나 끝이 '-'로 끝나면 처리
    if (!titleSlug || titleSlug.length < 2 || titleSlug === '-' || titleSlug.endsWith('-')) {
      // 제목에서 slug 생성 실패 시 날짜 + UUID 조합 사용
      if (dateStr) {
        slug = `${dateStr}-${page.id.substring(0, 8)}`;
        console.log(`[buildPost] Title slug invalid or contains only Korean, using date + UUID: ${slug}`);
      } else {
        slug = page.id;
        console.log(`[buildPost] Cannot generate slug from title, using UUID`);
      }
    } else {
      // 날짜가 있으면 날짜 + 제목 조합, 없으면 제목만 사용
      if (dateStr) {
        slug = `${dateStr}-${titleSlug.substring(0, 50)}`; // 최대 50자
      } else {
        slug = titleSlug.substring(0, 50);
      }
      console.log(`[buildPost] Generated slug from title (English only): ${slug}`);
    }
  } else {
    console.log(`[buildPost] No title found, using UUID as slug`);
  }
  
  // 최종 slug 검증: 빈 문자열, '-', 끝이 '-'로 끝나는 경우 UUID 사용
  if (!slug || slug.trim() === '' || slug === '-' || slug.endsWith('-') || slug.length < 2) {
    console.warn(`[buildPost] Invalid slug detected (${slug}), forcing UUID`);
    slug = page.id;
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
    `id: "${post.id}"`,
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
  const newFilePath = path.join(DATA_DIR, `${post.slug}.md`);
  
  // 기존 파일들 중에서 같은 ID를 가진 파일 확인 (slug 변경 시 정리)
  if (fs.existsSync(DATA_DIR)) {
    const existingFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.md'));
    
    for (const fileName of existingFiles) {
      const filePath = path.join(DATA_DIR, fileName);
      
      // 파일명이 새 slug와 같으면 건너뛰기
      if (fileName === `${post.slug}.md`) {
        continue;
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const idMatch = content.match(/^id:\s*["']([^"']+)["']/m);
        
        // 같은 ID를 가진 파일이 있으면 삭제 (slug 변경 또는 중복 방지)
        if (idMatch && idMatch[1] === post.id) {
          console.log(`[save] Found existing file with same ID ${post.id}, removing: ${fileName}`);
          fs.unlinkSync(filePath);
          console.log(`[save] Removed old file: ${fileName}`);
          break;
        }
      } catch (err) {
        // 파일 읽기 실패 시 무시하고 계속 진행
        console.warn(`[save] Error reading ${fileName}:`, err.message);
      }
    }
  }
  
  // 새 파일 저장
  fs.writeFileSync(newFilePath, `${frontmatter}${post.content}`, 'utf8');
  console.log(`[save] ${newFilePath}`);
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

  // Notion에서 가져온 포스트의 ID와 slug 수집
  const notionPostIds = new Set();
  const notionPostSlugs = new Set();
  
  for (const page of pages) {
    const post = await buildPost(page);
    notionPostIds.add(post.id);
    notionPostSlugs.add(post.slug);
    savePost(post);
  }

  // 기존 파일 중 Notion에 없는 파일 삭제 (공개 해제된 포스트 정리)
  if (fs.existsSync(DATA_DIR)) {
    const existingFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.md'));
    let deletedCount = 0;
    
    for (const fileName of existingFiles) {
      const filePath = path.join(DATA_DIR, fileName);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const idMatch = content.match(/^id:\s*["']([^"']+)["']/m);
        const slugMatch = content.match(/^slug:\s*["']([^"']+)["']/m);
        const fileSlug = slugMatch ? slugMatch[1] : fileName.replace(/\.md$/, '');
        
        // ID가 있고 Notion에 없으면 삭제 (공개 해제된 포스트)
        if (idMatch && idMatch[1]) {
          const fileId = idMatch[1];
          if (!notionPostIds.has(fileId)) {
            console.log(`[cleanup] Post ${fileId} is no longer published in Notion, removing: ${fileName}`);
            fs.unlinkSync(filePath);
            deletedCount++;
            continue;
          }
        }
        
        // ID가 없지만 slug가 Notion에 없고, 파일명이 slug와 다르면 삭제 (중복 파일 정리)
        // 단, id 필드가 없는 오래된 파일은 보존 (안전을 위해)
        if (!idMatch && !notionPostSlugs.has(fileSlug) && fileName !== `${fileSlug}.md`) {
          console.log(`[cleanup] Orphaned file (not in Notion and no id field), removing: ${fileName}`);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        console.warn(`[cleanup] Error reading ${fileName}:`, err.message);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[cleanup] Removed ${deletedCount} file(s) that are no longer published.`);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


