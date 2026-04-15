/**
 * Test Engine - Handles timed practice tests
 * Uses TopicEngine for exercise rendering, adds timer + question grid
 */

const TEST_TIME_LIMITS = {
  'mixed-40': 60,
  'mc-40': 45,
  'mc-50': 60
};

const TestEngine = {
  timer: null,
  timeRemaining: 0,
  isSubmitted: false,

  async init(testId) {
    // Initialize TopicEngine's state for rendering
    TopicEngine.state = {
      topicId: testId,
      data: null,
      currentIndex: 0,
      answers: {},
      score: 0,
      totalExercises: 0
    };

    try {
      const resp = await fetch('../data/' + testId + '.json');
      if (!resp.ok) throw new Error('Data not found');
      TopicEngine.state.data = await resp.json();
    } catch (err) {
      document.getElementById('exercise-area').textContent = 'Không thể tải dữ liệu.';
      return;
    }

    const exercises = TopicEngine.state.data.exercises || [];
    TopicEngine.state.totalExercises = TopicEngine.countQuestions(exercises);

    // Setup timer
    const testType = TopicEngine.state.data.testType || 'mc-40';
    this.timeRemaining = (TEST_TIME_LIMITS[testType] || 45) * 60;

    // Render
    this.renderNavBar();
    this.renderTimer();
    this.renderQuestionGrid();
    TopicEngine.renderExercises();
    this.startTimer();

    // Wrap TopicEngine.updateProgress to also update grid
    const origUpdate = TopicEngine.updateProgress.bind(TopicEngine);
    TopicEngine.updateProgress = () => {
      origUpdate();
      const answered = Object.keys(TopicEngine.state.answers).length;
      this.updateGridItem(answered, true);
    };

    TopicEngine.recordDailyActivity();
  },

  renderNavBar() {
    const nav = document.getElementById('nav-bar');
    if (!nav) return;
    const titleEl = nav.querySelector('.nav-bar__title');
    if (titleEl) titleEl.textContent = TopicEngine.state.data.title || TopicEngine.state.topicId;
  },

  renderTimer() {
    const timerEl = document.getElementById('test-timer');
    if (timerEl) this.updateTimerDisplay(timerEl);
  },

  updateTimerDisplay(timerEl) {
    timerEl.textContent = Logic.formatTime(this.timeRemaining);
    timerEl.className = Logic.getTimerClass(this.timeRemaining);
  },

  startTimer() {
    const timerEl = document.getElementById('test-timer');
    if (!timerEl) return;

    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay(timerEl);
      if (this.timeRemaining <= 0) this.submitTest();
    }, 1000);
  },

  renderQuestionGrid() {
    const grid = document.getElementById('question-grid');
    if (!grid) return;
    grid.textContent = '';

    for (let i = 1; i <= TopicEngine.state.totalExercises; i++) {
      const item = document.createElement('button');
      item.className = 'question-grid__item';
      item.textContent = i;
      item.type = 'button';
      item.dataset.qnum = i;
      item.addEventListener('click', () => {
        const cards = document.querySelectorAll('.exercise-card');
        if (cards[i - 1]) {
          cards[i - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      grid.appendChild(item);
    }
  },

  updateGridItem(qnum, answered) {
    const grid = document.getElementById('question-grid');
    if (!grid) return;
    const item = grid.querySelector('[data-qnum="' + qnum + '"]');
    if (item && answered) {
      item.classList.add('question-grid__item--answered');
    }
  },

  submitTest() {
    if (this.isSubmitted) return;
    this.isSubmitted = true;
    clearInterval(this.timer);

    const state = TopicEngine.state;
    const correct = Object.values(state.answers).filter(a => a.correct).length;
    const total = state.totalExercises;
    const stars = Logic.calculateStars(correct, total);

    // Save progress
    const progress = Storage.load('all-progress', {});
    progress[state.topicId] = Logic.mergeProgress(
      progress[state.topicId],
      { score: correct * Logic.POINTS_CORRECT, stars, correct, total }
    );
    Storage.save('all-progress', progress);

    // Show results
    const area = document.getElementById('results-area');
    if (area) {
      area.style.display = 'block';
      const starsEl = area.querySelector('.results__stars');
      if (starsEl) starsEl.textContent = '\u2B50'.repeat(stars);
      const titleEl = area.querySelector('.results__title');
      if (titleEl) titleEl.textContent = Logic.getResultTitle(correct, total);
      const scoreEl = area.querySelector('.results__score');
      if (scoreEl) scoreEl.textContent = correct + '/' + total + ' đúng (' + Math.round(correct / total * 100) + '%)';
      area.scrollIntoView({ behavior: 'smooth' });
    }

    // Color the grid
    const exercises = state.data.exercises || [];
    let qIdx = 0;
    const grid = document.getElementById('question-grid');
    exercises.forEach((ex) => {
      if (ex.type === 'reading-comprehension' && ex.questions) {
        ex.questions.forEach((q, qi) => {
          qIdx++;
          const exId = 'reading-' + ex.id + '-' + qi;
          const ans = state.answers[exId];
          if (grid) {
            const item = grid.querySelector('[data-qnum="' + qIdx + '"]');
            if (item) {
              if (ans && ans.correct) item.classList.add('question-grid__item--correct');
              else if (ans) item.classList.add('question-grid__item--wrong');
            }
          }
        });
      } else {
        qIdx++;
        const exId = ex.id || exercises.indexOf(ex);
        const ans = state.answers[exId];
        if (grid) {
          const item = grid.querySelector('[data-qnum="' + qIdx + '"]');
          if (item) {
            if (ans && ans.correct) item.classList.add('question-grid__item--correct');
            else if (ans) item.classList.add('question-grid__item--wrong');
          }
        }
      }
    });

    TopicEngine.sendTelegramProgress(correct, total, stars);
  }
};
