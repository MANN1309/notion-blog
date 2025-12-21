import { Suspense } from 'react';
// Notion 또는 Git 기반 포스트 사용 (환경 변수로 선택 가능)
import { getPosts as getNotionPosts } from '@/lib/notion';
import { getPosts as getGitPosts } from '@/lib/posts';

// 환경 변수로 데이터 소스 선택 (기본값: Notion)
const USE_GIT_POSTS = process.env.USE_GIT_POSTS === 'true';

async function getPosts() {
  if (USE_GIT_POSTS) {
    return getGitPosts();
  }
  return getNotionPosts();
}
import TagsSidebar from './components/TagsSidebar';
import ProfileSidebar from './components/ProfileSidebar';
import SearchBar from './components/SearchBar';
import PostCard from './components/PostCard';

interface HomeProps {
  searchParams: Promise<{ tag?: string; search?: string }>;
}

// 자동 재검증 비활성화 (수동으로만 재검증)
export const revalidate = false;

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const allPosts = await getPosts();
  
  // 모든 태그 수집
  const allTags = Array.from(
    new Set(
      allPosts.flatMap((post: any) => [
        ...((post.tags || []) as string[]),
        ...(post.category ? [post.category as string] : []),
      ])
    )
  ).sort() as string[];

  // 필터링
  let filteredPosts = allPosts;
  
  if (params.tag && params.tag !== 'All') {
    filteredPosts = allPosts.filter((post: any) =>
      post.tags.includes(params.tag) || post.category === params.tag
    );
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredPosts = filteredPosts.filter((post: any) =>
      post.title.toLowerCase().includes(searchLower) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchLower))
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Tags */}
          <div className="hidden lg:block flex-shrink-0">
            <Suspense fallback={<div className="w-48">Loading...</div>}>
              <TagsSidebar allTags={allTags} />
            </Suspense>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-theme-primary">
                  All Posts ({filteredPosts.length})
                </h1>
                <div className="text-sm text-theme-secondary">
                  Desc
                </div>
              </div>
              <Suspense fallback={<div>Loading search...</div>}>
                <SearchBar />
              </Suspense>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-theme-muted">
                  {params.search || params.tag
                    ? '검색 결과가 없습니다.'
                    : '아직 게시된 글이 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar - Profile */}
          <div className="hidden xl:block flex-shrink-0">
            <ProfileSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
