import {
  getConsultingAnswer,
  getConsultingResponseText,
  getConsultingPreview,
  getFitPicCount,
  getConsentItems,
} from './consultingIntake';

describe('consultingIntake helpers', () => {
  describe('getConsultingAnswer', () => {
    it('returns matching answer by id', () => {
      const answers = [{ id: 'sessionGoal', answer: '목표' }, { id: 'finalNote', answer: '메모' }];
      expect(getConsultingAnswer(answers, 'finalNote')).toEqual({ id: 'finalNote', answer: '메모' });
    });

    it('returns null when answers is not an array or no match exists', () => {
      expect(getConsultingAnswer(null, 'sessionGoal')).toBeNull();
      expect(getConsultingAnswer([{ id: 'x' }], 'sessionGoal')).toBeNull();
    });
  });

  describe('getConsultingResponseText', () => {
    it('returns answer text when only answer exists', () => {
      expect(getConsultingResponseText({ answer: '평일 저녁' })).toBe('평일 저녁');
    });

    it('returns selected labels joined by commas', () => {
      expect(getConsultingResponseText({ selected: ['강남역', '성수'] })).toBe('강남역, 성수');
    });

    it('returns other text with prefix', () => {
      expect(getConsultingResponseText({ other: 'DM 우선' })).toBe('기타: DM 우선');
    });

    it('combines answer, selected, and other text in order', () => {
      expect(
        getConsultingResponseText({
          answer: '주말 가능',
          selected: ['성수'],
          other: '한남도 가능',
        })
      ).toBe('주말 가능 / 성수 / 기타: 한남도 가능');
    });

    it('returns 미입력 when no content exists', () => {
      expect(getConsultingResponseText({})).toBe('미입력');
      expect(getConsultingResponseText(null)).toBe('미입력');
    });
  });

  describe('getConsultingPreview', () => {
    it('prefers sessionGoal over later fields', () => {
      const answers = [
        { id: 'sessionGoal', selected: ['옷장 정리'] },
        { id: 'shoppingArea', selected: ['성수'] },
        { id: 'shopWhere', selected: ['무신사'] },
        { id: 'finalNote', answer: '메모' },
      ];
      expect(getConsultingPreview(answers)).toBe('옷장 정리');
    });

    it('falls back to shoppingArea, then shopWhere, then finalNote', () => {
      expect(
        getConsultingPreview([
          { id: 'shoppingArea', selected: ['성수'] },
          { id: 'shopWhere', selected: ['무신사'] },
        ])
      ).toBe('성수');

      expect(
        getConsultingPreview([
          { id: 'shopWhere', selected: ['무신사'] },
          { id: 'finalNote', answer: '메모' },
        ])
      ).toBe('무신사');

      expect(getConsultingPreview([{ id: 'finalNote', answer: '메모' }])).toBe('메모');
    });

    it('returns null when all candidates are empty', () => {
      expect(getConsultingPreview([])).toBeNull();
      expect(getConsultingPreview([{ id: 'sessionGoal', answer: ' ' }])).toBeNull();
    });
  });

  describe('getFitPicCount', () => {
    it('returns array length or 0', () => {
      expect(getFitPicCount([{ id: 1 }, { id: 2 }])).toBe(2);
      expect(getFitPicCount(null)).toBe(0);
    });
  });

  describe('getConsentItems', () => {
    it('returns only enabled consent labels', () => {
      expect(getConsentItems({ recording: true, photo: false })).toEqual(['프리세션 녹음·녹화 동의']);
      expect(getConsentItems({ recording: true, photo: true })).toEqual([
        '프리세션 녹음·녹화 동의',
        '오프라인 쇼핑 사진 촬영 동의',
      ]);
    });

    it('returns empty array for invalid input', () => {
      expect(getConsentItems(null)).toEqual([]);
      expect(getConsentItems({})).toEqual([]);
    });
  });
});

