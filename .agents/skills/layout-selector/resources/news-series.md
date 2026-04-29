# News Series — Layout Reference

## `news-hook` — Màn hình mở đầu

### `classic-breaking`
**Dùng khi:**
- Thông báo kết quả thi chính thức vừa được công bố
- Thay đổi cấu trúc đề thi Aptis
- Tin nóng: lịch thi mới, địa điểm thay đổi
- Thông tin học bổng liên quan Aptis

**Mẫu data:**
```json
{ "headline": "Aptis vừa thay đổi cấu trúc đề thi!", "body": "Có hiệu lực từ tháng 6/2025" }
```

### `data-hook`
**Dùng khi:**
- Mở đầu bằng tỷ lệ gây sốc ("73% thí sinh fail Writing")
- Điểm trung bình thấp hơn kỳ vọng
- Số câu hỏi mỗi phần, thời gian thi
- % thí sinh đạt B2 lần đầu

**Mẫu data:**
```json
{ "numeric": "73%", "headline": "thí sinh trượt phần Writing", "caption": "Kỳ thi 27/4" }
```

### `question`
**Dùng khi:**
- "Bạn đã biết cấu trúc đề Aptis mới nhất chưa?"
- "Reading Part 3 thực sự khó đến mức nào?"
- "Tại sao điểm Speaking thấp dù luyện nhiều?"
- Muốn kéo người xem bằng câu hỏi thực tế

### `quote`
**Dùng khi:**
- Trích dẫn từ British Council về tiêu chí chấm điểm
- Lời khuyên từ giáo viên uy tín
- Nhận xét thí sinh sau thi
- Trích quy chế thi chính thức

### `split-alert`
**Dùng khi:**
- Đề năm nay vs đề năm ngoái (2 cột)
- Aptis General vs Aptis ESOL
- Thông tin đúng vs thông tin sai đang lan truyền

### `full-bleed-image`
**Dùng khi:**
- Có ảnh đề thi, ảnh phòng thi, bảng kết quả
- Muốn cảm giác "như đang xem đề thật"
- Testimonial học viên kèm ảnh bảng điểm

### `cinematic`
**Dùng khi:**
- Intro video series dài
- Video milestone (100 học viên pass B2)
- Phong cách phim tài liệu

### `ticker-focus`
**Dùng khi:**
- Nhiều tin ngắn dồn dập (lịch, địa điểm, phí)
- Cập nhật nhanh nhiều thay đổi
- Phong cách bản tin tạo cảm giác khẩn cấp

---

## `news-problem` — Đặt vấn đề

### `data-impact`
- Tỷ lệ fail từng phần thi kèm số liệu
- Điểm trung bình toàn quốc vs điểm target B2
- Thời gian trung bình luyện để đạt level
- Chi phí thi, lệ phí retake

### `split-screen`
- Cách làm đúng vs cách làm sai phổ biến
- Thí sinh chuẩn bị tốt vs không chuẩn bị
- Kỳ thi tháng 4 vs tháng 10
- Aptis B2 vs C1 yêu cầu

### `timeline`
- Lịch sử thay đổi đề thi qua các năm
- Lộ trình ôn thi 3 tháng từ A2 lên B2
- Diễn biến ngày thi: check-in → thi → kết quả
- Thời gian từng phần trong buổi thi

### `quote-wall`
- Tổng hợp ý kiến học viên về phần khó nhất
- Feedback về đề thi gần đây từ nhiều người
- Nhận xét từ nhiều giáo viên

### `bento-grid`
- Overview 4 kỹ năng (R/W/L/S) cùng lúc
- Dashboard: thời gian, số câu, điểm tối đa
- Nhiều thông tin nhỏ trong 1 màn hình

### `stacked-cards`
- 5 lỗi phổ biến trong Writing
- 3 lý do fail Speaking
- Các "bẫy" trong Reading Part 3

### `before-after`
- Bài writing trước và sau khi sửa
- Điểm trước vs sau khi luyện 2 tháng
- Cách trả lời cũ vs được cải thiện

### `icon-story`
- Hành trình thi Aptis bằng icon
- Quy trình đăng ký thi từng bước
- Cấu trúc bài thi bằng hình ảnh

---

## `news-curiosity` — Tạo tò mò

### `countdown`
- "3 điều PHẢI biết trước khi thi Aptis"
- "5 lỗi ngữ pháp phổ biến nhất trong Writing"
- "Top 4 dạng bài Reading cần luyện ngay"
- Đếm ngược tip theo thứ tự quan trọng

### `reveal-blur`
- Tiết lộ dần cấu trúc đề (mờ → rõ)
- Hé lộ điểm số sau khi tạo suspense
- Che 1 phần câu hỏi → hiện đáp án

### `question-dissolve`
- Đặt câu hỏi khó → tan dần → hiện đáp án
- "Bạn có làm được câu này không?" → đáp án
- Câu hỏi bẫy trong Reading → giải thích

### `cliffhanger`
- Kết scene giữa chừng: "Và đây là lý do thật sự..."
- Cắt ngang trước khi nói điểm số
- Teaser chuyển sang scene tiếp theo

### `visual-tension`
- Áp lực thời gian (đồng hồ đếm ngược)
- "Bạn có 60 giây để trả lời"
- Tình huống khẩn cấp: lịch thi sắp đến

---

## `news-analysis` — Phân tích sâu

### `checklist`
- Checklist chuẩn bị trước ngày thi
- Kỹ năng cần đạt để pass B2
- Những điều cần tránh trong bài thi
- Checklist review bài Writing trước nộp
- Tiêu chí chấm điểm Speaking

### `step-by-step`
- Hướng dẫn đăng ký thi Aptis online
- Quy trình làm bài Reading Part 3 hiệu quả
- Các bước viết email/letter Writing Task 2
- Chiến lược Speaking theo từng turn

### `warning`
- Lỗi thường gặp trong Writing
- Điều bị cấm trong phòng thi
- Cảnh báo website giả mạo
- Lỗi ngữ pháp nghiêm trọng làm mất điểm

### `flowchart`
- Sơ đồ quyết định: Aptis General hay ESOL?
- Luồng xử lý Reading: câu hỏi trước hay đoạn văn?
- Chiến lược phân bổ thời gian Writing

### `compare`
- Aptis vs IELTS (chi phí, độ khó, ứng dụng)
- B2 Aptis vs B2 CEFR standard
- Writing Task 1 vs Task 2

### `expert-quote`
- Trích dẫn từ examiners về cách chấm
- Lời khuyên người đã đạt C1
- Nhận xét từ British Council

### `numbered-list`
- Top 5 lỗi Writing theo mức độ nghiêm trọng
- 7 từ nối quan trọng nhất trong Writing
- 3 chiến lược tốt nhất cho Speaking

### `pros-and-cons`
- Học với gia sư vs tự học
- Thi sớm vs thi sau khi chuẩn bị kỹ
- Dùng app vs học từ tài liệu giấy
