/**
 * Homepage - Display progress stats and topic completion status
 */
const STAR_FILLED = '\u2605';
const STAR_EMPTY = '\u2606';

const HomePage = {
  init() {
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

    const streak = this.calculateStreak();
    document.getElementById('stat-streak').textContent = streak;
  },

  calculateStreak() {
    const history = Storage.load('daily-history', {});
    let streak = 0;
    let date = new Date();
    const today = date.toISOString().slice(0, 10);

    while (true) {
      const key = date.toISOString().slice(0, 10);
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
    const tgBotUrl = Storage.load('telegram-bot-url', null);
    const banner = document.getElementById('tg-banner');
    if (!tgBotUrl) {
      banner.style.display = 'flex';
      banner.href = '#';
      banner.addEventListener('click', (e) => {
        e.preventDefault();
        const url = prompt('Nhập link Telegram bot:');
        if (url) {
          Storage.save('telegram-bot-url', url);
          banner.style.display = 'none';
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => HomePage.init());
