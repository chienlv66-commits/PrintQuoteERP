# PrintOS Pricing Engine Starter

Bộ source starter này chuyển file Excel báo giá thành kiến trúc Pricing Engine dùng cho web app/Google Antigravity.

## Đã có trong bản này

- Core helper: layout tối ưu, rounding, tier lookup, chọn phương án rẻ nhất.
- Database schema SQL: materials, quantity_tiers, process_prices, quote_requests, quote_results.
- Seed dữ liệu ban đầu từ sheet `Loại giấy` trong file Excel.
- Module tính giá `quick_paper` / Giấy In Nhanh.
- Module tính giá `offset` / In offset.
- API mẫu: `POST /api/quotes/calculate`.
- Demo input để so sánh với Excel.

## Cài và test

```bash
npm install
npm run test:demo
```

Chạy API:

```bash
npx tsx src/api/server.ts
```

Gửi request test:

```bash
curl -X POST http://localhost:4000/api/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "productType":"quick_paper",
    "role":"admin",
    "quantity":84,
    "widthCm":29.7,
    "heightCm":21,
    "materialId":"C300 thường",
    "sideCount":1,
    "printPageTierLabel":"400-500",
    "laminate":false,
    "cut":true,
    "drill":false,
    "finishingType":"auto"
  }'
```

## Ghi chú quan trọng

Kết quả hiện là bản engine starter. Cần tiếp tục lấy 5 bộ test từ từng sheet Excel để hiệu chỉnh sai lệch về dưới 1%.

Thứ tự nên làm tiếp:

1. Chạy demo với dữ liệu mặc định của Excel.
2. So sánh từng dòng breakdown với Excel.
3. Hiệu chỉnh các hệ số hao, khổ tính, hệ số chia lợi nhuận.
4. Làm tiếp module `quick_decal`, `void`, `tem_cn`, `mica`, `leather_tag`.
