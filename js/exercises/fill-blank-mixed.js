/**
 * Fill-Blank-Mixed Exercise Type
 * Fill multiple blanks within one sentence
 */

const FillBlankMixedExercise = {
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const questionText = Utils.createElement('div', {
      class: 'exercise__question'
    });

    let template = question.template;
    const inputs = [];

    question.blanks.forEach((blank, index) => {
      const inputId = `blank-${question.id}-${blank.blankId}`;
      const inputHTML = `<input type="text" class="input" id="${inputId}"
        data-blank-id="${blank.blankId}" placeholder="..." style="display: inline-block; width: 150px; margin: 0 4px;">`;

      template = template.replace(`_${blank.blankId}_`, inputHTML);
    });

    questionText.innerHTML = template;

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Xong');

    submitBtn.onclick = () => {
      const answers = [];
      let hasEmpty = false;

      question.blanks.forEach(blank => {
        const input = questionText.querySelector(`[data-blank-id="${blank.blankId}"]`);
        if (input) {
          const value = input.value.trim();
          if (Utils.isEmpty(value)) {
            hasEmpty = true;
          }
          answers.push({
            blankId: blank.blankId,
            value: value
          });
        }
      });

      if (hasEmpty) {
        Utils.showToast('Please fill all blanks', 'error');
        return;
      }

      callbacks.onAnswer(answers);
    };

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small'
    }, '💡 Hint');

    hintBtn.onclick = () => callbacks.onHint();

    actions.appendChild(submitBtn);
    if (question.hints && question.hints.length > 0) {
      actions.appendChild(hintBtn);
    }

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(questionText);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    const firstInput = questionText.querySelector('input');
    if (firstInput) firstInput.focus();
  },

  validate(userAnswers, question) {
    let allCorrect = true;

    question.blanks.forEach((blank) => {
      const userAnswer = userAnswers.find(a => a.blankId === blank.blankId);
      if (!userAnswer) {
        allCorrect = false;
        return;
      }

      const acceptedAnswers = blank.acceptedAnswers || [blank.answer];
      if (!Utils.validateAnswer(userAnswer.value, acceptedAnswers)) {
        allCorrect = false;
      }
    });

    return allCorrect;
  },

  getUserAnswer(container) {
    const answers = [];
    const inputs = container.querySelectorAll('input[data-blank-id]');
    inputs.forEach(input => {
      answers.push({
        blankId: parseInt(input.dataset.blankId),
        value: input.value.trim()
      });
    });
    return answers;
  },

  showFeedback(container, isCorrect, question) {
    const actions = container.querySelector('.exercise__actions');
    const inputs = container.querySelectorAll('input[data-blank-id]');

    inputs.forEach(input => {
      input.disabled = true;
      const blankId = parseInt(input.dataset.blankId);
      const blank = question.blanks.find(b => b.blankId === blankId);

      if (blank) {
        const acceptedAnswers = blank.acceptedAnswers || [blank.answer];
        if (Utils.validateAnswer(input.value, acceptedAnswers)) {
          input.classList.add('correct-answer');
        } else {
          input.classList.add('wrong-answer');
        }
      }
    });

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    if (isCorrect) {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <span>All correct! Excellent!</span>
      `;
    } else {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <span>Some answers need correction. Check the highlighted blanks.</span>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  reset(container) {
    const inputs = container.querySelectorAll('input[data-blank-id]');
    inputs.forEach(input => {
      input.value = '';
      input.disabled = false;
      input.classList.remove('correct-answer', 'wrong-answer');
    });

    const feedback = container.querySelector('.feedback');
    if (feedback) feedback.remove();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('fill-blank-mixed', FillBlankMixedExercise);
}
