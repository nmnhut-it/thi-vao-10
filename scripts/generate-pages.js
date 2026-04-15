/**
 * Generate HTML pages for all topics and tests
 * Run: node scripts/generate-pages.js
 */
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'pages');

const TOPIC_TEMPLATE = (topicId, title) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${title} | Ôn Thi Vào 10</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../css/shared.css">
</head>
<body>
  <!-- Nav Bar -->
  <nav class="nav-bar" id="nav-bar">
    <a class="nav-bar__back" href="../index.html">\u2190</a>
    <span class="nav-bar__title">${title}</span>
    <span class="nav-bar__progress" id="nav-progress">0/0</span>
  </nav>

  <!-- Progress -->
  <div class="progress">
    <div class="progress__bar" id="progress-bar" style="width:0%"></div>
  </div>

  <!-- Tabs -->
  <div class="container">
    <div class="tabs">
      <button class="tab tab--active" data-target="tab-knowledge">Kiến Thức</button>
      <button class="tab" data-target="tab-practice">Luyện Tập</button>
    </div>
  </div>

  <!-- Knowledge Tab -->
  <div class="tab-content tab-content--active" id="tab-knowledge">
    <div class="container">
      <div class="knowledge" id="knowledge-panel">
        <div class="knowledge__header">
          <span class="knowledge__header-text">Kiến thức cần nhớ</span>
          <span class="knowledge__toggle">\u25BC</span>
        </div>
        <div class="knowledge__body knowledge__body--open"></div>
      </div>
    </div>
  </div>

  <!-- Practice Tab -->
  <div class="tab-content" id="tab-practice">
    <div class="container">
      <div id="exercise-area" class="exercise-area"></div>
    </div>
  </div>

  <!-- Results (hidden until complete) -->
  <div class="container" id="results-area" style="display:none;">
    <div class="results">
      <div class="results__stars"></div>
      <div class="results__title"></div>
      <div class="results__score"></div>
      <div class="results__actions">
        <a class="btn btn--primary btn--block" href="../index.html">Về trang chủ</a>
        <button class="btn btn--outline btn--block" onclick="location.reload()">Làm lại</button>
      </div>
    </div>
  </div>

  <script src="../js/core/storage.js"></script>
  <script src="../js/core/logic.js"></script>
  <script src="../js/core/telegram.js"></script>
  <script src="../js/core/topic-engine.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => TopicEngine.init('${topicId}'));
  </script>
</body>
</html>`;

const TEST_TEMPLATE = (testId, title, meta) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${title} | Ôn Thi Vào 10</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../css/shared.css">
</head>
<body>
  <!-- Nav Bar -->
  <nav class="nav-bar" id="nav-bar">
    <a class="nav-bar__back" href="../index.html">\u2190</a>
    <span class="nav-bar__title">${title}</span>
    <span class="test-timer" id="test-timer">--:--</span>
  </nav>

  <!-- Progress -->
  <div class="progress">
    <div class="progress__bar" id="progress-bar" style="width:0%"></div>
  </div>

  <div class="container">
    <!-- Question Grid -->
    <div class="question-grid" id="question-grid"></div>

    <!-- Exercise Area -->
    <div id="exercise-area" class="exercise-area"></div>

    <!-- Submit Button -->
    <div style="padding:var(--sp-4) 0;">
      <button class="btn btn--primary btn--block" id="submit-test" type="button">Nộp bài</button>
    </div>

    <!-- Results (hidden until submit) -->
    <div id="results-area" style="display:none;">
      <div class="results">
        <div class="results__stars"></div>
        <div class="results__title"></div>
        <div class="results__score"></div>
        <div class="results__actions">
          <a class="btn btn--primary btn--block" href="../index.html">Về trang chủ</a>
          <button class="btn btn--outline btn--block" onclick="location.reload()">Làm lại</button>
        </div>
      </div>
    </div>
  </div>

  <script src="../js/core/storage.js"></script>
  <script src="../js/core/logic.js"></script>
  <script src="../js/core/telegram.js"></script>
  <script src="../js/core/topic-engine.js"></script>
  <script src="../js/core/test-engine.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      TestEngine.init('${testId}');
      document.getElementById('submit-test').addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn nộp bài?')) {
          TestEngine.submitTest();
        }
      });
    });
  </script>
</body>
</html>`;

// All topics
const topics = [
  ['phonetics-pronunciation', 'Pronunciation (Phát Âm)'],
  ['phonetics-stress', 'Stress (Trọng Âm)'],
  ['grammar-verb-tenses', 'Verb Tenses (Thì Động Từ)'],
  ['grammar-subject-verb-concord', 'Subject-Verb Concord (Hòa Hợp Chủ Vị)'],
  ['grammar-modal-verbs', 'Modal Verbs (Động Từ Khuyết Thiếu)'],
  ['grammar-verb-forms', 'Verb Forms (Dạng Động Từ)'],
  ['grammar-tag-questions', 'Tag Questions (Câu Hỏi Đuôi)'],
  ['grammar-active-passive', 'Active & Passive (Chủ Động & Bị Động)'],
  ['grammar-conditional', 'Conditional Sentences (Câu Điều Kiện)'],
  ['grammar-subjunctive', 'Subjunctive Mood (Thể Giả Định)'],
  ['grammar-reported-speech', 'Reported Speech (Câu Tường Thuật)'],
  ['grammar-relative-clauses', 'Relative Clauses (Mệnh Đề Quan Hệ)'],
  ['grammar-phrases-clauses', 'Phrases & Clauses (Cụm Từ & Mệnh Đề)'],
  ['grammar-comparison', 'Comparison (So Sánh)'],
  ['grammar-quantifiers', 'Quantifiers (Lượng Từ)'],
  ['grammar-conjunctions', 'Conjunctions (Liên Từ)'],
  ['grammar-articles', 'Articles (Mạo Từ)'],
  ['grammar-prepositions', 'Prepositions (Giới Từ)'],
  ['vocab-word-formation', 'Word Formation (Cấu Tạo Từ)'],
  ['vocab-phrasal-verbs', 'Phrasal Verbs (Cụm Động Từ)'],
  ['vocab-communicative', 'Communicative Exchanges (Giao Tiếp)'],
  ['vocab-word-choice', 'Word Choice (Chọn Từ)'],
  ['vocab-synonyms-antonyms', 'Synonyms & Antonyms (Đồng Nghĩa & Trái Nghĩa)'],
  ['reading-comprehension', 'Reading Comprehension (Đọc Hiểu)'],
  ['reading-gap-filling', 'Gap Filling (Điền Từ)'],
  ['writing-sentence', 'Sentence Writing (Viết Câu)'],
  ['review-rewriting', 'Sentence Rewriting Review (Ôn Viết Lại Câu)'],
  ['review-error-finding', 'Error Finding Review (Ôn Tìm Lỗi Sai)'],
];

const tests = [
  ['test-1', 'Đề Thi Thử 1', 'mixed-40'],
  ['test-2', 'Đề Thi Thử 2', 'mixed-40'],
  ['test-3', 'Đề Thi Thử 3', 'mixed-40'],
  ['test-4', 'Đề Thi Thử 4', 'mc-40'],
  ['test-5', 'Đề Thi Thử 5', 'mc-40'],
  ['test-6', 'Đề Thi Thử 6', 'mc-40'],
  ['test-7', 'Đề Thi Thử 7', 'mc-50'],
  ['test-8', 'Đề Thi Thử 8', 'mc-50'],
  ['test-9', 'Đề Thi Thử 9', 'mc-50'],
];

// Ensure pages dir exists
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });

// Generate topic pages
topics.forEach(([id, title]) => {
  const html = TOPIC_TEMPLATE(id, title);
  fs.writeFileSync(path.join(PAGES_DIR, id + '.html'), html, 'utf8');
});

// Generate test pages
tests.forEach(([id, title, type]) => {
  const html = TEST_TEMPLATE(id, title, type);
  fs.writeFileSync(path.join(PAGES_DIR, id + '.html'), html, 'utf8');
});

console.log('Generated ' + topics.length + ' topic pages and ' + tests.length + ' test pages.');
