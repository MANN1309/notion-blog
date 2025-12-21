# Git 블로그 배포 가이드

GitHub에 블로그를 배포하고 Giscus 댓글 시스템을 활성화하는 전체 가이드입니다.

## 1단계: GitHub 저장소 생성

### 새 저장소 생성

1. GitHub에 로그인
2. 우측 상단 **+** 버튼 → **New repository** 클릭
3. 저장소 정보 입력:
   - **Repository name**: `notion-blog` (또는 원하는 이름)
   - **Description**: "Notion 기반 블로그"
   - **Public** 선택 (Giscus 사용을 위해 필수)
   - **Add a README file** 체크 해제 (이미 있음)
4. **Create repository** 클릭

### 기존 저장소 사용

이미 GitHub 저장소가 있다면 다음 단계로 진행하세요.

## 2단계: Git 초기화 및 푸시

### 로컬 저장소 초기화 (아직 안 했다면)

```bash
# Git 초기화
git init

# .gitignore 확인 (필요시 생성)
# node_modules, .next, .env.local 등은 제외되어야 함

# 첫 커밋
git add .
git commit -m "Initial commit: Notion blog with Giscus comments"

# GitHub 저장소 연결
git remote add origin https://github.com/your-username/your-repo.git

# 브랜치 이름 설정 (필요시)
git branch -M main

# 푸시
git push -u origin main
```

### 기존 저장소에 푸시

```bash
git add .
git commit -m "Add Git blog support and Giscus comments"
git push
```

## 3단계: Vercel에 배포

### Vercel 계정 생성 및 배포

1. [Vercel](https://vercel.com) 접속
2. **Sign Up** → GitHub 계정으로 로그인
3. **Add New Project** 클릭
4. GitHub 저장소 선택
5. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
6. **Environment Variables** 섹션에서 환경 변수 추가:
   ```
   NOTION_API_KEY=your-notion-api-key (Notion 사용 시)
   NOTION_DATABASE_ID=your-database-id (Notion 사용 시)
   NEXT_PUBLIC_GISCUS_REPO=your-username/your-repo
   NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
   NEXT_PUBLIC_GISCUS_CATEGORY=General
   NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
   ```
7. **Deploy** 클릭

### 자동 배포 설정

- GitHub에 푸시하면 자동으로 재배포됩니다
- Pull Request 생성 시 프리뷰 배포가 생성됩니다

## 4단계: GitHub Discussions 활성화

1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **General** → **Features** 섹션
4. **Discussions** 체크박스 활성화
5. **Set up discussions** 클릭
6. **Start discussion** 버튼 클릭

## 5단계: Giscus 설정

1. [Giscus 설정 페이지](https://giscus.app) 접속
2. 다음 정보 입력:
   - **Repository**: `username/repo-name` (예: `woo/notion-blog`)
   - **Discussion category**: "Announcements" 또는 새 카테고리 생성
3. **Enable giscus** 버튼 클릭
4. 생성된 설정 정보 복사:
   - `data-repo-id`
   - `data-category-id`

## 6단계: 환경 변수 업데이트

### Vercel 환경 변수 업데이트

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가/수정:
   ```
   NEXT_PUBLIC_GISCUS_REPO=your-username/your-repo
   NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
   NEXT_PUBLIC_GISCUS_CATEGORY=General
   NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
   ```
4. **Save** 클릭
5. **Redeploy** 클릭하여 재배포

### 로컬 환경 변수 (선택사항)

`.env.local` 파일에도 동일한 변수를 추가하면 로컬에서도 테스트 가능합니다.

## 7단계: Giscus 앱 승인

1. GitHub 저장소 → **Settings** → **Integrations** → **Installed GitHub Apps**
2. **Giscus** 앱 찾기
3. **Configure** 클릭
4. 저장소 접근 권한 확인 및 승인

## 8단계: 테스트

1. 배포된 사이트 접속 (Vercel에서 제공하는 URL)
2. 포스트 페이지 접속
3. 페이지 하단에 댓글 위젯이 표시되는지 확인
4. GitHub 계정으로 로그인하여 댓글 작성 테스트

## 문제 해결

### 댓글이 표시되지 않을 때

1. **환경 변수 확인**
   - Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
   - `NEXT_PUBLIC_` 접두사가 있는지 확인

2. **Giscus 앱 승인 확인**
   - GitHub 저장소 Settings → Integrations에서 Giscus 앱이 승인되었는지 확인

3. **Discussions 활성화 확인**
   - GitHub 저장소에 Discussions가 활성화되어 있는지 확인

4. **브라우저 콘솔 확인**
   - 개발자 도구(F12) → Console 탭에서 에러 메시지 확인

### 배포가 실패할 때

1. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 실패한 배포 클릭
   - 빌드 로그에서 에러 확인

2. **환경 변수 확인**
   - 필수 환경 변수가 모두 설정되었는지 확인

3. **의존성 확인**
   - `package.json`의 모든 패키지가 올바른지 확인

## 다음 단계

### 포스트 작성

1. `content/posts/` 디렉토리에 마크다운 파일 생성
2. Git 커밋 및 푸시
3. 자동 배포 확인

### 커스터마이징

- `app/globals.css`: 스타일 수정
- `app/components/Giscus.tsx`: 댓글 위젯 커스터마이징
- `app/components/Header.tsx`: 헤더 수정

## 유용한 링크

- [Vercel 문서](https://vercel.com/docs)
- [Giscus 문서](https://github.com/giscus/giscus)
- [Next.js 문서](https://nextjs.org/docs)

