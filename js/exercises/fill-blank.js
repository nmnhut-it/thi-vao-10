/**
 * Fill-in-the-Blank Exercise Type
 * Standard fill-in exercise with single blank per question
 */

const FillBlankExercise = {
  /**
   * Render the UI for fill-blank exercise
   * @param {Object} question - Question data from JSON
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} callbacks - { onAnswer, onHint }
   */
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const questionText = Utils.createElement('div', {
      class: 'exercise__question'
    });
    questionText.innerHTML = question.question;

    const inputGroup = Utils.createElement('div', { class: 'input-group' });

    const input = Utils.createElement('input', {
      type: 'text',
      class: 'input',
      id: `answer-${question.id}`,
      placeholder: 'Nhập câu trả lời của bạn...',
      autocomplete: 'off'
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const userAnswer = input.value.trim();
        if (!Utils.isEmpty(userAnswer)) {
          callbacks.onAnswer(userAnswer);
        }
      }
    });

    inputGroup.appendChild(input);

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Nộp bài');

    submitBtn.onclick = () => {
      const userAnswer = input.value.trim();
      if (Utils.isEmpty(userAnswer)) {
        Utils.showToast('Vui lòng nhập câu trả lời', 'error');
        return;
      }
      callbacks.onAnswer(userAnswer);
    };

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small'
    }, '💡 Gợi ý');

    hintBtn.onclick = () => {
      callbacks.onHint();
    };

    actions.appendChild(submitBtn);
    if (question.hints && question.hints.length > 0) {
      actions.appendChild(hintBtn);
    }

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(questionText);
    exerciseCard.appendChild(inputGroup);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    input.focus();
  },

  /**
   * Validate student answer
   * @param {string} userAnswer - Student's answer
   * @param {Object} question - Question data
   * @returns {boolean} - True if correct
   */
  validate(userAnswer, question) {
    const acceptedAnswers = question.acceptedAnswers || [question.answer];
    return Utils.validateAnswer(userAnswer, acceptedAnswers);
  },

  /**
   * Get user's current answer from UI
   * @param {HTMLElement} container - DOM element containing the exercise
   * @returns {string} - Current user answer
   */
  getUserAnswer(container) {
    const input = container.querySelector('input[type="text"]');
    return input ? input.value.trim() : '';
  },

  /**
   * Show visual feedback for correct/wrong answer
   * @param {HTMLElement} container - DOM element
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {Object} question - Question data
   */
  showFeedback(container, isCorrect, question) {
    const input = container.querySelector('input[type="text"]');
    const actions = container.querySelector('.exercise__actions');

    if (!input || !actions) return;

    input.disabled = true;

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    if (isCorrect) {
      input.classList.add('correct-answer');
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <span>Đúng rồi! Giỏi lắm!</span>
      `;
    } else {
      input.classList.add('wrong-answer');
      const correctAnswer = question.answer;
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <div>
          <div>Chưa đúng.</div>
          <div class="feedback__correct-answer">Đáp án đúng: <strong>${correctAnswer}</strong></div>
        </div>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  /**
   * Reset exercise for retry
   * @param {HTMLElement} container - DOM element
   */
  reset(container) {
    const input = container.querySelector('input[type="text"]');
    if (input) {
      input.value = '';
      input.disabled = false;
      input.classList.remove('correct-answer', 'wrong-answer');
      input.focus();
    }

    const feedback = container.querySelector('.feedback');
    if (feedback) {
      feedback.remove();
    }

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

// Register with game engine when loaded
if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('fill-blank', FillBlankExercise);
}
