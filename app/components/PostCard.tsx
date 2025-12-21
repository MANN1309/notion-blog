import Link from 'next/link';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    date: string;
    category: string | null;
    tags: string[];
    excerpt?: string;
    thumbnail?: string | null;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const hasThumbnail = post.thumbnail && post.thumbnail.trim() !== '';

  return (
    <article className="bg-theme-card border border-theme rounded-lg overflow-hidden hover:shadow-md transition-all">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className={`flex ${hasThumbnail ? 'flex-col md:flex-row' : 'flex-col'}`}>
          {/* Thumbnail - 이미지가 있을 때 표시 (모바일: 위, 데스크톱: 왼쪽) */}
          {hasThumbnail && (
            <div className="w-full md:w-48 h-48 flex-shrink-0 bg-theme-primary flex items-center justify-center overflow-hidden">
              <img 
                src={post.thumbnail!} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className={`p-6 flex-1 flex flex-col ${!hasThumbnail ? '' : ''}`}>
            <h2 className="text-xl font-semibold text-theme-primary mb-2 hover:text-theme-primary-accent transition-colors">
              {post.title}
            </h2>
            
            <time className="text-sm text-theme-muted block mb-3">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
            
            {post.excerpt && (
              <p className="text-theme-secondary mb-4 line-clamp-3 text-sm overflow-hidden">
                {post.excerpt}
                {post.excerpt.length >= 150 && '...'}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-auto">
              {post.category && (
                <span className="px-2 py-1 bg-theme-primary text-theme-primary-accent rounded text-xs font-medium">
                  {post.category}
                </span>
              )}
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-theme-tag text-theme-tag rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

