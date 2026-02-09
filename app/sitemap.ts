import { MetadataRoute } from 'next'
import { getPosts } from '@/lib/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://woosm-blog.vercel.app').trim()
  const posts = await getPosts()
  const now = Date.now()

  const postUrls = posts.map((post) => {
    // Google sitemap 지침: <loc>는 반드시 한 줄, URL 올바르게 인코딩
    const encodedSlug = post.slug
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
    const url = `${baseUrl}/posts/${encodedSlug}`.trim()

    // lastmod는 현재 시점 이하로 제한 (미래 날짜 시 크롤 오류 방지)
    const postDate = new Date(post.date).getTime()
    const lastModified = new Date(Math.min(postDate, now))

    return {
      url,
      lastModified,
    }
  })

  return [
    {
      url: baseUrl,
      lastModified: new Date(now),
    },
    ...postUrls,
  ]
}

