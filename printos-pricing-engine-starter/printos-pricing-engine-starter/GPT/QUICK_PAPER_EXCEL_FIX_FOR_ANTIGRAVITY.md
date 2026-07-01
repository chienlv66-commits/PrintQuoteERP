# PrintOS - Sửa module Giấy In Nhanh theo Excel

## Mục tiêu
Sửa `src/pricing/modules/quick-paper.ts` để kết quả bám sát sheet `Giấy In Nhanh` trong file Excel. Không cần giống 100%, nhưng sai lệch mục tiêu dưới 1%.

## Công thức Excel cần bám

### Input
- `C2`: số lượng
- `C3`: dài cm
- `C4`: rộng cm
- `C6`: loại giấy
- `C7`: số mặt in
- `C9`: vùng giá trang in, ví dụ `400-500`
- `C10`: cán 1/0
- `C11`: xén 1/0
- `C12`: khoan 1/0

### Công thức lõi
```ts
const layout = maxLayout(31.5, 42, widthCm, heightCm, 0);
const itemsPerSheet = layout.itemsPerSheet;
const printPages = quantity * 2 * sideCount / itemsPerSheet;
const printedSheets = Math.ceil(quantity / itemsPerSheet);

const paperCostRaw = (10 + printedSheets) * material.unitPriceM2 * 32.5 * 43 * 1.1;
const paperCost = ceilMoney(paperCostRaw, 1000);

const printCost = printTier.value * printPages;
const laminationRaw = laminate ? 500 * printPages : 0;
const laminationCost = laminate ? ceilMoney(laminationRaw, 10000) : 0;

const cuttingCost = cut ? Math.max(quantity * 20, 50000) : 0;
const drillingCost = drill ? Math.max(quantity * 50, 50000) : 0;

const moldFee = 500000;
const moldDiecutCost = Math.max((quantity / itemsPerSheet) * 400, 250000);
const laserDiecutCost = Math.max((quantity / itemsPerSheet) * 3200, 100000);

const secondPaperCost = paperCost;
const mountScoreCost = 150000;
const mountingCost = Math.max((quantity / itemsPerSheet) * 32.5 * 43 * 0.2, 200000);
const marginDivisor = 0.65;
```

### Giá theo phương án
```ts
const cutTotal = paperCost + printCost + laminationCost + cuttingCost + drillingCost;

const laserTotal = paperCost + printCost + laminationCost + laserDiecutCost;

const moldTotal = paperCost + printCost + laminationCost + cuttingCost + drillingCost + moldFee + moldDiecutCost;

const mountCutTotal = paperCost + printCost + laminationCost + cuttingCost + drillingCost + secondPaperCost + mountScoreCost + mountingCost;

const mountDiecutTotal = paperCost + printCost + laminationCost + moldFee + moldDiecutCost + secondPaperCost + mountScoreCost + mountingCost;

const sellUnit = total / (quantity * marginDivisor);
```

## Bảng giá trang in cần sửa trong seed
Module `quick_print_page` phải dùng đúng bảng `Loại giấy!K3:L8`:

```json
[
  { "module": "quick_print_page", "label": "<100", "minQty": 0, "maxQty": 99.999, "value": 2200, "unit": "vnd/page" },
  { "module": "quick_print_page", "label": "100-200", "minQty": 100, "maxQty": 200, "value": 1700, "unit": "vnd/page" },
  { "module": "quick_print_page", "label": "200-300", "minQty": 200, "maxQty": 300, "value": 1300, "unit": "vnd/page" },
  { "module": "quick_print_page", "label": "300-400", "minQty": 300, "maxQty": 400, "value": 1200, "unit": "vnd/page" },
  { "module": "quick_print_page", "label": "400-500", "minQty": 400, "maxQty": 500, "value": 1100, "unit": "vnd/page" },
  { "module": "quick_print_page", "label": "500-1000", "minQty": 500, "maxQty": 1000, "value": 1000, "unit": "vnd/page" }
]
```

## Điểm cần cải thiện cho Google Antigravity
1. Tách tất cả hệ số đang hardcode thành `process_prices`: `margin_divisor`, `quick_paper_sheet_width`, `quick_paper_sheet_height`, `paper_calc_width`, `paper_calc_height`, `paper_waste_multiplier`, `paper_waste_sheets`, `lamination_price_per_page`, `cut_price_per_item`, `cut_min`, `drill_price_per_item`, `drill_min`, `mold_fee`, `mold_diecut_per_sheet`, `mold_diecut_min`, `laser_diecut_per_sheet`, `laser_diecut_min`, `mount_score_fixed`, `mounting_rate`, `mounting_min`.
2. Admin phải có trường chọn `printPageTierLabel`; nếu bỏ trống mới auto chọn theo `printPages`.
3. API trả cả `breakdown` để admin/sale kiểm tra từng dòng giống Excel.
4. Viết 5 test case lấy từ Excel: quantity, size, giấy, số mặt, tier, cán/xén/khoan, phương án thành phẩm. Test so sánh từng dòng: tiền giấy, tiền in, cán, xén, khoan, khuôn, bế, laze, bồi, giá/cái.
5. Không dùng `Math.ceil(printPages)` vì Excel C8 giữ số lẻ.
6. Cán phải làm tròn lên 10.000 theo C17, không để nguyên `500 * printPages`.
7. Bồi bế không cộng xén/khoan theo Excel.
