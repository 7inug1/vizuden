export function getConsultingAnswer(answers, id) {
  if (!Array.isArray(answers)) return null;
  return answers.find((item) => item?.id === id) ?? null;
}

export function getConsultingResponseText(answer) {
  if (!answer) return '미입력';

  const parts = [];

  if (typeof answer.answer === 'string' && answer.answer.trim()) {
    parts.push(answer.answer.trim());
  }

  if (Array.isArray(answer.selected) && answer.selected.length > 0) {
    parts.push(answer.selected.join(', '));
  }

  if (typeof answer.other === 'string' && answer.other.trim()) {
    parts.push(`기타: ${answer.other.trim()}`);
  }

  if (parts.length === 0) return '미입력';
  return parts.join(' / ');
}

export function getConsultingPreview(answers) {
  const goal = getConsultingAnswer(answers, 'sessionGoal');
  const shoppingArea = getConsultingAnswer(answers, 'shoppingArea');
  const shoppingChannel = getConsultingAnswer(answers, 'shopWhere');
  const finalNote = getConsultingAnswer(answers, 'finalNote');

  const preview =
    getConsultingResponseText(goal) !== '미입력'
      ? getConsultingResponseText(goal)
      : getConsultingResponseText(shoppingArea) !== '미입력'
        ? getConsultingResponseText(shoppingArea)
        : getConsultingResponseText(shoppingChannel) !== '미입력'
          ? getConsultingResponseText(shoppingChannel)
          : getConsultingResponseText(finalNote);

  if (!preview || preview === '미입력') return null;
  return preview;
}

export function getFitPicCount(fitPics) {
  return Array.isArray(fitPics) ? fitPics.length : 0;
}

export function getConsentItems(consents) {
  if (!consents || typeof consents !== 'object') return [];

  return [
    consents.recording ? '프리세션 녹음·녹화 동의' : null,
    consents.photo ? '오프라인 쇼핑 사진 촬영 동의' : null,
  ].filter(Boolean);
}

const CONSULTING_STATUS_LABELS = {
  submitted: '신청 접수',
  contacted: '연락 완료',
  scheduled: '일정 확정',
  completed: '컨설팅 완료',
  cancelled: '진행 취소',
};

export function getConsultingStatusLabel(status) {
  if (!status || typeof status !== 'string') return '신청 접수';
  return CONSULTING_STATUS_LABELS[status] || status;
}
