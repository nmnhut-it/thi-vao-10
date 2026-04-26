# Explanation Style Guide

All explanations in this project target **Vietnamese Grade 9 students** studying English. Explanations must be clear, concise, and written primarily in Vietnamese.

## Core Rules

1. **Vietnamese-first** — Write in Vietnamese. Use English only for the actual words/phrases being discussed.
2. **Show the transformation** — Use `→` arrows to map original → answer or error → correction.
3. **Name the grammar concept** — State what rule or pattern applies (e.g., "bị động", "câu điều kiện loại 2", "so sánh nhất").
4. **1-2 sentences max** — Keep it short. The student just got the answer wrong; they need a quick "aha", not a lecture.
5. **No cryptic abbreviations** — Never write "V3", "PP", "S + V + ..." as the main explanation. If referencing structure, explain in Vietnamese what it means. "phân từ 2" or "quá khứ đơn" are OK in parentheses.
6. **Use proper Vietnamese diacritics** — Always write "Luyện Tập", never "Luyen Tap".

## Style by Exercise Type

### 1. `multiple-choice` (929 items)

**Fields:** question, options[], correctIndex, explanation

**Format:** Explain WHY the correct answer is right and briefly why the wrong options are wrong.

**Good examples:**
```
"'one-way' bắt đầu bằng âm /w/ (phụ âm) => dùng 'a', không dùng 'an'."
"'Do the laundry' = giặt đồ. Là cụm từ cố định phổ biến."
"Hai ý tưởng tương phản (tôi không thích >< anh tôi vẫn mê) => dùng 'but'."
"'should' diễn tả lời khuyên. 'will' là tương lai, 'can' là khả năng, 'must' quá mạnh — đều không phù hợp ngữ cảnh này."
```

**Bad examples:**
```
"Type 2 conditional (unreal present)."        ← too terse, no Vietnamese
"'Shouldn't' = should not, advising against something."  ← English only
"The correct answer is B because it is grammatically correct."  ← vague, no value
```

### 2. `error-correct` (172 items)

**Fields:** wrongSentence, correctSentence, errorWord, correction, explanation

**Format:** State the grammar rule violated, show the fix.

**Good examples:**
```
"Sau 'because of' là danh từ/cụm danh từ, không dùng mệnh đề. Phải đổi thành 'because' khi sau nó là mệnh đề (she was deaf)."
"'better' đã là dạng so sánh hơn rồi, không cần thêm 'more'. 'more better' là sai."
"Động từ sau 'make' dùng nguyên mẫu không 'to': 'make him go', không phải 'make him to go'."
```

**Bad examples:**
```
"Breakfast is served (passive), not serving (active)."  ← English, no rule explanation
"Type 3: if-clause needs past perfect."  ← cryptic abbreviation
```

### 3. `sentence-rewrite` (302 items) — DONE

**Fields:** original, instruction, starterText, answer, acceptedAnswers[], explanation

**Format:** Name the transformation, show mapping with →, state the rule.

**Good examples:**
```
"Chuyển chủ động sang bị động (hiện tại đơn). 'grow rice' → 'is grown'. Tân ngữ 'rice' lên làm chủ ngữ."
"Dùng câu điều kiện loại 2 cho tình huống không có thật hiện tại. 'doesn't have' → 'If she had', 'can't' → 'could'."
"Chuyển 'because + mệnh đề' thành 'because of + danh từ/V-ing'. 'because I was ill' → 'because of my illness'."
```

### 4. `sentence-combine` (19 items)

**Fields:** original, instruction, keyword, answer, acceptedAnswers[], explanation

**Format:** Name the connecting structure, show how two clauses merge.

**Good examples:**
```
"Nối bằng mệnh đề quan hệ 'which/that' cho vật. 'was bitten by it' → 'which bit me'."
"Dùng 'wish + quá khứ đơn' cho ước không có thật hiện tại. 'I can't swim' → 'wish I could swim'."
"Nối bằng 'If + quá khứ đơn, would + V' (điều kiện loại 2). 'don't have money, can't buy' → 'If I had money, I would buy'."
```

**Bad examples:**
```
"Use relative clause with 'which/that' for animals."  ← English
"Second conditional: If + past simple, would + infinitive."  ← formula, no mapping
```

### 5. `sentence-build` (12 items)

**Fields:** prompt, answer, acceptedAnswers[], explanation

**Format:** Explain what tense/structure is needed and why.

**Good examples:**
```
"Dùng quá khứ tiếp diễn (was reading) cho hành động đang xảy ra bị cắt ngang bởi quá khứ đơn (heard). Cấu trúc: was/were + V-ing khi có 'while' hoặc hành động nền."
"Dùng hiện tại hoàn thành tiếp diễn (have been waiting) cho hành động bắt đầu trong quá khứ và vẫn tiếp diễn. 'since 8 AM' → dùng have been V-ing."
```

**Bad examples:**
```
"Past continuous (was reading) for ongoing action interrupted by past simple (heard)."  ← English only
```

### 6. `reading-comprehension` (38 items)

**Fields:** passage, questions[] (each with question, options[], correctIndex, explanation)

**Format:** Point to the specific part of the passage that supports the answer. Quote briefly.

**Good examples:**
```
"Đoạn văn nói về khí tự nhiên là gì, cách phát hiện và các ứng dụng — đáp án D tóm tắt đúng nhất. Các đáp án khác chỉ nói một phần."
"Câu đầu tiên đoạn văn viết: 'A resume is a tool that can be used to obtain a job interview.' → đáp án A."
"Từ 'tiny germs that are so small' cho thấy virus rất nhỏ, có thể bay trong không khí → đáp án B."
```

**Bad examples:**
```
"The passage discusses what natural gas is..."  ← English, no reference to specific text
"The correct answer is D because it summarizes the passage."  ← vague
```

### 7. `fill-blank` (10 items)

**Fields:** question, answer, acceptedAnswers[], explanation

**Format:** Explain what grammar rule determines the blank.

**Good examples:**
```
"'car' là vật, làm chủ ngữ trong mệnh đề quan hệ => dùng 'which' hoặc 'that'."
"'whose' chỉ sự sở hữu, đứng trước danh từ 'mother' => 'whose mother'."
```

## Per-Type Checklist

When reviewing explanations, verify for EACH item:

- [ ] Explanation is in Vietnamese (English only for quoted words/phrases)
- [ ] Uses → arrows to show transformation (where applicable)
- [ ] Names the grammar concept/rule
- [ ] Is 1-2 sentences, concise
- [ ] No cryptic abbreviations (V3, PP, S+V formulas)
- [ ] Answer itself is grammatically correct
- [ ] `acceptedAnswers` includes common valid alternatives
- [ ] No spelling/grammar errors in the explanation itself
