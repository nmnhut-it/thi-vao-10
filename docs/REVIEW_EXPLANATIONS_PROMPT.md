# Review Explanations — Reusable Agent Prompt

Use this prompt when asking an agent to review and fix explanations in data files. Each section covers one exercise type.

---

## Universal Instructions (include in every agent call)

```
Update the explanations in D:\Gitlab\thi-vao-10\data\{FILENAME}. This file has {TYPE} exercises
(search for type "{TYPE}"). It may also have other exercise types — ONLY update {TYPE} items.

YOUR TASK: For each {TYPE} exercise, update the "explanation" field to Vietnamese-first style.
Target audience: Vietnamese Grade 9 students learning English.

### Style Rules
1. Write in Vietnamese. Use English ONLY for the actual words/phrases being discussed.
2. Use → arrows to show transformations (original → answer, error → correction).
3. Name the grammar concept in Vietnamese (bị động, câu điều kiện loại 2, so sánh nhất...).
4. Keep it 1-2 sentences max.
5. NO cryptic abbreviations like "V3", "PP", "S + V + ...". If referencing structure, explain in Vietnamese.
6. Use proper Vietnamese diacritics — always "Luyện Tập", never "Luyen Tap".

### What to check
- Answer correctness: Is the answer grammatically correct? Flag any errors.
- acceptedAnswers: Are common valid alternatives included? Add if missing.
- Explanation: Does it help a Grade 9 student understand WHY?

### Process
1. Read the file
2. Find all {TYPE} items
3. Update their explanations
4. Fix any answer correctness issues
5. Write the complete updated file back (must be valid JSON)
6. Return: count of items updated, list of any answer issues found

### DO NOT
- Change fields other than "explanation" (unless fixing an answer bug)
- Modify other exercise types in the same file
- Add or remove exercises
```

---

## Type-Specific Guidance

### multiple-choice

```
### MC Explanation Format
Explain WHY the correct option is right. Briefly note why key wrong options fail.

Good: "'one-way' bắt đầu bằng âm /w/ (phụ âm) => dùng 'a', không dùng 'an'."
Good: "'should' diễn tả lời khuyên. 'will' là tương lai, 'must' quá mạnh — không phù hợp."
Good: "'Do the laundry' = giặt đồ. Là cụm từ cố định phổ biến."

Bad: "The correct answer is B." (vague)
Bad: "Type 2 conditional (unreal present)." (English, no explanation)
```

### error-correct

```
### Error-Correct Explanation Format
State the grammar rule violated, show the fix with →.

Good: "Sau 'because of' là danh từ, không dùng mệnh đề. Phải đổi thành 'because' + mệnh đề."
Good: "'better' đã là so sánh hơn, không thêm 'more'. 'more better' là sai."
Good: "Sau 'make' dùng nguyên mẫu không 'to': 'make him go', không 'make him to go'."

Bad: "Breakfast is served (passive), not serving (active)." (English only)
```

### sentence-rewrite

```
### Sentence-Rewrite Explanation Format
Name the transformation, show mapping with →, state the rule.

Good: "Chuyển chủ động sang bị động. 'grow rice' → 'is grown'. Tân ngữ lên làm chủ ngữ."
Good: "Dùng câu điều kiện loại 2. 'doesn't have' → 'If she had', 'can't' → 'could'."
Good: "Chuyển 'because + mệnh đề' thành 'because of + N/V-ing'. 'because I was ill' → 'because of my illness'."
```

### sentence-combine

```
### Sentence-Combine Explanation Format
Name the connecting structure, show how two clauses merge.

Good: "Nối bằng mệnh đề quan hệ 'which/that' cho vật. 'was bitten by it' → 'which bit me'."
Good: "Dùng 'wish + quá khứ đơn' cho ước không có thật hiện tại. 'I can't swim' → 'wish I could swim'."
```

### sentence-build

```
### Sentence-Build Explanation Format
Explain what tense/structure is needed and why.

Good: "Dùng quá khứ tiếp diễn (was reading) cho hành động đang xảy ra bị cắt ngang bởi quá khứ đơn (heard)."
Good: "Dùng hiện tại hoàn thành tiếp diễn (have been waiting) cho hành động bắt đầu trong quá khứ vẫn tiếp diễn."
```

### reading-comprehension

```
### Reading-Comprehension Explanation Format
Point to the specific passage text that supports the answer. Quote briefly.

Good: "Đoạn văn viết: 'A resume is a tool to obtain a job interview.' → đáp án A."
Good: "Từ 'tiny germs that are so small' cho thấy virus rất nhỏ → đáp án B."

Bad: "The passage discusses natural gas..." (English, no specific reference)
```

### fill-blank

```
### Fill-Blank Explanation Format
Explain what grammar rule determines the blank.

Good: "'car' là vật, làm chủ ngữ => 'which' hoặc 'that'."
Good: "'whose' chỉ sở hữu, đứng trước danh từ 'mother' => 'whose mother'."
```

---

## Current Progress Tracker

### Completed (Vietnamese-first explanations)
| File | Types Done | Status |
|------|-----------|--------|
| `writing-sentence.json` | sentence-rewrite (120) | DONE |
| `review-rewriting.json` | sentence-rewrite (20) | DONE |
| `grammar-conditional.json` | sentence-rewrite (10) | DONE |
| `grammar-reported-speech.json` | sentence-rewrite (10) | DONE |
| `grammar-active-passive.json` | sentence-rewrite (20) | DONE |
| `grammar-relative-clauses.json` | sentence-rewrite (20) | DONE |
| `grammar-comparison.json` | sentence-rewrite (10) | DONE |
| `grammar-conjunctions.json` | sentence-rewrite (20) + MC + error-correct | DONE |
| `grammar-subjunctive.json` | sentence-rewrite (10) | DONE |
| `grammar-phrases-clauses.json` | sentence-rewrite (10) | DONE |
| `grammar-verb-tenses.json` | sentence-rewrite (10) | DONE |
| `grammar-verb-forms.json` | sentence-rewrite (10) | DONE |
| `test-1.json` through `test-9.json` | sentence-rewrite only | DONE |
| `grammar-articles.json` | MC | ALREADY VI |
| `grammar-prepositions.json` | MC | ALREADY VI |
| `grammar-quantifiers.json` | MC | ALREADY VI |
| `vocab-word-choice.json` | MC | ALREADY VI |
| `vocab-word-formation.json` | MC | ALREADY VI |
| `vocab-synonyms-antonyms.json` | MC | ALREADY VI |
| `vocab-phrasal-verbs.json` | MC | ALREADY VI |
| `review-end-of-semester-2.json` | MC | ALREADY VI |

### Remaining Work

#### Priority 1 — Grammar files (MC + error-correct still in English)
| File | Remaining Types | Count |
|------|----------------|-------|
| `grammar-active-passive.json` | MC (30), error-correct (10) | 40 |
| `grammar-conditional.json` | MC (20), error-correct (20) | 40 |
| `grammar-verb-tenses.json` | MC (20), error-correct (10) | 30 |
| `grammar-verb-forms.json` | MC (20), error-correct (10) | 30 |
| `grammar-phrases-clauses.json` | MC (20) | 20 |
| `grammar-reported-speech.json` | MC (20), error-correct (10) | 30 |
| `grammar-subjunctive.json` | MC (20), error-correct (10) | 30 |
| `grammar-modal-verbs.json` | MC (20), error-correct (10) | 30 |
| `grammar-subject-verb-concord.json` | MC (20), error-correct (10) | 30 |
| `grammar-tag-questions.json` | MC (20), error-correct (10) | 30 |
| **Subtotal** | | **310** |

#### Priority 2 — Phonetics & Vocabulary & Reading (all in English)
| File | Types | Count |
|------|-------|-------|
| `phonetics-pronunciation.json` | MC (20) | 20 |
| `phonetics-stress.json` | MC (20) | 20 |
| `vocab-communicative.json` | MC (90) | 90 |
| `reading-comprehension.json` | reading-comprehension (10) | 10 |
| `reading-gap-filling.json` | reading-comprehension (10) | 10 |
| **Subtotal** | | **150** |

#### Priority 3 — Review & Test files (mixed types still in English)
| File | Remaining Types | Count |
|------|----------------|-------|
| `review-error-finding.json` | error-correct (15) | 15 |
| `test-1.json` | MC (24), reading-comprehension (4) | 28 |
| `test-2.json` | MC (24), reading-comprehension (4) | 28 |
| `test-3.json` | MC (24), reading-comprehension (4) | 28 |
| `test-4.json` | MC (24), reading-comprehension (4), sentence-combine (4), sentence-build (4) | 36 |
| `test-5.json` | MC (24), reading-comprehension (4), sentence-combine (4), sentence-build (4) | 36 |
| `test-6.json` | MC (24), reading-comprehension (4), sentence-combine (4), sentence-build (4) | 36 |
| `test-7.json` | MC (20), reading-comprehension (4), sentence-combine (2) | 26 |
| `test-8.json` | MC (20), reading-comprehension (4), sentence-combine (2) | 26 |
| `test-9.json` | MC (20), reading-comprehension (4), sentence-combine (2) | 26 |
| **Subtotal** | | **285** |

### Grand Total Remaining: ~745 explanations

---

## How to Use

### Process one file:
```
Read docs/REVIEW_EXPLANATIONS_PROMPT.md for the universal instructions and type-specific guidance.
Process data/{file}.json — update all {type} explanations to Vietnamese-first style.
Commit with message: "fix: review {type} explanations — {filename} ({count} items)"
```

### Batch process (recommended — run multiple agents in parallel):
```
For each file in priority group, launch an agent with:
- The universal instructions from docs/REVIEW_EXPLANATIONS_PROMPT.md
- The type-specific guidance for the exercise type(s) in that file
- The file path and expected item count

Commit each file separately for easy rollback.
```

### Verify after each batch:
```bash
node scripts/validate-data.js    # Must show 0 errors
npx vitest run                   # All 2568+ tests must pass
```
