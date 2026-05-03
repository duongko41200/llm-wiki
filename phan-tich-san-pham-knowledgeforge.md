# 🚀 KnowledgeForge — Bản phân tích chức năng v4 (đã chỉnh theo feedback)

> **Định vị**: Gia sư AI cá nhân — dùng song song với bất kỳ trung tâm nào.

---

## 📋 TỔNG QUAN CHỨC NĂNG

| # | Chức năng | Trạng thái | Ưu tiên |
|---|-----------|:----------:|:-------:|
| 1 | Smart Error Memory (Sticky Notes kéo thả) | 🔜 Làm | 🔴 CAO |
| 2 | AI Writing Coach (ưu tiên tài liệu upload) | 🔜 Làm | 🔴 CAO |
| 3 | AI Speaking Partner 24/7 | 🔜 Làm | 🔴 CAO |
| 4 | Auto Study Schedule (Lịch học tự động cá nhân hóa) | 🔜 Làm | 🔴 CAO |
| 5 | Instant Context Dictionary | 🔜 Làm | 🟡 TB |
| 6 | Audio Shadowing + AI | 🔜 Làm | 🟡 TB |
| 7 | Reading Speed Trainer | 🔜 Làm | 🟡 TB |
| 8 | AI Summarizer — tóm tắt tài liệu | 🔜 Làm | 🟡 TB |
| 9 | Voice Journal — nhật ký nói | 🔜 Làm | 🟢 THẤP |
| 10 | ~~Exam Prediction Engine~~ | 💤 Sau | — |

---

## 🔥 1. Smart Error Memory — Sticky Notes kéo thả

### Mô tả
Mỗi lỗi user mắc (Writing, Speaking, Quiz) → tạo thành **sticky note** hiện trên màn hình. User có thể:
- **Kéo thả** note đến vị trí bất kỳ trên dashboard
- **Ghim** note quan trọng
- **Đánh dấu "Đã sửa"** khi đã luyện xong
- **Nhóm** theo loại (Grammar / Vocabulary / Pronunciation)

### Giao diện sticky notes

```
┌──────────────────────────────────────────────────────────┐
│  📌 DASHBOARD                                            │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ 🔴 Grammar      │  │ 🟡 Vocabulary   │                │
│  │                 │  │                 │                │
│  │ Past Simple vs  │  │ "make up for"   │                │
│  │ Present Perfect │  │ = bù đắp        │                │
│  │                 │  │                 │                │
│  │ Lặp: 12 lần    │  │ Lặp: 3 lần     │                │
│  │ [Luyện] [Xong✓]│  │ [Luyện] [Xong✓]│                │
│  └─────────────────┘  └─────────────────┘                │
│                                                          │
│       ┌─────────────────┐                                │
│       │ 🔵 Speaking      │                                │
│       │                 │                                │
│       │ Phát âm "third" │                                │
│       │ → /θɜːrd/       │                                │
│       │                 │                                │
│       │ [Nghe mẫu] [Ghi âm]                             │
│       └─────────────────┘                                │
│                                                          │
│  [+ Thêm note thủ công]                                 │
└──────────────────────────────────────────────────────────┘
```

### Tính năng chi tiết
- **Auto-create**: AI tự tạo note mỗi khi phát hiện lỗi mới
- **Spaced repetition**: Note "chưa sửa" sẽ tự nhảy lên trên cùng sau 3 ngày
- **Đếm lặp**: Hiện số lần user mắc lại cùng 1 lỗi
- **Áp dụng cho**: Writing (lỗi grammar, vocab) + Speaking (lỗi phát âm, grammar nói)
- **Export**: Xuất tất cả notes thành PDF để in ra dán bàn học

### Kỹ thuật
- Frontend: React DnD (drag & drop) hoặc `react-beautiful-dnd`
- Lưu vị trí note trong localStorage / SQLite
- Gemini phân loại lỗi tự động

---

## 🔥 2. AI Writing Coach — Ưu tiên tài liệu upload

### Mô tả
User viết bài → AI chấm NGAY theo rubric Aptis. **Bài mẫu gợi ý lấy từ tài liệu đã upload trước**. Chỉ khi không có bài mẫu phù hợp trong tài liệu thì AI mới tự tạo.

### Flow chấm bài

```
User viết bài Writing
        ↓
AI chấm điểm theo 4 tiêu chí Aptis
        ↓
Tìm trong tài liệu đã upload:
   → CÓ bài mẫu cùng topic? 
      ✅ Hiện bài mẫu từ tài liệu + highlight điểm tốt
   → KHÔNG có?
      ⚠️ AI tự viết bài mẫu + ghi rõ "Bài mẫu do AI tạo"
        ↓
Liệt kê 3-5 lỗi cần sửa ngay
        ↓
Tạo Sticky Note cho mỗi lỗi mới (liên kết feature #1)
```

### Bảng chấm điểm

```
📊 KẾT QUẢ CHẤM WRITING
─────────────────────────────
Đề bài: Write a formal email to complain about a product

┌──────────────────┬───────┬──────────────────────────┐
│ Tiêu chí         │ Điểm  │ Nhận xét                 │
├──────────────────┼───────┼──────────────────────────┤
│ Task Response    │ 3/5   │ Thiếu phần "yêu cầu bồi │
│                  │       │ thường" — đề yêu cầu     │
│ Grammar          │ 3/5   │ 4 lỗi (→ xem Sticky)    │
│ Vocabulary       │ 4/5   │ Đa dạng, phù hợp formal │
│ Coherence        │ 3/5   │ Thiếu linking words      │
└──────────────────┴───────┴──────────────────────────┘
Ước tính band: ~B1

📝 BÀI MẪU THAM KHẢO:
📄 Từ tài liệu "ABC Center - Writing Tasks.pdf" (trang 15)
   [Xem bài mẫu gốc]

   — hoặc nếu không có —
   
🤖 Bài mẫu do AI tạo (level B2):
   [Xem bài mẫu AI]
```

---

## 🔥 3. AI Speaking Partner — Luyện nói 24/7

### Mô tả
AI đóng vai giám khảo Aptis Speaking, 4 parts đúng format thi thật.

### Flow

```
[Chọn Part] → Part 1 / Part 2 / Part 3 / Part 4
        ↓
AI hiện câu hỏi (text + audio TTS)
   🔊 "Tell me about a place you like to visit"
        ↓
User bấm ghi âm → nói → bấm dừng
   🎙️ Recording... (30 giây)
        ↓
AI phiên âm (Whisper / Web Speech API)
        ↓
AI chấm điểm:
   Pronunciation:  7/10 ████████░░
   Grammar:        6/10 ███████░░░
   Vocabulary:     8/10 █████████░
   Fluency:        5/10 ██████░░░░
        ↓
AI gợi ý câu trả lời tốt hơn
        ↓
Lỗi phát âm → tạo Sticky Note (liên kết feature #1)
        ↓
[Thử lại] → So sánh lần 1 vs lần 2
```

### Chế độ đặc biệt
- **Free talk**: Nói chuyện tự do với AI (luyện fluency)
- **Topic drill**: Chọn topic → AI hỏi 5 câu liên tục
- **Timed mode**: Giả lập áp lực thời gian thi thật

---

## 🔥 4. Auto Study Schedule — Lịch học tự động cá nhân hóa

### Mô tả
AI tự động xây dựng lộ trình và tạo lịch học cá nhân cho người dùng dựa trên mục tiêu điểm số và thời gian thi. Mỗi khi user bật phần mềm, một thông báo nổi (popup) sẽ xuất hiện để nhắc nhở nhiệm vụ học tập của ngày hôm đó.

```
🔔 THÔNG BÁO KHI BẬT APP
────────────────────────────────────
Xin chào! Lịch học hôm nay của bạn (02/05/2026):

⚡ Nhiệm vụ 1: Luyện Speaking Part 2 (15 phút)
   → Lý do: Điểm Fluency hôm qua của bạn hơi thấp.
   [Bắt đầu ngay]

⚡ Nhiệm vụ 2: Ôn lại 3 Sticky Notes bị lỗi (5 phút)
   → Grammar: Past Simple vs Present Perfect
   [Xem Sticky Notes]

⚡ Nhiệm vụ 3: Làm 1 bài Mock Test Reading (30 phút)
   [Bắt đầu ngay]

🎯 Mục tiêu tháng này: Đạt B2 Aptis (Còn 15 ngày)
```

### Tính năng chi tiết
- **Dynamic Scheduling**: Lịch học không cố định mà tự động điều chỉnh dựa trên kết quả làm bài của user (yếu phần nào AI sẽ tự chèn lịch học phần đó vào ngày hôm sau).
- **Push Notification / App Startup Popup**: Hiển thị thông báo thân thiện và rõ ràng ngay khi user mở app để họ không phải suy nghĩ "hôm nay học gì".
- **Tracking tiến độ**: Hiển thị thanh tiến trình hoàn thành mục tiêu.

---

## 🟡 5. Instant Context Dictionary — Từ điển trong ngữ cảnh

### Mô tả
Khi đọc tài liệu trong app → bôi đen từ/cụm từ → AI popup giải thích trong ngữ cảnh câu đó.

```
User bôi đen: "look into"

📖 TRONG CÂU NÀY:
"The manager will look into the matter."
→ Nghĩa: điều tra, xem xét (investigate)

📚 CÁC NGHĨA KHÁC:
1. look into (nhìn vào trong): look into the box
2. look into (điều tra): ← NGHĨA TRONG CÂU NÀY

🎯 PHRASAL VERBS LIÊN QUAN:
- look up (tra cứu)
- look after (chăm sóc)
- look forward to (mong đợi)

💾 [Lưu vào Sticky Note] [Nghe phát âm]
```

---

## 🟡 6. Audio Shadowing + AI

### Mô tả
Luyện Listening bằng kỹ thuật Shadowing: nghe → nói theo → AI so sánh.

```
🎧 SHADOWING MODE
─────────────────
Bước 1: Nghe gốc (100% speed)
   🔊 "The conference will be held on the third floor"

Bước 2: Nghe chậm (70% speed)

Bước 3: Nói theo (ghi âm)

Bước 4: AI so sánh phát âm
   ✅ "conference" — đúng
   ⚠️ "third" → bạn nói "thurd" → sửa: /θɜːrd/

Bước 5: Tăng tốc dần: 70% → 85% → 100% → 110%
```

---

## 🟡 7. Reading Speed Trainer

### Mô tả
Aptis Reading có giới hạn thời gian. Luyện đọc nhanh + hiểu đúng.

```
📖 READING SPEED TRAINER
────────────────────────
Đoạn văn: 250 từ
Thời gian mục tiêu: 2 phút (125 wpm)

[Bắt đầu đọc] ← bấm bắt đầu

   Đoạn văn hiện dần / highlight dòng đang đọc
   Timer đếm ngược: 1:45... 1:30...

[Đã đọc xong] ← bấm khi đọc xong

⏱️ Thời gian: 1:52 (134 wpm) — Tốt!

📝 3 câu hỏi kiểm tra comprehension:
   1. What is the main idea? [A] [B] [C]
   2. ...

Kết quả: 2/3 đúng
→ Tốc độ: ✅ Nhanh hơn mục tiêu
→ Hiểu: ⚠️ Cần chính xác hơn
→ Gợi ý: Đọc chậm lại 10%, tập trung keywords
```

---

## 🟡 8. AI Summarizer — Tóm tắt tài liệu

### Mô tả
Upload tài liệu dài (50 trang) → AI tóm tắt thành:
- **1 trang** tổng quan
- **Bullet points** key takeaways
- **Flashcards** tự động từ nội dung
- **Mind map** cấu trúc bài

```
📄 TÀI LIỆU: "ABC Center - Reading Strategies.pdf" (52 trang)

📋 TÓM TẮT (1 phút đọc):
─────────────────────────
Tài liệu cover 5 chiến lược đọc chính:
1. Skimming — đọc lướt tìm ý chính
2. Scanning — tìm thông tin cụ thể
3. Inference — suy luận từ ngữ cảnh
4. Matching — nối thông tin
5. Ordering — sắp xếp thứ tự

🎯 KEY TAKEAWAYS:
• Skimming: đọc title + first sentence mỗi đoạn
• Scanning: tìm keywords (tên, số, ngày)
• Inference: chú ý từ "however, although, despite"

📝 FLASHCARDS TỰ ĐỘNG: 15 cards đã tạo
   [Bắt đầu luyện flashcard]
```

---

## 🟢 9. Voice Journal — Nhật ký nói

### Mô tả
Mỗi ngày user ghi âm 1-2 phút nói tiếng Anh về bất kỳ chủ đề gì. AI tracking tiến bộ theo thời gian.

```
📅 NHẬT KÝ NÓI CỦA BẠN
───────────────────────
Ngày 1 (01/05): "My daily routine" — Fluency: 4/10
Ngày 5 (05/05): "My favorite food" — Fluency: 5/10
Ngày 10 (10/05): "Travel experience" — Fluency: 6/10 📈

📊 TIẾN BỘ 30 NGÀY:
Fluency:      4 → 6 (+50%) 📈
Vocabulary:   Dùng 120 → 180 từ unique
Grammar:      Giảm 8 → 3 lỗi/phút
Pronunciation: Sửa được 5/8 lỗi phát âm
```

---

## 💤 10. Exam Prediction Engine *(phát triển sau)*

> Phân tích 50-100 đề thi đã upload → dự đoán topic/dạng câu hỏi hay ra.
> **Ghi chú**: Để sau khi đã có đủ dữ liệu từ nhiều user upload.

---

## 📊 BẢNG SO SÁNH TỔNG HỢP

| Chức năng | Trung tâm | KnowledgeForge |
|-----------|:---------:|:--------------:|
| Đề thi có sẵn | ✅ | ❌ (upload) |
| **Sticky Notes lỗi kéo thả** | ❌ | ✅ |
| **Chấm Writing tức thì** | ❌ | ✅ |
| **Speaking Partner 24/7** | ❌ | ✅ |
| **Lịch học tự động + Nhắc nhở** | ❌ | ✅ |
| **Từ điển trong ngữ cảnh** | ❌ | ✅ |
| **Audio Shadowing AI** | ❌ | ✅ |
| **Reading Speed Trainer** | ❌ | ✅ |
| **Tóm tắt tài liệu AI** | ❌ | ✅ |
| **Voice Journal tracking** | ❌ | ✅ |
| Dùng với MỌI trung tâm | ❌ | ✅ |
| Chạy offline | ❌ | ✅ |

---

## 🎯 THỨ TỰ TRIỂN KHAI ĐỀ XUẤT

### Phase 1 — MVP bán được (2-3 tuần)
1. ✅ Upload tài liệu + AI Chat (đã có)
2. 🔜 **Auto Study Schedule** — tự lên lịch + popup nhắc nhở mỗi ngày
3. 🔜 **AI Writing Coach** — nhu cầu cao nhất (ưu tiên tài liệu upload)
4. 🔜 **Smart Error Memory + Sticky Notes**

### Phase 2 — Killer features (2-3 tuần)
5. **AI Speaking Partner**
6. **Instant Context Dictionary**

### Phase 3 — Engagement (2-3 tuần)
7. **AI Summarizer**
8. **Reading Speed Trainer**

### Phase 4 — Growth (2+ tuần)
9. **Audio Shadowing**
10. **Voice Journal**
11. *(Sau)* Exam Prediction Engine
