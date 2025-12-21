# 색상 팔레트 가이드

이 문서는 블로그의 색상 팔레트를 수정하는 방법을 설명합니다.

## 색상 팔레트 파일 위치

모든 색상은 **`app/globals.css`** 파일에서 CSS 변수로 중앙 관리됩니다.

## 색상 수정 방법

`app/globals.css` 파일에서 라이트 모드(`:root`)와 다크 모드(`.dark`)의 색상을 직접 수정하세요.

```css
:root {
  /* 라이트 모드 색상 */
  --color-bg: #ffffff;
  --color-bg-header: #ffffff;
  --color-text-primary: #171717;
  /* ... 기타 색상들 */
}

.dark {
  /* 다크 모드 색상 */
  --color-bg: #0a0a0a;
  --color-bg-header: #121212;
  --color-text-primary: #ededed;
  /* ... 기타 색상들 */
}
```

## 주요 색상 카테고리

### 배경색
- `background`: 전체 페이지 배경
- `card`: 포스트 카드 배경
- `sidebar`: 사이드바 배경
- `header`: 헤더 배경
- `search`: 검색 바 배경

### 텍스트 색상
- `text.primary`: 주요 텍스트
- `text.secondary`: 보조 텍스트
- `text.muted`: 비활성 텍스트

### 강조 색상
- `primary`: 링크, 버튼 등 강조 요소
- `primaryBg`: 강조 배경
- `primaryText`: 강조 텍스트

### 기타
- `border`: 테두리 색상
- `tag`: 태그 배경
- `hover`: 호버 상태 배경
- `selected`: 선택된 항목 배경

## 색상 변경 예시

예를 들어, 주요 강조 색상을 파란색에서 보라색으로 변경하려면:

`app/globals.css` 파일에서 다음을 수정하세요:

```css
:root {
  --color-primary: #9333ea;  /* 라이트 모드: 보라색 */
}

.dark {
  --color-primary: #a855f7;  /* 다크 모드: 밝은 보라색 */
}
```

## 다크 모드 토글

사용자는 헤더의 다크 모드 토글 버튼을 클릭하여 라이트/다크 모드를 전환할 수 있습니다.
선택한 모드는 브라우저의 localStorage에 저장되어 다음 방문 시에도 유지됩니다.

