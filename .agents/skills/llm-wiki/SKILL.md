---
name: llm-wiki
description: Xây dựng và duy trì knowledge base cá nhân theo pattern LLM Wiki (Karpathy). Hỗ trợ init, ingest, query, lint, discover, run, digest, pain-rank.
---

# LLM Wiki — Claude Code Skill

Hệ thống knowledge base cá nhân. LLM xây dựng và duy trì wiki từ nguồn thô.
Dựa trên pattern của Andrej Karpathy, mở rộng với auto-discovery.

## Sub-commands

Skill này hỗ trợ các sub-commands sau. Parse argument đầu tiên để xác định command:

| Command | Mô tả | Ví dụ |
|---------|-------|-------|
| `init` | Tạo wiki mới cho một chủ đề | `/llm-wiki init "AI Agents"` |
| `ingest` | Xử lý nguồn mới trong raw/ | `/llm-wiki ingest` |
| `query` | Hỏi đáp dựa trên wiki | `/llm-wiki query "So sánh RAG vs Wiki"` |
| `lint` | Kiểm tra sức khỏe wiki | `/llm-wiki lint` |
| `discover` | Tự tìm nguồn mới | `/llm-wiki discover` |
| `run` | Chạy full cycle: discover → ingest → lint | `/llm-wiki run` |
| `status` | Xem trạng thái wiki | `/llm-wiki status` |
| `digest` | Daily brief — tóm tắt thay đổi wiki 24h | `/llm-wiki digest` |
| `pain-rank` | Xếp hạng pain points theo cơ hội kinh doanh | `/llm-wiki pain-rank` |

Nếu không có sub-command → hiển thị trạng thái và hỏi user muốn làm gì.

## Thư mục gốc

```
WIKI_ROOT = <current working directory>
```

Xác định WIKI_ROOT bằng cách tìm folder chứa CLAUDE.md + config.yaml + wiki/ + raw/. Thường là thư mục project hiện tại.

Luôn đọc `WIKI_ROOT/CLAUDE.md` trước khi thực hiện bất kỳ command nào — đó là schema quy định mọi quy tắc.

## Command: init

**Mục đích:** Khởi tạo wiki mới hoặc thêm topic mới vào wiki hiện tại.

**Quy trình:**
1. Đọc `CLAUDE.md` và `config.yaml`
2. Nếu argument là topic mới → thêm vào `config.yaml` → topics
3. Nếu wiki chưa có folder structure → tạo theo CLAUDE.md
4. Ghi LOG.md

**Ví dụ:**
```
/llm-wiki init "Rust Programming"
→ Thêm topic "Rust Programming" vào config.yaml
→ Keywords tự sinh: ["Rust language", "Rust programming", "cargo", "rustc"]
```

## Command: ingest

**Mục đích:** Xử lý mọi file mới/chưa xử lý trong `raw/`.

**Quy trình:**
1. Đọc `CLAUDE.md` (schema & quy tắc)
2. Đọc `.discoveries/history.json` → lấy danh sách đã xử lý
3. Scan `raw/` → tìm file chưa có trong history
4. Với mỗi file mới:
   a. Đọc nội dung (dùng Read cho text, WebFetch cho URL, PDF reader cho PDF)
   b. Tạo source summary → `wiki/sources/`
   c. Trích xuất entities → tạo/cập nhật `wiki/entities/`
   d. Trích xuất concepts → tạo/cập nhật `wiki/concepts/`
   e. Thêm cross-references `[[links]]` vào các trang liên quan
   f. Phát hiện contradictions → ghi chú vào trang liên quan
5. Cập nhật `wiki/INDEX.md`
6. Ghi `wiki/LOG.md`
7. Cập nhật `.discoveries/history.json`

**Quy tắc QUAN TRỌNG:**
- KHÔNG BAO GIỜ sửa file trong `raw/`
- Mỗi source có thể ảnh hưởng 5-15 wiki pages
- Luôn trích dẫn nguồn: `[Nguồn: filename](../raw/path)`
- Nếu thông tin mới mâu thuẫn với cũ → giữ cả hai, ghi rõ
- Không bịa thông tin — chỉ viết những gì có trong raw sources
- Batch size theo config.yaml → `schedule.ingest.batch_size`

## Command: query

**Mục đích:** Hỏi đáp dựa trên nội dung wiki.

**Quy trình:**
1. Đọc `wiki/INDEX.md` → tìm trang liên quan đến câu hỏi
2. Đọc các trang wiki liên quan (đọc đủ context, không chỉ 1-2 trang)
3. Tổng hợp câu trả lời với citations `[[trang-wiki]]`
4. Nếu câu trả lời có giá trị phân tích → lưu vào `wiki/syntheses/` hoặc `outputs/`
5. Ghi LOG.md

**Quy tắc:**
- Trả lời DỰA TRÊN WIKI, không dùng kiến thức bên ngoài
- Nếu wiki thiếu thông tin → nói rõ và gợi ý topic cần discover
- So sánh, phân tích → tự động lưu thành synthesis page
- Format đầu ra linh hoạt: markdown, bảng so sánh, bullet points

**Ví dụ:**
```
/llm-wiki query "So sánh RAG truyền thống vs LLM Wiki pattern"
→ Đọc INDEX.md → tìm trang về RAG, LLM Wiki
→ Đọc các trang liên quan
→ Tạo bảng so sánh
→ Lưu vào wiki/syntheses/rag-vs-llm-wiki.md
```

## Command: lint

**Mục đích:** Kiểm tra sức khỏe wiki, phát hiện vấn đề.

**Quy trình:**
1. Đọc toàn bộ `wiki/INDEX.md`
2. Scan mọi file trong `wiki/`
3. Kiểm tra:
   - **Contradictions**: thông tin mâu thuẫn giữa các trang
   - **Orphans**: trang không ai link đến
   - **Missing pages**: `[[link]]` trỏ đến trang chưa tồn tại
   - **Stale claims**: thông tin cũ bị nguồn mới bác bỏ
   - **Broken links**: link đến raw source không còn tồn tại
   - **Gaps**: lĩnh vực quan trọng thiếu coverage
   - **Quality**: trang quá ngắn, thiếu sources, thiếu cross-refs
4. Tạo báo cáo → `outputs/lint-YYYY-MM-DD.md`
5. Cập nhật `.discoveries/gaps.json` (cho discover dùng)
6. Ghi LOG.md
7. Nếu `config.yaml → schedule.lint.auto_fix = true` → tự sửa lỗi đơn giản

**Output format:**
```markdown
# Lint Report — YYYY-MM-DD

## Tóm tắt
- Tổng trang: N
- Contradictions: N
- Orphans: N
- Missing pages: N
- Gaps: N

## Chi tiết
### Contradictions
...
### Đề xuất
- Tạo trang mới: [danh sách]
- Tìm nguồn cho: [danh sách gaps]
```

## Command: discover

**Mục đích:** Tự động tìm nguồn mới từ internet.

**Quy trình:**
1. Đọc `config.yaml` → topics, feeds, discovery settings
2. Đọc `.discoveries/gaps.json` → knowledge gaps cần lấp
3. Đọc `.discoveries/history.json` → tránh trùng lặp
4. Thực hiện theo strategies trong config:
   a. **reddit_scan**: WebSearch `site:reddit.com` theo subreddits + keywords trong config.yaml → tìm pain points, use cases, ý tưởng. Lưu vào `raw/reddit/YYYY-MM-DD-slug.md`. Trích xuất: vấn đề gốc, giải pháp được đề xuất, upvotes, sentiment.
   b. **github_trending**: WebSearch GitHub trending repos theo languages/topics filter
   c. **github_watch**: Kiểm tra repos/orgs/people trong config → new releases, new repos
   d. **web_search**: WebSearch theo keywords của mỗi topic
   e. **feed_poll**: Kiểm tra RSS feeds, Hacker News
   f. **gap_fill**: WebSearch theo gaps từ lint
   g. **snowball**: Đọc references trong wiki → follow links chưa có
5. Với mỗi nguồn tìm được:
   a. Kiểm tra dedup (URL, title)
   b. WebFetch nội dung
   c. Lưu vào `raw/articles/YYYY-MM-DD-slug.md` với frontmatter:
      ```yaml
      ---
      title: "Tiêu đề"
      url: "https://..."
      discovered: YYYY-MM-DD
      topic: "tên topic"
      ---
      ```
6. Cập nhật `.discoveries/history.json`
7. Ghi LOG.md
8. **Tự động trigger ingest** cho nguồn mới

**Quy tắc:**
- Tối đa sources theo `config.yaml → schedule.discover.max_sources`
- Ưu tiên: gaps > reddit pain points > trending > feeds
- Chỉ lấy nội dung chất lượng (bài viết sâu, papers, guides, high-upvote posts)
- Skip: quảng cáo, listicles nông, nội dung trùng lặp
- Reddit posts: trích xuất pain point + giải pháp, phân loại theo domain (business, dev, consumer)
- Lưu reddit vào `raw/reddit/` (tách riêng khỏi `raw/articles/`)

## Command: run

**Mục đích:** Chạy full cycle tự động.

**Quy trình:**
```
discover → ingest → lint → (nếu có gaps mới → discover lại)
```

1. Chạy `discover` → tìm nguồn mới (Reddit, GitHub trending, web search)
2. Chạy `ingest` → xử lý mọi file mới trong raw/
3. Chạy `lint` → kiểm tra sức khỏe
4. Nếu lint phát hiện critical gaps → chạy thêm 1 vòng discover+ingest
5. Tạo summary report → `outputs/run-YYYY-MM-DD.md`
6. Ghi LOG.md

**Giới hạn:** Tối đa 2 vòng discover-ingest để tránh vòng lặp vô hạn.

## Command: status

**Mục đích:** Hiển thị trạng thái wiki hiện tại.

**Output:**
```
LLM Wiki Status
═══════════════
Wiki: My LLM Wiki
Topics: 3 (LLM Agents, Claude Code, AI Engineering)
Raw sources: N files
Wiki pages: N pages (E entities, C concepts, S sources, Y syntheses)
Last ingest: YYYY-MM-DD
Last lint: YYYY-MM-DD
Last discover: YYYY-MM-DD
Knowledge gaps: N
Orphan pages: N
Health: Good | Warning | Needs Attention
```

## Command: digest

**Mục đích:** Tạo daily brief — tóm tắt mọi thay đổi wiki trong 24h, highlights insights mới.

**Quy trình:**
1. Đọc `wiki/LOG.md` → lọc entries trong 24h qua
2. Đọc các trang wiki mới/cập nhật trong khoảng thời gian đó
3. Tổng hợp thành báo cáo ngắn gọn

**Output format:**
```markdown
# Daily Digest — YYYY-MM-DD

## Nguồn mới (N)
- [tên nguồn] — 1 dòng tóm tắt

## Wiki pages mới (N)
- [tên trang] — 1 dòng mô tả

## Top 3 Insights
1. [Insight quan trọng nhất — trích từ syntheses hoặc cross-references mới]
2. [Insight thứ hai]
3. [Insight thứ ba]

## Pain Points mới phát hiện (từ Reddit)
| Pain Point | Domain | Upvotes | Cơ hội |
|------------|--------|---------|--------|
| ... | ... | ... | ... |

## Knowledge Gaps cần lấp
- [gap 1]
- [gap 2]

## Thống kê
- Wiki: N pages (+X hôm nay)
- Sources: N (+Y hôm nay)
- Health: Good/Warning
```

Lưu vào: `outputs/digest-YYYY-MM-DD.md`

## Command: pain-rank

**Mục đích:** Xếp hạng pain points từ Reddit và các nguồn khác theo tiềm năng kinh doanh.

**Quy trình:**
1. Đọc tất cả files trong `raw/reddit/`
2. Đọc `wiki/concepts/ai-pain-points.md` và `wiki/concepts/micro-saas-pattern.md`
3. Trích xuất mọi pain point đã thu thập
4. Scoring mỗi pain point theo 5 tiêu chí

**Scoring Framework (mỗi tiêu chí 1-10, tổng max 50):**

| Tiêu chí | Mô tả | Trọng số |
|----------|-------|----------|
| **Urgency** | Người dùng cần giải pháp ngay? Hay "nice to have"? | x2 |
| **Market Size** | Bao nhiêu người/doanh nghiệp có vấn đề này? | x2 |
| **Willingness to Pay** | Sẵn sàng trả tiền? Đang trả cho alternatives? | x3 |
| **AI Solvability** | AI/LLM có thể giải quyết tốt không? | x2 |
| **Competition** | Ít cạnh tranh = điểm cao | x1 |

**Output format:**
```markdown
# Pain Point Ranking — YYYY-MM-DD

## Top 10 Cơ hội

| Rank | Pain Point | Domain | Score | Urgency | Market | WTP | AI-Fit | Comp |
|------|-----------|--------|-------|---------|--------|-----|--------|------|
| 1 | ... | B2B | 42/50 | 9 | 8 | 9 | 8 | 8 |
| 2 | ... | Consumer | 38/50 | 7 | 9 | 7 | 9 | 6 |

## Chi tiết Top 3

### #1: [Tên Pain Point] — Score: 42/50
- **Vấn đề:** [Mô tả cụ thể]
- **Target user:** [Ai có vấn đề này]
- **Giải pháp đề xuất:** [MVP concept]
- **Revenue model:** [Cách kiếm tiền]
- **Nguồn Reddit:** [Links/upvotes]
- **Next step:** [Hành động cụ thể tiếp theo]

### #2: ...
### #3: ...

## Idea-to-Spec Pipeline (cho #1)
- Problem Statement: ...
- Target User Persona: ...
- MVP Features (3-5): ...
- Tech Stack Suggestion: ...
- Estimated effort: ... (human) / ... (CC)
```

Lưu vào: `outputs/pain-rank-YYYY-MM-DD.md`

**Quy tắc:**
- Chỉ rank pain points CÓ TRONG WIKI — không bịa thêm
- Scoring phải giải thích lý do cho mỗi điểm số
- Top 1 luôn kèm Idea-to-Spec pipeline
- Cross-reference với [[micro-saas-pattern]], [[saas-unbundling]], [[ai-pain-points]]

## Ngôn ngữ & Format

- Wiki content: **tiếng Việt có dấu** (thuật ngữ kỹ thuật giữ tiếng Anh)
- File names: tiếng Anh, kebab-case
- Frontmatter: tiếng Anh
- Wiki links: `[[kebab-case-name]]`
- Cross-refs: mỗi trang ít nhất 2 links đến trang khác
- Citations: `[Nguồn: filename](../raw/path)`

## Error Handling

- Nếu WebFetch/WebSearch fail → ghi lỗi vào LOG.md, skip nguồn đó, tiếp tục
- Nếu file raw không đọc được (binary, corrupted) → skip, ghi LOG
- Nếu wiki quá lớn cho context → đọc INDEX.md trước, chỉ đọc trang liên quan
- Nếu config.yaml thiếu field → dùng giá trị mặc định trong CLAUDE.md
