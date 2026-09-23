# VIZUDEN

취향·라이프스타일·원하는 이미지를 바탕으로 스타일 방향을 정리하는 AI 스타일 서비스.

[서비스 보기](https://vizuden.com)

## 주요 기능

- **스타일 유형 탐색:** 질문에 답하고 자신의 스타일 유형과 특징을 확인합니다.
- **스타일 번역서·처방전:** 설문과 사진을 바탕으로 AI가 스타일 방향과 실행 제안을 구성합니다. 샘플 보고서로 결과를 미리 볼 수 있습니다.
- **결과 확인:** 생성 중인 처방전을 점진적으로 표시하고, 로그인 후 마이페이지에서 저장된 결과를 조회합니다.
- **운영 도구:** 관리자 대시보드에서 사용자와 보고서 현황을 확인합니다. 무료 체험 요청에는 일일 사용 제한을 적용합니다.

## 기술 구성

React · JavaScript · Vite · Tailwind CSS · Anthropic API · Supabase · Vercel

`src/`는 화면과 상태 관리, `api/`는 서버리스 API, `api/_lib/`는 프롬프트·검색·인증 공통 로직입니다. DB 설정 SQL은 저장소 루트에 있습니다.

## 로컬 실행

Node.js 22.12 이상을 권장합니다.

```sh
npm ci
npm run dev
```

`.env.local`에 브라우저용 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정합니다.

**현재 Vite 개발 서버는 `/api` 요청을 기본적으로 운영 서비스로 전달합니다.** 로컬 API를 사용하려면 별도로 API 서버를 실행하고 `VITE_API_TARGET`을 해당 주소로 지정하세요.

서버 API에는 `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다. 검색 연동에는 `TAVILY_API_KEY`를 사용합니다. 실제 키는 커밋하지 않습니다.

## 빌드

```sh
npm run build
npm run preview
```

빌드에는 보고서 공유용 OG HTML 생성이 포함됩니다. 서비스는 Vercel에 배포하며, AI 결과의 유용성·정확성을 정량 검증했다는 주장은 포함하지 않습니다.
