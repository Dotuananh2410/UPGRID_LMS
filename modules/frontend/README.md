# Frontend Module

Thư mục `src/` chứa toàn bộ mã nguồn của Frontend xây dựng trên Next.js (App Router).

## Công nghệ sử dụng
- **Framework:** Next.js (App Router) với React 18+.
- **Ngôn ngữ:** TypeScript (`.tsx`, `.ts`).
- **Styling:** Tailwind CSS (utility-first CSS).
- **Data Fetching & Caching:** `SWR` (của Vercel).
- **Toán học:** `KaTeX` (hiển thị công thức toán).
- **Icons:** `lucide-react`.

## Cấu trúc thư mục (`src/`)

- `app/`: Định nghĩa các Routes của ứng dụng (theo chuẩn App Router Next.js).
  - `(auth)/login/page.tsx`: Trang đăng nhập.
  - `(dashboard)/admin/`: Giao diện dành cho Quản trị viên (Admin).
  - `(dashboard)/teacher/`: Giao diện dành cho Giáo viên.
  - `(dashboard)/student/`: Giao diện dành cho Học viên.
  - `(public)/classes/`: Trang danh sách lớp học công khai (áp dụng ISR).
  - `layout.tsx`: Layout gốc của ứng dụng.
- `components/`: Các React Component có thể tái sử dụng.
  - `Sidebar.tsx`: Thanh điều hướng bên trái.
  - `ui/`: Chứa các component UI nguyên thủy (Nút bấm, Input, Modal).
- `context/`: React Context Providers (ví dụ: AuthContext để quản lý trạng thái đăng nhập toàn cục).
- `utils/`: Các hàm tiện ích (hàm gọi API wrapper, format ngày tháng, tiền tệ).
- `types/`: Nơi định nghĩa các TypeScript Interfaces/Types để kiểm soát kiểu dữ liệu nghiêm ngặt.

## Quản lý State & Caching

Hệ thống sử dụng chiến lược Caching kết hợp:
1. **ISR (Incremental Static Regeneration):** Được dùng ở các trang public như `/classes`. Dữ liệu được fetch 1 lần ở server build-time và tái tạo định kỳ (ví dụ `revalidate = 60`), đảm bảo tốc độ cực nhanh.
2. **SWR (Stale-While-Revalidate):** Dùng ở các trang dashboard cần dữ liệu mới nhất nhưng vẫn mượt mà. SWR trả về dữ liệu cache ngay lập tức, trong nền nó gọi API lấy dữ liệu mới và tự động cập nhật UI.

## Quy tắc Component
- Giữ component nhỏ gọn, ưu tiên Server Component của Next.js, chỉ dùng Client Component (`"use client"`) khi cần tương tác (onClick, hooks).
- Mọi API call (GET/POST) phải thông qua file `utils/api.ts` để đảm bảo gắn kèm Token bảo mật.
