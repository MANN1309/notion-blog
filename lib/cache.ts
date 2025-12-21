import fs from 'fs';
import path from 'path';

// 캐시 디렉토리 경로
const cacheDirectory = path.join(process.cwd(), 'data');
const postsCacheFile = path.join(cacheDirectory, 'posts.json');
const postsDetailCacheDir = path.join(cacheDirectory, 'posts');

// 디렉토리 생성 (없으면)
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 포스트 목록 캐시 읽기
export function getCachedPosts(): any[] | null {
  try {
    if (!fs.existsSync(postsCacheFile)) {
      return null;
    }
    const data = fs.readFileSync(postsCacheFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading posts cache:', error);
    return null;
  }
}

// 포스트 목록 캐시 저장
export function saveCachedPosts(posts: any[]): void {
  try {
    ensureDirectoryExists(cacheDirectory);
    fs.writeFileSync(postsCacheFile, JSON.stringify(posts, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving posts cache:', error);
    throw error;
  }
}

// 특정 포스트 캐시 읽기
export function getCachedPost(slug: string): any | null {
  try {
    const postFile = path.join(postsDetailCacheDir, `${slug}.json`);
    if (!fs.existsSync(postFile)) {
      return null;
    }
    const data = fs.readFileSync(postFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading post cache:', error);
    return null;
  }
}

// 특정 포스트 캐시 저장
export function saveCachedPost(slug: string, post: any): void {
  try {
    ensureDirectoryExists(postsDetailCacheDir);
    const postFile = path.join(postsDetailCacheDir, `${slug}.json`);
    fs.writeFileSync(postFile, JSON.stringify(post, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving post cache:', error);
    throw error;
  }
}

// 모든 포스트 상세 정보 캐시 저장
export function saveAllCachedPosts(posts: any[], postsDetail: any[]): void {
  try {
    ensureDirectoryExists(postsDetailCacheDir);
    
    // 목록 저장
    saveCachedPosts(posts);
    
    // 각 포스트 상세 정보 저장
    postsDetail.forEach((post) => {
      const slug = post.slug || post.id;
      saveCachedPost(slug, post);
    });
  } catch (error) {
    console.error('Error saving all cached posts:', error);
    throw error;
  }
}

