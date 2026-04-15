/**
 * Homepage - Display progress stats and topic completion status
 */
const STAR_FILLED = '\u2605';
const STAR_EMPTY = '\u2606';

const HomePage = {
  init() {
    // Init Telegram from URL params (saves to localStorage)
    if (typeof Telegram !== 'undefined') {
      Telegram.init();
    }

    this.updateStats();
    this.updateTopicStatuses();
    this.setupTelegramBanner();
  },

  updateStats() {
    const progress = Storage.load('all-progress', {});
    const topics = Object.keys(progress);
    const completed = topics.filter(t => progress[t].completed).length;
    const totalScore = topics.reduce((sum, t) => sum + (progress[t].bestScore || 0), 0);

    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-score').textContent = totalScore;

    const streak = Logic.calculateStreak(
      Storage.load('daily-history', {}),
      new Date().toISOString().slice(0, 10)
    );
    document.getElementById('stat-streak').textContent = streak;
  },

  updateTopicStatuses() {
    const progress = Storage.load('all-progress', {});
    document.querySelectorAll('.topic-card__status').forEach(el => {
      const topicId = el.dataset.topic;
      const data = progress[topicId];
      el.textContent = '';

      if (data && data.completed) {
        const stars = data.stars || 0;
        const span = document.createElement('span');
        span.className = 'topic-card__stars';
        span.textContent = STAR_FILLED.repeat(stars) + STAR_EMPTY.repeat(3 - stars);
        el.appendChild(span);
      } else if (data && data.lastScore !== undefined) {
        const dot = document.createElement('span');
        dot.className = 'topic-card__arrow';
        dot.style.color = 'var(--primary)';
        dot.textContent = '\u25CF';
        el.appendChild(dot);
      } else {
        const arrow = document.createElement('span');
        arrow.className = 'topic-card__arrow';
        arrow.textContent = '\u203A';
        el.appendChild(arrow);
      }
    });
  },

  setupTelegramBanner() {
    const banner = document.getElementById('tg-banner');
    if (!banner) return;

    const isConnected = typeof Telegram !== 'undefined' && Telegram.isConfigured();
    const studentName = typeof Telegram !== 'undefined' ? Telegram.studentName : null;

    if (isConnected) {
      // Show connected state
      banner.style.display = 'flex';
      const textEl = banner.querySelector('.tg-banner__text');
      if (textEl) {
        const strong = textEl.querySelector('strong');
        const desc = textEl.childNodes[textEl.childNodes.length - 1];
        if (strong) strong.textContent = 'Telegram: ' + (studentName || 'Kết nối thành công');
        if (desc && desc.nodeType === 3) {
          desc.textContent = 'Tiến độ học tập sẽ được gửi tự động';
        }
      }
      banner.style.cursor = 'default';
      banner.removeAttribute('href');
    } else {
      // Not connected — hide banner (teacher shares URL with params)
      banner.style.display = 'none';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => HomePage.init());
