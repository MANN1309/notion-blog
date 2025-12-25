import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
// 정적 파일에서 포스트 읽기 (GitHub Actions가 생성한 마크다운 파일)
import { getPostBySlug, getPosts } from '@/lib/posts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Giscus from '@/app/components/Giscus';

// 정적 생성 (빌드 타임에 생성, 수동 재검증으로 갱신)
export const dynamic = 'force-static';
export const dynamicParams = false; // 없는 slug는 404

// 빌드 타임에 모든 포스트의 slug를 미리 생성
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// SEO 메타데이터 생성
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://woosm-blog.vercel.app'

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다',
    }
  }

  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
      publishedTime: post.date,
      authors: ['작성자'],
      tags: post.tags,
      url: `${baseUrl}/posts/${post.slug}`,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.title,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
    alternates: {
      canonical: `${baseUrl}/posts/${post.slug}`,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://woosm-blog.vercel.app'

  if (!post) {
    notFound();
  }

  // 구조화된 데이터 (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.thumbnail || undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: '작성자',
    },
    publisher: {
      '@type': 'Organization',
      name: '블로그',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-theme">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <Link
          href="/"
          className="text-[var(--color-primary)] hover:underline mb-8 inline-block transition-colors"
        >
          ← 목록으로 돌아가기
        </Link>

        <article className="prose prose-lg max-w-none bg-theme-article rounded-lg p-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-theme-primary mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-theme-muted mb-4">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.category && (
                <span className="px-2 py-1 bg-theme-primary text-theme-primary-accent rounded text-xs">
                  {post.category}
                </span>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-theme-tag text-theme-tag rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="markdown-content text-theme-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* 댓글 시스템 */}
        {process.env.NEXT_PUBLIC_GISCUS_REPO && (
          <Giscus
            repo={process.env.NEXT_PUBLIC_GISCUS_REPO}
            repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID || ''}
            category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'General'}
            categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || ''}
            mapping="pathname"
            reactionsEnabled={true}
            emitMetadata={false}
            inputPosition="bottom"
            theme="preferred_color_scheme"
            lang="ko"
          />
        )}
      </main>
    </div>
    </>
  );
}
