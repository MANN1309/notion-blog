import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fetchPostsFromNotion, getPostById } from '@/lib/notion';

const postsDirectory = path.join(process.cwd(), 'content', 'posts');

// 파일이 업데이트가 필요한지 확인
function shouldUpdate(filePath: string, notionPost: any): boolean {
  if (!fs.existsSync(filePath)) {
    return true; // 파일이 없으면 생성 필요
  }

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    
    // 파일의 lastModified와 Notion의 last_edited_time 비교
    const fileStats = fs.statSync(filePath);
    const fileTime = fileStats.mtime.getTime();
    
    // Notion 페이지의 last_edited_time 가져오기
    // (fetchPostsFromNotion에서 반환된 데이터에 last_edited_time이 포함되어야 함)
    // 일단 간단하게 slug, title, date를 비교
    const fileSlug = data.slug || path.basename(filePath, '.md');
    const fileTitle = data.title;
    const fileDate = data.date;
    
    // slug나 title이 다르면 업데이트
    if (fileSlug !== notionPost.slug || fileTitle !== notionPost.title) {
      return true;
    }
    
    // 날짜가 다르면 업데이트 (ISO 문자열 비교)
    if (fileDate && notionPost.date) {
      const fileDateStr = new Date(fileDate).toISOString();
      const notionDateStr = new Date(notionPost.date).toISOString();
      if (fileDateStr !== notionDateStr) {
        return true;
      }
    }
    
    // 기본적으로 파일이 오래되었으면 업데이트 (24시간 이상 지났으면)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (fileTime < oneDayAgo) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking file:', error);
    return true; // 에러 발생 시 업데이트
  }
}

// 포스트를 마크다운 파일로 저장
async function savePostToFile(post: any) {
  try {
    // 디렉토리 생성
    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }

    const frontmatter = {
      title: post.title,
      slug: post.slug,
      date: post.date,
      category: post.category || null,
      tags: post.tags || [],
      thumbnail: post.thumbnail || null,
      excerpt: post.excerpt || null,
      published: true, // Notion에서 가져온 것은 모두 공개된 것
    };

    const content = matter.stringify(post.content || '', frontmatter);
    const filePath = path.join(postsDirectory, `${post.slug}.md`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[sync] Saved post: ${post.slug}`);
    return true;
  } catch (error) {
    console.error(`[sync] Error saving post ${post.slug}:`, error);
    return false;
  }
}

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

    // 1. Notion에서 모든 포스트 가져오기
    const notionPosts = await fetchPostsFromNotion();
    console.log(`[sync] Fetched ${notionPosts.length} posts from Notion`);

    // 2. 기존 파일 목록 가져오기
    const existingFiles = fs.existsSync(postsDirectory)
      ? fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.md'))
      : [];

    const existingSlugs = new Set(
      existingFiles.map((f) => f.replace(/\.md$/, ''))
    );
    const notionSlugs = new Set(notionPosts.map((p) => p.slug));

    // 3. 변경/추가된 포스트 처리
    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const post of notionPosts) {
      const filePath = path.join(postsDirectory, `${post.slug}.md`);
      const exists = existingSlugs.has(post.slug);

      if (!exists) {
        // 새 포스트 - 전체 내용 가져와서 저장
        console.log(`[sync] Creating new post: ${post.slug}`);
        const fullPost = await getPostById(post.id);
        if (fullPost) {
          await savePostToFile(fullPost);
          created++;
        }
      } else if (shouldUpdate(filePath, post)) {
        // 업데이트 필요 - 전체 내용 가져와서 저장
        console.log(`[sync] Updating post: ${post.slug}`);
        const fullPost = await getPostById(post.id);
        if (fullPost) {
          await savePostToFile(fullPost);
          updated++;
        }
      } else {
        // 변경사항 없음
        skipped++;
      }
    }

    // 4. 삭제된 포스트 파일 삭제
    let deleted = 0;
    for (const file of existingFiles) {
      const slug = file.replace(/\.md$/, '');
      if (!notionSlugs.has(slug)) {
        const filePath = path.join(postsDirectory, file);
        fs.unlinkSync(filePath);
        console.log(`[sync] Deleted post: ${slug}`);
        deleted++;
      }
    }

    // 5. 캐시 재검증
    revalidatePath('/');
    revalidatePath('/posts', 'page');

    console.log(`[sync] Sync completed: ${created} created, ${updated} updated, ${skipped} skipped, ${deleted} deleted`);

    return NextResponse.json({
      success: true,
      message: 'Notion data synced to static files',
      stats: {
        total: notionPosts.length,
        created,
        updated,
        skipped,
        deleted,
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

