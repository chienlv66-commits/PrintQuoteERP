# PRINTOS – Module tính giá Mác in: Riboon và In Flexo — V2 đã xác nhận

Nguồn phân tích: file Excel `1.Bảng tính Mác in 12-12-24.xlsx`

Bản V2 đã cập nhật theo xác nhận:
- Riboon: ô in nền bệt giữ nguyên như Excel, chưa đưa vào công thức.
- Riboon: phí khác mặc định 30.000, admin được sửa.
- In Flexo: phí ra fim mặc định 25.000, admin được sửa.
- Số mã trên 1 bài in luôn tối thiểu là 1, không hỗ trợ giá trị 0.

Các sheet đã đọc:
- `Riboon`
- `In Flexo`
- `Công in`

Mục tiêu: chuyển công thức Excel thành code TypeScript để Google Antigravity thêm vào Pricing Engine của PrintOS.

---

## 1. Sheet Riboon

### 1.1 Ô nhập liệu màu xanh/vàng cần đưa lên UI

| Excel | Ý nghĩa | Field đề xuất |
|---|---|---|
| B6 | Rộng mác, cm | `widthCm` |
| C6 | Dài mác, mm, bao gồm dư may | `lengthMm` |
| D6 | Mã nguyên liệu | `materialCode` |
| E6 | Mực in: Đen/Trắng | `inkColor` |
| H3 | Tổng số mác | `quantity` |
| J3 | Chọn khoảng số lượng | `tierLabel` hoặc auto theo `quantity` |
| M3 | Nguyên cuộn = 0, cắt thành phẩm = 1 | `cutFlag` |
| N3 | Không in nền bệt = 0, in nền bệt = 1 | `solidBackgroundFlag`, giữ field nhưng không tính vào công thức như Excel |

### 1.2 Công thức đã bóc từ Excel

```ts
rollPrice = INDEX('Công in'!B38:E50, MATCH(materialCode), MATCH(widthCm))
meters = quantity * lengthMm / 1000
tagsPerRoll = 190 / (lengthMm / 1000)

materialCost = quantity * rollPrice / tagsPerRoll * 1.2
inkCost = quantity * lengthMm / 1000 * inkPrice

printFee = max(quantity * 100, 30000)
cutCost = max(quantity * 30, 50000) * cutFlag

totalCost = (cutCost + printFee + materialCost + otherCost + extraCost + inkCost) / (1 - coefficient)

meterPrice = totalCost / meters
unitPrice = totalCost / quantity
```

### 1.3 Bảng hệ số số lượng Riboon

Lấy từ `Công in!G29:H36`.

| Mốc | Hệ số |
|---|---:|
| G3<=100 | 0.55 |
| 100<G3<=500 | 0.50 |
| 500<G3<=1.000 | 0.45 |
| 1.000<G3<=2.000 | 0.40 |
| 2.000<G3<=5.000 | 0.38 |
| 5.000<G3<=10.000 | 0.35 |
| 10.000<G3<=20.000 | 0.32 |
| 20.000<G3<=50.000 | 0.30 |

---

## 2. Sheet In Flexo

### 2.1 Ô nhập liệu màu xanh/vàng cần đưa lên UI

| Excel | Ý nghĩa | Field đề xuất |
|---|---|---|
| B6/B7/B8 | Rộng mác, cm | `widthCm` |
| C6/C7/C8 | Dài mác, mm | `lengthMm` |
| D6/D7/D8 | Mã nguyên liệu | `materialCode` |
| G3 | Tổng số mác | `quantity` |
| I3 | Chọn khoảng số lượng | `tierLabel` hoặc auto |
| K3 | Số mã trên 1 bài in | `codeCount`, bắt buộc >= 1 |
| L3 | Nguyên cuộn = 0, cắt thành phẩm = 1 | `cutFlag` |
| M3 | Không nền bệt = 0, nền bệt = 1 | `solidBackgroundFlag` |
| K6/K7/K8 | Chọn màu/cấu hình in | `printColor` |
| I6/I7/I8 | Ra phim | `filmCost`, mặc định 25.000, admin được sửa |

### 2.2 Nhóm sản phẩm cần chọn trong web

Excel có 3 dòng tính song song:

| Excel | Nhóm web | Hệ số lợi nhuận | Roll length |
|---|---|---:|---:|
| Row 6 – Giấy dai | `vai_giay` | `VG` | 190m |
| Row 7 – Satin | `satin` | `ST` | 190m |
| Row 8 – Coton | `cotton` | `CT` | 95m |

### 2.3 Công thức đã bóc từ Excel

```ts
rollPrice = INDEX('Công in'!B12:R26, MATCH(materialCode), MATCH(widthCm))

rollLengthM = materialGroup === 'cotton' ? 95 : 190
tagsPerRoll = rollLengthM / (lengthMm / 1000)

materialCost = quantity * rollPrice / tagsPerRoll * 1.2

if (solidBackgroundFlag === 0) {
  inkCost = inkFactor * lengthMm * 10 * quantity / 15
} else {
  inkCost = inkFactor * lengthMm * 10 * quantity
}

if (codeCount >= 1) {
  plateCost = plateFactor * widthCm * lengthMm * 10 * 5 * codeCount
} else {
  plateCost = plateFactor * widthCm * lengthMm * 4
}

printCost = printFee * materialCost / rollPrice

// Giấy dai + Satin
if (materialGroup !== 'cotton' && quantity < 5000) {
  printCost *= 1.2
}

// Cotton
if (materialGroup === 'cotton' && quantity >= 5000) {
  printCost *= 0.65
}

cutCost = (quantity >= 10000 ? quantity * 22 : quantity * 25) * cutFlag

marginBase = materialGroup === 'cotton' ? 0.71 : 0.65
coefficient = hệ số theo tier và nhóm ST/CT/VG

totalCost = (cutCost + printCost + materialCost + filmCost + plateCost + inkCost) / (marginBase * (1 - coefficient))

unitPrice = totalCost / quantity
rollPriceQuote = unitPrice * tagsPerRoll
```

---

## 3. Ghi chú quan trọng để Antigravity sửa đúng

1. Không hardcode giá nguyên liệu trong công thức. Giá nguyên liệu phải nằm trong database hoặc JSON seed.
2. Width phải match đúng các cột trong bảng Excel. Nếu nhập width không có trong bảng giá, báo lỗi để admin chọn lại.
3. `lengthMm` phải hiểu là mm. Excel ghi “Dài (m)” nhưng công thức dùng `C6/1000`, nên thực tế đang là mm.
4. `tierLabel` nên cho admin chọn để khớp Excel 100%; có thể auto theo `quantity` nhưng cần cho override.
5. Riboon và Flexo dùng 2 bảng mốc số lượng khác nhau:
   - Riboon: `Công in!G29:H36`
   - Flexo: `Công in!C29:F36`
6. Cotton trong Flexo khác Satin/Giấy dai ở 2 điểm:
   - Cuộn 95m thay vì 190m.
   - Công thức chia margin dùng `0.71` thay vì `0.65`.

---

## 4. Yêu cầu cho Google Antigravity

Hãy thêm folder mới:

```txt
src/pricing/modules/mac-in/
  mac-in-ribbon-flexo.pricing.ts
  mac-in-pricing-data.json
```

Thêm API product types:

```ts
productType: "ribbon" | "flexo"
```

Khi trả kết quả, admin cần thấy:

```ts
{
  totalCost,
  unitPrice,
  rollPrice,
  meterPrice,
  breakdown: {
    rollPrice,
    tagsPerRoll,
    materialCost,
    inkCost,
    filmCost,
    plateCost,
    printCost,
    cutCost,
    coefficient,
    marginBase
  }
}
```

---

## 5. Các câu hỏi đã xác nhận

1. Riboon: ô in nền bệt giữ nguyên như Excel, chưa tính vào công thức.
2. Riboon: phí khác mặc định 30.000 và admin được sửa.
3. In Flexo: phí ra fim mặc định 25.000 và admin được sửa.
4. `codeCount` luôn ít nhất là 1.


---

## 6. V2 – Yêu cầu sửa chính thức cho Google Antigravity

Hãy cập nhật module hiện tại theo các quy tắc sau:

### 6.1 Riboon

- `solidBackgroundFlag` vẫn hiển thị trên UI để giống Excel, nhưng **không đưa vào công thức tính**.
- `otherCost` lấy mặc định `30000`, nhưng admin/sale có thể sửa thủ công.
- Công thức Riboon giữ nguyên:

```ts
const printFee = input.printFeeOverride ?? Math.max(input.quantity * 100, 30000);
const cutCost = Math.max(input.quantity * 30, 50000) * input.cutFlag;
const otherCost = input.otherCost ?? 30000;
const extraCost = input.extraCost ?? 0;
const totalCost = (cutCost + printFee + materialCost + otherCost + extraCost + inkCost) / (1 - coefficient);
```

### 6.2 In Flexo

- `filmCost` mặc định `25000`, nhưng admin/sale có thể sửa thủ công.
- `codeCount` luôn phải >= 1. Không dùng nhánh công thức cho `codeCount = 0`.
- Khi người dùng nhập `codeCount < 1`, báo lỗi ngay.
- Công thức kẽm/bản in dùng cố định:

```ts
assertPositive('codeCount', input.codeCount);
if (input.codeCount < 1) {
  throw new Error('Số mã trên 1 bài in phải >= 1');
}

const filmCost = input.filmCost ?? 25000;
const plateCost = color.plateFactor * input.widthCm * input.lengthMm * 10 * 5 * input.codeCount;
```

### 6.3 UI cần cho admin sửa

Các field nên để mặc định nhưng cho sửa:

```ts
Ribbon: otherCost = 30000, extraCost = 0, printFeeOverride optional
Flexo: filmCost = 25000, codeCount >= 1
```

### 6.4 Test bắt buộc

- Test Riboon với `solidBackgroundFlag = 0` và `1` phải cho cùng kết quả, vì Excel hiện chưa dùng ô này trong công thức.
- Test Flexo với `codeCount = 0` phải báo lỗi.
- Test Flexo không nhập `filmCost` phải tự dùng `25000`.
- Test Ribbon không nhập `otherCost` phải tự dùng `30000`.
