import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 포스트 디렉토리 경로
const postsDirectory = path.join(process.cwd(), 'content', 'posts');

// 포스트 메타데이터 타입
export interface PostMeta {
  id: string;
  title: string;
  slug: string;
  date: string;
  category?: string | null;
  tags?: string[];
  published?: boolean;
  thumbnail?: string | null;
  excerpt?: string | null;
}

// 포스트 타입
export interface Post extends PostMeta {
  id: string;
  content: string;
}

// 모든 포스트 가져오기
export async function getPosts(): Promise<PostMeta[]> {
  try {
    // content/posts 디렉토리가 없으면 빈 배열 반환
    if (!fs.existsSync(postsDirectory)) {
      console.warn('[getPosts] Posts directory does not exist:', postsDirectory);
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory).filter((fileName) => fileName.endsWith('.md'));
    console.log(`[getPosts] Found ${fileNames.length} markdown files`);
    
    const postsWithNulls: (PostMeta | null)[] = fileNames.map((fileName) => {
      try {
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // published가 false이거나 없으면 제외
        if (data.published === false) {
          return null;
        }

        // excerpt가 없으면 본문에서 추출
        let excerpt = data.excerpt;
        if (!excerpt && content) {
          // 마크다운 태그 제거하고 첫 150자 추출
          const plainText = content
            .replace(/[#*`\[\]()]/g, '')
            .replace(/\n/g, ' ')
            .trim();
          excerpt = plainText.substring(0, 150);
        }

        const post: PostMeta = {
          id: fileName.replace(/\.md$/, ''),
          title: data.title || '제목 없음',
          slug: data.slug || fileName.replace(/\.md$/, ''),
          date: data.date || fs.statSync(fullPath).mtime.toISOString(),
          category: data.category || null,
          tags: data.tags || [],
          thumbnail: data.thumbnail || null,
          excerpt: excerpt || null,
        };

        console.log(`[getPosts] Loaded post: ${post.title} (slug: ${post.slug})`);
        return post;
      } catch (error) {
        console.error(`[getPosts] Error reading ${fileName}:`, error);
        return null;
      }
    });
    
    const allPostsData: PostMeta[] = postsWithNulls
      .filter((post): post is PostMeta => post !== null)
      .sort((a, b) => {
        // 날짜 기준 내림차순 정렬
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    console.log(`[getPosts] Returning ${allPostsData.length} posts`);
    return allPostsData;
  } catch (error) {
    console.error('[getPosts] Error reading posts:', error);
    return [];
  }
}

// Slug로 포스트 가져오기
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn('[getPostBySlug] Posts directory does not exist:', postsDirectory);
      return null;
    }

    const fileNames = fs.readdirSync(postsDirectory).filter((name) => name.endsWith('.md'));
    
    // 먼저 파일명으로 직접 매칭 시도
    let fileName = fileNames.find((name) => name.replace(/\.md$/, '') === slug);
    
    // 파일명으로 찾지 못한 경우, frontmatter의 slug로 검색
    if (!fileName) {
      for (const name of fileNames) {
        try {
          const fullPath = path.join(postsDirectory, name);
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const { data } = matter(fileContents);
          if (data.slug === slug) {
            fileName = name;
            break;
          }
        } catch (err) {
          console.warn(`[getPostBySlug] Error reading ${name}:`, err);
          continue;
        }
      }
    }

    if (!fileName) {
      console.warn(`[getPostBySlug] Post not found for slug: ${slug}`);
      return null;
    }

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // excerpt가 없으면 본문에서 추출
    let excerpt = data.excerpt;
    if (!excerpt && content) {
      const plainText = content
        .replace(/[#*`\[\]()]/g, '')
        .replace(/\n/g, ' ')
        .trim();
      excerpt = plainText.substring(0, 150);
    }

    const post = {
      id: fileName.replace(/\.md$/, ''),
      title: data.title || '제목 없음',
      slug: data.slug || fileName.replace(/\.md$/, ''),
      date: data.date || fs.statSync(fullPath).mtime.toISOString(),
      category: data.category || null,
      tags: data.tags || [],
      thumbnail: data.thumbnail || null,
      excerpt: excerpt || null,
      content: content,
    };

    console.log(`[getPostBySlug] Found post: ${post.title} (slug: ${post.slug})`);
    return post;
  } catch (error) {
    console.error('[getPostBySlug] Error reading post:', error);
    return null;
  }
}

// 포스트 ID로 가져오기 (호환성을 위해 유지)
export async function getPostById(id: string): Promise<Post | null> {
  return getPostBySlug(id);
}

