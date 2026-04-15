# Ôn Thi Vào 10 - Development Rules

## Project Overview
Interactive self-study English exam prep for Vietnamese Grade 9 students entering high school (THPT). Mobile-first, no teacher needed. Every answer includes an explanation.

## Architecture

### File Structure
```
/
├── index.html                    # Homepage - topic grid + progress stats
├── css/shared.css                # All styles - single source of truth
├── js/
│   ├── core/
│   │   ├── logic.js              # Pure logic (unit-testable, no DOM)
│   │   ├── topic-engine.js       # Topic page rendering + exercise flow
│   │   ├── test-engine.js        # Practice test: timer + question grid
│   │   └── storage.js            # LocalStorage wrapper
│   └── home.js                   # Homepage progress display
├── data/
│   ├── grammar-*.json            # Grammar topic data (16 files)
│   ├── phonetics-*.json          # Phonetics data (2 files)
│   ├── vocab-*.json              # Vocabulary data (5 files)
│   ├── reading-*.json            # Reading data (2 files)
│   ├── writing-*.json            # Writing data (1 file)
│   ├── review-*.json             # Review data (2 files)
│   └── test-*.json               # Practice tests (9 files)
├── pages/                        # Generated HTML pages (don't edit directly)
├── scripts/
│   ├── generate-pages.js         # Generates all pages/ HTML from templates
│   └── validate-data.js          # Validates JSON data structure
└── tests/
    ├── logic.test.js             # Unit tests for logic.js
    └── data-validation.test.js   # Validates all JSON data files
```

### Key Principles
- **Plain HTML/CSS/JS** — no frameworks, no build step
- **Pages are generated** — edit `scripts/generate-pages.js`, then run `node scripts/generate-pages.js`
- **Logic separated from DOM** — `logic.js` has pure functions, `topic-engine.js` handles DOM
- **All Vietnamese text uses proper diacritics** — never write "Luyen Tap", always "Luyện Tập"

## Data Format

### JSON Data Files
Each topic/test has a JSON file in `data/`. See existing files for reference. Key exercise types:
- `multiple-choice`: question, options[], correctIndex, explanation
- `error-correct`: wrongSentence, correctSentence, errorWord, correction, explanation
- `sentence-rewrite`: original, instruction, starterText, answer, acceptedAnswers[], explanation
- `sentence-build`: prompt, answer, acceptedAnswers[], explanation
- `sentence-combine`: either MC (with options) or text-based (with answer)
- `reading-comprehension`: passage, questions[] (each with options and correctIndex)

### Answer Accuracy
- This project has NO answer key from the source PDF — all answers are determined by us
- Every answer must be carefully verified for correctness
- Every exercise must have an explanation — short, natural, tutor-friendly
- Run adversarial review on any new/changed answers

## Development Workflow

### Adding Content
1. Create JSON data file in `data/`
2. Add topic entry to `scripts/generate-pages.js`
3. Add homepage link to `index.html`
4. Run `node scripts/generate-pages.js`
5. Run `node scripts/validate-data.js`
6. Run `npx vitest run`

### Testing
```bash
npx vitest run                    # All tests
node scripts/validate-data.js     # Data validation only
```

### Serving Locally
```bash
npx http-server -p 8090 -c-1
```

## Coding Standards
- ES6+ vanilla JS, no jQuery, no frameworks
- CSS custom properties for all colors/spacing
- BEM naming for CSS classes
- Mobile-first responsive design
- All Vietnamese text must have proper diacritics
- Short inline comments only where logic is non-obvious

## Telegram Integration
- Bot URL stored in LocalStorage via `Storage.save('telegram-bot-url', url)`
- Progress messages sent on topic/test completion
- Attendance tracked via daily-history in LocalStorage
