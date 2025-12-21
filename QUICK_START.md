# 빠른 시작 가이드

## Git 블로그로 전환하기

### 옵션 1: 하이브리드 모드 (권장)

Notion과 Git 모두 지원합니다. 환경 변수로 선택할 수 있습니다.

#### 1. `.env.local` 파일에 추가

```bash
# Git 기반 포스트 사용 (true로 설정하면 Git, false 또는 없으면 Notion)
USE_GIT_POSTS=true
```

#### 2. 포스트 작성

`content/posts/` 디렉토리에 마크다운 파일을 생성하세요:

```markdown
---
title: "게시글 제목"
slug: "my-post"
date: "2025-01-15"
category: "개발"
tags: ["Next.js", "React"]
published: true
excerpt: "미리보기 텍스트"
---

# 본문 내용
```

#### 3. 테스트

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속하여 확인하세요.

### 옵션 2: 완전 전환

Notion을 완전히 제거하고 Git만 사용하려면:

1. `app/page.tsx`에서 import 변경:
```typescript
import { getPosts } from '@/lib/posts';
```

2. `app/posts/[slug]/page.tsx`에서 import 변경:
```typescript
import { getPostBySlug } from '@/lib/posts';
```

## GitHub 배포

자세한 배포 가이드는 `GIT_DEPLOYMENT_GUIDE.md`를 참고하세요.

### 간단한 배포 절차

1. **GitHub 저장소 생성**
   - GitHub에서 새 저장소 생성 (Public)

2. **로컬에서 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

3. **Vercel 배포**
   - [Vercel](https://vercel.com) 접속
   - GitHub 저장소 연결
   - 환경 변수 설정
   - 배포 완료!

4. **Giscus 설정**
   - GitHub Discussions 활성화
   - [giscus.app](https://giscus.app)에서 설정
   - 환경 변수에 Giscus 정보 추가

## 포스트 작성 팁

- 파일명: `kebab-case.md` 형식 권장 (예: `my-first-post.md`)
- 프론트매터: YAML 형식으로 메타데이터 작성
- 이미지: `public/images/` 디렉토리에 저장 후 `/images/filename.jpg` 형식으로 참조
- 마크다운: 표준 마크다운 문법 사용 가능

