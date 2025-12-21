# Vercel 배포 가이드

## 빠른 배포 (5분)

### 1단계: Vercel 계정 생성

1. [vercel.com](https://vercel.com) 접속
2. **Sign Up** 클릭
3. **Continue with GitHub** 선택
4. GitHub 계정으로 로그인

### 2단계: 프로젝트 배포

1. Vercel 대시보드에서 **Add New Project** 클릭
2. GitHub 저장소 목록에서 **MANN1309/notion-blog** 선택
3. **Import** 클릭

### 3단계: 프로젝트 설정

**프로젝트 설정 화면에서:**

- **Framework Preset**: Next.js (자동 감지됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)

**Environment Variables 섹션에서:**

다음 환경 변수를 추가하세요:

```
# Notion 사용 시 (선택사항)
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-database-id

# Git 기반 포스트 사용 시
USE_GIT_POSTS=true

# Giscus 댓글 시스템 (나중에 추가 가능)
NEXT_PUBLIC_GISCUS_REPO=MANN1309/notion-blog
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

**참고**: Giscus 설정은 나중에 추가해도 됩니다.

### 4단계: 배포 시작

1. **Deploy** 버튼 클릭
2. 1-2분 대기
3. 배포 완료!

### 5단계: 확인

- 배포된 URL 확인 (예: `notion-blog-xxx.vercel.app`)
- 사이트 접속하여 확인

## 자동 배포 설정

이미 설정되어 있습니다! 

- GitHub에 `git push`하면 자동으로 재배포됩니다
- Pull Request 생성 시 프리뷰 배포가 생성됩니다

## 환경 변수 추가/수정

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 변수 추가/수정
4. **Save** 클릭
5. **Deployments** → 최신 배포 → **Redeploy** 클릭

## 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 연결

## 문제 해결

### 빌드 실패 시

1. **Deployments** 탭에서 실패한 배포 클릭
2. 빌드 로그 확인
3. 일반적인 원인:
   - 환경 변수 누락
   - 의존성 문제
   - 빌드 명령어 오류

### 환경 변수 적용 안 됨

- 환경 변수 추가 후 **Redeploy** 필요
- `NEXT_PUBLIC_` 접두사 확인

## 다음 단계

배포 완료 후:

1. ✅ Giscus 댓글 시스템 설정 (`GISCUS_SETUP.md` 참고)
2. ✅ 포스트 작성 (`content/posts/` 디렉토리)
3. ✅ 커스텀 도메인 연결 (선택사항)

