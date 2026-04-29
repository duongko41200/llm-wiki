# Mẫu Cấu Trúc Video 5 Scene

## Mẫu A: Review Đề Thi

**Dùng khi:** Vừa có kỳ thi Aptis, muốn review ngay

```json
[
  { "scene": 1, "layoutType": "exam-hook",      "layoutStyle": "stamp-verdict",      "nội dung": "Phán xét tổng quan đề" },
  { "scene": 2, "layoutType": "exam-stats",     "layoutStyle": "data-cards",         "nội dung": "Số liệu cụ thể từng part" },
  { "scene": 3, "layoutType": "exam-showcase",  "layoutStyle": "question-table",     "nội dung": "Trình bày nội dung đề" },
  { "scene": 4, "layoutType": "exam-commentary","layoutStyle": "tip-checklist",      "nội dung": "Mẹo làm bài rút ra" },
  { "scene": 5, "layoutType": "exam-commentary","layoutStyle": "verdict-card",       "nội dung": "Kết luận + CTA" }
]
```

---

## Mẫu B: Tin Tức Aptis

**Dùng khi:** Có thông tin mới về lịch thi, thay đổi cấu trúc, kết quả

```json
[
  { "scene": 1, "layoutType": "news-hook",      "layoutStyle": "classic-breaking",   "nội dung": "Tin nóng" },
  { "scene": 2, "layoutType": "news-problem",   "layoutStyle": "data-impact",        "nội dung": "Thực trạng / số liệu" },
  { "scene": 3, "layoutType": "news-curiosity", "layoutStyle": "countdown",          "nội dung": "Tạo tò mò" },
  { "scene": 4, "layoutType": "news-analysis",  "layoutStyle": "checklist",          "nội dung": "Phân tích / hành động" },
  { "scene": 5, "layoutType": "news-analysis",  "layoutStyle": "expert-quote",       "nội dung": "Kết luận từ chuyên gia" }
]
```

---

## Mẫu C: Học Kỹ Năng / Bài Học

**Dùng khi:** Dạy 1 kỹ năng cụ thể (Writing, Speaking, Reading...)

```json
[
  { "scene": 1, "layoutType": "centered-title",    "layoutStyle": "typewriter",       "nội dung": "Tiêu đề bài học" },
  { "scene": 2, "layoutType": "education-visual",  "layoutStyle": "correction",       "nội dung": "Sai ✕ vs Đúng ✓" },
  { "scene": 3, "layoutType": "step-by-step",      "layoutStyle": "default",          "nội dung": "Các bước thực hiện" },
  { "scene": 4, "layoutType": "stagger-list",      "layoutStyle": "scanner-match",    "nội dung": "Từ vựng / cụm từ cần nhớ" },
  { "scene": 5, "layoutType": "education-visual",  "layoutStyle": "checklist",        "nội dung": "Tổng kết bài học" }
]
```

---

## Mẫu D: So Sánh / Viral

**Dùng khi:** So sánh 2 thứ, gây tranh cãi, viral

```json
[
  { "scene": 1, "layoutType": "news-hook",      "layoutStyle": "data-hook",          "nội dung": "Con số gây sốc" },
  { "scene": 2, "layoutType": "compare-items",  "layoutStyle": "split-vs",           "nội dung": "So sánh trực tiếp" },
  { "scene": 3, "layoutType": "big-stat",       "layoutStyle": "glow-card",          "nội dung": "Highlight số quan trọng" },
  { "scene": 4, "layoutType": "news-analysis",  "layoutStyle": "pros-and-cons",      "nội dung": "Phân tích ưu/nhược" },
  { "scene": 5, "layoutType": "exam-commentary","layoutStyle": "verdict-card",       "nội dung": "Phán quyết cuối cùng" }
]
```

---

## Mẫu E: Học Từ Vựng / Ngữ Pháp

**Dùng khi:** Video tập trung vào từ vựng, connector, cấu trúc câu

```json
[
  { "scene": 1, "layoutType": "news-hook",         "layoutStyle": "question",         "nội dung": "Câu hỏi bẫy ngữ pháp" },
  { "scene": 2, "layoutType": "stagger-list",      "layoutStyle": "scanner-match",    "nội dung": "5 từ/cụm từ quan trọng" },
  { "scene": 3, "layoutType": "education-visual",  "layoutStyle": "correction",       "nội dung": "Cách dùng sai vs đúng" },
  { "scene": 4, "layoutType": "karaoke-subtitle",  "layoutStyle": "line-by-line",     "nội dung": "Đọc câu mẫu có từ mới" },
  { "scene": 5, "layoutType": "education-visual",  "layoutStyle": "standard-response","nội dung": "Câu hỏi + Câu trả lời mẫu" }
]
```

---

## Mẫu F: Cảnh Báo / Warning

**Dùng khi:** Cảnh báo lỗi sai, thông tin sai lan truyền, trap trong đề

```json
[
  { "scene": 1, "layoutType": "news-hook",      "layoutStyle": "split-alert",        "nội dung": "Cảnh báo mạnh" },
  { "scene": 2, "layoutType": "panic-escalation","layoutStyle": "default",           "nội dung": "Tình huống tệ nếu mắc lỗi" },
  { "scene": 3, "layoutType": "news-analysis",  "layoutStyle": "warning",            "nội dung": "Chi tiết lỗi cần tránh" },
  { "scene": 4, "layoutType": "education-visual","layoutStyle": "correction",        "nội dung": "Cách sửa đúng" },
  { "scene": 5, "layoutType": "news-analysis",  "layoutStyle": "checklist",          "nội dung": "Checklist kiểm tra lại" }
]
```

---

## Bảng tra cứu nhanh theo từ khóa

| Từ khóa nội dung | layoutType | layoutStyle |
|---|---|---|
| Review đề thi | `exam-hook` | `stamp-verdict` |
| Phân tích Writing mẫu | `education-visual` | `standard-response` |
| So sánh 2 cách làm | `compare-items` | `split-vs` |
| Checklist ôn thi | `news-analysis` | `checklist` |
| Giải thích từ vựng | `stagger-list` | `scanner-match` |
| Số liệu đề thi | `exam-stats` | `data-cards` |
| Voiceover bài mẫu | `karaoke-subtitle` | `line-by-line` |
| Kịch bản Speaking | `speech-bubble` | `neon-chat` |
| Cảnh báo lỗi sai | `news-analysis` | `warning` |
| Hành trình luyện thi | `news-problem` | `timeline` |
| Mẹo nhanh | `stagger-list` | `card-stack` |
| Quote động lực | `neon-quote` | `card-quote` |
| Đúng vs Sai ngữ pháp | `education-visual` | `correction` |
| Overview 4 kỹ năng | `news-problem` | `bento-grid` |
| Tin nóng Aptis | `news-hook` | `classic-breaking` |
| Bẫy trong đề | `exam-hook` | `question-hook` |
| Stress trước ngày thi | `panic-escalation` | `default` |
| Lộ trình học 3 tháng | `news-problem` | `timeline` |
| Kết luận cuối video | `exam-commentary` | `verdict-card` |
| Điểm số gây sốc | `news-hook` | `data-hook` |
| Từ vựng học thuật | `stagger-list` | `scanner-match` |
| Aptis vs IELTS | `compare-items` | `feature-table` |
| Câu mẫu Speaking | `education-visual` | `standard-response` |
| Đếm ngược tips | `news-curiosity` | `countdown` |
| Bảng xếp hạng | `top-ranking` | `default` |
