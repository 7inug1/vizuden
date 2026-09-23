import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMessage } from '../scripts/check-commit-msg.mjs';

const ok = (msg) => assert.deepEqual(checkMessage(msg), [], msg);
const bad = (msg, pattern) => {
  const problems = checkMessage(msg);
  assert.ok(problems.some((p) => pattern.test(p)), `${msg}\n→ ${problems.join(' / ') || '(문제 없음)'}`);
};

test('형식을 지킨 제목·본문은 통과', () => {
  ok('fix: 저장이 확인된 보고서만 완료로 표시');
  ok(`refactor: 종료된 네이버 쇼핑 검색 호출 제거

배경
- 네이버 쇼핑 검색 API 2026-07-31 종료, 공식 대체 API 없음
- 모든 요청 404 (SE05)

변경
- 서버: 윤문·저장 중 10초마다 SSE 주석(: keepalive) 전송
  (화면의 30초 무응답 제한 대비, 이 구간은 보낼 데이터 없음)

새 라우트
  GET  /api/translator-intake        목록
`);
  ok('merge: 보고서 생성 안정성 개선 (#1)');
  ok('feat(api): 번역가 인테이크 라우트 통합');
});

test('제목: 타입 접두어 필수', () => {
  bad('보고서 저장 수정', /타입/);
  bad('Merge pull request #1 from 7inug1/fix/report-reliability', /타입/);
  bad('wip: 작업 중', /타입/);
});

test('제목: 한국어 필수', () => {
  bad('fix: verify actual database reads in daily keepalive', /한국어/);
});

test('제목: 명사형 종결 (~다·~요·~게·마침표 금지)', () => {
  bad('fix: 저장 실패를 오류로 처리한다', /명사형/);
  bad('feat: 랜딩에서 바로 샘플 번역서로 갈 수 있게', /명사형/);
  bad('fix: 저장 실패 처리해요', /명사형/);
  bad('fix: 저장 실패 처리.', /명사형/);
});

test('본문: 문장형 종결 금지 (들여쓴 줄 포함)', () => {
  bad('fix: 수정\n\n배경\n- 무료 플랜은 프로젝트를 멈춘다', /4줄.*명사형/);
  bad('fix: 수정\n\n- 경로 수정\n  이 화면은 번들에 실려 있었다.', /4줄.*명사형/);
  bad('fix: 수정\n\n- 끊김 없음이에요', /명사형/);
});

test('본문: 불릿·소제목 끝 마침표 금지, 소제목이 아닌 문단 금지', () => {
  bad('fix: 수정\n\n- 보고서로 연결.', /마침표/);
  bad('fix: 수정\n\n라우트에서 빠졌거나 아무 데서도 import 되지 않아 실행될 수 없는 코드 삭제', /소제목/);
});

test('본문: 공동 작성 trailer 금지', () => {
  bad('fix: 수정\n\n- 변경\n\nCo-Authored-By: Claude <noreply@anthropic.com>', /Co-Authored-By/);
});

test('git 주석과 가위 줄 아래는 검사하지 않음', () => {
  ok('fix: 수정\n\n- 변경\n# Please enter the commit message. 이건 주석이다.\n# ------------------------ >8 ------------------------\ndiff --git a b 한다.');
});
