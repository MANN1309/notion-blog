# Notion 데이터 동기화 가이드

Notion에서 버튼을 클릭하면 Notion 데이터를 가져와서 웹사이트 캐시에 저장합니다. 그 외에는 캐시된 데이터만 사용하여 빠르게 로드됩니다.

## 작동 원리

1. **Notion 버튼 클릭** → `/api/sync` 호출 → Notion에서 데이터 가져와서 파일에 저장
2. **일반 사용자 접속** → 캐시된 파일에서만 읽기 (Notion API 호출 안 함)
3. **빠른 로딩** → 파일 읽기만 하므로 매우 빠름

## 설정 방법

### 1단계: 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:

```
Name: SYNC_API_KEY
Value: your-secret-key-here (보안을 위한 API 키)
Environment: Production, Preview, Development (모두 선택)
```

### 2단계: 동기화 방법 선택

#### 방법 1: 관리자 페이지 사용 (권장, 가장 안전)

1. 브라우저에서 다음 URL 접속:
   ```
   https://your-site.vercel.app/admin/sync
   ```
2. "동기화 시작" 버튼 클릭
3. 완료!

**장점:**
- 토큰 노출 없음
- 안전함
- 간단한 UI

#### 방법 2: Notion HTML 임베드 사용 (무료 플랜 가능)

1. [Notion HTML 임베드 도구](https://www.notion-tools.com/embeds/html) 접속
2. 다음 URL을 임베드:
   ```
   https://your-site.vercel.app/sync-button?token=YOUR_TOKEN_HERE
   ```
   (YOUR_TOKEN_HERE를 실제 토큰으로 변경)
3. Notion에서 `/embed` 입력
4. 생성된 링크 붙여넣기

**또는 자동 실행:**
```
https://your-site.vercel.app/sync-button?token=YOUR_TOKEN&auto=true
```

#### 방법 3: Notion Button URL 연결 (무료 플랜 가능)

1. Notion 페이지에서 `/button` 입력
2. Button 블록 생성
3. 버튼 텍스트 입력 (예: "웹사이트 데이터 동기화")
4. 버튼 클릭 시:
   - **Connect to** → **URL** 선택 (Webhook 아님!)
   - URL 입력:
     ```
     https://your-site.vercel.app/sync-button?token=YOUR_TOKEN_HERE
     ```

### 3단계: 초기 동기화

처음 한 번은 수동으로 동기화해야 합니다:

**방법 1: 관리자 페이지 사용 (권장)**
```
https://your-site.vercel.app/admin/sync
```

**방법 2: 브라우저에서 직접 호출**
```
https://your-site.vercel.app/api/sync?token=your-secret-key-here
```

**방법 3: curl 사용**
```bash
curl -X POST https://your-site.vercel.app/api/sync \
  -H "x-api-key: your-secret-key-here"
```

## 사용 방법

1. Notion에서 포스트 작성/수정
2. "공개" 체크박스 체크
3. "웹사이트 데이터 동기화" 버튼 클릭
4. 몇 초 후 캐시에 저장 완료
5. 웹사이트에서 즉시 반영됨 (재배포 불필요)

## 장점

- ⚡ **매우 빠름**: 파일 읽기만 하므로 Notion API 호출보다 훨씬 빠름
- 🔄 **수동 제어**: 버튼 클릭 시에만 데이터 갱신
- 💰 **API 호출 최소화**: Notion API 사용량 절약
- 🛡️ **안정적**: Notion API 장애 시에도 웹사이트 정상 작동

## 주의사항

- **Vercel 제한**: Vercel은 파일 시스템이 읽기 전용이므로, 빌드 시점에 파일이 생성되어야 합니다.
- **초기 동기화 필요**: 첫 배포 후 반드시 한 번은 동기화해야 합니다.
- **데이터 디렉토리**: `data/` 디렉토리는 Git에 커밋되지 않습니다 (`.gitignore`에 포함).

## 문제 해결

### 동기화가 안 될 때

1. **API 키 확인**
   - 환경 변수가 올바르게 설정되었는지 확인
   - Notion Webhook 헤더에 API 키가 포함되어 있는지 확인

2. **API 엔드포인트 확인**
   - `https://your-site.vercel.app/api/sync` 접속하여 테스트
   - 에러 메시지 확인

3. **캐시 파일 확인**
   - `data/posts.json` 파일이 생성되었는지 확인
   - 파일 내용이 올바른지 확인

### 캐시가 없을 때

- 캐시 파일이 없으면 자동으로 Notion API를 호출합니다
- 하지만 느릴 수 있으므로 초기 동기화를 권장합니다

## 보안 고려사항

- **토큰은 반드시 설정하세요** (Vercel 환경 변수에 `SYNC_API_KEY` 또는 `SYNC_TOKEN` 추가)
- **관리자 페이지 사용 권장**: `/admin/sync`는 토큰 노출 없이 사용 가능
- **HTML 임베드 사용 시**: 토큰이 URL에 포함되므로 복잡한 토큰 사용 권장
- 환경 변수로 안전하게 관리하세요

## 사용 방법 요약

1. **가장 안전한 방법**: `/admin/sync` 페이지 사용
2. **Notion 임베드**: `/sync-button?token=xxx` URL 임베드
3. **Notion Button**: URL 연결로 `/sync-button?token=xxx` 사용

