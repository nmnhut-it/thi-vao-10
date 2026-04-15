/**
 * Multiple Choice Exercise Type
 * Select correct answer from multiple options
 */

const MultipleChoiceExercise = {
  render(question, container, callbacks) {
    container.innerHTML = '';

    const exerciseCard = Utils.createElement('div', { class: 'card exercise' });

    const exerciseNum = Utils.createElement('span', {
      class: 'exercise__number'
    }, `Exercise ${question.id}`);

    const questionText = Utils.createElement('div', {
      class: 'exercise__question'
    }, question.question);

    const choiceList = Utils.createElement('ul', { class: 'choice-list' });

    // Shuffle options and store the mapping
    const shuffledOptions = this.getShuffledOptions(question);

    // Store reference for keyboard selection
    const selectOption = (displayIndex) => {
      const inputs = choiceList.querySelectorAll('input[type="radio"]');
      if (displayIndex < inputs.length) {
        inputs[displayIndex].checked = true;
        inputs[displayIndex].dispatchEvent(new Event('change'));
      }
    };

    const submitAnswer = () => {
      const selected = choiceList.querySelector('input[type="radio"]:checked');
      if (!selected) {
        Utils.showToast('Vui lòng chọn một câu trả lời', 'error');
        return;
      }
      callbacks.onAnswer(parseInt(selected.dataset.originalIndex));
    };

    shuffledOptions.forEach((option, index) => {
      const choiceItem = Utils.createElement('li', { class: 'choice-item' });

      const choiceLabel = Utils.createElement('label', { class: 'choice-label' });

      const radioInput = Utils.createElement('input', {
        type: 'radio',
        name: `question-${question.id}`,
        value: option.text,
        class: 'choice-input',
        id: `choice-${question.id}-${index}`
      });

      // Store original index for validation
      radioInput.dataset.originalIndex = option.originalIndex;

      radioInput.addEventListener('change', () => {
        const labels = choiceList.querySelectorAll('.choice-label');
        labels.forEach(lbl => lbl.classList.remove('choice-label--selected'));
        choiceLabel.classList.add('choice-label--selected');
      });

      const choiceText = Utils.createElement('span', {
        class: 'choice-text'
      }, option.text);

      choiceLabel.appendChild(radioInput);
      choiceLabel.appendChild(choiceText);
      choiceItem.appendChild(choiceLabel);
      choiceList.appendChild(choiceItem);
    });

    const actions = Utils.createElement('div', { class: 'exercise__actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary'
    }, 'Nộp bài');

    submitBtn.onclick = submitAnswer;

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary btn--small'
    }, '💡 Gợi ý');

    hintBtn.onclick = () => callbacks.onHint();

    actions.appendChild(submitBtn);
    if (question.hints && question.hints.length > 0) {
      actions.appendChild(hintBtn);
    }

    exerciseCard.appendChild(exerciseNum);
    exerciseCard.appendChild(questionText);
    exerciseCard.appendChild(choiceList);
    exerciseCard.appendChild(actions);

    container.appendChild(exerciseCard);

    // Attach keyboard handler
    Utils.KeyboardHelper.attachMultipleChoice(container, {
      onSelect: selectOption,
      onSubmit: submitAnswer,
      optionCount: shuffledOptions.length
    });
  },

  /**
   * Shuffle options and create mapping to original indices
   * @param {Object} question - Question object
   * @returns {Array} Array of {text, originalIndex} objects
   */
  getShuffledOptions(question) {
    // Create array with original indices
    const optionsWithIndex = question.options.map((text, index) => ({
      text,
      originalIndex: index
    }));

    // Shuffle using Utils
    return Utils.shuffleArray(optionsWithIndex);
  },

  validate(userAnswer, question) {
    return userAnswer === question.correctIndex;
  },

  getUserAnswer(container) {
    const selected = container.querySelector('input[type="radio"]:checked');
    return selected ? parseInt(selected.dataset.originalIndex) : null;
  },

  showFeedback(container, isCorrect, question) {
    const actions = container.querySelector('.exercise__actions');
    const inputs = container.querySelectorAll('input[type="radio"]');

    inputs.forEach(input => input.disabled = true);

    const feedbackDiv = Utils.createElement('div', {
      class: isCorrect ? 'feedback feedback--success' : 'feedback feedback--error'
    });

    // Build explanation content - check for wordDetails (pronunciation questions)
    const explanationHtml = this.buildExplanationHtml(question);

    // Build hints HTML
    const hintsHtml = this.buildHintsHtml(question);

    if (isCorrect) {
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✓</span>
        <div>
          <div>Đúng rồi! Giỏi lắm!</div>
          ${explanationHtml ? `<div class="feedback__explanation">${explanationHtml}</div>` : ''}
          ${hintsHtml}
        </div>
      `;
    } else {
      const correctAnswer = question.options[question.correctIndex];
      feedbackDiv.innerHTML = `
        <span class="feedback__icon">✗</span>
        <div>
          <div>Chưa đúng.</div>
          <div class="feedback__correct-answer">Đáp án đúng: <strong>${correctAnswer}</strong></div>
          ${explanationHtml ? `<div class="feedback__explanation">${explanationHtml}</div>` : ''}
          ${hintsHtml}
        </div>
      `;
    }

    actions.insertAdjacentElement('afterend', feedbackDiv);

    const buttons = actions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  },

  /**
   * Builds hints HTML for display in feedback
   * @param {Object} question - Question object
   * @returns {string} HTML string for hints
   */
  buildHintsHtml(question) {
    if (!question.hints || question.hints.length === 0) {
      return '';
    }

    const hintsList = question.hints.map(hint => `<li>${hint}</li>`).join('');
    return `<div class="feedback__hints"><strong>💡 Gợi ý:</strong><ul>${hintsList}</ul></div>`;
  },

  /**
   * Builds explanation HTML, handling both regular and pronunciation questions
   * @param {Object} question - Question object
   * @returns {string} HTML string for explanation
   */
  buildExplanationHtml(question) {
    // Check if this is a pronunciation question with wordDetails
    if (question.wordDetails && Array.isArray(question.wordDetails) && question.wordDetails.length > 0) {
      return this.buildPronunciationExplanation(question);
    }

    // Fall back to regular explanation
    return question.explanation || '';
  },

  /**
   * Builds rich explanation HTML for pronunciation questions
   * @param {Object} question - Question object with wordDetails
   * @returns {string} HTML string
   */
  buildPronunciationExplanation(question) {
    if (!question.wordDetails || !Array.isArray(question.wordDetails)) {
      return question.explanation || '';
    }

    const isStressQuestion = question.stressType === 'word stress';
    const correctIndex = question.correctIndex;

    // Helper to convert **text** to <u>text</u>
    function formatUnderlinedWord(detail) {
      if (detail.underlinedWord) {
        // Convert **text** to <u>text</u>
        return detail.underlinedWord.replace(/\*\*([^*]+)\*\*/g, '<u>$1</u>');
      }
      return detail.word;
    }

    let html = '<div class="pronunciation-details">';

    // Add underlined part or stress type info
    if (question.underlinedPart) {
      html += `<div class="pronunciation-header"><strong>Phần gạch chân:</strong> "${question.underlinedPart}"</div>`;
    } else if (isStressQuestion) {
      html += `<div class="pronunciation-header"><strong>Dạng:</strong> Trọng âm từ</div>`;
    }

    html += '<table class="word-details-table">';
    html += '<thead><tr>';
    html += '<th>Từ</th>';
    html += '<th>IPA</th>';
    html += isStressQuestion ? '<th>Trọng âm</th>' : '<th>Âm</th>';
    html += '<th>Nghĩa</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    question.wordDetails.forEach((detail, index) => {
      const isCorrect = index === correctIndex;
      const rowClass = isCorrect ? 'correct-word-row' : '';
      const wordDisplay = formatUnderlinedWord(detail);

      html += `<tr class="${rowClass}">`;
      html += `<td><strong>${wordDisplay}</strong>${isCorrect ? ' ✓' : ''}</td>`;
      html += `<td class="ipa-cell">${detail.ipa || '-'}</td>`;

      if (isStressQuestion) {
        html += `<td>${detail.stressPattern || '-'}</td>`;
      } else {
        html += `<td class="underlined-sound">${detail.underlinedSound || '-'}</td>`;
      }

      html += `<td>${detail.meaning || '-'}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';

    // Add the original explanation if present
    if (question.explanation) {
      html += `<div class="pronunciation-summary"><strong>Giải thích:</strong> ${question.explanation}</div>`;
    }

    html += '</div>';

    return html;
  },

  reset(container) {
    const inputs = container.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
      input.checked = false;
      input.disabled = false;
    });

    const labels = container.querySelectorAll('.choice-label');
    labels.forEach(lbl => lbl.classList.remove('choice-label--selected'));

    const feedback = container.querySelector('.feedback');
    if (feedback) feedback.remove();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
};

if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('multiple-choice', MultipleChoiceExercise);
}
