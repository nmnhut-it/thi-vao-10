/**
 * Game Engine for English Grammar Games
 * Core orchestrator that manages game state, scoring, timer, and exercise flow
 */

const GameEngine = {
  // Constants
  POINTS_PER_QUESTION: 10,
  COMBO_MULTIPLIER: 1.5,
  TIME_BONUS_THRESHOLD: 5000,
  TIME_BONUS_POINTS: 5,
  HINT_PENALTY: 2,
  REANSWER_PENALTY_MULTIPLIER: 0.5, // 50% points for re-answers
  REANSWER_THRESHOLD: 2, // Start penalizing after 2nd attempt

  // State
  state: {
    unitId: null,
    unitData: null,
    currentExerciseIndex: 0,
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    comboCount: 0,
    hintsUsed: 0,
    startTime: null,
    questionStartTime: null,
    isPlaying: false,
    completed: false,
    answerHistory: [], // Track all answers for summary
    timeBonusEarned: 0,
    comboBonusEarned: 0,
    // Re-answer tracking
    questionAttempts: {}, // Track attempts per question ID
    reAnswerCount: 0, // Total number of re-answers
    reAnswerPenaltyPoints: 0, // Total points lost due to re-answer penalties
    firstAttemptCorrect: 0 // Questions answered correctly on first try
  },

  // Exercise type handlers (populated dynamically)
  exerciseHandlers: {},

  /**
   * Initialize game with unit data
   * @param {Object} unitData - Unit data from JSON
   * @param {string} unitId - Unit ID
   */
  // Global navigation cleanup function
  navigationCleanup: null,

  init(unitData, unitId) {
    this.state = {
      unitId: unitId,
      unitData: unitData,
      currentExerciseIndex: 0,
      score: 0,
      correctAnswers: 0,
      totalQuestions: this.calculateTotalQuestions(unitData.exercises),
      comboCount: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      isPlaying: true,
      completed: false,
      answerHistory: [],
      timeBonusEarned: 0,
      comboBonusEarned: 0,
      // Re-answer tracking
      questionAttempts: {},
      reAnswerCount: 0,
      reAnswerPenaltyPoints: 0,
      firstAttemptCorrect: 0
    };

    // Setup global keyboard navigation
    this.setupGlobalNavigation();

    this.updateUI();
    this.renderCurrentExercise();
  },

  /**
   * Setup global arrow key navigation between exercises
   */
  setupGlobalNavigation() {
    // Cleanup previous handler if exists
    if (this.navigationCleanup) {
      this.navigationCleanup();
    }

    const self = this;

    const handler = (e) => {
      // Ignore if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Left arrow - previous exercise (only if answered)
      if (e.key === 'ArrowLeft') {
        const prevBtn = document.getElementById('nav-prev-btn');
        if (prevBtn && !prevBtn.disabled) {
          e.preventDefault();
          self.previousExercise();
        }
      }

      // Right arrow - next exercise (only if answered)
      if (e.key === 'ArrowRight') {
        const nextBtn = document.getElementById('nav-next-btn');
        if (nextBtn && nextBtn.dataset.answered === 'true') {
          e.preventDefault();
          self.nextExercise();
        }
      }
    };

    document.addEventListener('keydown', handler);
    this.navigationCleanup = () => document.removeEventListener('keydown', handler);
  },

  /**
   * Calculate total number of questions across all exercises
   * @param {Array} exercises - Array of exercise objects
   * @returns {number} - Total question count
   */
  calculateTotalQuestions(exercises) {
    return exercises.reduce((total, exercise) => {
      if (exercise.type === 'fill-blank-table') {
        return total + exercise.rows.length;
      } else if (exercise.type === 'dialogue-complete') {
        return total + exercise.lines.filter(line => line.blank).length;
      } else if (exercise.type === 'open-ended') {
        return total;
      } else {
        return total + 1;
      }
    }, 0);
  },

  /**
   * Register exercise type handler
   * @param {string} typeName - Exercise type name
   * @param {Object} handler - Exercise handler object
   */
  registerExerciseHandler(typeName, handler) {
    this.exerciseHandlers[typeName] = handler;
  },

  /**
   * Render current exercise
   */
  renderCurrentExercise() {
    const exercise = this.getCurrentExercise();
    if (!exercise) {
      this.completeGame();
      return;
    }

    const container = document.getElementById('exercise-container');
    if (!container) {
      console.error('Exercise container not found');
      return;
    }

    container.innerHTML = '';

    const handler = this.exerciseHandlers[exercise.type];
    if (!handler) {
      console.error(`No handler found for exercise type: ${exercise.type}`);
      return;
    }

    this.questionStartTime = Date.now();

    const callbacks = {
      onAnswer: (userAnswer) => this.handleAnswer(userAnswer, exercise),
      onHint: () => this.handleHint(exercise)
    };

    handler.render(exercise, container, callbacks);

    // Add navigation controls after rendering
    this.addNavigationControls(container);
  },

  /**
   * Add navigation controls (Previous/Next buttons) to exercise
   * @param {HTMLElement} container - Exercise container
   */
  addNavigationControls(container) {
    const existingNav = container.querySelector('.exercise-navigation');
    if (existingNav) {
      existingNav.remove();
    }

    const navDiv = Utils.createElement('div', { class: 'exercise-navigation' });

    const currentIndex = this.state.currentExerciseIndex;
    const totalExercises = this.state.unitData.exercises.length;

    // Previous button
    if (currentIndex > 0) {
      const prevBtn = Utils.createElement('button', {
        class: 'btn btn--secondary',
        id: 'nav-prev-btn'
      }, '← Câu trước');

      prevBtn.onclick = () => this.previousExercise();
      navDiv.appendChild(prevBtn);
    }

    // Question indicator
    const indicator = Utils.createElement('span', {
      class: 'exercise-navigation__indicator'
    }, `Câu ${currentIndex + 1} / ${totalExercises}`);
    navDiv.appendChild(indicator);

    // Next button (always show, but may be disabled)
    const nextBtn = Utils.createElement('button', {
      class: 'btn btn--primary',
      id: 'nav-next-btn'
    }, 'Câu tiếp theo →');

    nextBtn.dataset.answered = 'false';
    nextBtn.disabled = true;
    nextBtn.title = 'Vui lòng trả lời câu hỏi trước';

    nextBtn.onclick = () => {
      if (nextBtn.dataset.answered === 'true') {
        this.nextExercise();
      }
    };

    navDiv.appendChild(nextBtn);

    container.appendChild(navDiv);
  },

  /**
   * Go to a specific exercise by index
   * @param {number} index - Exercise index to jump to
   */
  goToExercise(index) {
    const totalExercises = this.state.unitData.exercises.length;
    if (index >= 0 && index < totalExercises) {
      this.state.currentExerciseIndex = index;
      this.renderCurrentExercise();
      this.updateUI();
      this.updateQuestionNavigator();
    }
  },

  /**
   * Render question navigator grouped by section/Đề
   * @param {HTMLElement} targetContainer - Container to render navigator into
   */
  renderQuestionNavigator(targetContainer) {
    const exercises = this.state.unitData.exercises;
    if (!exercises || exercises.length === 0) return;

    // Group exercises by section
    const sections = this.groupExercisesBySection(exercises);

    const navigator = Utils.createElement('div', {
      class: 'question-navigator',
      id: 'question-navigator'
    });

    // Header
    const header = Utils.createElement('div', { class: 'question-navigator__header' });
    header.innerHTML = `
      <span class="question-navigator__title">📋 Danh sách câu hỏi</span>
      <button class="question-navigator__toggle" id="nav-toggle-btn">▼</button>
    `;
    navigator.appendChild(header);

    // Sections container
    const sectionsContainer = Utils.createElement('div', { class: 'question-navigator__sections' });

    Object.entries(sections).forEach(([sectionName, sectionExercises]) => {
      const section = Utils.createElement('div', { class: 'question-navigator__section' });

      // Section header
      const sectionHeader = Utils.createElement('div', {
        class: 'question-navigator__section-header'
      }, sectionName);
      section.appendChild(sectionHeader);

      // Question grid
      const grid = Utils.createElement('div', { class: 'question-navigator__grid' });

      sectionExercises.forEach(({ exercise, originalIndex }) => {
        const btn = Utils.createElement('button', {
          class: 'question-navigator__btn',
          'data-index': originalIndex,
          title: `Câu ${exercise.id || originalIndex + 1}`
        }, String(exercise.id || originalIndex + 1));

        btn.onclick = () => this.goToExercise(originalIndex);
        grid.appendChild(btn);
      });

      section.appendChild(grid);
      sectionsContainer.appendChild(section);
    });

    navigator.appendChild(sectionsContainer);

    // Legend
    const legend = Utils.createElement('div', { class: 'question-navigator__legend' });
    legend.innerHTML = `
      <div class="question-navigator__legend-item">
        <div class="question-navigator__legend-dot question-navigator__legend-dot--current"></div>
        <span>Đang làm</span>
      </div>
      <div class="question-navigator__legend-item">
        <div class="question-navigator__legend-dot question-navigator__legend-dot--correct"></div>
        <span>Đúng</span>
      </div>
      <div class="question-navigator__legend-item">
        <div class="question-navigator__legend-dot question-navigator__legend-dot--wrong"></div>
        <span>Sai</span>
      </div>
    `;
    navigator.appendChild(legend);

    // Toggle functionality
    setTimeout(() => {
      const toggleBtn = document.getElementById('nav-toggle-btn');
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          navigator.classList.toggle('question-navigator--collapsed');
          toggleBtn.textContent = navigator.classList.contains('question-navigator--collapsed') ? '▶' : '▼';
        };
      }
    }, 0);

    targetContainer.insertBefore(navigator, targetContainer.firstChild);
  },

  /**
   * Group exercises by section
   * @param {Array} exercises - Array of exercises
   * @returns {Object} - Exercises grouped by section name
   */
  groupExercisesBySection(exercises) {
    const sections = {};

    exercises.forEach((exercise, index) => {
      // Extract section name (e.g., "ĐỀ 1 - Phonetics" -> "ĐỀ 1")
      let sectionName = 'Khác';
      if (exercise.section) {
        const match = exercise.section.match(/^(ĐỀ \d+)/i);
        if (match) {
          sectionName = match[1];
        } else {
          sectionName = exercise.section.split(' - ')[0] || exercise.section;
        }
      }

      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }

      sections[sectionName].push({
        exercise,
        originalIndex: index
      });
    });

    return sections;
  },

  /**
   * Update question navigator button states
   */
  updateQuestionNavigator() {
    const navigator = document.getElementById('question-navigator');
    if (!navigator) return;

    const buttons = navigator.querySelectorAll('.question-navigator__btn');
    buttons.forEach(btn => {
      const index = parseInt(btn.dataset.index, 10);

      // Remove all state classes
      btn.classList.remove(
        'question-navigator__btn--current',
        'question-navigator__btn--correct',
        'question-navigator__btn--wrong',
        'question-navigator__btn--answered'
      );

      // Add current class
      if (index === this.state.currentExerciseIndex) {
        btn.classList.add('question-navigator__btn--current');
      }

      // Check answer history for this question
      const exercise = this.state.unitData.exercises[index];
      if (exercise) {
        const questionId = exercise.id || `exercise-${index}`;
        const answerRecord = this.state.answerHistory.find(r => r.questionId === questionId);

        if (answerRecord) {
          if (answerRecord.isCorrect) {
            btn.classList.add('question-navigator__btn--correct');
          } else {
            btn.classList.add('question-navigator__btn--wrong');
          }
        }
      }
    });
  },

  /**
   * Enable the next button after answer is submitted
   */
  enableNextButton() {
    const nextBtn = document.getElementById('nav-next-btn');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.dataset.answered = 'true';
      nextBtn.title = '';
    }
  },

  /**
   * Get current exercise
   * @returns {Object|null} - Current exercise object
   */
  getCurrentExercise() {
    const exercises = this.state.unitData?.exercises;
    if (!exercises || this.state.currentExerciseIndex >= exercises.length) {
      return null;
    }
    return exercises[this.state.currentExerciseIndex];
  },

  /**
   * Handle user answer submission
   * @param {string|Array} userAnswer - User's answer
   * @param {Object} exercise - Exercise object
   */
  handleAnswer(userAnswer, exercise) {
    if (!this.state.isPlaying) return;

    const handler = this.exerciseHandlers[exercise.type];
    if (!handler) return;

    const isCorrect = handler.validate(userAnswer, exercise);
    const container = document.getElementById('exercise-container');

    // Get correct answer and question text based on exercise type
    let correctAnswer = '';
    let questionText = '';

    if (exercise.type === 'multiple-choice') {
      correctAnswer = exercise.options?.[exercise.correctIndex];
      questionText = exercise.question;
    } else if (exercise.type === 'vocabulary-match') {
      correctAnswer = exercise.pairs?.map(p => `${p.english} = ${p.vietnamese}`).join(', ');
      questionText = `Match vocabulary pairs (${exercise.pairs?.length || 0} pairs)`;
    } else if (exercise.type === 'word-rearrange') {
      // Use standardized correctSentence field (see scripts/unify-exercise-data.js)
      correctAnswer = exercise.correctSentence || '';
      questionText = `Arrange: ${correctAnswer}`;
    } else if (exercise.type === 'fill-blank') {
      correctAnswer = exercise.answer;
      questionText = exercise.question;
    } else {
      correctAnswer = exercise.answer || '';
      questionText = exercise.question || exercise.title || `Câu ${exercise.id}`;
    }

    // Check if this is a re-answer
    const questionId = exercise.id || `exercise-${this.state.currentExerciseIndex}`;
    const previousAttempts = this.state.questionAttempts[questionId] || 0;
    const isReAnswer = previousAttempts > 0;
    const attemptNumber = previousAttempts + 1;

    // Update attempt count
    this.state.questionAttempts[questionId] = attemptNumber;

    const answerRecord = {
      questionId: questionId,
      questionText: questionText,
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      exercise: exercise,
      timeSpent: Date.now() - this.questionStartTime,
      points: 0,
      attemptNumber: attemptNumber,
      isReAnswer: isReAnswer
    };

    if (isCorrect) {
      const points = this.handleCorrectAnswer(exercise, isReAnswer, attemptNumber);
      answerRecord.points = points;
      answerRecord.originalPoints = this.calculateOriginalPoints(exercise);
      answerRecord.penaltyApplied = isReAnswer && attemptNumber >= this.REANSWER_THRESHOLD;

      // Track first attempt correct answers
      if (!isReAnswer && attemptNumber === 1) {
        this.state.firstAttemptCorrect++;
      }

      handler.showFeedback(container, true, exercise);
      Utils.playSound('correct');
    } else {
      this.handleWrongAnswer();
      answerRecord.points = 0;
      answerRecord.originalPoints = 0;
      answerRecord.penaltyApplied = false;
      handler.showFeedback(container, false, exercise);
      Utils.playSound('wrong');
    }

    this.state.answerHistory.push(answerRecord);
    this.updateUI();

    // Enable next button after answer is submitted
    this.enableNextButton();

    // Update question navigator
    this.updateQuestionNavigator();
  },

  /**
   * Handle correct answer
   * @param {Object} exercise - Exercise object
   * @returns {number} - Points earned
   */
  handleCorrectAnswer(exercise) {
    this.state.correctAnswers++;
    this.state.comboCount++;

    let points = exercise.points || this.POINTS_PER_QUESTION;
    let timeBonus = 0;
    let comboBonus = 0;

    const questionTime = Date.now() - this.questionStartTime;
    if (questionTime < this.TIME_BONUS_THRESHOLD) {
      timeBonus = this.TIME_BONUS_POINTS;
      points += timeBonus;
      this.state.timeBonusEarned += timeBonus;
    }

    if (this.state.comboCount >= 3) {
      const bonusPoints = Math.floor(points * (this.COMBO_MULTIPLIER - 1));
      comboBonus = bonusPoints;
      points = Math.floor(points * this.COMBO_MULTIPLIER);
      this.state.comboBonusEarned += comboBonus;
    }

    this.state.score += points;
    return points;
  },

  /**
   * Handle wrong answer
   */
  handleWrongAnswer() {
    this.state.comboCount = 0;
  },

  /**
   * Calculate original points for an exercise (before bonuses/penalties)
   * @param {Object} exercise - Exercise object
   * @returns {number} - Base points for the exercise
   */
  calculateOriginalPoints(exercise) {
    return exercise.points || this.POINTS_PER_QUESTION;
  },

  /**
   * Handle hint request
   * @param {Object} exercise - Exercise object
   */
  handleHint(exercise) {
    if (!exercise.hints || exercise.hints.length === 0) {
      Utils.showToast('No hints available for this question', 'info');
      return;
    }

    const hintIndex = this.state.hintsUsed % exercise.hints.length;
    const hint = exercise.hints[hintIndex];

    Utils.showToast(hint, 'info', 5000);
    this.state.hintsUsed++;
    this.state.score = Math.max(0, this.state.score - this.HINT_PENALTY);
    this.updateUI();
  },

  /**
   * Move to previous exercise
   */
  previousExercise() {
    if (this.state.currentExerciseIndex > 0) {
      this.state.currentExerciseIndex--;
      this.renderCurrentExercise();
      this.updateUI();
    }
  },

  /**
   * Move to next exercise
   */
  nextExercise() {
    this.state.currentExerciseIndex++;
    this.renderCurrentExercise();
    this.updateUI();
  },

  /**
   * Complete the game
   */
  completeGame() {
    this.state.isPlaying = false;
    this.state.completed = true;

    const timeSpent = Math.floor((Date.now() - this.state.startTime) / 1000);
    const percentage = Utils.calculatePercentage(
      this.state.correctAnswers,
      this.state.totalQuestions
    );
    const stars = Utils.getStarRating(percentage);

    const progressData = {
      score: this.state.score,
      correctAnswers: this.state.correctAnswers,
      totalQuestions: this.state.totalQuestions,
      stars: stars,
      completed: true,
      timeSpent: timeSpent
    };

    Storage.saveUnitProgress(this.state.unitId, progressData);

    this.sendResultsToTelegram(percentage, stars, timeSpent);

    this.showCompletionScreen(percentage, stars, timeSpent);
    Utils.playSound('complete');
  },

  /**
   * Send results to Telegram
   * @param {number} percentage - Score percentage
   * @param {number} stars - Number of stars earned
   * @param {number} timeSpent - Time spent in seconds
   */
  async sendResultsToTelegram(percentage, stars, timeSpent) {
    if (typeof TelegramSender === 'undefined') {
      console.warn('TelegramSender not loaded, skipping result submission');
      return;
    }

    try {
      const resultData = {
        studentName: TelegramSender.getStudentName(),
        teacherName: TelegramSender.getTeacherName(),
        unitTitle: this.state.unitData.title || this.state.unitId,
        grammarTopics: this.state.unitData.grammarTopics || [],
        score: this.state.score,
        correctAnswers: this.state.correctAnswers,
        totalQuestions: this.state.totalQuestions,
        percentage: percentage,
        stars: stars,
        timeSpent: timeSpent,
        hintsUsed: this.state.hintsUsed,
        timeBonusEarned: this.state.timeBonusEarned,
        comboBonusEarned: this.state.comboBonusEarned,
        answerHistory: this.state.answerHistory,
        completedAt: new Date().toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      };

      const success = await TelegramSender.sendResults(resultData);

      if (success) {
        console.log('Results sent to Telegram successfully');
      } else {
        console.warn('Failed to send results to Telegram');
      }
    } catch (error) {
      console.error('Error sending results to Telegram:', error);
    }
  },

  /**
   * Show completion screen
   * @param {number} percentage - Score percentage
   * @param {number} stars - Number of stars earned
   * @param {number} timeSpent - Time spent in seconds
   */
  showCompletionScreen(percentage, stars, timeSpent) {
    const container = document.getElementById('exercise-container');
    if (!container) return;

    container.innerHTML = '';

    // Main completion card
    const completionCard = Utils.createElement('div', {
      class: 'card completion-card fade-in'
    });

    // Title and stars
    const title = Utils.createElement('h2', { class: 'completion__title' }, '🎉 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH!');

    const starsContainer = Utils.createElement('div', { class: 'stars completion__stars' });
    for (let i = 0; i < 3; i++) {
      const star = Utils.createElement('span', {
        class: i < stars ? 'star star--filled star--animating' : 'star'
      }, '★');
      starsContainer.appendChild(star);
    }

    // Score summary section
    const summarySection = Utils.createElement('div', { class: 'completion__summary' });
    summarySection.innerHTML = `
      <h3 class="completion__section-title">BẢNG ĐIỂM CHI TIẾT</h3>
      <div class="summary__grid">
        <div class="summary__item summary__item--highlight">
          <span class="summary__label">Tổng điểm</span>
          <span class="summary__value">⭐ ${this.state.score} điểm</span>
        </div>
        <div class="summary__item">
          <span class="summary__label">Số câu đúng</span>
          <span class="summary__value">${this.state.correctAnswers}/${this.state.totalQuestions} (${percentage}%)</span>
        </div>
        <div class="summary__item">
          <span class="summary__label">Thời gian</span>
          <span class="summary__value">${Utils.formatTime(timeSpent)}</span>
        </div>
        <div class="summary__item">
          <span class="summary__label">Gợi ý sử dụng</span>
          <span class="summary__value">${this.state.hintsUsed} (-${this.state.hintsUsed * this.HINT_PENALTY} điểm)</span>
        </div>
        <div class="summary__item summary__item--bonus">
          <span class="summary__label">Điểm thưởng combo</span>
          <span class="summary__value">+${this.state.comboBonusEarned} điểm</span>
        </div>
        <div class="summary__item summary__item--bonus">
          <span class="summary__label">Điểm thưởng thời gian</span>
          <span class="summary__value">+${this.state.timeBonusEarned} điểm</span>
        </div>
      </div>
    `;

    // Answer history table
    const historySection = this.createAnswerHistoryTable();

    // Corrections section (wrong answers only)
    const correctionsSection = this.createCorrectionsSection();

    // Action buttons
    const buttonContainer = Utils.createElement('div', {
      class: 'completion__actions'
    });

    const retryBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, '🔄 Làm lại');
    retryBtn.onclick = () => this.restart();

    const printBtn = Utils.createElement('button', {
      class: 'btn btn--secondary'
    }, '🖨️ In kết quả');
    printBtn.onclick = () => window.print();

    const homeBtn = Utils.createElement('button', {
      class: 'btn btn--secondary'
    }, '🏠 Về trang chủ');
    homeBtn.onclick = () => window.location.href = '../index.html';

    buttonContainer.appendChild(retryBtn);
    buttonContainer.appendChild(printBtn);
    buttonContainer.appendChild(homeBtn);

    // Assemble card
    completionCard.appendChild(title);
    completionCard.appendChild(starsContainer);
    completionCard.appendChild(summarySection);
    completionCard.appendChild(historySection);

    // Show corrections or perfect score message
    if (correctionsSection) {
      completionCard.appendChild(correctionsSection);
    } else {
      // Perfect score celebration
      const perfectSection = Utils.createElement('div', { class: 'completion__perfect' });
      perfectSection.innerHTML = `
        <div class="perfect-score">
          <div class="perfect-score__icon">🏆</div>
          <h3 class="perfect-score__title">HOÀN HẢO!</h3>
          <p class="perfect-score__message">
            Xuất sắc! Bạn đã trả lời đúng tất cả ${this.state.totalQuestions} câu hỏi!
            Tiếp tục phát huy nhé! 💯
          </p>
        </div>
      `;
      completionCard.appendChild(perfectSection);
    }

    completionCard.appendChild(buttonContainer);

    container.appendChild(completionCard);
  },

  /**
   * Create answer history table
   * @returns {HTMLElement} - History table element
   */
  createAnswerHistoryTable() {
    const section = Utils.createElement('div', { class: 'completion__history' });
    section.innerHTML = '<h3 class="completion__section-title">CHI TIẾT CÂU TRẢ LỜI</h3>';

    const table = Utils.createElement('table', { class: 'history-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Câu</th>
          <th>Câu trả lời của bạn</th>
          <th>Đáp án đúng</th>
          <th>Kết quả</th>
          <th>Điểm</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    this.state.answerHistory.forEach((record, index) => {
      const row = tbody.insertRow();
      row.className = record.isCorrect ? 'history-row--correct' : 'history-row--wrong';

      row.innerHTML = `
        <td>${index + 1}</td>
        <td class="history-cell--answer">${this.formatAnswer(record.userAnswer)}</td>
        <td class="history-cell--correct">${this.formatAnswer(record.correctAnswer)}</td>
        <td class="history-cell--status">${record.isCorrect ? '✓ Đúng' : '✗ Sai'}</td>
        <td class="history-cell--points">${record.points} điểm</td>
      `;
    });

    section.appendChild(table);
    return section;
  },

  /**
   * Create corrections section for wrong answers
   * @returns {HTMLElement|null} - Corrections section or null
   */
  createCorrectionsSection() {
    const wrongAnswers = this.state.answerHistory.filter(r => !r.isCorrect);
    if (wrongAnswers.length === 0) return null;

    const section = Utils.createElement('div', { class: 'completion__corrections' });
    section.innerHTML = `<h3 class="completion__section-title">CÂU SAI CẦN XEM LẠI (${wrongAnswers.length} câu)</h3>`;

    wrongAnswers.forEach((record, index) => {
      const correctionCard = Utils.createElement('div', { class: 'correction-item' });
      correctionCard.innerHTML = `
        <div class="correction__question">
          <strong>Câu ${this.state.answerHistory.indexOf(record) + 1}:</strong> ${record.questionText}
        </div>
        <div class="correction__answer correction__answer--wrong">
          ❌ Câu trả lời của bạn: <strong>${this.formatAnswer(record.userAnswer)}</strong>
        </div>
        <div class="correction__answer correction__answer--correct">
          ✓ Đáp án đúng: <strong>${this.formatAnswer(record.correctAnswer)}</strong>
        </div>
        ${record.exercise.explanation ? `
          <div class="correction__explanation">
            💡 Giải thích: ${record.exercise.explanation}
          </div>
        ` : ''}
      `;
      section.appendChild(correctionCard);
    });

    return section;
  },

  /**
   * Format answer for display
   * @param {any} answer - Answer to format
   * @returns {string} - Formatted answer
   */
  formatAnswer(answer) {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (typeof answer === 'object' && answer !== null) {
      return JSON.stringify(answer);
    }
    return String(answer || '(không trả lời)');
  },

  /**
   * Restart game
   */
  restart() {
    this.init(this.state.unitData, this.state.unitId);
  },

  /**
   * Update UI elements (score, progress, etc.)
   */
  updateUI() {
    const scoreElement = document.getElementById('current-score');
    if (scoreElement) {
      scoreElement.textContent = `⭐ ${this.state.score}`;
    }

    const progressElement = document.getElementById('progress-count');
    if (progressElement) {
      progressElement.textContent = `${this.state.currentExerciseIndex + 1} / ${this.state.unitData.exercises.length}`;
    }

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      const progress = Utils.calculatePercentage(
        this.state.currentExerciseIndex,
        this.state.unitData.exercises.length
      );
      progressBar.style.width = `${progress}%`;
    }

    const comboElement = document.getElementById('combo-count');
    if (comboElement) {
      comboElement.textContent = this.state.comboCount;
      comboElement.style.display = this.state.comboCount >= 3 ? 'inline' : 'none';
    }
  },

  /**
   * Get current game state
   * @returns {Object} - Current state
   */
  getState() {
    return { ...this.state };
  },

  /**
   * Pause game
   */
  pause() {
    this.state.isPlaying = false;
  },

  /**
   * Resume game
   */
  resume() {
    this.state.isPlaying = true;
    this.questionStartTime = Date.now();
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
