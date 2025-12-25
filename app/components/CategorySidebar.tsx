'use client';

import { useSearchParams, useRouter } from 'next/navigation';

interface CategorySidebarProps {
  allCategories: string[];
}

export default function CategorySidebar({ allCategories }: CategorySidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get('category') || 'All';

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <aside className="w-48 sticky top-20">
      <h2 className="text-lg font-semibold text-theme-primary mb-4">카테고리</h2>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => handleCategoryClick('All')}
            className={`w-full text-left px-3 py-2 rounded-md transition-all ${
              selectedCategory === 'All'
                ? 'bg-theme-selected text-theme-primary-accent font-medium shadow-sm border border-theme'
                : 'text-theme-secondary hover:bg-theme-hover'
            }`}
          >
            전체
          </button>
        </li>
        {allCategories.map((category) => (
          <li key={category}>
            <button
              onClick={() => handleCategoryClick(category)}
              className={`w-full text-left px-3 py-2 rounded-md transition-all ${
                selectedCategory === category
                  ? 'bg-theme-selected text-theme-primary-accent font-medium shadow-sm border border-theme'
                  : 'text-theme-secondary hover:bg-theme-hover'
              }`}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

