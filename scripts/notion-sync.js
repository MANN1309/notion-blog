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
    throw new Error(`Notion API error: ${response.statusText}`);
  }

  const data = await response.json();
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
  // lib/notion.ts와 동일한 로직 사용
  let title = '제목 없음';
  if (props.Title?.title?.[0]?.plain_text) {
    title = props.Title.title[0].plain_text;
  } else if (props.title?.title?.[0]?.plain_text) {
    title = props.title.title[0].plain_text;
  } else {
    // title 타입 속성 찾기 (모든 속성 중에서 title 타입 찾기)
    const titleProp = Object.values(props).find((p) => p && p.type === 'title');
    if (titleProp?.title?.[0]?.plain_text) {
      title = titleProp.title[0].plain_text;
    } else {
      // 디버깅: 어떤 속성들이 있는지 확인
      console.warn(`[buildPost] Title not found for page ${page.id}. Available properties:`, Object.keys(props));
    }
  }

  // Slug 속성 찾기
  let slug = page.id;
  if (props.Slug?.rich_text?.[0]?.plain_text) {
    slug = props.Slug.rich_text[0].plain_text;
  } else if (props.slug?.rich_text?.[0]?.plain_text) {
    slug = props.slug.rich_text[0].plain_text;
  } else if (title && title !== '제목 없음') {
    // Slug가 없으면 제목에서 slug 생성 (한글 제거, 소문자, 공백을 하이픈으로)
    slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 특수문자 제거
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/-+/g, '-') // 연속된 하이픈 제거
      .trim();
    // slug가 비어있으면 UUID 사용
    if (!slug) {
      slug = page.id;
    }
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


