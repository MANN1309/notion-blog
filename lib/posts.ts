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
      console.warn('Posts directory does not exist:', postsDirectory);
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const postsWithNulls: (PostMeta | null)[] = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
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

        return {
          id: fileName.replace(/\.md$/, ''),
          title: data.title || '제목 없음',
          slug: data.slug || fileName.replace(/\.md$/, ''),
          date: data.date || fs.statSync(fullPath).mtime.toISOString(),
          category: data.category || null,
          tags: data.tags || [],
          thumbnail: data.thumbnail || null,
          excerpt: excerpt || null,
        } as PostMeta;
      });
    
    const allPostsData: PostMeta[] = postsWithNulls
      .filter((post): post is PostMeta => post !== null)
      .sort((a, b) => {
        // 날짜 기준 내림차순 정렬
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    return allPostsData;
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

// Slug로 포스트 가져오기
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return null;
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const fileName = fileNames.find(
      (name) =>
        name.endsWith('.md') &&
        (name.replace(/\.md$/, '') === slug ||
          matter(fs.readFileSync(path.join(postsDirectory, name), 'utf8')).data
            .slug === slug)
    );

    if (!fileName) {
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

    return {
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
  } catch (error) {
    console.error('Error reading post:', error);
    return null;
  }
}

// 포스트 ID로 가져오기 (호환성을 위해 유지)
export async function getPostById(id: string): Promise<Post | null> {
  return getPostBySlug(id);
}

