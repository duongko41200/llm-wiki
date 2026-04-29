# Exam Series — Layout Reference

## `exam-hook` — Mở đầu video ôn thi

### `score-reveal`
- Tiết lộ điểm thi của học viên thực tế (ẩn danh)
- Reveal từng phần (R/W/L/S) theo thứ tự kịch tính
- So sánh điểm mục tiêu vs điểm thực nhận
- Reveal điểm sau retake (cải thiện bao nhiêu)

### `stamp-verdict`
- Phán xét đề thi vừa diễn ra: DỄ / TRUNG BÌNH / KHÓ
- Đóng dấu: ĐỀ CÓ BẪY / ĐỀ CÔNG BẰNG
- Nhận xét: "Kỳ này Writing khó hơn kỳ trước"
- Verdict cho từng part độc lập

### `comparison-tease`
- "Đề 27/4 vs đề 15/3: Cái nào khó hơn?"
- So sánh 2 dạng bài xuất hiện cùng kỳ
- Preview 2 chiến lược trước khi phân tích

### `countdown-parts`
- Đếm ngược 4 phần thi Writing → Speaking
- "Part 3: 45 giây còn lại" cảm giác thi thật
- Intro cho video review từng phần

### `question-hook`
- 1 câu hỏi mẫu thật: "bạn sẽ trả lời gì?"
- Câu hỏi gây tranh cãi trong cộng đồng
- Câu hỏi bẫy mà 80% người làm sai

---

## `exam-stats` — Thống kê / Số liệu đề thi

### `data-cards`
- 4 thẻ: Số câu / Thời gian / Điểm tối đa / Level
- Phân tích kỳ thi 27/4: từng part theo thẻ riêng
- So sánh thống kê 2 kỳ thi gần nhất

**Mẫu data:**
```json
{ "body": ["📖 Reading | 50 câu | 50 phút", "✍️ Writing | 2 tasks | 50 phút", "🎧 Listening | 25 câu | 35 phút", "🗣️ Speaking | 3 parts | 12 phút"] }
```

### `gauge-meter`
- Đồng hồ độ khó: DỄ (xanh) → KHÓ (đỏ)
- Mức độ áp lực thời gian từng phần
- Tỷ lệ "bẫy câu hỏi" trong đề

### `bar-race`
- Biểu đồ thanh so sánh % pass từng part
- Điểm trung bình theo kỳ thi qua các năm

### `skill-towers`
- Tháp 4 kỹ năng chiều cao theo số câu
- So sánh điểm trung bình từng kỹ năng trong lớp

### `magazine-spread`
- Phong cách tạp chí: ảnh + số liệu đẹp
- Tổng kết kỳ thi dạng editorial

---

## `exam-showcase` — Trình bày nội dung đề thi

### `image-viewer`
- Screenshot đề thi thực (đã blur thông tin cá nhân)
- Ảnh phòng thi, máy tính, môi trường
- Bảng điểm kết quả thực tế

### `question-table`
- Bảng cấu trúc đề: Part × số câu × thời gian
- Dạng bài xuất hiện trong kỳ vừa rồi
- Ma trận kỹ năng × level × điểm

### `skills-breakdown`
- Phân tích chi tiết từng kỹ năng
- Reading: Part 1/2/3 breakdown
- Writing: Task 1 vs Task 2 so sánh

### `flashcard-flip`
- Từ vựng trong đề → lật → nghĩa + ví dụ
- Cụm từ học thuật thường gặp trong Reading
- Phrasal verbs trong Writing task

### `split-media`
- Câu hỏi đề bên trái, chiến lược bên phải
- Ví dụ sai ↔ ví dụ đúng
- Đề gốc ↔ gợi ý trả lời

---

## `exam-commentary` — Bình luận chuyên môn

### `tip-checklist`
- 5 mẹo làm bài Writing Task 2
- Checklist kiểm tra trước khi nộp
- Connector quan trọng cần nhớ
- Tip quản lý thời gian Speaking

### `verdict-card`
- Thẻ kết luận cuối video: "Đề kỳ này FAIR"
- Đánh giá tổng điểm: ★★★★☆
- Kết luận và call-to-action rõ ràng
- Khuyến nghị: nên retake hay không?

### `difficulty-breakdown`
- Phân tích từng Part: khó ở đâu, bẫy gì
- Breakdown theo kỹ năng: "Listening khó nhất vì..."
- Biểu đồ phân bổ độ khó trong đề

### `pros-cons`
- Ưu/nhược của đề thi kỳ này
- Đề phù hợp với trình độ nào
- Nên retake hay chấp nhận điểm?

### `expert-review`
- Review chuyên sâu từ góc độ giáo viên
- Phân tích chiến lược của British Council
- Nhận xét trend đề thi qua các kỳ
