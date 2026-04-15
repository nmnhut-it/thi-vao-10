/**
 * Sentence Rewrite Exercise Type
 * Transform sentences using specific grammar
 */

const SentenceRewriteExercise = {
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const instructions = Utils.createElement('div', {
      class: 'exercise__instructions'
    }, question.instruction || 'Rewrite the sentence');

    const originalText = Utils.createElement('div', {
      class: 'exercise__question'
    });
    originalText.innerHTML = `<strong>Original:</strong> ${question.original}`;

    const starterText = Utils.createElement('div', {
      class: 'mt-1 mb-1'
    });
    starterText.innerHTML = question.starterText ? `<strong>Begin with:</strong> ${question.starterText}...` : '';

    const textarea = Utils.createElement('textarea', {
      class: 'input',
      id: `answer-${question.id}`,
      placeholder: 'Write your rewritten sentence here...',
      rows: 2
    });

    if (question.starterText) {
      textarea.value = question.starterText + ' ';
    }

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Xong');

    submitBtn.onclick = () => {
      const userAnswer = textarea.value.trim();
      if (Utils.isEmpty(userAnswer)) {
        Utils.showToast('Please write your sentence', 'error');
        return;
      }
      callbacks.onAnswer(userAnswer);
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
    exerciseCard.appendChild(instructions);
    exerciseCard.appendChild(originalText);
    if (question.starterText) {
      exerciseCard.appendChild(starterText);
    }
    exerciseCard.appendChild(textarea);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  },

  validate(userAnswer, question) {
    const acceptedAnswers = question.acceptedAnswers || [question.answer];
    return Utils.validateAnswer(userAnswer, acceptedAnswers);
  },

  getUserAnswer(container) {
    const textarea = container.querySelector('textarea');
    return textarea ? textarea.value.trim() : '';
  },

  showFeedback(container, isCorrect, question, onNext) {
    const textarea = container.querySelector('textarea');
    const actions = container.querySelector('.exercise__actions');

    if (textarea) textarea.disabled = true;

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    if (isCorrect) {
      if (textarea) textarea.classList.add('correct-answer');
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <span>Correct!</span>
      `;
    } else {
      if (textarea) textarea.classList.add('wrong-answer');
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <div>
          <div>Not quite right.</div>
          <div class="feedback__correct-answer">Correct answer: <strong>${question.answer}</strong></div>
        </div>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    if (onNext) {
      const nextBtn = Utils.createElement('button', {
        class: 'btn btn--primary btn--large mt-2'
      }, 'Next Question →');
      nextBtn.style.width = '100%';
      nextBtn.style.fontSize = 'var(--font-size-lg)';
      nextBtn.style.padding = 'var(--spacing-md)';

      nextBtn.onclick = () => onNext();

      feedbackDiv.insertAdjacentElement('afterend', nextBtn);
      nextBtn.focus();
    }
  },

  reset(container) {
    const textarea = container.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
      textarea.disabled = false;
      textarea.classList.remove('correct-answer', 'wrong-answer');
      textarea.focus();
    }

    const feedback = container.querySelector('.feedback');
    if (feedback) feedback.remove();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('sentence-rewrite', SentenceRewriteExercise);
}
