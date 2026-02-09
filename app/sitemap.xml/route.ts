import { NextResponse } from 'next/server'
import { getPosts } from '@/lib/posts'

/** Google Search Console 지침: <loc> 한 줄, lastmod만, priority/changefreq 없음 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** <loc> 내부 줄바꿈 제거 — 크롤링 오류 방지 */
function toSingleLineUrl(url: string): string {
  return url.replace(/\s+/g, '').trim()
}

export async function GET() {
  const baseUrl = toSingleLineUrl(process.env.NEXT_PUBLIC_SITE_URL || 'https://woosm-blog.vercel.app')
  const posts = await getPosts()
  const now = Date.now()

  const urlEntries: string[] = []

  // 홈 — <loc> 한 줄로 출력
  urlEntries.push(
    `<url><loc>${escapeXml(baseUrl)}</loc><lastmod>${new Date(now).toISOString()}</lastmod></url>`
  )

  // 포스트 — loc 한 줄, lastmod 현재 시점 이하
  for (const post of posts) {
    const slugNoSpaces = toSingleLineUrl(post.slug)
    const encodedSlug = slugNoSpaces
      .split('/')
      .map((seg) => encodeURIComponent(seg.trim()))
      .join('/')
    const url = toSingleLineUrl(`${baseUrl}/posts/${encodedSlug}`)
    const postTime = new Date(post.date).getTime()
    const lastmod = new Date(Math.min(postTime, now)).toISOString()
    urlEntries.push(`<url><loc>${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod></url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
