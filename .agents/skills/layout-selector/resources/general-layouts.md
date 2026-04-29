# General Layouts — Layout Reference

## Danh sách / Liệt kê

### `stagger-list / default`
- Bất kỳ danh sách 3-7 items
- Các bước ôn thi theo thứ tự
- Danh sách tài liệu cần chuẩn bị
- Điểm rút ra từ đề thi
- Lý do nên/không nên học kỹ năng X

### `stagger-list / card-stack`
- Danh sách tips quan trọng, mỗi tip là 1 card đẹp
- "5 bí kíp Writing" design premium
- Items có mô tả ngắn kèm theo

### `stagger-list / timeline-dots`
- Lộ trình ôn thi theo tuần/tháng
- Diễn biến kỳ thi từ đầu đến cuối
- Milestone học tập của học viên

### `stagger-list / scanner-match`
- Từ vựng học thuật ↔ Định nghĩa
- Connector ↔ Cách dùng
- Dạng bài ↔ Chiến lược
- Lỗi phổ biến ↔ Cách sửa

**Mẫu data:**
```json
{ "body": ["furthermore ➡️ thêm vào đó, ngoài ra", "however ➡️ tuy nhiên, mặc dù vậy", "therefore ➡️ do đó, vì vậy"] }
```

### `stagger-list / keyword-badge`
- Từ khoá có badge nổi bật
- Tag kỹ năng: READING / WRITING / LISTENING
- Highlights key terms trong bài học

### `pill-stack / default`
- Danh sách pill shape, hiện đại
- Tags ngắn không có description
- Danh sách từ vựng compact

---

## Số liệu

### `big-stat / default`
- 1 con số lớn chiếm màn hình + text giải thích
- "73%" fail phần Writing

### `big-stat / glow-card`
- Con số phát sáng, dramatic
- Highlight achievement: "C1"
- Số liệu viral, gây sốc

### `big-stat / hexagon`
- Tech/hexagon style
- Video phong cách modern/futuristic

### `data-callout / default`
- Highlight 1 dữ liệu quan trọng kèm context
- Số liệu cần giải thích thêm

---

## Hướng dẫn từng bước

### `step-by-step / default`
- Quy trình làm bài Writing
- Các bước đăng ký thi
- Hướng dẫn luyện Speaking

### `step-by-step / formula`
- Công thức cấu trúc câu: S + V + O + (ADV)
- Formula viết mở đoạn: Hook + Bridge + Thesis
- Công thức tính điểm CEFR

### `step-by-step / horizontal-flow`
- Timeline ngày thi
- Luồng xử lý: Đọc đề → Phân tích → Viết → Review
- Quy trình làm Reading theo thứ tự

### `step-by-step / bento-grid`
- Dashboard nhiều tip nhỏ
- Grid 4 ô: 4 kỹ năng mỗi kỹ năng 1 tip
- Tổng kết bài học dạng infographic

---

## Giáo dục

### `education-visual / correction`
- Câu Writing sai → Câu đúng (đỏ vs xanh)
- Cách dùng từ sai vs đúng trong ngữ cảnh
- Cấu trúc câu sai ngữ pháp → sửa lại

**Mẫu data:**
```json
{ "body": ["✕ I am very agree with this opinion", "✓ I strongly agree with this opinion"] }
```

### `education-visual / checklist`
- Tiêu chí chấm điểm Writing từng mục
- Kỹ năng B2 CEFR cần đạt
- To-do list ôn thi 1 tuần cuối

### `education-visual / standard-response`
- Q: Câu hỏi Speaking → A: Câu trả lời mẫu
- Đề bài Writing → Bài mẫu tham khảo
- Tình huống giao tiếp → Cách phản hồi chuẩn

**Mẫu data:**
```json
{ "caption": "Describe a memorable journey you have taken.", "body": "I'd like to talk about a trip I took to Da Nang last summer..." }
```

### `education-visual / big-numeric`
- "4 kỹ năng" + giải thích mỗi kỹ năng
- "72 phút" Writing + gợi ý phân bổ
- "B2" level mục tiêu + những gì cần đạt

---

## So sánh

### `compare-items / split-vs`
- Aptis vs IELTS: nên chọn cái nào?
- Writing Task 1 vs Task 2 khác nhau thế nào
- Học nhóm vs tự học: cái nào hiệu quả?
- Luyện thi online vs offline

### `compare-items / feature-table`
- So sánh Aptis General / ESOL / Advanced
- Bảng so sánh trung tâm luyện thi
- So sánh tài liệu: ưu/nhược/giá/phù hợp

### `vs-battle / default`
- 2 lựa chọn chiến nhau toàn màn hình
- Drama tối đa, kịch tính

### `venn-diagram / default`
- Điểm chung giữa 2 kỹ năng
- Overlap giữa Reading và Listening
- Điểm giao nhau giữa 2 phương pháp

---

## Trích dẫn / Quote

### `neon-quote / default`
- Quote neon sáng, dramatic
- Câu motivation cho thí sinh

### `neon-quote / card-quote`
- Quote dài hơn, cần card
- Nhận xét chi tiết từ học viên sau thi
- Excerpt từ tài liệu British Council

### `neon-quote / minimal`
- Quote ngắn, impactful, không gian thoáng
- 1 rule duy nhất cần nhớ
- Slogan, tagline chương trình

---

## Hội thoại

### `speech-bubble / default`
- Mô phỏng hội thoại trong Speaking test
- Kịch bản giao tiếp thực tế
- Câu hỏi giáo viên - trả lời học sinh

### `speech-bubble / neon-chat`
- Chat style hiện đại, phù hợp Gen Z
- Mô phỏng tin nhắn hỏi đáp về Aptis
- Hội thoại giữa 2 thí sinh về đề

### `speech-bubble / highlight`
- Highlight câu quan trọng trong hội thoại
- Chú thích ý nghĩa của câu vừa nói
- Nhấn mạnh key phrase cần học

---

## Phụ đề / Karaoke

### `karaoke-subtitle / default`
- Video có voiceover, highlight từng từ
- Giải thích từ trong câu định nghĩa
- Phụ đề cho audio/video mẫu thi

### `karaoke-subtitle / line-by-line`
- Đọc từng câu trong bài văn mẫu
- Giải thích từng dòng câu trả lời mẫu
- Script nói chuyện theo từng ý

### `karaoke-subtitle / bounce-word`
- Nhấn mạnh từ vựng quan trọng
- Highlight connector: "Furthermore", "However"
- Từ khoá bị underestimate nhưng quan trọng

---

## Viral / Cảm xúc

### `panic-escalation / default`
- "Còn 2 tuần thi, chưa ôn gì"
- Escalation từ "chưa lo" → "panic"
- Cảm xúc leo thang khi phát hiện đề khó

### `panic-escalation / notification-storm`
- Bão thông báo lịch thi / kết quả
- Nhiều reminder dồn dập về deadline
- Trạng thái thông báo của thí sinh

### `top-ranking / default`
- Bảng xếp hạng Top 3 (kỹ năng, tài liệu...)
- "Top 3 lỗi Speaking phổ biến nhất"

### `breaking-news / default`
- Phong cách bản tin khẩn tạo urgency
- Phù hợp khi muốn viral nhanh

### `podcast-subtitle / default`
- Phong cách podcast, waveform animation
- Video dạng interview hoặc monologue dài

---

## Tiêu đề / CTA

### `centered-title / default`
- Tiêu đề đơn giản, rõ ràng
- Tên phần thi, level mục tiêu

### `centered-title / gradient-text`
- Tiêu đề cần nổi bật, màu gradient
- Scene tiêu đề chính của video

### `centered-title / typewriter`
- Hiệu ứng đánh máy, gây chú ý
- Reveal từ từ tên chủ đề

### `centered-fact / default`
- 1 sự thật/fact đơn độc, impactful
- "Aptis B2 = Công nhận tại 100+ quốc gia"

### `cta-block / default`
- Call-to-action cuối video
- "Follow để xem thêm video Aptis"

### `split-content / default`
- Chia đôi: ảnh/visual trên + text dưới
- Kết hợp media và text một cách cân bằng

---

## Cấu trúc nâng cao

### `mindmap-flow / default`
- Sơ đồ tư duy: chủ đề → nhánh
- Tổng quan Reading Part 3

### `mindmap-flow / flowchart`
- Lưu đồ có điều kiện
- "Nếu... thì... / Nếu không... thì..."

### `timeline-vertical / default`
- Timeline dọc với các mốc sự kiện
- Lộ trình học chi tiết theo tháng
