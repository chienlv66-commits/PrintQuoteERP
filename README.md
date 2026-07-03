# PrintQuote ERP - Hệ Thống Báo Giá & Quản Lý Đơn Hàng Ngành In

Đây là hệ thống quản lý đơn hàng (ERP) và tính giá (Pricing Engine) dành riêng cho ngành in ấn, được tối ưu hóa cho tốc độ, độ chính xác cao và dễ dàng mở rộng.

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

- **Frontend Framework:** React + Vite
- **Styling:** Tailwind CSS (utility-first CSS)
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Database/Storage:** Google Sheets API (qua Google Apps Script)
- **Tính toán (Pricing Engine):** TypeScript (độc lập với framework, có thể tái sử dụng ở backend nếu cần)
- **Hosting/Deployment:** Vercel

## 📂 Cấu Trúc Thư Mục (Folder Structure)

```text
print-quote-app-v2/
├── src/
│   ├── components/       # Các UI Component dùng chung (Sidebar, Layout, Modal...)
│   ├── context/          # Quản lý State toàn cục (AppContext.jsx - tích hợp Google Sheets API)
│   ├── data/             # Dữ liệu tĩnh (seed-from-excel.json chứa bảng giá chuẩn)
│   ├── pages/            # Các trang chính của hệ thống (Dashboard, Orders, TestPricing, CreateOrder...)
│   ├── pricing/          # 🧠 LÕI TÍNH GIÁ (PRICING ENGINE) - Viết bằng TypeScript
│   │   ├── core/         # Các thuật toán cơ sở: tính layout xếp giấy, làm tròn tiền, tìm tier giá
│   │   ├── extra-modules/# Các module tính giá sản phẩm phụ (Mác da, Mica, Tem UV DTF, Dây logo...)
│   │   ├── modules/      # Các module tính giá chính (In Nhanh, Offset, Decal In Nhanh)
│   │   ├── index.ts      # Điểm entry xuất các hàm tính giá (calculateQuote)
│   │   ├── engine.ts     # Wrapper gắn context (seed data) vào hàm tính giá
│   │   └── types.ts      # Định nghĩa chuẩn kiểu dữ liệu TypeScript (QuoteResult, QuoteAlternative...)
│   └── services/         # Tích hợp API (api.js để gọi Google Apps Script)
├── public/               # Tài nguyên tĩnh
└── vite.config.js        # Cấu hình Vite builder
```

## 🧠 Lõi Tính Giá (Pricing Engine)

Hệ thống tính giá được thiết kế tách biệt hoàn toàn khỏi UI, tuân thủ nguyên tắc tính toán thuần túy (Pure Functions). Đầu vào là các tham số (Kích thước, Số lượng, Loại giấy, Gia công...), đầu ra là một Object thống nhất:

```typescript
export interface QuoteResult {
  productType: ProductType;
  selectedMethod: string;
  costTotal: number;       // Tổng giá vốn (giá sản xuất)
  costUnit: number;        // Giá vốn 1 cái
  sellTotal: number;       // Tổng giá bán cho khách
  sellUnit: number;        // Giá bán 1 cái
  alternatives: QuoteAlternative[]; // Các phương án thay thế (ví dụ: Bế vs Xén)
  breakdown: Record<string, any>;   // Bóc tách chi tiết (tiền giấy, tiền in, tiền cán...) để minh bạch
}
```

### Cách Thêm Một Module Tính Giá Mới

Để thêm sản phẩm mới (ví dụ: `Hộp Giấy`), bạn chỉ cần:
1. Viết một file TypeScript mới trong `src/pricing/modules/` (hoặc `extra-modules/`) ví dụ `hop-giay.ts`.
2. Định nghĩa hàm `calculateHopGiay(input, ctx)` trả về chuẩn kiểu dữ liệu `QuoteResult`.
3. Thêm định nghĩa vào `src/pricing/types.ts` (ở `ProductType`).
4. Khai báo (Export) hàm đó trong `src/pricing/index.ts` bên trong khối `switch (input.productType)`.
5. Gọi `runPricingEngine` từ giao diện UI (ví dụ trong `AdminTestPricing.jsx` hoặc trang mới).

## 🔄 Luồng Dữ Liệu & API

Dự án sử dụng Google Sheets làm cơ sở dữ liệu. Toàn bộ logic giao tiếp được đặt trong `src/context/AppContext.jsx` và `src/services/api.js`.

- Lấy dữ liệu: Dùng `getDataFromSheet('Orders')` hoặc `getDataFromSheet('Customers')`.
- Lưu đơn hàng: Chạy `saveOrderToSheet(finalOrderData)` từ trang Tạo Đơn Mới (`CreateOrder.jsx`).
- Các hàm này gọi `fetch()` tới Endpoint của Google Apps Script (Web App URL) bằng phương thức `GET` và `POST`.

---

**⚠️ Lưu ý cho lập trình viên / AI Developer tiếp quản:**
Khi nhận dự án này, hãy đọc kỹ cấu trúc của thư mục `src/pricing`. Tuyệt đối không thay đổi kiểu trả về `QuoteResult` trong `types.ts` vì điều này sẽ làm gãy hiển thị ở phía giao diện React. Đối với mọi tính toán phức tạp, hãy tạo module TS độc lập và kiểm thử độ chính xác bóc tách chi phí (breakdown) kỹ lưỡng trước khi gắn vào UI.
