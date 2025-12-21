# Notion 버튼으로 웹사이트 재배포하기

Notion에서 버튼을 클릭하면 웹사이트가 자동으로 재배포되어 최신 Notion 데이터가 반영됩니다.

## 설정 방법

### 1단계: Vercel Deploy Hook 생성

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Git** 섹션
3. **Deploy Hooks** 클릭
4. **Create Hook** 클릭
5. Hook 이름 입력 (예: "Notion Deploy")
6. **Create Hook** 클릭
7. 생성된 URL 복사 (예: `https://api.vercel.com/v1/integrations/deploy/...`)

### 2단계: 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:

```
Name: VERCEL_DEPLOY_HOOK_URL
Value: (1단계에서 복사한 URL)
Environment: Production, Preview, Development (모두 선택)
```

### 3단계: Notion에 버튼 추가

#### 방법 1: Notion Button 블록 사용 (권장)

1. Notion 페이지에서 `/button` 입력
2. Button 블록 생성
3. 버튼 텍스트 입력 (예: "웹사이트 업데이트")
4. 버튼 클릭 시:
   - **Connect to** → **Webhook** 선택
   - Webhook URL 입력:
     ```
     https://your-site.vercel.app/api/redeploy
     ```
   - 또는 로컬 테스트:
     ```
     http://localhost:3000/api/redeploy
     ```

#### 방법 2: Notion Automation 사용

1. Notion 페이지에서 **Automations** 추가
2. **Trigger**: Button clicked
3. **Action**: Webhook
4. Webhook URL: `https://your-site.vercel.app/api/redeploy`
5. 저장

### 4단계: 보안 설정 (선택사항)

Notion에서 직접 호출하는 경우 보안을 위해 API 키를 추가할 수 있습니다.

#### API 라우트 수정

`app/api/redeploy/route.ts`에 API 키 검증 추가:

```typescript
export async function POST(request: Request) {
  // API 키 검증
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.DEPLOY_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  // ... 나머지 코드
}
```

환경 변수 추가:
```
DEPLOY_API_KEY=your-secret-key-here
```

Notion Webhook에서 헤더 추가:
```
x-api-key: your-secret-key-here
```

## 사용 방법

1. Notion에서 포스트 작성/수정
2. "공개" 체크박스 체크
3. "웹사이트 업데이트" 버튼 클릭
4. Vercel에서 자동 재배포 시작
5. 1-2분 후 웹사이트에 반영

## 대안: GitHub Actions 사용

더 안전한 방법으로 GitHub Actions를 사용할 수도 있습니다:

1. GitHub Actions 워크플로우 생성
2. Notion Button → GitHub API 호출
3. GitHub Actions가 Vercel 재배포 트리거

## 문제 해결

### 버튼 클릭해도 반영 안 될 때

1. **Vercel Deploy Hook URL 확인**
   - 환경 변수가 올바르게 설정되었는지 확인
   - Vercel 대시보드에서 Deploy Hook이 활성화되어 있는지 확인

2. **API 엔드포인트 확인**
   - `https://your-site.vercel.app/api/redeploy` 접속하여 테스트
   - 에러 메시지 확인

3. **Notion Webhook 확인**
   - Notion Automation 로그 확인
   - Webhook 호출이 성공했는지 확인

### 보안 고려사항

- API 엔드포인트가 공개되어 있으므로 API 키 사용 권장
- 또는 IP 화이트리스트 설정 (Vercel Pro 플랜 필요)

## 참고

- Vercel Deploy Hook 문서: https://vercel.com/docs/deployments/deploy-hooks
- Notion Automation 문서: https://www.notion.so/help/automations

