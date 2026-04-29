---
name: TikTok Content Creator
description: >
  Generate viral TikTok video scripts for Aptis exam preparation content.
  Use when the user asks to create TikTok scripts, social media content,
  short-form video scripts, or promotional material for Aptis courses.
  Triggers on keywords like "TikTok", "video script", "kịch bản", "viral",
  "content", "hook", "CTA", or "bản tin".
---

# TikTok Content Creator for Aptis

## Purpose

This skill generates high-converting TikTok video scripts designed to:

1. **Attract** potential Aptis students through viral hooks and relatable pain points.
2. **Educate** viewers with actionable exam strategies in under 60 seconds.
3. **Convert** viewers into website visitors or course enrollees via strategic CTAs.

---

## Available Formulas & Styles

There are **3 formulas** (structural blueprints) and **6 styles** (3 single-topic + 3 listicle) available in the `resources/` directory:

### Formulas (Structural Blueprints)

| Formula | File | Use When |
|---------|------|----------|
| **Paradigm Shift** | `resources/paradigm-shift-formula.md` | Debunking a common misconception or introducing a counter-intuitive strategy. Structure: HOOK → ROOT CAUSE → BREAKDOWN → TWIST → CTA |
| **News Report** | `resources/news-report-formula.md` | Creating urgency around a widespread exam failure pattern. Structure: VẤN ĐỀ → HOOK → CÂU DẪN → GIẢI QUYẾT → CTA |
| **Case Study** | `resources/case-study-formula.md` | Using personal success as proof to build trust before delivering a highly actionable method. Structure: HOOK → SETUP (PROOF) → OVERVIEW → INSIGHT → THE PILL → CTA |

### Styles — Single-topic (1 vấn đề = 1 video)

| Style | File | Use When |
|-------|------|----------|
| **Interactive Q&A** | `resources/style-interactive-qa.md` | Engaging directly with student pain points; CTA is placed early (Step 2) for maximum conversion. Structure: THE PAIN → EARLY CTA → ROOT CAUSE → THE PILL → OUTRO |
| **Myth Busting** | `resources/style-myth-busting.md` | Building "expert practitioner" authority by exposing a flawed study method. Structure: HOOK → ROOT CAUSE → BREAKDOWN → TWIST → CTA |
| **News Report Style** | `resources/style-news-report.md` | Fast-paced, FOMO-driven delivery using real student quotes as "field reports". Structure: VẤN ĐỀ HIỆN TRƯỜNG → HOOK → CÂU DẪN → GIẢI QUYẾT → CTA |

### Styles — Listicle (Nhiều vấn đề / tips / tricks = 1 video)

| Style | File | Use When |
|-------|------|----------|
| **Countdown Listicle** | `resources/style-countdown-listicle.md` | Listing 3-5 rules/tips/mistakes in descending order of importance. Creates suspense ("số 1 là..."). Structure: HOOK → ITEMS ĐẾM NGƯỢC → TWIST → CTA → ENGAGEMENT |
| **Speed Tips** | `resources/style-speed-tips.md` | Rapid-fire listing of 5-8 quick tips/tricks in under 45 seconds. Maximizes perceived value. Structure: HOOK → RAPID-FIRE → RECAP → CTA → ENGAGEMENT |
| **Checklist Challenge** | `resources/style-checklist-challenge.md` | Turning multiple mistakes into a self-assessment quiz. Highest engagement (comment số lỗi). Structure: HOOK → CHECKLIST ITEMS → SCORING → CTA → ENGAGEMENT |

---

## Workflow

### Step 1: Gather Input

Before generating a script, collect (or infer) the following from the user:

- **Topic / Pain Point**: The specific Aptis exam problem to address (e.g., "Speaking Part 3 disadvantage questions", "Vocabulary for unfamiliar topics").
- **Formula or Style**: Which formula/style to use. If the user does not specify, recommend one based on the topic.
- **Target Audience**: Typically Aptis B1-C level test takers, but confirm if needed.
- **CTA Destination**: Where to direct viewers (e.g., website, course page, link in bio). Default: "Website Aptis — link ở bio".

### Step 2: Load the Chosen Formula/Style

Read the corresponding resource file from `resources/` to understand the exact structure, step-by-step template, and examples.

### Step 3: Generate the Script

Produce a complete TikTok script that:

1. **Follows the chosen formula/style structure exactly** — every step must be present.
2. **Uses natural, spoken Vietnamese** — conversational tone, not academic writing.
3. **Includes English exam vocabulary/phrases** where relevant (for Aptis content).
4. **Keeps total script length under 60 seconds** of spoken content (~150-180 words Vietnamese).
5. **Formats output clearly** with labeled sections matching the formula steps.

### Step 4: Add Production Notes

After the script, include:

- **Estimated duration**: Total speaking time.
- **On-screen text suggestions**: Keywords to display as text overlays.
- **Music/SFX recommendations**: Based on the style (e.g., news beat for News Report, lofi for breakdowns).
- **Visual cues**: Camera angles, transitions, or props if applicable.

---

## Output Format

```markdown
# 🎬 TikTok Script: [Title]

**Formula/Style:** [Name]
**Topic:** [Pain point addressed]
**Estimated Duration:** [XX seconds]

---

## Script

### [Step 1 Name]
> [Script content for step 1]

### [Step 2 Name]
> [Script content for step 2]

... (all steps)

---

## Production Notes

- **On-screen text:** [Keywords to highlight]
- **Music:** [Recommendation]
- **Visual:** [Camera/editing notes]
```

---

## Quality Checklist

Before delivering the final script, verify:

- [ ] Every step from the chosen formula/style is present and correctly ordered.
- [ ] The hook creates genuine curiosity or emotional reaction within the first 3 seconds.
- [ ] At least one concrete example with English vocabulary is included (for Aptis content).
- [ ] The CTA is clear, specific, and directs to a single destination.
- [ ] The script sounds natural when read aloud — no "written" phrasing.
- [ ] Total word count is within the 150-180 word range for ~60 second delivery.

---

## Examples of Good Hooks (Reference)

- ❌ "Hôm nay mình sẽ chia sẻ về..." (Boring, zero curiosity)
- ✅ "Thuộc làu 8 khía cạnh nhưng vào phòng thi vẫn... tịt ngòi!" (Pain + paradox)
- ✅ "Bản tin Aptis 24/7! Hàng loạt thí sinh đứng hình vì..." (Urgency + FOMO)

---

## Important Notes

- **Localization**: All scripts are in Vietnamese with English exam terms embedded naturally.
- **Platform**: Optimized for TikTok (vertical video, 30-60 seconds, fast-paced).
- **Brand Voice**: Authoritative yet approachable — "thầy/cô chuyên gia thực chiến" persona.
- **Vocabulary Tone**: Avoid overly negative, depressing, or extreme terms when describing student struggles (e.g., DO NOT use "chết lâm sàng", "mù chữ", "vô phương cứu chữa"). Use relatable, lighter terms instead (e.g., "đứng hình", "tịt ngòi", "cạn lời", "bí ý").
- **Plain Language**: Always use simple, universally understood Vietnamese. Avoid slang, obscure metaphors, or "clever" wordplay that might confuse viewers (e.g., DO NOT use "mượn mỏ", "bẻ lái", "đánh lận con đen"). Instead, use straightforward phrasing (e.g., "copy Thì từ câu hỏi", "lấy nguyên Thì của đề bài", "chuyển hướng sang từ khác"). The target audience includes students of all backgrounds — clarity always wins over creativity.
- **No generic content**: Every script must address a specific, concrete exam scenario.
