import { questions } from './questions';

// answers: ['A', 'B', 'BOTH', ...] — 최대 12개 배열
// BOTH 선택 시 양쪽에 0.5씩 분배
function accumulateScores(answers) {
  const scores = { I: 0, R: 0, C: 0, D: 0, M: 0, E: 0, T: 0, N: 0 };

  answers.forEach((answer, index) => {
    const q = questions[index];
    if (!q) return;
    if (answer === 'BOTH') {
      scores[q.scoreA] += 0.5;
      scores[q.scoreB] += 0.5;
    } else {
      const key = answer === 'A' ? q.scoreA : q.scoreB;
      scores[key]++;
    }
  });

  return scores;
}

export function calculateType(answers) {
  const scores = accumulateScores(answers);

  const type = [
    scores.I >= scores.R ? 'I' : 'R',
    scores.C >= scores.D ? 'C' : 'D',
    scores.M >= scores.E ? 'M' : 'E',
    scores.T >= scores.N ? 'T' : 'N',
  ].join('');

  return { type, scores };
}

// 각 축의 점수 반환
export function getAxisScores(scores) {
  return [
    { axis: 'motivation', labelA: 'I', labelB: 'R', scoreA: scores.I, scoreB: scores.R },
    { axis: 'orientation', labelA: 'C', labelB: 'D', scoreA: scores.C, scoreB: scores.D },
    { axis: 'energy', labelA: 'M', labelB: 'E', scoreA: scores.M, scoreB: scores.E },
    { axis: 'temporality', labelA: 'T', labelB: 'N', scoreA: scores.T, scoreB: scores.N },
  ];
}

// 현재까지 답한 것으로 부분 타입 코드 계산
// 축별 3문항이 완료된 시점에만 해당 글자가 확정됨
export function getPartialType(answers) {
  const scores = accumulateScores(answers);
  const count = answers.length;

  return [
    count >= 3 ? (scores.I >= scores.R ? 'I' : 'R') : null,
    count >= 6 ? (scores.C >= scores.D ? 'C' : 'D') : null,
    count >= 9 ? (scores.M >= scores.E ? 'M' : 'E') : null,
    count >= 12 ? (scores.T >= scores.N ? 'T' : 'N') : null,
  ];
}
