# Vercel 배포 단계별 가이드

## 📋 준비사항

- ✅ GitHub 저장소: `MANN1309/notion-blog` (이미 완료)
- ✅ 코드 푸시 완료 (이미 완료)

## 🚀 배포 시작

### 1단계: Vercel 계정 생성

1. 브라우저에서 [vercel.com](https://vercel.com) 접속
2. 우측 상단 **Sign Up** 클릭
3. **Continue with GitHub** 선택
4. GitHub 계정으로 로그인
5. Vercel이 GitHub 저장소에 접근 권한 요청 → **Authorize** 클릭

### 2단계: 프로젝트 가져오기

1. Vercel 대시보드에서 **Add New Project** 버튼 클릭
2. GitHub 저장소 목록에서 **MANN1309/notion-blog** 찾기
3. **Import** 버튼 클릭

### 3단계: 프로젝트 설정

**Configure Project** 화면에서:

#### 기본 설정 (자동으로 설정됨)
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

#### 환경 변수 설정

**Environment Variables** 섹션에서 **Add** 버튼 클릭하여 다음 변수 추가:

> **참고**: Notion을 사용하는 경우 `USE_GIT_POSTS` 환경 변수는 설정하지 않아도 됩니다. (기본값이 Notion 모드입니다)
> 
> <!-- Git 기반 포스트를 사용하려면 다음 변수를 추가하세요:
> ```
> Name: USE_GIT_POSTS
> Value: true
> Environment: Production, Preview, Development (모두 선택)
> ```
> -->

**변수 1-4: Giscus 댓글 시스템** (나중에 추가 가능)
```
Name: NEXT_PUBLIC_GISCUS_REPO
Value: MANN1309/notion-blog
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_GISCUS_REPO_ID
Value: (Giscus 설정 후 추가)
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_GISCUS_CATEGORY
Value: General
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_GISCUS_CATEGORY_ID
Value: (Giscus 설정 후 추가)
Environment: Production, Preview, Development
```

**참고**: 
- Notion을 사용하는 경우 `NOTION_API_KEY`와 `NOTION_DATABASE_ID` 환경 변수를 추가하세요
- `USE_GIT_POSTS`는 Git 기반 마크다운 파일을 사용할 때만 필요합니다 (Notion 사용 시 불필요)
- Giscus 설정은 배포 후에 추가해도 됩니다

### 4단계: 배포 시작

1. 모든 설정 확인
2. 하단의 **Deploy** 버튼 클릭
3. 빌드 진행 상황 확인 (1-2분 소요)

### 5단계: 배포 완료 확인

1. 빌드가 완료되면 **Visit** 버튼 클릭
2. 배포된 사이트 확인
3. URL 형식: `notion-blog-xxx.vercel.app`

## 🔄 자동 배포 설정

**이미 자동으로 설정되어 있습니다!**

- GitHub에 `git push`하면 자동으로 재배포됩니다
- Pull Request 생성 시 프리뷰 배포가 생성됩니다

### 테스트해보기

```bash
# 로컬에서 파일 수정
echo "# 테스트" >> README.md

# 커밋 및 푸시
git add README.md
git commit -m "Test auto deployment"
git push
```

Vercel 대시보드에서 자동으로 새 배포가 시작되는 것을 확인할 수 있습니다.

## ⚙️ 환경 변수 추가/수정

### 배포 후 환경 변수 추가

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Environment Variables** 클릭
4. **Add New** 버튼 클릭
5. 변수 이름과 값 입력
6. **Save** 클릭
7. **Deployments** 탭으로 이동
8. 최신 배포 → **⋮** 메뉴 → **Redeploy** 클릭

## 🌐 커스텀 도메인 설정 (선택사항)

### 도메인 추가

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 입력 (예: `myblog.com`)
3. **Add** 클릭
4. DNS 설정 안내에 따라 도메인 제공업체에서 설정

### DNS 설정 예시

도메인 제공업체(예: 가비아, 후이즈)에서:

**CNAME 레코드 추가:**
```
Type: CNAME
Name: @ (또는 www)
Value: cname.vercel-dns.com
```

또는

**A 레코드 추가:**
```
Type: A
Name: @
Value: 76.76.21.21
```

## 📊 배포 상태 확인

### 대시보드에서 확인

1. **Deployments** 탭: 모든 배포 이력 확인
2. **Analytics** 탭: 방문자 통계 (Pro 플랜)
3. **Settings** 탭: 프로젝트 설정

### 배포 로그 확인

1. **Deployments** 탭에서 배포 클릭
2. **Build Logs** 탭에서 빌드 과정 확인
3. 에러 발생 시 로그에서 원인 확인

## 🔧 문제 해결

### 빌드 실패 시

1. **Deployments** 탭 → 실패한 배포 클릭
2. **Build Logs** 확인
3. 일반적인 원인:
   - 환경 변수 누락
   - 의존성 문제 (`package.json` 확인)
   - 빌드 명령어 오류

### 환경 변수 적용 안 됨

- 환경 변수 추가 후 **반드시 Redeploy** 필요
- `NEXT_PUBLIC_` 접두사 확인 (클라이언트에서 사용하는 변수)

### 사이트가 표시되지 않을 때

- 빌드가 완료되었는지 확인
- 올바른 URL로 접속했는지 확인
- 브라우저 캐시 삭제 후 재시도

## 📝 다음 단계

배포 완료 후:

1. ✅ **Giscus 댓글 시스템 설정**
   - `GISCUS_SETUP.md` 참고
   - GitHub Discussions 활성화
   - Giscus 설정 후 환경 변수 추가

2. ✅ **포스트 작성**
   - `content/posts/` 디렉토리에 마크다운 파일 추가
   - Git 커밋 및 푸시
   - 자동 배포 확인

3. ✅ **커스터마이징**
   - 스타일 수정 (`app/globals.css`)
   - 레이아웃 수정
   - 컴포넌트 수정

## 💡 유용한 팁

### 프리뷰 배포

- Pull Request 생성 시 자동으로 프리뷰 URL 생성
- 프로덕션 배포 전에 테스트 가능

### 롤백

- 이전 배포로 롤백 가능
- **Deployments** → 배포 선택 → **⋮** → **Promote to Production**

### 알림 설정

- **Settings** → **Notifications**
- 배포 성공/실패 시 이메일 알림 받기

## 🎉 완료!

이제 블로그가 인터넷에 공개되었습니다!

- 배포된 URL: `https://notion-blog-xxx.vercel.app`
- GitHub에 푸시하면 자동 배포
- 무료 플랜으로 충분히 운영 가능

