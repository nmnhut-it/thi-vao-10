/**
 * Pure logic functions - no DOM, no side effects, fully unit-testable
 */

const Logic = {
  POINTS_CORRECT: 10,
  STAR_THRESHOLDS: [0.5, 0.7, 0.9],

  /**
   * Count total questions in an exercises array
   * @param {Array} exercises
   * @returns {number}
   */
  countQuestions(exercises) {
    return exercises.reduce((n, ex) => {
      if (ex.type === 'reading-comprehension' && ex.questions) {
        return n + ex.questions.length;
      }
      return n + 1;
    }, 0);
  },

  /**
   * Normalize a string for answer comparison
   * @param {string} s
   * @returns {string}
   */
  normalizeAnswer(s) {
    return s.toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();
  },

  /**
   * Check if a text answer matches any accepted answer
   * @param {string} userAnswer
   * @param {Object} exercise - must have .answer and optionally .acceptedAnswers
   * @returns {boolean}
   */
  checkTextAnswer(userAnswer, exercise) {
    if (!userAnswer || !userAnswer.trim()) return false;
    const primary = exercise.answer || exercise.correctSentence;
    const accepted = [primary, ...(exercise.acceptedAnswers || [])].filter(Boolean);
    return accepted.some(a => this.normalizeAnswer(userAnswer) === this.normalizeAnswer(a));
  },

  /**
   * Check if a multiple-choice selection is correct
   * @param {number} selected - index chosen by user
   * @param {number} correctIndex - correct index
   * @returns {boolean}
   */
  checkMCAnswer(selected, correctIndex) {
    return selected === correctIndex;
  },

  /**
   * Calculate star rating from percentage
   * @param {number} correctCount
   * @param {number} totalCount
   * @returns {number} 0-3 stars
   */
  calculateStars(correctCount, totalCount) {
    if (totalCount === 0) return 0;
    const pct = correctCount / totalCount;
    if (pct >= this.STAR_THRESHOLDS[2]) return 3;
    if (pct >= this.STAR_THRESHOLDS[1]) return 2;
    if (pct >= this.STAR_THRESHOLDS[0]) return 1;
    return 0;
  },

  /**
   * Get result title text based on percentage
   * @param {number} correctCount
   * @param {number} totalCount
   * @returns {string}
   */
  getResultTitle(correctCount, totalCount) {
    if (totalCount === 0) return '';
    const pct = correctCount / totalCount;
    if (pct >= 0.9) return 'Xuất sắc!';
    if (pct >= 0.7) return 'Rất tốt!';
    if (pct >= 0.5) return 'Khá tốt!';
    return 'Cần cố gắng thêm!';
  },

  /**
   * Calculate score from answers map
   * @param {Object} answers - map of exId -> { correct: boolean }
   * @returns {{ score: number, correct: number, total: number }}
   */
  calculateScore(answers) {
    const entries = Object.values(answers);
    const correct = entries.filter(a => a.correct).length;
    return {
      score: correct * this.POINTS_CORRECT,
      correct,
      total: entries.length
    };
  },

  /**
   * Merge new progress into existing progress for a topic
   * @param {Object|null} existing - previous progress data
   * @param {Object} newResult - { score, correct, total, stars }
   * @returns {Object} merged progress
   */
  mergeProgress(existing, newResult) {
    const prev = existing || {};
    return {
      completed: true,
      bestScore: Math.max(prev.bestScore || 0, newResult.score),
      stars: Math.max(prev.stars || 0, newResult.stars),
      lastScore: newResult.score,
      correctCount: newResult.correct,
      totalCount: newResult.total,
      lastPlayed: new Date().toISOString()
    };
  },

  /**
   * Calculate daily streak from history
   * @param {Object} history - map of 'YYYY-MM-DD' -> count
   * @param {string} today - 'YYYY-MM-DD'
   * @returns {number}
   */
  calculateStreak(history, today) {
    let streak = 0;
    let date = new Date(today + 'T12:00:00'); // noon to avoid timezone edge cases

    const toKey = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    };

    while (true) {
      const key = toKey(date);
      if (history[key]) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else if (key === today) {
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },

  /**
   * Build explanation text for a wrong text answer
   * @param {Object} exercise
   * @returns {string}
   */
  buildWrongAnswerExplanation(exercise) {
    const correctAnswer = exercise.answer || exercise.correctSentence || '';
    const explanation = exercise.explanation || '';
    if (!correctAnswer && !explanation) return '';
    return 'Đáp án: ' + correctAnswer + (explanation ? '\n' + explanation : '');
  },

  /**
   * Format timer display
   * @param {number} seconds
   * @returns {string} "MM:SS"
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  },

  /**
   * Get timer CSS class based on remaining time
   * @param {number} seconds
   * @returns {string}
   */
  getTimerClass(seconds) {
    if (seconds <= 300) return 'test-timer test-timer--danger';
    if (seconds <= 600) return 'test-timer test-timer--warning';
    return 'test-timer';
  },

  /**
   * Build Telegram progress message
   * @param {string} title
   * @param {number} correct
   * @param {number} total
   * @param {number} stars
   * @returns {string}
   */
  buildTelegramMessage(title, correct, total, stars) {
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    return [
      '\u2705 ' + title,
      'Kết quả: ' + correct + '/' + total + ' (' + pct + '%)',
      '\u2B50 ' + stars + '/3 sao'
    ].join('\n');
  },

  /**
   * Strip leading option letter from option text (e.g., "A. hello" -> "hello")
   * @param {string} opt
   * @returns {string}
   */
  cleanOptionText(opt) {
    return opt.replace(/^[A-D]\.\s*/, '');
  },

  /**
   * Check if text contains underline markup tags
   * @param {string} text
   * @returns {boolean}
   */
  hasUnderlineTags(text) {
    return text.indexOf('<u>') !== -1;
  },

  /**
   * Parse text with underline tags into segments for safe DOM rendering.
   * Returns array of { text, underline } objects.
   * Only recognizes the underline tag — all other markup is treated as plain text.
   * @param {string} text
   * @returns {Array<{text: string, underline: boolean}>}
   */
  parseUnderlinedText(text) {
    const segments = [];
    const parts = text.split(/<\/?u>/);
    let insideTag = false;
    // The split alternates: outside, inside, outside, inside...
    // First part is always outside a tag
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 0) {
        segments.push({ text: parts[i], underline: insideTag });
      }
      insideTag = !insideTag;
    }
    return segments;
  }
};

// Export for testing (CJS)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Logic;
  module.exports.default = Logic;
}
