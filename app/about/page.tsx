export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">About</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Notion에서 관리하는 블로그입니다.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            이 블로그는 Notion 데이터베이스를 CMS로 사용하여 구축되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

