# PrintOS Mac In – Ribbon + In Flexo

File trong thư mục:
- `MAC_IN_RIBBON_FLEXO_FOR_ANTIGRAVITY.md`: tài liệu/prompt cho Google Antigravity.
- `mac-in-ribbon-flexo.pricing.ts`: code TypeScript tính giá.
- `mac-in-pricing-data.json`: dữ liệu bảng giá bóc từ sheet `Công in`.

Cách dùng:
1. Gửi file `.md` cho Google Antigravity để nó hiểu yêu cầu.
2. Đưa file `.ts` vào `src/pricing/modules/mac-in/`.
3. Đưa file `.json` vào seed/database.
4. Thêm route API `productType = ribbon | flexo`.
