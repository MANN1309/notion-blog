# Giscus 댓글 시스템 설정 가이드

## 1단계: GitHub 저장소 준비

1. GitHub에 블로그 저장소가 있어야 합니다 (없으면 생성)
2. 저장소가 Public이어야 합니다 (Private은 유료 플랜 필요)

## 2단계: GitHub Discussions 활성화

1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **General** → **Features** 섹션 찾기
4. **Discussions** 체크박스 활성화
5. **Set up discussions** 클릭
6. **Start discussion** 버튼 클릭하여 Discussions 활성화

## 3단계: Giscus 앱 설치

1. [Giscus 설정 페이지](https://giscus.app) 접속
2. 다음 정보 입력:
   - **Repository**: `username/repo-name` 형식 (예: `woo/notion-blog`)
   - **Discussion category**: "Announcements" 또는 새 카테고리 생성
3. **Enable giscus** 버튼 클릭
4. 생성된 설정 정보 복사:
   - `data-repo-id`
   - `data-category-id`

## 4단계: 환경 변수 설정

`.env.local` 파일에 다음 변수 추가:

```bash
# Giscus 설정
NEXT_PUBLIC_GISCUS_REPO=username/repo-name
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

**중요**: `NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 접근 가능합니다.

## 5단계: Giscus 앱 승인

1. GitHub 저장소 → **Settings** → **Integrations** → **Installed GitHub Apps**
2. **Giscus** 앱 찾기
3. **Configure** 클릭
4. 저장소 접근 권한 확인 및 승인

## 6단계: 테스트

1. 개발 서버 재시작: `npm run dev`
2. 포스트 페이지 접속
3. 페이지 하단에 댓글 위젯이 표시되는지 확인
4. GitHub 계정으로 로그인하여 댓글 작성 테스트

## 문제 해결

### 댓글이 표시되지 않을 때

1. **환경 변수 확인**
   - `.env.local` 파일에 모든 변수가 올바르게 설정되었는지 확인
   - 개발 서버를 재시작했는지 확인

2. **Giscus 앱 승인 확인**
   - GitHub 저장소 Settings → Integrations에서 Giscus 앱이 승인되었는지 확인

3. **Discussions 활성화 확인**
   - GitHub 저장소에 Discussions가 활성화되어 있는지 확인

4. **브라우저 콘솔 확인**
   - 개발자 도구(F12) → Console 탭에서 에러 메시지 확인

### 다크 모드가 적용되지 않을 때

- Giscus 컴포넌트의 `theme` prop이 `"preferred_color_scheme"`로 설정되어 있는지 확인
- 테마 전환 후 페이지 새로고침

## 커스터마이징

`app/components/Giscus.tsx` 파일에서 다음을 수정할 수 있습니다:

- `mapping`: 댓글 매핑 방식 (`pathname`, `url`, `title` 등)
- `inputPosition`: 댓글 입력창 위치 (`top`, `bottom`)
- `reactionsEnabled`: 반응 버튼 활성화 여부
- `lang`: 언어 설정 (`ko`, `en` 등)

## 보안 참고사항

- `NEXT_PUBLIC_` 접두사가 붙은 환경 변수는 클라이언트 번들에 포함됩니다
- 민감한 정보는 포함하지 마세요
- Repo ID와 Category ID는 공개되어도 문제없습니다

