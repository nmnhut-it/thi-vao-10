/**
 * Reading Comprehension Exercise Type
 * Display a passage with multiple-choice questions
 * Supports showing all questions at once or one at a time
 */

const ReadingComprehensionExercise = {
  // Track state for current exercise
  currentState: {
    answeredQuestions: {},
    totalQuestions: 0,
    exerciseId: null
  },

  // Track current focused question index for keyboard navigation
  focusedQuestionIndex: 0,

  render(exercise, container, callbacks) {
    container.innerHTML = '';

    // Reset state for new exercise
    this.currentState = {
      answeredQuestions: {},
      totalQuestions: exercise.questions?.length || 0,
      exerciseId: exercise.id
    };

    // Reset focused question
    this.focusedQuestionIndex = 0;

    const exerciseCard = Utils.createElement('div', {
      class: 'card exercise reading-exercise'
    });

    // Exercise header
    const header = Utils.createElement('div', { class: 'reading-exercise__header' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, exercise.title || `Đề ${exercise.id}`);
    header.appendChild(exerciseNum);

    // Passage section
    const passageSection = Utils.createElement('div', { class: 'reading-exercise__passage' });

    const passageTitle = Utils.createElement('h3', {
      class: 'reading-exercise__passage-title'
    }, '📖 Đọc đoạn văn sau:');
    passageSection.appendChild(passageTitle);

    const passageBox = Utils.createElement('div', { class: 'passage-box' });

    // Support multiple paragraphs
    if (Array.isArray(exercise.passage)) {
      exercise.passage.forEach((para, idx) => {
        const p = Utils.createElement('p', {});
        p.innerHTML = para;
        passageBox.appendChild(p);
      });
    } else {
      // Single string passage - split by double newline for paragraphs
      const paragraphs = exercise.passage.split(/\n\n+/);
      paragraphs.forEach(para => {
        const p = Utils.createElement('p', {});
        p.innerHTML = para.replace(/\n/g, '<br>');
        passageBox.appendChild(p);
      });
    }

    passageSection.appendChild(passageBox);

    // Toggle button for passage (collapse/expand)
    const toggleBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small reading-exercise__toggle',
      type: 'button'
    }, '📖 Thu gọn đoạn văn');

    toggleBtn.onclick = () => {
      passageBox.classList.toggle('passage-box--collapsed');
      toggleBtn.textContent = passageBox.classList.contains('passage-box--collapsed')
        ? '📖 Mở rộng đoạn văn'
        : '📖 Thu gọn đoạn văn';
    };
    passageSection.appendChild(toggleBtn);

    // Questions section
    const questionsSection = Utils.createElement('div', { class: 'reading-exercise__questions' });

    const questionsTitle = Utils.createElement('h3', {
      class: 'reading-exercise__questions-title'
    }, `📝 Trả lời các câu hỏi (${exercise.questions.length} câu):`);
    questionsSection.appendChild(questionsTitle);

    // Render each question
    exercise.questions.forEach((q, qIndex) => {
      const questionDiv = this.renderQuestion(q, qIndex, exercise, callbacks);
      questionsSection.appendChild(questionDiv);
    });

    // Submit all button
    const actionsDiv = Utils.createElement('div', { class: 'reading-exercise__actions' });

    const submitAllBtn = Utils.createElement('button', {
      class: 'btn btn--primary btn--large',
      id: 'submit-all-btn'
    }, '✓ Nộp bài');

    submitAllBtn.onclick = () => this.handleSubmitAll(exercise, container, callbacks);
    actionsDiv.appendChild(submitAllBtn);

    // Hint button if any question has hints
    const hasHints = exercise.questions.some(q => q.hints && q.hints.length > 0);
    if (hasHints || (exercise.hints && exercise.hints.length > 0)) {
      const hintBtn = Utils.createElement('button', {
        class: 'btn btn--secondary'
      }, '💡 Gợi ý');
      hintBtn.onclick = () => callbacks.onHint();
      actionsDiv.appendChild(hintBtn);
    }

    // Assemble
    exerciseCard.appendChild(header);
    exerciseCard.appendChild(passageSection);
    exerciseCard.appendChild(questionsSection);
    exerciseCard.appendChild(actionsDiv);

    container.appendChild(exerciseCard);

    // Attach keyboard handler
    this.attachKeyboardHandler(exercise, container, callbacks);
  },

  /**
   * Attach keyboard handler for reading comprehension
   * Supports navigation between questions and answer selection
   */
  attachKeyboardHandler(exercise, container, callbacks) {
    const self = this;
    const questionCount = exercise.questions.length;

    // Focus first question visually
    this.updateQuestionFocus(container, 0);

    const handler = (e) => {
      // Ignore if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key;

      // Navigate between questions with Up/Down
      if (key === 'ArrowDown') {
        e.preventDefault();
        self.focusedQuestionIndex = Math.min(self.focusedQuestionIndex + 1, questionCount - 1);
        self.updateQuestionFocus(container, self.focusedQuestionIndex);
        self.scrollToQuestion(container, self.focusedQuestionIndex);
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        self.focusedQuestionIndex = Math.max(self.focusedQuestionIndex - 1, 0);
        self.updateQuestionFocus(container, self.focusedQuestionIndex);
        self.scrollToQuestion(container, self.focusedQuestionIndex);
      }

      // Handle answer selection (1-4 or A-D)
      const mcMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      if (mcMap.hasOwnProperty(key)) {
        const question = exercise.questions[self.focusedQuestionIndex];
        if (question && mcMap[key] < question.options.length) {
          e.preventDefault();
          self.selectAnswer(container, exercise, self.focusedQuestionIndex, mcMap[key]);
        }
      }

      // Submit on Enter
      if (key === 'Enter') {
        e.preventDefault();
        self.handleSubmitAll(exercise, container, callbacks);
      }
    };

    // Store handler for cleanup
    Utils.KeyboardHelper.cleanup();
    document.addEventListener('keydown', handler);
    Utils.KeyboardHelper.activeHandler = handler;

    // Show keyboard hint
    this.showKeyboardHint(container, exercise.questions[0]?.options?.length || 4);
  },

  /**
   * Update visual focus on question
   */
  updateQuestionFocus(container, index) {
    const questions = container.querySelectorAll('.reading-question');
    questions.forEach((q, i) => {
      q.classList.toggle('reading-question--focused', i === index);
    });
  },

  /**
   * Scroll to focused question
   */
  scrollToQuestion(container, index) {
    const questions = container.querySelectorAll('.reading-question');
    if (questions[index]) {
      questions[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  /**
   * Select answer for a question
   */
  selectAnswer(container, exercise, questionIndex, optionIndex) {
    const questionDiv = container.querySelector(`[data-question-index="${questionIndex}"]`);
    if (!questionDiv) return;

    const radios = questionDiv.querySelectorAll('input[type="radio"]');
    if (radios[optionIndex]) {
      radios[optionIndex].checked = true;
      radios[optionIndex].dispatchEvent(new Event('change'));
    }
  },

  /**
   * Show keyboard hint for reading comprehension
   */
  showKeyboardHint(container, optionCount) {
    const existing = container.querySelector('.keyboard-hint');
    if (existing) existing.remove();

    const keys = ['1', '2', '3', '4'].slice(0, optionCount).join('/');
    const letters = ['A', 'B', 'C', 'D'].slice(0, optionCount).join('/');
    const hintText = `⌨️ Phím tắt: ↑↓ chuyển câu | ${keys} hoặc ${letters} chọn đáp án | Enter nộp bài`;

    const hint = Utils.createElement('div', { class: 'keyboard-hint' }, hintText);
    container.appendChild(hint);
  },

  renderQuestion(question, index, exercise, callbacks) {
    const questionDiv = Utils.createElement('div', {
      class: 'reading-question',
      dataset: { questionIndex: index }
    });

    // Question text
    const questionText = Utils.createElement('p', {
      class: 'reading-question__text'
    });
    questionText.innerHTML = `<strong>${index + 1}.</strong> ${question.question}`;
    questionDiv.appendChild(questionText);

    // Options
    const optionsList = Utils.createElement('ul', { class: 'choice-list reading-question__options' });

    // Get options - shuffle if not in test mode
    const optionsWithIndex = question.options.map((text, idx) => ({ text, originalIndex: idx }));
    const displayOptions = Utils.isTestMode ? optionsWithIndex : Utils.shuffleArray(optionsWithIndex);

    displayOptions.forEach((option, optIdx) => {
      const li = Utils.createElement('li', { class: 'choice-item' });
      const label = Utils.createElement('label', { class: 'choice-label' });

      const radio = Utils.createElement('input', {
        type: 'radio',
        name: `reading-q-${exercise.id}-${index}`,
        value: option.originalIndex,
        class: 'choice-input',
        id: `reading-q-${exercise.id}-${index}-opt-${optIdx}`
      });
      radio.dataset.originalIndex = option.originalIndex;

      radio.addEventListener('change', () => {
        // Update visual selection
        const labels = optionsList.querySelectorAll('.choice-label');
        labels.forEach(lbl => lbl.classList.remove('choice-label--selected'));
        label.classList.add('choice-label--selected');

        // Track answer
        this.currentState.answeredQuestions[index] = parseInt(option.originalIndex);
      });

      const optionText = Utils.createElement('span', { class: 'choice-text' }, option.text);

      label.appendChild(radio);
      label.appendChild(optionText);
      li.appendChild(label);
      optionsList.appendChild(li);
    });

    questionDiv.appendChild(optionsList);

    // Explanation box (hidden initially)
    const explanationBox = Utils.createElement('div', {
      class: 'explanation-box',
      id: `explanation-${exercise.id}-${index}`
    });
    questionDiv.appendChild(explanationBox);

    return questionDiv;
  },

  handleSubmitAll(exercise, container, callbacks) {
    const questions = exercise.questions;
    const answered = this.currentState.answeredQuestions;

    // Check if all questions are answered
    const unanswered = [];
    questions.forEach((q, idx) => {
      if (answered[idx] === undefined) {
        unanswered.push(idx + 1);
      }
    });

    if (unanswered.length > 0) {
      Utils.showToast(`Vui lòng trả lời câu ${unanswered.join(', ')}`, 'error');
      return;
    }

    // Calculate results
    let correctCount = 0;
    const results = questions.map((q, idx) => {
      const userAnswer = answered[idx];
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionIndex: idx,
        userAnswer,
        correctIndex: q.correctIndex,
        isCorrect
      };
    });

    // Show feedback for each question
    this.showAllFeedback(exercise, container, results);

    // Disable submit button
    const submitBtn = container.querySelector('#submit-all-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = `✓ Đã nộp (${correctCount}/${questions.length} đúng)`;
    }

    // Disable all radio buttons
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(r => r.disabled = true);

    // Build answer object for game engine
    // We pass an object containing all answers for this reading exercise
    const answerData = {
      answers: answered,
      correctCount: correctCount,
      totalQuestions: questions.length,
      isAllCorrect: correctCount === questions.length,
      results: results
    };

    // Call the answer callback
    callbacks.onAnswer(answerData);
  },

  showAllFeedback(exercise, container, results) {
    results.forEach((result, idx) => {
      const question = exercise.questions[idx];
      const questionDiv = container.querySelector(`[data-question-index="${idx}"]`);
      if (!questionDiv) return;

      // Highlight correct/wrong
      const options = questionDiv.querySelectorAll('.choice-item');
      options.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        const originalIdx = parseInt(radio.dataset.originalIndex);

        if (originalIdx === question.correctIndex) {
          opt.classList.add('choice-item--correct');
        } else if (originalIdx === result.userAnswer && !result.isCorrect) {
          opt.classList.add('choice-item--wrong');
        }
      });

      // Add result icon to question
      const questionText = questionDiv.querySelector('.reading-question__text');
      if (questionText) {
        const icon = result.isCorrect ? '✓' : '✗';
        const iconClass = result.isCorrect ? 'result-icon--correct' : 'result-icon--wrong';
        const iconSpan = Utils.createElement('span', { class: `result-icon ${iconClass}` }, ` ${icon}`);
        questionText.appendChild(iconSpan);
      }

      // Show explanation
      const explanationBox = questionDiv.querySelector('.explanation-box');
      if (explanationBox && question.explanation) {
        explanationBox.innerHTML = `
          <p class="explanation-box__title">${result.isCorrect ? '✓ Đúng!' : '✗ Chưa đúng'}</p>
          <div class="explanation-box__content">
            ${!result.isCorrect ? `<p><strong>Đáp án đúng:</strong> ${question.options[question.correctIndex]}</p>` : ''}
            <p>${question.explanation}</p>
          </div>
        `;
        explanationBox.classList.add('show');
      }

      // Mark question div with result
      questionDiv.classList.add(result.isCorrect ? 'reading-question--correct' : 'reading-question--wrong');
    });
  },

  validate(userAnswer, exercise) {
    // userAnswer is the answerData object from handleSubmitAll
    if (!userAnswer || typeof userAnswer !== 'object') return false;

    // Consider correct if majority of questions are correct (>= 50%)
    // Or use isAllCorrect for strict mode
    const percentage = (userAnswer.correctCount / userAnswer.totalQuestions) * 100;

    // For partial credit, always return true so points can be calculated
    // The actual score will be based on correctCount
    return userAnswer.correctCount > 0 || userAnswer.isAllCorrect;
  },

  getUserAnswer(container) {
    return this.currentState.answeredQuestions;
  },

  showFeedback(container, isCorrect, exercise) {
    // Feedback is already shown in handleSubmitAll
    // This is called by game engine after validation
    const exerciseCard = container.querySelector('.reading-exercise');
    if (exerciseCard) {
      exerciseCard.classList.add(isCorrect ? 'exercise--correct' : 'exercise--attempted');
    }
  },

  reset(container) {
    this.currentState = {
      answeredQuestions: {},
      totalQuestions: 0,
      exerciseId: null
    };

    // Reset UI
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(r => {
      r.checked = false;
      r.disabled = false;
    });

    const labels = container.querySelectorAll('.choice-label');
    labels.forEach(lbl => lbl.classList.remove('choice-label--selected'));

    const items = container.querySelectorAll('.choice-item');
    items.forEach(item => {
      item.classList.remove('choice-item--correct', 'choice-item--wrong');
    });

    const questionDivs = container.querySelectorAll('.reading-question');
    questionDivs.forEach(div => {
      div.classList.remove('reading-question--correct', 'reading-question--wrong');
    });

    const explanations = container.querySelectorAll('.explanation-box');
    explanations.forEach(exp => {
      exp.classList.remove('show');
      exp.innerHTML = '';
    });

    const resultIcons = container.querySelectorAll('.result-icon');
    resultIcons.forEach(icon => icon.remove());

    const submitBtn = container.querySelector('#submit-all-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Nộp bài';
    }
  }
};

// Register with game engine
if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('reading-comprehension', ReadingComprehensionExercise);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReadingComprehensionExercise;
}
