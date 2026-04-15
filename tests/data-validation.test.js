import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const VALID_TYPES = [
  'multiple-choice', 'fill-blank', 'error-correct', 'sentence-rewrite',
  'sentence-build', 'sentence-combine', 'reading-comprehension',
  'fill-blank-mixed', 'fill-blank-table'
];

const jsonFiles = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => [f, JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8'))]);

describe('Data file structure', () => {
  it.each(jsonFiles)('%s has required fields', (fileName, data) => {
    expect(data.topicId).toBeTruthy();
    expect(data.title).toBeTruthy();
    expect(Array.isArray(data.exercises)).toBe(true);
    expect(data.exercises.length).toBeGreaterThan(0);
  });

  it.each(jsonFiles)('%s exercises have valid types', (fileName, data) => {
    data.exercises.forEach((ex, i) => {
      expect(VALID_TYPES).toContain(ex.type);
    });
  });
});

describe('Multiple-choice exercises', () => {
  const mcExercises = jsonFiles.flatMap(([file, data]) =>
    data.exercises
      .filter(ex => {
        if (ex.type === 'multiple-choice') return true;
        // sentence-combine with options is MC; without options it's text-based
        if (ex.type === 'sentence-combine' && ex.options) return true;
        return false;
      })
      .map((ex, i) => [`${file}#${i + 1}`, ex])
  );

  it.each(mcExercises)('%s has valid correctIndex', (label, ex) => {
    expect(typeof ex.correctIndex).toBe('number');
    expect(ex.correctIndex).toBeGreaterThanOrEqual(0);
    expect(ex.correctIndex).toBeLessThan(ex.options.length);
  });

  it.each(mcExercises)('%s has at least 2 options', (label, ex) => {
    expect(ex.options.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Text-answer exercises', () => {
  const textExercises = jsonFiles.flatMap(([file, data]) =>
    data.exercises
      .filter(ex => {
        if (['sentence-rewrite', 'sentence-build', 'fill-blank', 'error-correct'].includes(ex.type)) return true;
        // sentence-combine without options is text-based
        if (ex.type === 'sentence-combine' && !ex.options) return true;
        return false;
      })
      .map((ex, i) => [`${file}#${i + 1}`, ex])
  );

  if (textExercises.length > 0) {
    it.each(textExercises)('%s has an answer', (label, ex) => {
      const hasAnswer = ex.answer || ex.correctSentence;
      expect(hasAnswer).toBeTruthy();
    });
  }
});

describe('Reading comprehension exercises', () => {
  const readingExercises = jsonFiles.flatMap(([file, data]) =>
    data.exercises
      .filter(ex => ex.type === 'reading-comprehension')
      .map((ex, i) => [`${file}#${i + 1}`, ex])
  );

  if (readingExercises.length > 0) {
    it.each(readingExercises)('%s has passage and questions', (label, ex) => {
      expect(ex.passage).toBeTruthy();
      expect(Array.isArray(ex.questions)).toBe(true);
      expect(ex.questions.length).toBeGreaterThan(0);
    });

    it.each(readingExercises)('%s questions have valid correctIndex', (label, ex) => {
      ex.questions.forEach((q, qi) => {
        expect(typeof q.correctIndex).toBe('number');
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      });
    });
  }
});
