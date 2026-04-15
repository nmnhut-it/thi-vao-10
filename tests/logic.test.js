import { describe, it, expect } from 'vitest';
const Logic = (await import('../js/core/logic.js')).default;

describe('Logic.countQuestions', () => {
  it('counts simple exercises as 1 each', () => {
    const exercises = [
      { type: 'multiple-choice', id: 1 },
      { type: 'fill-blank', id: 2 },
      { type: 'error-correct', id: 3 }
    ];
    expect(Logic.countQuestions(exercises)).toBe(3);
  });

  it('counts reading-comprehension by number of sub-questions', () => {
    const exercises = [
      { type: 'multiple-choice', id: 1 },
      { type: 'reading-comprehension', id: 2, questions: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }
    ];
    expect(Logic.countQuestions(exercises)).toBe(4);
  });

  it('returns 0 for empty array', () => {
    expect(Logic.countQuestions([])).toBe(0);
  });
});

describe('Logic.normalizeAnswer', () => {
  it('lowercases and trims', () => {
    expect(Logic.normalizeAnswer('  Hello World  ')).toBe('hello world');
  });

  it('strips punctuation', () => {
    expect(Logic.normalizeAnswer("It's a test.")).toBe("its a test");
  });

  it('collapses multiple spaces', () => {
    expect(Logic.normalizeAnswer('a   b    c')).toBe('a b c');
  });
});

describe('Logic.checkTextAnswer', () => {
  it('matches exact answer', () => {
    const ex = { answer: 'taller than' };
    expect(Logic.checkTextAnswer('taller than', ex)).toBe(true);
  });

  it('matches case-insensitively', () => {
    const ex = { answer: 'She is taller than her brother.' };
    expect(Logic.checkTextAnswer('she is taller than her brother', ex)).toBe(true);
  });

  it('matches accepted answers', () => {
    const ex = { answer: 'main answer', acceptedAnswers: ['alt 1', 'alt 2'] };
    expect(Logic.checkTextAnswer('alt 2', ex)).toBe(true);
  });

  it('rejects wrong answer', () => {
    const ex = { answer: 'correct' };
    expect(Logic.checkTextAnswer('wrong', ex)).toBe(false);
  });

  it('returns false for empty input', () => {
    const ex = { answer: 'correct' };
    expect(Logic.checkTextAnswer('', ex)).toBe(false);
    expect(Logic.checkTextAnswer('  ', ex)).toBe(false);
  });
});

describe('Logic.checkMCAnswer', () => {
  it('returns true for correct index', () => {
    expect(Logic.checkMCAnswer(2, 2)).toBe(true);
  });

  it('returns false for wrong index', () => {
    expect(Logic.checkMCAnswer(0, 3)).toBe(false);
  });
});

describe('Logic.calculateStars', () => {
  it('returns 3 stars for 90%+', () => {
    expect(Logic.calculateStars(9, 10)).toBe(3);
    expect(Logic.calculateStars(10, 10)).toBe(3);
  });

  it('returns 2 stars for 70-89%', () => {
    expect(Logic.calculateStars(7, 10)).toBe(2);
    expect(Logic.calculateStars(8, 10)).toBe(2);
  });

  it('returns 1 star for 50-69%', () => {
    expect(Logic.calculateStars(5, 10)).toBe(1);
    expect(Logic.calculateStars(6, 10)).toBe(1);
  });

  it('returns 0 stars for below 50%', () => {
    expect(Logic.calculateStars(4, 10)).toBe(0);
    expect(Logic.calculateStars(0, 10)).toBe(0);
  });

  it('returns 0 for zero total', () => {
    expect(Logic.calculateStars(0, 0)).toBe(0);
  });
});

describe('Logic.getResultTitle', () => {
  it('returns correct Vietnamese titles', () => {
    expect(Logic.getResultTitle(10, 10)).toBe('Xuất sắc!');
    expect(Logic.getResultTitle(8, 10)).toBe('Rất tốt!');
    expect(Logic.getResultTitle(6, 10)).toBe('Khá tốt!');
    expect(Logic.getResultTitle(3, 10)).toBe('Cần cố gắng thêm!');
  });

  it('returns empty for zero total', () => {
    expect(Logic.getResultTitle(0, 0)).toBe('');
  });
});

describe('Logic.calculateScore', () => {
  it('calculates from answers map', () => {
    const answers = {
      1: { correct: true },
      2: { correct: false },
      3: { correct: true }
    };
    const result = Logic.calculateScore(answers);
    expect(result.score).toBe(20);
    expect(result.correct).toBe(2);
    expect(result.total).toBe(3);
  });

  it('returns zeros for empty map', () => {
    const result = Logic.calculateScore({});
    expect(result.score).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('Logic.mergeProgress', () => {
  it('keeps best score and stars', () => {
    const existing = { bestScore: 100, stars: 2 };
    const newResult = { score: 80, stars: 1, correct: 8, total: 10 };
    const merged = Logic.mergeProgress(existing, newResult);
    expect(merged.bestScore).toBe(100);
    expect(merged.stars).toBe(2);
    expect(merged.completed).toBe(true);
  });

  it('updates when new is better', () => {
    const existing = { bestScore: 50, stars: 1 };
    const newResult = { score: 100, stars: 3, correct: 10, total: 10 };
    const merged = Logic.mergeProgress(existing, newResult);
    expect(merged.bestScore).toBe(100);
    expect(merged.stars).toBe(3);
  });

  it('handles null existing', () => {
    const newResult = { score: 70, stars: 2, correct: 7, total: 10 };
    const merged = Logic.mergeProgress(null, newResult);
    expect(merged.bestScore).toBe(70);
    expect(merged.stars).toBe(2);
  });
});

describe('Logic.calculateStreak', () => {
  it('counts consecutive days', () => {
    const history = {
      '2026-04-15': 3,
      '2026-04-14': 1,
      '2026-04-13': 2
    };
    expect(Logic.calculateStreak(history, '2026-04-15')).toBe(3);
  });

  it('returns 0 if no history', () => {
    expect(Logic.calculateStreak({}, '2026-04-15')).toBe(0);
  });

  it('skips today if not yet recorded', () => {
    const history = {
      '2026-04-14': 1,
      '2026-04-13': 2
    };
    expect(Logic.calculateStreak(history, '2026-04-15')).toBe(2);
  });

  it('stops at gap', () => {
    const history = {
      '2026-04-15': 1,
      '2026-04-13': 1 // gap on 14th
    };
    expect(Logic.calculateStreak(history, '2026-04-15')).toBe(1);
  });
});

describe('Logic.formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(Logic.formatTime(3600)).toBe('60:00');
    expect(Logic.formatTime(90)).toBe('01:30');
    expect(Logic.formatTime(0)).toBe('00:00');
    expect(Logic.formatTime(5)).toBe('00:05');
  });
});

describe('Logic.getTimerClass', () => {
  it('returns danger for <= 5 minutes', () => {
    expect(Logic.getTimerClass(300)).toContain('danger');
    expect(Logic.getTimerClass(60)).toContain('danger');
  });

  it('returns warning for <= 10 minutes', () => {
    expect(Logic.getTimerClass(600)).toContain('warning');
    expect(Logic.getTimerClass(301)).toContain('warning');
  });

  it('returns plain for > 10 minutes', () => {
    const cls = Logic.getTimerClass(601);
    expect(cls).not.toContain('warning');
    expect(cls).not.toContain('danger');
  });
});

describe('Logic.cleanOptionText', () => {
  it('strips leading letter prefix', () => {
    expect(Logic.cleanOptionText('A. hello')).toBe('hello');
    expect(Logic.cleanOptionText('B. world')).toBe('world');
  });

  it('leaves text without prefix unchanged', () => {
    expect(Logic.cleanOptionText('hello')).toBe('hello');
  });
});

describe('Logic.buildWrongAnswerExplanation', () => {
  it('includes correct answer and explanation', () => {
    const ex = { answer: 'taller', explanation: 'Short adj uses -er' };
    const result = Logic.buildWrongAnswerExplanation(ex);
    expect(result).toContain('taller');
    expect(result).toContain('Short adj uses -er');
  });

  it('uses correctSentence if no answer', () => {
    const ex = { correctSentence: 'She is tall.', explanation: '' };
    const result = Logic.buildWrongAnswerExplanation(ex);
    expect(result).toContain('She is tall.');
  });
});

describe('Logic.buildTelegramMessage', () => {
  it('formats correctly', () => {
    const msg = Logic.buildTelegramMessage('Verb Tenses', 8, 10, 2);
    expect(msg).toContain('Verb Tenses');
    expect(msg).toContain('8/10');
    expect(msg).toContain('80%');
    expect(msg).toContain('2/3');
  });
});

describe('Logic.hasUnderlineTags', () => {
  it('detects underline tags', () => {
    expect(Logic.hasUnderlineTags('sw<u>ea</u>ter')).toBe(true);
    expect(Logic.hasUnderlineTags('hello')).toBe(false);
  });
});

describe('Logic.parseUnderlinedText', () => {
  it('parses text with underline tags', () => {
    const result = Logic.parseUnderlinedText('sw<u>ea</u>ter');
    expect(result).toEqual([
      { text: 'sw', underline: false },
      { text: 'ea', underline: true },
      { text: 'ter', underline: false }
    ]);
  });

  it('handles text without tags', () => {
    const result = Logic.parseUnderlinedText('hello');
    expect(result).toEqual([{ text: 'hello', underline: false }]);
  });

  it('handles multiple underline sections', () => {
    const result = Logic.parseUnderlinedText('a<u>b</u>c<u>d</u>e');
    expect(result).toEqual([
      { text: 'a', underline: false },
      { text: 'b', underline: true },
      { text: 'c', underline: false },
      { text: 'd', underline: true },
      { text: 'e', underline: false }
    ]);
  });

  it('handles tag at start', () => {
    const result = Logic.parseUnderlinedText('<u>ab</u>cd');
    expect(result).toEqual([
      { text: 'ab', underline: true },
      { text: 'cd', underline: false }
    ]);
  });
});
