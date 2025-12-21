# Notion 블로그

Notion 데이터베이스의 글을 외부에서 볼 수 있는 블로그 시스템입니다.

## 기능

- ✅ Notion 데이터베이스에서 글 자동 연동
- ✅ 마크다운 형식으로 글 표시
- ✅ 태그 및 메타데이터 지원
- ✅ 반응형 디자인
- ✅ 다크 모드 지원

## 시작하기

### 1. Notion 설정

#### 1.1 Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations)에 접속
2. "New integration" 클릭
3. 이름을 입력하고 "Submit" 클릭
4. 생성된 Integration의 "Internal Integration Token"을 복사

#### 1.2 데이터베이스 설정

1. Notion에서 글쓰기 데이터베이스를 생성하거나 기존 데이터베이스를 사용
2. 데이터베이스에 다음 속성(Properties)이 필요합니다:
   - **Title** (제목) - Title 타입 (페이지 제목으로 자동 사용)
   - **Slug** (URL 경로) - Rich text 타입
   - **공개** (발행 여부) - Checkbox 타입
   - **날짜** (생성일) - Date 타입
   - **카테고리** (카테고리) - Select 또는 Multi-select 타입 (선택사항)
   - **태그** (태그) - Multi-select 타입 (선택사항)

3. 데이터베이스 페이지에서 우측 상단 "..." 메뉴 클릭
4. "Connections" → 생성한 Integration 선택하여 연결

#### 1.3 데이터베이스 ID 확인

데이터베이스 URL에서 ID를 확인할 수 있습니다:
```
https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
```
여기서 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 부분이 데이터베이스 ID입니다.

### 2. 프로젝트 설정

#### 2.1 환경 변수 설정

`.env.local.example` 파일을 `.env.local`로 복사하고 값을 입력하세요:

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 다음 정보를 입력:
- `NOTION_API_KEY`: Notion Integration Token
- `NOTION_DATABASE_ID`: Notion 데이터베이스 ID

#### 2.2 의존성 설치

```bash
npm install
```

#### 2.3 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 프로젝트를 연결
2. 환경 변수 설정:
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
3. 배포 완료!

### 다른 플랫폼

Next.js를 지원하는 모든 플랫폼에서 배포 가능합니다:
- Netlify
- AWS Amplify
- Railway
- 등등

## 사용 방법

1. Notion 데이터베이스에 새 글 추가
2. 다음 속성들을 입력:
   - **Title**: 글 제목 (페이지 제목으로 사용)
   - **Slug**: URL에 사용될 고유한 경로 (예: `my-first-post`)
   - **공개**: 발행하려면 체크
   - **날짜**: 글 작성 날짜
   - **카테고리**: 글 카테고리 (선택사항)
   - **태그**: 태그 추가 (선택사항)
3. 블로그에서 자동으로 반영됩니다!

## 커스터마이징

### 스타일 변경

`app/globals.css`에서 스타일을 수정할 수 있습니다.

### 레이아웃 변경

- 메인 페이지: `app/page.tsx`
- 포스트 페이지: `app/posts/[slug]/page.tsx`

## 문제 해결

### 글이 표시되지 않을 때

1. `공개` 속성이 체크되어 있는지 확인
2. Notion Integration이 데이터베이스에 연결되어 있는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인

### API 오류가 발생할 때

1. Notion API 키가 유효한지 확인
2. 데이터베이스 ID가 올바른지 확인
3. 데이터베이스 속성 이름이 정확한지 확인

## 라이선스

MIT
