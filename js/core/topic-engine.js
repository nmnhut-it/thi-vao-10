/**
 * Topic Engine - Renders knowledge + exercises for a study topic
 * Designed for self-study: every answer gets an explanation
 * Pure logic lives in logic.js (unit-testable). This file handles DOM only.
 */

const TopicEngine = {
  testMode: false, // When true, suppress immediate feedback (exam simulation)

  state: {
    topicId: null,
    data: null,
    currentIndex: 0,
    answers: {},    // exerciseId -> { selected, correct, attempts }
    score: 0,
    totalExercises: 0
  },

  async init(topicId) {
    this.state.topicId = topicId;

    try {
      const resp = await fetch('../data/' + topicId + '.json');
      if (!resp.ok) throw new Error('Data not found');
      this.state.data = await resp.json();
    } catch (err) {
      document.getElementById('exercise-area').textContent = 'Không thể tải dữ liệu. Vui lòng thử lại.';
      return;
    }

    // Prompt for student name + photo on first visit (blocks until submitted)
    if (typeof StudentInfo !== 'undefined') {
      await StudentInfo.ensure();
    }

    // Offer to resume unfinished work. Load saved answers BEFORE render so
    // createMCQuestion can restore the answered-state UI naturally.
    this._resumePayload = null;
    const saved = this.loadInProgress();
    if (saved) {
      const count = Object.keys(saved.answers).length;
      const ago = this._formatTimeAgo(saved.savedAt);
      if (confirm('Bạn đã làm dở ' + count + ' câu (' + ago + '). Tiếp tục từ chỗ đó? (Nhấn "Hủy" để làm lại từ đầu.)')) {
        this.state.answers = saved.answers;
        this._resumePayload = saved;
      } else {
        this.clearInProgress();
      }
    }

    const exercises = this.state.data.exercises || [];
    this.state.totalExercises = this.countQuestions(exercises);

    this.renderNavBar();
    this.renderKnowledge();
    this.renderTabs();
    this.renderExercises();
    this.updateProgress();

    // Record daily activity + Telegram attendance
    this.recordDailyActivity();
    if (typeof Telegram !== 'undefined') {
      Telegram.init();
      Telegram.sendAttendance();
    }
  },

  _inProgressKey() {
    return 'in-progress-' + this.state.topicId;
  },

  /** Persist in-progress state. Extra fields (e.g. timeRemaining) merged in. */
  saveInProgress(extra) {
    if (!this.state.topicId) return;
    try {
      const payload = Object.assign(
        { answers: this.state.answers, savedAt: Date.now() },
        extra || {}
      );
      Storage.save(this._inProgressKey(), payload);
    } catch (e) { /* ignore quota errors */ }
  },

  loadInProgress() {
    if (!this.state.topicId) return null;
    const saved = Storage.load(this._inProgressKey(), null);
    if (!saved || !saved.answers) return null;
    if (Object.keys(saved.answers).length === 0) return null;
    return saved;
  },

  clearInProgress() {
    if (!this.state.topicId) return;
    Storage.remove(this._inProgressKey());
  },

  _formatTimeAgo(ts) {
    if (!ts) return 'vừa xong';
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return mins + ' phút trước';
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + ' giờ trước';
    const days = Math.round(hrs / 24);
    return days + ' ngày trước';
  },

  countQuestions(exercises) {
    return Logic.countQuestions(exercises);
  },

  renderNavBar() {
    const nav = document.getElementById('nav-bar');
    if (!nav) return;
    const titleEl = nav.querySelector('.nav-bar__title');
    if (titleEl) {
      titleEl.textContent = this.state.data.title || this.state.topicId;
    }
  },

  renderKnowledge() {
    const panel = document.getElementById('knowledge-panel');
    if (!panel || !this.state.data.knowledge) return;

    const body = panel.querySelector('.knowledge__body');
    if (body && this.state.data.knowledge.html) {
      // Knowledge HTML is trusted content from our own JSON files
      body.insertAdjacentHTML('beforeend', this.state.data.knowledge.html);
    }

    const toggle = panel.querySelector('.knowledge__header');
    if (toggle) {
      toggle.addEventListener('click', () => {
        body.classList.toggle('knowledge__body--open');
        const icon = toggle.querySelector('.knowledge__toggle');
        if (icon) icon.classList.toggle('knowledge__toggle--open');
      });
    }
  },

  renderTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('tab--active'));
        contents.forEach(c => c.classList.remove('tab-content--active'));
        tab.classList.add('tab--active');
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add('tab-content--active');
      });
    });
  },

  renderExercises() {
    const area = document.getElementById('exercise-area');
    if (!area) return;
    area.textContent = '';

    const exercises = this.state.data.exercises || [];
    let qNum = 0;

    exercises.forEach((ex, idx) => {
      if (ex.type === 'reading-comprehension' && ex.questions) {
        const wrapper = this.createReadingBlock(ex, qNum);
        area.appendChild(wrapper);
        qNum += ex.questions.length;
      } else {
        qNum++;
        const card = this.createExerciseCard(ex, qNum, idx);
        area.appendChild(card);
      }
    });
  },

  createReadingBlock(ex, startNum) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-card';
    wrapper.style.marginBottom = 'var(--sp-4)';

    // Passage
    const passageEl = document.createElement('div');
    passageEl.className = 'reading-passage';
    passageEl.style.cssText = 'font-size:var(--text-sm);line-height:1.8;margin-bottom:var(--sp-4);padding:var(--sp-3);background:var(--bg-subtle);border-radius:var(--radius-md);white-space:pre-line;';
    this._renderPassageWithBold(passageEl, ex.passage || '');
    wrapper.appendChild(passageEl);

    // Questions
    ex.questions.forEach((q, qi) => {
      const num = startNum + qi + 1;
      const qCard = this.createMCQuestion(q, num, 'reading-' + ex.id + '-' + qi);
      wrapper.appendChild(qCard);
    });

    return wrapper;
  },

  createExerciseCard(ex, num, idx) {
    switch (ex.type) {
      case 'multiple-choice':
        return this.createMCQuestion(ex, num, ex.id || idx);
      case 'sentence-combine':
        // sentence-combine can be MC (with options) or text-based (with answer)
        if (ex.options && typeof ex.correctIndex === 'number') {
          return this.createMCQuestion(ex, num, ex.id || idx);
        }
        return this.createSentenceRewriteCard(ex, num, idx);
      case 'error-correct':
        return this.createErrorCorrectCard(ex, num, idx);
      case 'sentence-rewrite':
        return this.createSentenceRewriteCard(ex, num, idx);
      case 'sentence-build':
        return this.createSentenceBuildCard(ex, num, idx);
      case 'fill-blank':
        return this.createFillBlankCard(ex, num, idx);
      default:
        return this.createMCQuestion(ex, num, ex.id || idx);
    }
  },

  createMCQuestion(q, num, exId) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exId = exId;

    const numEl = document.createElement('div');
    numEl.className = 'exercise-card__number';
    numEl.textContent = 'Câu ' + num;
    card.appendChild(numEl);

    const questionEl = document.createElement('div');
    questionEl.className = 'exercise-card__question';
    this._renderTextWithUnderline(questionEl, q.question || '');
    card.appendChild(questionEl);

    const optionsEl = document.createElement('div');
    optionsEl.className = 'options';

    const letters = ['A', 'B', 'C', 'D'];
    (q.options || []).forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.type = 'button';

      const letterEl = document.createElement('span');
      letterEl.className = 'option__letter';
      letterEl.textContent = letters[oi];
      btn.appendChild(letterEl);

      const textEl = document.createElement('span');
      const cleanOpt = Logic.cleanOptionText(opt);
      if (Logic.hasUnderlineTags(cleanOpt)) {
        Logic.parseUnderlinedText(cleanOpt).forEach(seg => {
          if (seg.underline) {
            const u = document.createElement('u');
            u.textContent = seg.text;
            textEl.appendChild(u);
          } else {
            textEl.appendChild(document.createTextNode(seg.text));
          }
        });
      } else {
        textEl.textContent = cleanOpt;
      }
      btn.appendChild(textEl);

      btn.addEventListener('click', () => {
        this.handleMCAnswer(card, optionsEl, oi, q.correctIndex, q.explanation, exId);
      });

      optionsEl.appendChild(btn);
    });

    card.appendChild(optionsEl);

    // Restore UI for a previously-saved answer (resume flow)
    const prior = this.state.answers[exId];
    if (prior) {
      const opts = optionsEl.querySelectorAll('.option');
      if (this.testMode) {
        if (opts[prior.selected]) opts[prior.selected].classList.add('option--selected');
      } else {
        opts.forEach((opt, i) => {
          opt.classList.add('option--disabled');
          if (i === q.correctIndex) opt.classList.add('option--correct');
          if (i === prior.selected && !prior.correct) opt.classList.add('option--wrong');
        });
        this.showFeedback(card, prior.correct, q.explanation || '');
      }
    }

    return card;
  },

  handleMCAnswer(card, optionsEl, selected, correct, explanation, exId) {
    if (this.testMode) {
      return this.handleMCAnswerTestMode(card, optionsEl, selected, correct, explanation, exId);
    }

    // Prevent re-answering
    if (this.state.answers[exId]) return;

    const options = optionsEl.querySelectorAll('.option');
    const isCorrect = selected === correct;

    this.state.answers[exId] = { selected, correct: isCorrect, attempts: 1 };
    if (isCorrect) this.state.score += Logic.POINTS_CORRECT;

    // Disable all options
    options.forEach((opt, i) => {
      opt.classList.add('option--disabled');
      if (i === correct) {
        opt.classList.add('option--correct');
      }
      if (i === selected && !isCorrect) {
        opt.classList.add('option--wrong');
      }
    });

    // Show feedback
    this.showFeedback(card, isCorrect, explanation);
    this.updateProgress();
    this.saveProgress();
    this.saveInProgress();
  },

  /** Test mode: record answer, highlight selected, allow changing */
  handleMCAnswerTestMode(card, optionsEl, selected, correct, explanation, exId) {
    const options = optionsEl.querySelectorAll('.option');
    const isCorrect = selected === correct;

    // Record answer (allow overwrite for answer changes)
    this.state.answers[exId] = { selected, correct: isCorrect, attempts: 1 };

    // Clear previous selection, highlight new one
    options.forEach(opt => opt.classList.remove('option--selected'));
    options[selected].classList.add('option--selected');

    this.updateProgress();
    this.saveInProgress();
  },

  createErrorCorrectCard(ex, num, idx) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exId = idx;

    const numEl = document.createElement('div');
    numEl.className = 'exercise-card__number';
    numEl.textContent = 'Câu ' + num;
    card.appendChild(numEl);

    const instrEl = document.createElement('div');
    instrEl.style.cssText = 'font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--sp-2);';
    instrEl.textContent = 'Tìm và sửa lỗi sai trong câu sau:';
    card.appendChild(instrEl);

    const sentEl = document.createElement('div');
    sentEl.className = 'exercise-card__question';
    sentEl.textContent = ex.wrongSentence || '';
    card.appendChild(sentEl);

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'input-answer';
    inputEl.placeholder = 'Nhập câu đã sửa...';
    card.appendChild(inputEl);

    const btnEl = document.createElement('button');
    btnEl.className = 'btn btn--primary btn--block mt-4';
    btnEl.textContent = 'Kiểm tra';
    btnEl.type = 'button';
    btnEl.addEventListener('click', () => {
      this.handleTextAnswer(card, inputEl, ex, idx);
    });
    card.appendChild(btnEl);

    // Allow Enter key
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnEl.click();
    });

    this._restoreTextInputState(card, inputEl, btnEl, ex, idx);
    return card;
  },

  createSentenceRewriteCard(ex, num, idx) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exId = idx;

    const numEl = document.createElement('div');
    numEl.className = 'exercise-card__number';
    numEl.textContent = 'Câu ' + num;
    card.appendChild(numEl);

    const instrEl = document.createElement('div');
    instrEl.style.cssText = 'font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--sp-2);';
    instrEl.textContent = ex.instruction || 'Viết lại câu sao cho nghĩa không đổi:';
    card.appendChild(instrEl);

    const origEl = document.createElement('div');
    origEl.className = 'exercise-card__question';
    origEl.textContent = ex.original || '';
    card.appendChild(origEl);

    if (ex.starterText) {
      const starterEl = document.createElement('div');
      starterEl.style.cssText = 'font-weight:600;margin-bottom:var(--sp-2);color:var(--primary);';
      starterEl.textContent = ex.starterText + '...';
      card.appendChild(starterEl);
    }

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'input-answer';
    inputEl.placeholder = 'Nhập câu trả lời...';
    card.appendChild(inputEl);

    const btnEl = document.createElement('button');
    btnEl.className = 'btn btn--primary btn--block mt-4';
    btnEl.textContent = 'Kiểm tra';
    btnEl.type = 'button';
    btnEl.addEventListener('click', () => {
      this.handleTextAnswer(card, inputEl, ex, idx);
    });
    card.appendChild(btnEl);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnEl.click();
    });

    this._restoreTextInputState(card, inputEl, btnEl, ex, idx);
    return card;
  },

  createSentenceBuildCard(ex, num, idx) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exId = idx;

    const numEl = document.createElement('div');
    numEl.className = 'exercise-card__number';
    numEl.textContent = 'Câu ' + num;
    card.appendChild(numEl);

    const instrEl = document.createElement('div');
    instrEl.style.cssText = 'font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--sp-2);';
    instrEl.textContent = 'Sắp xếp các từ thành câu hoàn chỉnh:';
    card.appendChild(instrEl);

    const promptEl = document.createElement('div');
    promptEl.className = 'exercise-card__question';
    promptEl.style.fontFamily = 'var(--font-mono)';
    promptEl.textContent = ex.prompt || '';
    card.appendChild(promptEl);

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'input-answer';
    inputEl.placeholder = 'Nhập câu hoàn chỉnh...';
    card.appendChild(inputEl);

    const btnEl = document.createElement('button');
    btnEl.className = 'btn btn--primary btn--block mt-4';
    btnEl.textContent = 'Kiểm tra';
    btnEl.type = 'button';
    btnEl.addEventListener('click', () => {
      this.handleTextAnswer(card, inputEl, ex, idx);
    });
    card.appendChild(btnEl);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnEl.click();
    });

    this._restoreTextInputState(card, inputEl, btnEl, ex, idx);
    return card;
  },

  createFillBlankCard(ex, num, idx) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exId = idx;

    const numEl = document.createElement('div');
    numEl.className = 'exercise-card__number';
    numEl.textContent = 'Câu ' + num;
    card.appendChild(numEl);

    const questionEl = document.createElement('div');
    questionEl.className = 'exercise-card__question';
    this._renderTextWithUnderline(questionEl, ex.question || '');
    card.appendChild(questionEl);

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'input-answer';
    inputEl.placeholder = 'Nhập câu trả lời...';
    card.appendChild(inputEl);

    const btnEl = document.createElement('button');
    btnEl.className = 'btn btn--primary btn--block mt-4';
    btnEl.textContent = 'Kiểm tra';
    btnEl.type = 'button';
    btnEl.addEventListener('click', () => {
      this.handleTextAnswer(card, inputEl, ex, idx);
    });
    card.appendChild(btnEl);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnEl.click();
    });

    this._restoreTextInputState(card, inputEl, btnEl, ex, idx);
    return card;
  },

  handleTextAnswer(card, inputEl, ex, exId) {
    if (this.testMode) {
      return this.handleTextAnswerTestMode(card, inputEl, ex, exId);
    }

    if (this.state.answers[exId]) return;

    const userAnswer = inputEl.value.trim();
    if (!userAnswer) {
      inputEl.focus();
      return;
    }

    const isCorrect = Logic.checkTextAnswer(userAnswer, ex);

    this.state.answers[exId] = { selected: userAnswer, correct: isCorrect, attempts: 1 };
    if (isCorrect) this.state.score += Logic.POINTS_CORRECT;

    inputEl.disabled = true;
    inputEl.classList.add(isCorrect ? 'input-answer--correct' : 'input-answer--wrong');

    // Hide submit button
    const btn = card.querySelector('.btn');
    if (btn) btn.style.display = 'none';

    // Build explanation with correct answer for wrong answers
    let fullExplanation = isCorrect ? (ex.explanation || '') : Logic.buildWrongAnswerExplanation(ex);

    this.showFeedback(card, isCorrect, fullExplanation);
    this.updateProgress();
    this.saveProgress();
    this.saveInProgress();
  },

  /** Test mode: record text answer without feedback, allow re-editing */
  handleTextAnswerTestMode(card, inputEl, ex, exId) {
    const userAnswer = inputEl.value.trim();
    if (!userAnswer) {
      inputEl.focus();
      return;
    }

    const isCorrect = Logic.checkTextAnswer(userAnswer, ex);
    this.state.answers[exId] = { selected: userAnswer, correct: isCorrect, attempts: 1 };

    // Visual indicator that answer is recorded (not correct/wrong)
    inputEl.classList.add('input-answer--recorded');

    this.updateProgress();
    this.saveInProgress();
  },

  /**
   * Render a string into an element, honoring <u>...</u> tags for underlined spans.
   * Uses DOM API (no innerHTML) so any other stray markup is shown as literal text.
   */
  _renderTextWithUnderline(el, text) {
    if (typeof Logic !== 'undefined' && Logic.hasUnderlineTags(text)) {
      Logic.parseUnderlinedText(text).forEach(seg => {
        if (seg.underline) {
          const u = document.createElement('u');
          u.textContent = seg.text;
          el.appendChild(u);
        } else {
          this._appendTextWithQuoteBold(el, seg.text);
        }
      });
    } else {
      this._appendTextWithQuoteBold(el, text);
    }
  },

  // Render passage text, wrapping **word** markers in highlighted <strong>.
  _renderPassageWithBold(el, text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    parts.forEach(part => {
      if (part.length >= 4 && part.startsWith('**') && part.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.className = 'passage-target';
        strong.textContent = part.slice(2, -2);
        el.appendChild(strong);
      } else if (part.length > 0) {
        el.appendChild(document.createTextNode(part));
      }
    });
  },

  // Render text, wrapping any "..." quoted segments in <strong>.
  _appendTextWithQuoteBold(el, text) {
    const parts = text.split(/("[^"]+")/);
    parts.forEach(part => {
      if (part.length >= 2 && part[0] === '"' && part[part.length - 1] === '"') {
        const strong = document.createElement('strong');
        strong.textContent = part;
        el.appendChild(strong);
      } else if (part.length > 0) {
        el.appendChild(document.createTextNode(part));
      }
    });
  },

  /**
   * Restore a previously-answered text-input card (resume flow).
   * Shared by error-correct / sentence-rewrite / sentence-build / fill-blank.
   */
  _restoreTextInputState(card, inputEl, btnEl, ex, exId) {
    const prior = this.state.answers[exId];
    if (!prior) return;

    inputEl.value = prior.selected || '';

    if (this.testMode) {
      inputEl.classList.add('input-answer--recorded');
      return;
    }

    inputEl.disabled = true;
    inputEl.classList.add(prior.correct ? 'input-answer--correct' : 'input-answer--wrong');
    if (btnEl) btnEl.style.display = 'none';

    const explanation = prior.correct
      ? (ex.explanation || '')
      : Logic.buildWrongAnswerExplanation(ex);
    this.showFeedback(card, prior.correct, explanation);
  },

  showFeedback(card, isCorrect, explanation) {
    const fb = document.createElement('div');
    fb.className = 'feedback ' + (isCorrect ? 'feedback--correct' : 'feedback--wrong');

    const title = document.createElement('div');
    title.className = 'feedback__title';
    title.textContent = isCorrect ? 'Chính xác!' : 'Chưa đúng';
    fb.appendChild(title);

    if (explanation) {
      const expEl = document.createElement('div');
      expEl.className = 'feedback__explanation';
      expEl.textContent = explanation;
      fb.appendChild(expEl);
    }

    card.appendChild(fb);

    // Scroll feedback into view
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  updateProgress() {
    const answered = Object.keys(this.state.answers).length;
    const total = this.state.totalExercises;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

    const progressEl = document.getElementById('nav-progress');
    if (progressEl) {
      progressEl.textContent = answered + '/' + total;
    }

    const barEl = document.getElementById('progress-bar');
    if (barEl) {
      barEl.style.width = pct + '%';
    }

    // Check completion (skip auto-show in test mode - TestEngine handles submit)
    if (answered === total && total > 0 && !this.testMode) {
      this.showResults();
    }
  },

  showResults() {
    const total = this.state.totalExercises;
    const correct = Object.values(this.state.answers).filter(a => a.correct).length;
    const pct = total > 0 ? correct / total : 0;

    const stars = Logic.calculateStars(correct, total);

    // Save final progress
    const progress = Storage.load('all-progress', {});
    const prev = progress[this.state.topicId] || {};
    progress[this.state.topicId] = {
      completed: true,
      bestScore: Math.max(prev.bestScore || 0, this.state.score),
      stars: Math.max(prev.stars || 0, stars),
      lastScore: this.state.score,
      correctCount: correct,
      totalCount: total,
      lastPlayed: new Date().toISOString()
    };
    Storage.save('all-progress', progress);

    // Topic complete — drop the in-progress snapshot
    this.clearInProgress();

    // Show results banner at top
    const area = document.getElementById('results-area');
    if (!area) return;
    area.style.display = 'block';

    const starsEl = area.querySelector('.results__stars');
    if (starsEl) {
      starsEl.textContent = '\u2B50'.repeat(stars);
    }

    const titleEl = area.querySelector('.results__title');
    if (titleEl) {
      if (pct >= 0.9) titleEl.textContent = 'Xuất sắc!';
      else if (pct >= 0.7) titleEl.textContent = 'Rất tốt!';
      else if (pct >= 0.5) titleEl.textContent = 'Khá tốt!';
      else titleEl.textContent = 'Cần cố gắng thêm!';
    }

    const scoreEl = area.querySelector('.results__score');
    if (scoreEl) {
      scoreEl.textContent = correct + '/' + total + ' đúng (' + Math.round(pct * 100) + '%)';
    }

    area.scrollIntoView({ behavior: 'smooth' });

    // Send to Telegram if configured
    this.sendTelegramProgress(correct, total, stars);
  },

  /** Reveal all answers after test submission - show correct/wrong + explanations */
  revealAllAnswers() {
    const exercises = this.state.data.exercises || [];
    let qIdx = 0;

    exercises.forEach((ex, idx) => {
      if (ex.type === 'reading-comprehension' && ex.questions) {
        ex.questions.forEach((q, qi) => {
          qIdx++;
          const exId = 'reading-' + ex.id + '-' + qi;
          this.revealMCAnswer(exId, q.correctIndex, q.explanation);
        });
      } else if (ex.type === 'multiple-choice' || (ex.options && typeof ex.correctIndex === 'number')) {
        qIdx++;
        const exId = ex.id || idx;
        this.revealMCAnswer(exId, ex.correctIndex, ex.explanation);
      } else {
        qIdx++;
        // Text exercises use array index as exId (matching createExerciseCard)
        this.revealTextAnswer(idx, ex);
      }
    });
  },

  /** Reveal a single MC answer after test submit */
  revealMCAnswer(exId, correctIndex, explanation) {
    const card = document.querySelector('[data-ex-id="' + exId + '"]');
    if (!card) return;

    const ans = this.state.answers[exId];
    const options = card.querySelectorAll('.option');

    options.forEach((opt, i) => {
      opt.classList.add('option--disabled');
      opt.classList.remove('option--selected');
      if (i === correctIndex) {
        opt.classList.add('option--correct');
      }
      if (ans && ans.selected === i && i !== correctIndex) {
        opt.classList.add('option--wrong');
      }
    });

    // If not answered, mark correct answer
    const isCorrect = ans && ans.correct;
    this.showFeedback(card, isCorrect, explanation || '');
  },

  /** Reveal a single text answer after test submit */
  revealTextAnswer(exId, ex) {
    const card = document.querySelector('[data-ex-id="' + exId + '"]');
    if (!card) return;

    const ans = this.state.answers[exId];
    const inputEl = card.querySelector('.input-answer');
    if (inputEl) {
      inputEl.disabled = true;
      inputEl.classList.remove('input-answer--recorded');
      if (ans && ans.correct) {
        inputEl.classList.add('input-answer--correct');
      } else {
        inputEl.classList.add('input-answer--wrong');
      }
    }

    const btn = card.querySelector('.btn');
    if (btn) btn.style.display = 'none';

    // Always show correct answer for text inputs (answered or not)
    const isCorrect = ans && ans.correct;
    const fullExplanation = Logic.buildWrongAnswerExplanation(ex);
    this.showFeedback(card, isCorrect || false, isCorrect ? (ex.explanation || '') : fullExplanation);
  },

  saveProgress() {
    const correct = Object.values(this.state.answers).filter(a => a.correct).length;
    const total = this.state.totalExercises;
    const progress = Storage.load('all-progress', {});
    progress[this.state.topicId] = {
      ...progress[this.state.topicId],
      lastScore: this.state.score,
      correctCount: correct,
      totalCount: total,
      lastPlayed: new Date().toISOString()
    };
    Storage.save('all-progress', progress);
  },

  recordDailyActivity() {
    const history = Storage.load('daily-history', {});
    const today = new Date().toISOString().slice(0, 10);
    history[today] = (history[today] || 0) + 1;
    Storage.save('daily-history', history);
  },

  async sendTelegramProgress(correct, total, stars) {
    if (typeof Telegram !== 'undefined' && Telegram.isConfigured()) {
      await Telegram.sendProgress(
        this.state.data.title || this.state.topicId,
        correct, total, stars
      );
    }
  }
};
