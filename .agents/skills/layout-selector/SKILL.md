---
name: Layout Selector
description: >
  Ban do tra cuu layout cho du an Aptis TikTok Autotool. Dung khi can
  chon layoutType va layoutStyle phu hop cho bat ky scene nao trong video.json.
  Triggers on keywords like "layout", "style", "scene", "video.json",
  "layoutType", "layoutStyle", "chon layout", "dung layout nao",
  "scene nao", "phu hop voi noi dung", "ban do layout", "tao file json",
  "tao video json", "kich ban", "toi muon tao video", "generate json".
---

# Layout Selector - Aptis TikTok Autotool

## Muc dich

Skill nay co 2 chuc nang chinh:

1. **Tra cuu layout**: Xac dinh layoutType va layoutStyle phu hop cho tung scene.
2. **Tao file JSON hoan chinh**: Khi user dua kich ban/noi dung, tu dong dich sang VideoBlueprint JSON san sang render.

> **Luu y:** video.json chi la ten file mac dinh. Ban co the tao nhieu file JSON doc lap
> (video-listening.json, video-writing-tips.json...) - tat ca dung chung schema VideoBlueprint.

---

## Workflow A - Tra cuu layout cho scene co san

### Buoc 1: Doc noi dung scene
- **Loai noi dung**: Tin tuc, on thi, danh sach, so sanh, quote, so lieu...
- **Vi tri scene**: Hook / Than bai / Ket luan
- **Du lieu co**: Headline, body, numeric, caption, danh sach

### Buoc 2: Tra cuu layout
- resources/news-series.md - tin tuc, su kien
- resources/exam-series.md - on thi, review de
- resources/general-layouts.md - danh sach, so lieu, quote, so sanh

### Buoc 3: Tra ve
```json
{ "layoutType": "...", "layoutStyle": "...", "ly do": "..." }
```

---

## Workflow B - Tao file JSON tu kich ban cua user

Khi user dua ra noi dung/kich ban va yeu cau tao file video JSON:

### Buoc 1: Phan tich kich ban
- **Chu de tong the**: Tin tuc? On thi? Hoc ky nang? So sanh?
- **So scenes can tao** (thuong 4-6 scenes)
- **Noi dung tung doan** thi se la tung scene

### Buoc 2: Chon Style Pack phu hop

> **Mac dinh cua du an: stylePackId = "paper"**
> Luon dung "paper" tru khi user yeu cau style khac.

| Mau sac paper | Gia tri |
|---|---|
| background | #FAF8F5 |
| primary | #C0392B |
| secondary | #D4A76A |
| textPrimary | #2C3E50 |
| textSecondary | #5D6D7E |
| accent | #1A7A6D |
| surface | #F0EDE8 |

Cac stylePackId khac co the dung neu user yeu cau: ocean, midnight, sunset, neon, forest, cream, corporate, space.

### Buoc 3: Map tung doan kich ban sang Scene

Voi moi doan noi dung:
1. Xac dinh vi tri (hook / than bai / ket luan)
2. Tra bang So do quyet dinh ben duoi de chon layoutType + layoutStyle
3. Phan ra noi dung thanh cac elements (headline, body, caption, numeric...)
4. Gan role dung cho tung element

### Buoc 4: Gan animation hop ly

| Role | animation mac dinh | animationDirection |
|---|---|---|
| headline | bounce-in hoac fade-slide-in | up |
| body | fade-slide-in | up |
| numeric | count-up | up |
| caption | fade-slide-in | down |
| subscript (phu de) | word-highlight | up |

Moi element tiep theo tang animationDelay them 15-20 frames.

### Buoc 5: Tinh durationInFrames

- Scene Hook: 360-420 frames (6-7 giay @ 60fps)
- Scene than bai: 480-660 frames (8-11 giay)
- Scene ket luan/CTA: 300-420 frames
- totalDurationInFrames = tong tat ca scenes

### Buoc 6: Xuat file JSON

Ten file mo ta noi dung:
- video-writing-tips-may2025.json
- video-exam-review-27apr.json
- video-compare-aptis-ielts.json

Dat tai: d:\CODE-APTIS\tiktok-content-autotool\

---

## Schema VideoBlueprint - Cau truc file JSON CHINH XAC

> Cap nhat truc tiep tu video.json thuc te cua du an. Dung dung cau truc nay.

```json
{
  "id": "ten-video-ngan-gon",
  "topic": "Tieu de mo ta video",
  "stylePackId": "paper",
  "totalDurationInFrames": 3600,
  "fps": 60,
  "width": 1080,
  "height": 1920,
  "colorSystem": {
    "background": "#FAF8F5",
    "primary": "#C0392B",
    "secondary": "#D4A76A",
    "textPrimary": "#2C3E50",
    "textSecondary": "#5D6D7E",
    "accent": "#1A7A6D",
    "surface": "#F0EDE8"
  },
  "scenes": [
    {
      "id": "scene-1-hook",
      "title": "Hook",
      "layoutType": "exam-hook",
      "layoutStyle": "stamp-verdict",
      "durationInFrames": 420,
      "contentY": 44,
      "transition": {
        "type": "none",
        "durationInFrames": 0,
        "timing": "linear"
      },
      "visuals": [
        {
          "type": "author-badge",
          "size": 300,
          "animation": "bounce-in",
          "animationDelay": 0,
          "isRemote": false,
          "motionEffect": "none",
          "svgVariant": "none"
        }
      ],
      "backgroundEffect": {
        "type": "vignette",
        "intensity": 0.3
      },
      "sfxTracks": [
        { "type": "whoosh", "delayInFrames": 0, "volume": 0.6 },
        { "type": "ding", "delayInFrames": 120, "volume": 0.8 }
      ],
      "elements": [
        {
          "elementType": "text",
          "content": "TIEU DE CHINH",
          "role": "headline",
          "animation": "bounce-in",
          "animationDelay": 10,
          "animationDirection": "up",
          "style": {
            "fontSize": 64,
            "fontWeight": 900,
            "gradient": ["#C0392B", "#1A7A6D"]
          },
          "customOverride": true
        },
        {
          "elementType": "text",
          "content": "Noi dung chinh\nDong 2 neu can",
          "role": "body",
          "animation": "fade-slide-in",
          "animationDelay": 120,
          "animationDirection": "up",
          "style": {
            "color": "#2C3E50",
            "fontSize": 48,
            "fontWeight": 600
          },
          "customOverride": true
        },
        {
          "elementType": "subscript",
          "content": "Phu de voiceover hien thi o vung duoi man hinh",
          "role": "caption",
          "animation": "word-highlight",
          "animationDelay": 0,
          "animationDirection": "up",
          "style": {
            "fontSize": 34,
            "highlightColor": "#C0392B"
          },
          "customOverride": true,
          "visible": true,
          "yOffset": -300,
          "hideAfterSeconds": 3
        }
      ]
    }
  ]
}
```

### Cac role hop le cho elements
- headline - tieu de chinh
- body - noi dung / mo ta (co the nhieu phan tu)
- numeric - con so lon (dung voi count-up)
- caption - chu thich, nhan nho
- cta - call to action cuoi video
- tag - nhan dac biet (icon, badge)

### Cac elementType hop le
- text - van ban thuong
- subscript - phu de voiceover (hien thi o vung duoi, co the an sau thoi gian)

### Cac transition hop le
- none - khong co hieu ung chuyen
- fade - mo dan (pho bien nhat)
- slide-left - truot tu phai sang
- slide-top - truot tu duoi len
- zoom - phong to vao

### Cac animation hop le cho elements
- fade-slide-in - xuat hien + truot
- bounce-in - nay ra
- scale-spring - phong to lo xo
- count-up - dem so (chi dung cho numeric)
- word-highlight - highlight tung tu (dung cho subscript)

### backgroundEffect type hop le
- vignette - toi goc man hinh
- particles - hat bui
- none - khong co hieu ung

### sfxTracks type hop le
- whoosh - am thanh truot
- ding - tieng "ding"
- none - khong am thanh

---

## So do quyet dinh nhanh

Noi dung doan kich ban la gi?

TIN TUC / SU KIEN
- Mo dau gay chu y    -> news-hook / classic-breaking | data-hook | question
- Trinh bay van de    -> news-problem / data-impact | split-screen | timeline
- Tao to mo          -> news-curiosity / countdown | reveal-blur | cliffhanger
- Phan tich, giai thich -> news-analysis / checklist | step-by-step | warning

ON THI / REVIEW DE
- Mo dau video       -> exam-hook / score-reveal | stamp-verdict | question-hook
- So lieu de thi     -> exam-stats / data-cards | gauge-meter | skill-towers
- Noi dung de thi    -> exam-showcase / question-table | flashcard-flip
- Nhan xet chuyen mon -> exam-commentary / tip-checklist | verdict-card | pros-cons

CO SO LIEU LON
- 1 con so           -> big-stat / glow-card | hexagon
- Nhieu so           -> exam-stats / data-cards | news-analysis / numbered-list

CO DANH SACH
- 3-7 items don gian  -> stagger-list / default
- Items co icon/badge -> stagger-list / keyword-badge | pill-stack
- Theo thu tu buoc   -> step-by-step / default | horizontal-flow
- Tu vung <-> nghia  -> stagger-list / scanner-match

SO SANH
- 2 phuong an        -> compare-items / split-vs | vs-battle
- Bang nhieu tieu chi -> compare-items / feature-table
- Dung vs Sai        -> education-visual / correction

TRICH DAN / QUOTE
- Quote ngan, impactful -> neon-quote / minimal
- Quote dai, can card   -> neon-quote / card-quote
- Hoi thoai Q&A         -> speech-bubble / neon-chat | highlight

GIAO DUC / BAI HOC
- So lon + giai thich -> education-visual / big-numeric
- Sai vs Dung        -> education-visual / correction
- Checklist quy tac  -> education-visual / checklist
- Cau mau chuan      -> education-visual / standard-response

VOICEOVER / PHU DE
- Highlight tung tu  -> karaoke-subtitle / default
- Highlight tung dong -> karaoke-subtitle / line-by-line
- Tu nay len khi nhan -> karaoke-subtitle / bounce-word

---

## Quy tac chon layout theo vi tri scene

| Vi tri | Uu tien |
|---|---|
| Scene 1 (Hook) | news-hook, exam-hook, centered-title/typewriter |
| Scene 2-3 (Than bai) | news-problem, exam-stats, stagger-list, education-visual |
| Scene 4 (Cao trao) | news-curiosity, news-analysis, compare-items, big-stat |
| Scene 5 (Ket luan) | exam-commentary/verdict-card, news-analysis/expert-quote, cta-block |

---

## Cac mau video 5 scene san co

Xem chi tiet trong: resources/video-templates.md

- Mau A: Review De Thi
- Mau B: Tin Tuc Aptis
- Mau C: Hoc Ky Nang
- Mau D: So Sanh / Viral
- Mau E: Hoc Tu Vung / Ngu Phap
- Mau F: Canh Bao / Warning

---

## Ghi chu ky thuat

- Safe zone: SAFE_TOP=295, SAFE_BOTTOM=440, SAFE_LEFT=55, SAFE_RIGHT=120
- TopConfidentialBar (height 295px) va BottomDocumentFooter (height 440px) ap dung toan cuc
- Khong tu y thay doi safe zone constants trong cac file layout
- File JSON tao ra dat tai root: d:\CODE-APTIS\tiktok-content-autotool\