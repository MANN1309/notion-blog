'use client';

import { useSearchParams, useRouter } from 'next/navigation';

interface TagsSidebarProps {
  allTags: string[];
}

export default function TagsSidebar({ allTags }: TagsSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedTag = searchParams.get('tag') || 'All';

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag === 'All') {
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <aside className="w-48 sticky top-20">
      <h2 className="text-lg font-semibold text-theme-primary mb-4">Tags</h2>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => handleTagClick('All')}
            className={`w-full text-left px-3 py-2 rounded-md transition-all ${
              selectedTag === 'All'
                ? 'bg-theme-selected text-theme-primary-accent font-medium shadow-sm border border-theme'
                : 'text-theme-secondary hover:bg-theme-hover'
            }`}
          >
            All
          </button>
        </li>
        {allTags.map((tag) => (
          <li key={tag}>
            <button
              onClick={() => handleTagClick(tag)}
              className={`w-full text-left px-3 py-2 rounded-md transition-all ${
                selectedTag === tag
                  ? 'bg-theme-selected text-theme-primary-accent font-medium shadow-sm border border-theme'
                  : 'text-theme-secondary hover:bg-theme-hover'
              }`}
            >
              {tag}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

