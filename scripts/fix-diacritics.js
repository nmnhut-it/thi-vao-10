/**
 * Fix Vietnamese diacritics in all JSON data files
 * Run: node scripts/fix-diacritics.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Title mappings (non-diacritic -> with diacritics)
const TITLE_MAP = {
  'Active & Passive (Chu Dong & Bi Dong)': 'Active & Passive (Chủ Động & Bị Động)',
  'Articles (Mao Tu)': 'Articles (Mạo Từ)',
  'Comparison (So Sanh)': 'Comparison (So Sánh)',
  'Conditional Sentences (Cau Dieu Kien)': 'Conditional Sentences (Câu Điều Kiện)',
  'Conjunctions (Lien Tu)': 'Conjunctions (Liên Từ)',
  'Modal Verbs (Dong Tu Khuyet Thieu)': 'Modal Verbs (Động Từ Khuyết Thiếu)',
  'Phrases & Clauses (Cum Tu & Menh De)': 'Phrases & Clauses (Cụm Từ & Mệnh Đề)',
  'Prepositions (Gioi Tu)': 'Prepositions (Giới Từ)',
  'Quantifiers (Luong Tu)': 'Quantifiers (Lượng Từ)',
  'Relative Clauses (Menh De Quan He)': 'Relative Clauses (Mệnh Đề Quan Hệ)',
  'Reported Speech (Cau Tuong Thuat)': 'Reported Speech (Câu Tường Thuật)',
  'Subject-Verb Concord (Hoa Hop S-V)': 'Subject-Verb Concord (Hòa Hợp S-V)',
  'Subjunctive Mood (Gia Dinh)': 'Subjunctive Mood (Thể Giả Định)',
  'Tag Questions (Cau Hoi Duoi)': 'Tag Questions (Câu Hỏi Đuôi)',
  'Verb Forms (Dang Cua Dong Tu)': 'Verb Forms (Dạng Của Động Từ)',
  'Verb Tenses (Thi Dong Tu)': 'Verb Tenses (Thì Động Từ)',
  'Pronunciation (Phat Am)': 'Pronunciation (Phát Âm)',
  'Stress (Trong Am)': 'Stress (Trọng Âm)',
  'Reading Comprehension (Doc Hieu)': 'Reading Comprehension (Đọc Hiểu)',
  'Gap-Filling / Cloze Reading (Doc Dien Tu)': 'Gap-Filling / Cloze Reading (Đọc Điền Từ)',
  'Tong On Tim Loi Sai': 'Tổng Ôn Tìm Lỗi Sai',
  'Tong On Viet Lai Cau Dong Nghia': 'Tổng Ôn Viết Lại Câu Đồng Nghĩa',
  'Communicative Exchanges (Giao Tiep)': 'Communicative Exchanges (Giao Tiếp)',
  'Phrasal Verbs (Cum Dong Tu)': 'Phrasal Verbs (Cụm Động Từ)',
  'Closest & Opposite Meaning (Dong Nghia & Trai Nghia)': 'Closest & Opposite Meaning (Đồng Nghĩa & Trái Nghĩa)',
  'Word Choice (Chon Tu)': 'Word Choice (Chọn Từ)',
  'Word Formation (Cau Tao Tu)': 'Word Formation (Cấu Tạo Từ)',
  'Sentence Writing (Viet Cau)': 'Sentence Writing (Viết Câu)',
};

// Common Vietnamese words in knowledge HTML that need diacritics
const WORD_REPLACEMENTS = [
  // Grammar terms
  ['dong tu', 'động từ'],
  ['Dong tu', 'Động từ'],
  ['DONG TU', 'ĐỘNG TỪ'],
  ['tinh tu', 'tính từ'],
  ['Tinh tu', 'Tính từ'],
  ['trang tu', 'trạng từ'],
  ['Trang tu', 'Trạng từ'],
  ['danh tu', 'danh từ'],
  ['Danh tu', 'Danh từ'],
  ['menh de', 'mệnh đề'],
  ['Menh de', 'Mệnh đề'],
  ['MENH DE', 'MỆNH ĐỀ'],
  ['gioi tu', 'giới từ'],
  ['Gioi tu', 'Giới từ'],
  ['mao tu', 'mạo từ'],
  ['Mao tu', 'Mạo từ'],
  ['lien tu', 'liên từ'],
  ['Lien tu', 'Liên từ'],
  ['luong tu', 'lượng từ'],
  ['phu am', 'phụ âm'],
  ['Phu am', 'Phụ âm'],
  ['nguyen am', 'nguyên âm'],
  ['Nguyen am', 'Nguyên âm'],
  // Common phrases
  ['cong thuc', 'công thức'],
  ['Cong thuc', 'Công thức'],
  ['CONG THUC', 'CÔNG THỨC'],
  ['cach dung', 'cách dùng'],
  ['Cach dung', 'Cách dùng'],
  ['CACH DUNG', 'CÁCH DÙNG'],
  ['tu nhan biet', 'từ nhận biết'],
  ['Tu nhan biet', 'Từ nhận biết'],
  ['TU NHAN BIET', 'TỪ NHẬN BIẾT'],
  ['dien ta', 'diễn tả'],
  ['Dien ta', 'Diễn tả'],
  ['vi du', 'ví dụ'],
  ['Vi du', 'Ví dụ'],
  ['VD:', 'VD:'],
  ['luu y', 'lưu ý'],
  ['Luu y', 'Lưu ý'],
  ['LUU Y', 'LƯU Ý'],
  ['cau truc', 'cấu trúc'],
  ['Cau truc', 'Cấu trúc'],
  // Tense names
  ['hien tai don', 'hiện tại đơn'],
  ['Hien tai don', 'Hiện tại đơn'],
  ['hien tai tiep dien', 'hiện tại tiếp diễn'],
  ['Hien tai tiep dien', 'Hiện tại tiếp diễn'],
  ['hien tai hoan thanh', 'hiện tại hoàn thành'],
  ['Hien tai hoan thanh', 'Hiện tại hoàn thành'],
  ['qua khu don', 'quá khứ đơn'],
  ['Qua khu don', 'Quá khứ đơn'],
  ['qua khu tiep dien', 'quá khứ tiếp diễn'],
  ['Qua khu tiep dien', 'Quá khứ tiếp diễn'],
  ['qua khu hoan thanh', 'quá khứ hoàn thành'],
  ['Qua khu hoan thanh', 'Quá khứ hoàn thành'],
  ['tuong lai don', 'tương lai đơn'],
  ['Tuong lai don', 'Tương lai đơn'],
  ['tuong lai tiep dien', 'tương lai tiếp diễn'],
  ['tuong lai tiep dien', 'tương lai tiếp diễn'],
  ['tuong lai hoan thanh', 'tương lai hoàn thành'],
  // Other common words in knowledge HTML
  ['thoi quen', 'thói quen'],
  ['thoi gian', 'thời gian'],
  ['su that', 'sự thật'],
  ['hanh dong', 'hành động'],
  ['nghe nghiep', 'nghề nghiệp'],
  ['so thich', 'sở thích'],
  ['nguon goc', 'nguồn gốc'],
  ['thuong xuyen', 'thường xuyên'],
  ['lich trinh', 'lịch trình'],
  ['thong bao', 'thông báo'],
  ['chan li', 'chân lí'],
  ['binh pham', 'bình phẩm'],
  ['thoi diem', 'thời điểm'],
  ['ke hoach', 'kế hoạch'],
  ['thay doi', 'thay đổi'],
  ['ca than', 'ca thán'],
  ['phan nan', 'phàn nàn'],
  ['trai nghiem', 'trải nghiệm'],
  ['hoi uc', 'hồi ức'],
  ['ki niem', 'kỉ niệm'],
  ['du doan', 'dự đoán'],
  ['loi hua', 'lời hứa'],
  ['kho co the', 'khó có thể'],
  ['khang dinh', 'khẳng định'],
  ['Khang dinh', 'Khẳng định'],
  ['phu dinh', 'phủ định'],
  ['Phu dinh', 'Phủ định'],
  ['nghi van', 'nghi vấn'],
  ['Thanh lap', 'Thành lập'],
  ['thanh lap', 'thành lập'],
  ['cau khang dinh', 'câu khẳng định'],
  ['so nhieu', 'số nhiều'],
  ['so it', 'số ít'],
  ['nguyen mau', 'nguyên mẫu'],
  ['chu dong', 'chủ động'],
  ['Chu dong', 'Chủ động'],
  ['bi dong', 'bị động'],
  ['Bi dong', 'Bị động'],
  ['cau dieu kien', 'câu điều kiện'],
  ['Cau dieu kien', 'Câu điều kiện'],
  ['the gia dinh', 'thể giả định'],
  ['tuong thuat', 'tường thuật'],
  ['quan he', 'quan hệ'],
  ['so sanh', 'so sánh'],
  ['So sanh', 'So sánh'],
  ['SO SANH', 'SO SÁNH'],
  ['dang lap', 'đẳng lập'],
  ['phu thuoc', 'phụ thuộc'],
  ['ket hop', 'kết hợp'],
  ['tuong quan', 'tương quan'],
  ['dem duoc', 'đếm được'],
  ['khong dem duoc', 'không đếm được'],
  ['Mot so', 'Một số'],
  ['mot so', 'một số'],
  ['thuong gap', 'thường gặp'],
  ['Nhom chu', 'Nhóm chữ'],
  ['nhom chu', 'nhóm chữ'],
  ['Quy tac', 'Quy tắc'],
  ['quy tac', 'quy tắc'],
  ['phat am', 'phát âm'],
  ['Phat am', 'Phát âm'],
  ['PHAT AM', 'PHÁT ÂM'],
  ['trong am', 'trọng âm'],
  ['Trong am', 'Trọng âm'],
  ['TRONG AM', 'TRỌNG ÂM'],
  ['am cam', 'âm câm'],
  ['vo thanh', 'vô thanh'],
  ['huu thanh', 'hữu thanh'],
  ['Chu cai', 'Chữ cái'],
  ['chu cai', 'chữ cái'],
  ['ngoai le', 'ngoại lệ'],
  ['Ngoai le', 'Ngoại lệ'],
  ['Dau hieu', 'Dấu hiệu'],
  ['dau hieu', 'dấu hiệu'],
  ['Vi tri', 'Vị trí'],
  ['vi tri', 'vị trí'],
  ['chuc nang', 'chức năng'],
  ['Chuc nang', 'Chức năng'],
  ['Dac diem', 'Đặc điểm'],
  ['dac diem', 'đặc điểm'],
  ['Can chu y', 'Cần chú ý'],
  ['can chu y', 'cần chú ý'],
  ['Quy luat', 'Quy luật'],
  ['quy luat', 'quy luật'],
  ['gan nhat', 'gần nhất'],
  ['cum tu', 'cụm từ'],
  ['Cum tu', 'Cụm từ'],
];

let totalFixed = 0;

fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).forEach(fileName => {
  const filePath = path.join(DATA_DIR, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix title
  const data = JSON.parse(content);
  if (data.title && TITLE_MAP[data.title]) {
    content = content.replace(JSON.stringify(data.title), JSON.stringify(TITLE_MAP[data.title]));
    changed = true;
    totalFixed++;
  }

  // Fix Vietnamese words in knowledge HTML and other text fields
  WORD_REPLACEMENTS.forEach(([from, to]) => {
    // Use word boundary-aware replacement to avoid partial matches
    // Only replace in Vietnamese context (not inside English words)
    const regex = new RegExp('(?<![a-zA-ZÀ-ỹ])' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-zA-ZÀ-ỹ])', 'g');
    const before = content;
    content = content.replace(regex, to);
    if (content !== before) {
      changed = true;
      totalFixed++;
    }
  });

  if (changed) {
    // Verify JSON is still valid
    try {
      JSON.parse(content);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed: ' + fileName);
    } catch (e) {
      console.error('ERROR: ' + fileName + ' - JSON broken after replacement: ' + e.message);
    }
  }
});

console.log('---');
console.log('Total replacements: ' + totalFixed);
