# 작업 규칙

## 커밋 메시지

`.githooks/commit-msg` 와 CI(`commit-msg` workflow)가 `scripts/check-commit-msg.mjs` 로 검사한다.

- 제목: `타입: 한국어 요약` — 타입은 feat, fix, refactor, docs, style, test, chore, ci, perf, build, revert, merge
- 제목·본문 모두 명사형 종결 (~수정, ~추가, ~없음). "~다", "~요" 금지
- 본문은 문단 대신 짧은 소제목(문제 / 변경 / 측정 등) 아래 `- ` 불릿
- 불릿·소제목 끝 마침표 없음
- Co-Authored-By trailer 넣지 않음
- PR 은 rebase 병합만 사용 (GitHub 가 영어 merge 커밋을 만들지 않도록)

예시

```
fix: 저장이 확인된 보고서만 완료로 표시

문제
- 저장 실패 시에도 서버가 done 전송

변경
- 서버: 갱신된 행 확인 후에만 done 전송
```

hook 연결: `npm install` 이 자동으로 `git config core.hooksPath .githooks` 실행.
