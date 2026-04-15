/**
 * Validate all JSON data files for structural correctness
 * Run: node scripts/validate-data.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const VALID_TYPES = ['multiple-choice', 'fill-blank', 'error-correct', 'sentence-rewrite', 'sentence-build', 'sentence-combine', 'reading-comprehension', 'fill-blank-mixed', 'fill-blank-table'];

let errors = 0;
let warnings = 0;
let totalExercises = 0;

function error(file, msg) {
  console.error(`  ERROR [${file}]: ${msg}`);
  errors++;
}

function warn(file, msg) {
  console.warn(`  WARN  [${file}]: ${msg}`);
  warnings++;
}

function validateExercise(ex, file, idx) {
  if (!ex.type) {
    error(file, `Exercise #${idx + 1}: missing 'type'`);
    return;
  }

  if (!VALID_TYPES.includes(ex.type)) {
    warn(file, `Exercise #${idx + 1}: unknown type '${ex.type}'`);
  }

  if (ex.type === 'multiple-choice') {
    if (!ex.question) error(file, `Exercise #${idx + 1}: MC missing 'question'`);
    if (!Array.isArray(ex.options) || ex.options.length < 2) {
      error(file, `Exercise #${idx + 1}: MC needs at least 2 options`);
    }
    if (typeof ex.correctIndex !== 'number') {
      error(file, `Exercise #${idx + 1}: MC missing 'correctIndex' (number)`);
    } else if (ex.options && (ex.correctIndex < 0 || ex.correctIndex >= ex.options.length)) {
      error(file, `Exercise #${idx + 1}: correctIndex ${ex.correctIndex} out of range (0-${ex.options.length - 1})`);
    }
    if (!ex.explanation) {
      warn(file, `Exercise #${idx + 1}: MC missing 'explanation'`);
    }
  }

  if (ex.type === 'error-correct') {
    if (!ex.wrongSentence) error(file, `Exercise #${idx + 1}: error-correct missing 'wrongSentence'`);
    if (!ex.correctSentence) error(file, `Exercise #${idx + 1}: error-correct missing 'correctSentence'`);
  }

  if (ex.type === 'sentence-rewrite') {
    if (!ex.original) error(file, `Exercise #${idx + 1}: sentence-rewrite missing 'original'`);
    if (!ex.answer) error(file, `Exercise #${idx + 1}: sentence-rewrite missing 'answer'`);
  }

  if (ex.type === 'sentence-build') {
    if (!ex.prompt) error(file, `Exercise #${idx + 1}: sentence-build missing 'prompt'`);
    if (!ex.answer) error(file, `Exercise #${idx + 1}: sentence-build missing 'answer'`);
  }

  if (ex.type === 'reading-comprehension') {
    if (!ex.passage) error(file, `Exercise #${idx + 1}: reading missing 'passage'`);
    if (!Array.isArray(ex.questions) || ex.questions.length === 0) {
      error(file, `Exercise #${idx + 1}: reading missing 'questions' array`);
    } else {
      ex.questions.forEach((q, qi) => {
        if (typeof q.correctIndex !== 'number') {
          error(file, `Exercise #${idx + 1}, Q${qi + 1}: reading question missing 'correctIndex'`);
        }
      });
    }
  }
}

function validateFile(filePath) {
  const fileName = path.basename(filePath);
  if (!fileName.endsWith('.json')) return;
  if (fileName === 'package.json') return;

  let data;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(content);
  } catch (e) {
    error(fileName, `Invalid JSON: ${e.message}`);
    return;
  }

  if (!data.topicId) error(fileName, "Missing 'topicId'");
  if (!data.title) error(fileName, "Missing 'title'");

  if (!Array.isArray(data.exercises)) {
    error(fileName, "Missing or invalid 'exercises' array");
    return;
  }

  if (data.exercises.length === 0) {
    warn(fileName, 'No exercises found');
  }

  data.exercises.forEach((ex, idx) => {
    validateExercise(ex, fileName, idx);
    totalExercises++;
  });

  console.log(`  OK    ${fileName}: ${data.exercises.length} exercises`);
}

// Main
console.log('Validating data files in', DATA_DIR);
console.log('---');

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.log('No JSON files found.');
  process.exit(0);
}

files.forEach(f => validateFile(path.join(DATA_DIR, f)));

console.log('---');
console.log(`Files: ${files.length} | Exercises: ${totalExercises} | Errors: ${errors} | Warnings: ${warnings}`);

if (errors > 0) {
  console.error('\nValidation FAILED with errors.');
  process.exit(1);
} else {
  console.log('\nValidation PASSED.');
}
