---
name: remotion-layout-best-practices
description: Best practices for creating dynamic Remotion Layouts, ensuring Custom Properties, Transitions, and Media work correctly.
---

# 🎨 Kiến trúc chuẩn cho Remotion Dynamic Layouts

Bạn phải TUÂN THỦ NGHIÊM NGẶT các quy tắc sau khi tạo mới hoặc sửa đổi một Layout (`.tsx` file) trong dự án này.

## ❌ Những lỗi thường gặp (TUYỆT ĐỐI TRÁNH)
1. **Dùng thẻ `<div>` thuần để render text**: 
   - 🚫 Sai: `<div style={style}>{element.content}</div>`
   - Điều này làm mất toàn bộ tính năng `customOverride`, animations, transitions, và custom colors từ editor!
2. **Quên render Ảnh/Video (Media)**:
   - Nếu bạn không gọi `<NewsInlineMedia />`, các Layout mới sẽ tàng hình luôn ảnh/video của người dùng.
3. **Bỏ quên các Role khác**:
   - Nếu layout chỉ tìm `role === 'headline'` mà bỏ quên `role === 'body'` hoặc `numeric`, text của người dùng sẽ biến mất một cách khó hiểu.

## ✅ Quy chuẩn bắt buộc khi tạo Layout mới

### 1. Standardized Layout Element Rendering
**NEVER use raw `div` tags to render content directly.** Always use `<LayoutElementRenderer>`.

When `LayoutElementRenderer` is used, the engine automatically calculates whether to use the layout's default styles or the user's custom properties.

```tsx
// ❌ WRONG: Hardcoding styles and bypassing the engine
<div style={{ fontSize: 32, color: colorSystem.accent }}>
  {getContent(headline)}
</div>

// ✅ RIGHT: Delegating styling to the engine, providing a baseStyle as fallback
<LayoutElementRenderer 
  element={headline} 
  colorSystem={colorSystem} 
  baseStyle={{ fontSize: 32, color: colorSystem.accent }}
  layoutDelay={0}
  layoutDirection="up"
/>
```

#### Animation Delegation (`static` prop)
If your layout component wraps the element in a `<div style={{ transform, opacity }}>` that uses a `spring` animation, you MUST pass `static={true}` to prevent "double-animation" artifacts.

```tsx
<LayoutElementRenderer ... static={true} />
```

**CRITICAL RULE:** `LayoutElementRenderer` will automatically IGNORE your `static={true}` if the user turns ON `customOverride`. This ensures that user-defined transactions (animations, transitions) always take precedence and play correctly, regardless of the layout's default behavior.

---

### Giải quyết vấn đề Custom Override bị ghi đè:
**Vấn đề trước đây:**
Khi Layout tự tạo animation (dùng `spring`, `interpolate`) và dùng các thẻ `<div>` thuần, hoặc khi bạn ép `static={true}` vào `<LayoutElementRenderer>`, các tuỳ chỉnh `transaction` (hiệu ứng chuyển cảnh) từ tuỳ chỉnh của Element sẽ bị vô hiệu hóa vì hệ thống nghĩ rằng Layout đã lo việc animation.

**Giải pháp đã triển khai:**
Bây giờ, KHÔNG ĐƯỢC DÙNG `<div style={...}>{getContent(el)}</div>`. BẮT BUỘC dùng `<LayoutElementRenderer element={el} static={true} />`. 
Bên trong nhân Render (`LayoutTextRenderer.tsx`), hệ thống đã được cập nhật logic:
`const finalStatic = element.customOverride ? false : isStatic;`
Có nghĩa là: Mặc định Layout có thể để `static={true}` để chặn double-animation. Nhưng ngay khi người dùng bật `Custom` lên, hệ thống sẽ **ép** `static` thành `false`, cho phép hiệu ứng tuỳ chỉnh của Element (transitions, delays) được kích hoạt và ưu tiên tuyệt đối, ghi đè lên animation tĩnh của Layout.

---

### 2. Luôn nhúng Media Renderer
Luôn phải có dòng này ở cuối hoặc giữa layout flow để hiển thị Ảnh/Video không bị đẩy lên Freeform:

```tsx
import { NewsInlineMedia } from './NewsInlineMedia';

// Đặt vào trong <AbsoluteFill> của Layout
<NewsInlineMedia scene={scene} colorSystem={colorSystem} maxHeight={400} />
```

### 3. Nguyên tắc "Remaining Elements Fallback" (Cực kỳ quan trọng)
Mỗi layout thường có logic `filter` để lấy ra những role cụ thể (VD: `const headline = elements.find(e => e.role === 'headline')`). Tuy nhiên, người dùng có thể ném vào nhiều loại text khác nhau (body, caption, cta, vv...)
Nếu layout KHÔNG tự render hết các text còn lại, text đó sẽ BỊ MẤT.
**Luôn luôn thêm block Fallback này vào cuối chuỗi render của Layout:**

```tsx
// 1. Lọc ra các element còn dư (không phải headline, không phải media, chưa được render)
const remainingTexts = getLayoutElements(scene).filter(
  e => e.role !== 'headline' && e.elementType !== 'image' && e.elementType !== 'video'
);

// 2. Render ở một vùng dự phòng (ví dụ ở dưới cùng)
{remainingTexts.length > 0 && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
    {remainingTexts.map((el, i) => (
      <LayoutElementRenderer key={i} element={el} colorSystem={colorSystem} />
    ))}
  </div>
)}
```

### 4. Hiểu về cơ chế Freeform (Custom Position)
- Bạn không cần viết code xử lý `customPosition` trong Layout nữa!
- Parent `SceneRenderer.tsx` đã tự động lọc các Element có `customPosition === true` và bốc chúng ra khỏi luồng của Layout, đưa lên lớp `<FreeformElementsLayer>` nằm trên cùng.
- Trách nhiệm của Layout chỉ là hiển thị đẹp mắt các element CÒN LẠI (layout flow elements).

## 📄 File Mẫu (Boilerplate)
Tham khảo file: `src/renderer/src/remotion/dynamic/layouts/BaseLayoutTemplate.tsx` để copy/paste nhanh bộ khung chuẩn khi cần tạo Layout mới.

---

### 5. Sử dụng Decorative Elements System (Decorator)
Từ giờ, KHÔNG ĐƯỢC hardcode các element trang trí (badge, underline, background glow, shapes...) trực tiếp bằng JSX thuần trong các Layout component.

**Quy tắc:**
- Luôn sử dụng `<DecoratedElement>` bao quanh `<LayoutElementRenderer>`.
- Mỗi style mới phải được khai báo trong thư mục `decorators/registry/`.
- `<DecoratedElement>` sẽ đọc config từ registry và tự động render các trang trí (badge, underline, glow) đúng chuẩn.

```tsx
import { DecoratedElement } from '../decorators';

// ✅ ĐÚNG: Uỷ quyền trang trí cho DecoratedElement
<DecoratedElement 
  element={headline} 
  colorSystem={colorSystem} 
  layoutType="news-hook" 
  layoutStyle={(scene as any).layoutStyle || 'default'}
>
  <LayoutElementRenderer element={headline} colorSystem={colorSystem} ... />
</DecoratedElement>
```
