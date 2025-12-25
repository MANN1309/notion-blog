import { Suspense } from 'react';
import type { Metadata } from 'next';
// 정적 파일에서 포스트 읽기 (GitHub Actions가 생성한 마크다운 파일)
import { getPosts } from '@/lib/posts';
import CategorySidebar from './components/CategorySidebar';
import ProfileSidebar from './components/ProfileSidebar';
import SearchBar from './components/SearchBar';
import PostCard from './components/PostCard';

interface HomeProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

// 동적 라우팅 허용 (카테고리 필터링을 위해 필요)
export const dynamic = 'auto';

// SEO 메타데이터
export const metadata: Metadata = {
  title: '블로그',
  description: 'Notion에서 관리하는 블로그',
  openGraph: {
    title: '블로그',
    description: 'Notion에서 관리하는 블로그',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '블로그',
    description: 'Notion에서 관리하는 블로그',
  },
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const allPosts = await getPosts();
  
  // 모든 카테고리 수집 (null 제외)
  const allCategories = Array.from(
    new Set(
      allPosts
        .map((post: any) => post.category)
        .filter((category: string | null) => category !== null)
    )
  ).sort() as string[];

  // 필터링
  let filteredPosts = allPosts;
  
  if (params.category && params.category !== 'All') {
    filteredPosts = allPosts.filter((post: any) =>
      post.category === params.category
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
          {/* Left Sidebar - Categories */}
          <div className="hidden lg:block flex-shrink-0">
            <Suspense fallback={<div className="w-48">Loading...</div>}>
              <CategorySidebar allCategories={allCategories} />
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
                  {params.search || params.category
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
