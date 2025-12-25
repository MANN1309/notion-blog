import { MetadataRoute } from 'next'
import { getPosts } from '@/lib/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://woosm-blog.vercel.app'
  const posts = await getPosts()

  const postUrls = posts.map((post) => {
    // Google sitemap 지침 준수: URL은 올바르게 인코딩되어야 함
    // slug의 각 세그먼트를 인코딩 (하이픈은 유지)
    const encodedSlug = post.slug
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
    
    return {
      url: `${baseUrl}/posts/${encodedSlug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  })

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postUrls,
  ]
}

