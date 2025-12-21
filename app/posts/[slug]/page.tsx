import { notFound } from 'next/navigation';
import Link from 'next/link';
// Notion 또는 Git 기반 포스트 사용 (환경 변수로 선택 가능)
import { getPostBySlug as getNotionPostBySlug } from '@/lib/notion';
import { getPostBySlug as getGitPostBySlug } from '@/lib/posts';

// 환경 변수로 데이터 소스 선택 (기본값: Notion)
const USE_GIT_POSTS = process.env.USE_GIT_POSTS === 'true';

async function getPostBySlug(slug: string) {
  if (USE_GIT_POSTS) {
    return getGitPostBySlug(slug);
  }
  return getNotionPostBySlug(slug);
}
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Giscus from '@/app/components/Giscus';

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
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
              {post.tags.length > 0 && (
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
  );
}
