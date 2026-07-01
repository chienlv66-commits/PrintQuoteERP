# PrintOS Extra Modules v2 - Chốt theo phản hồi để đưa vào Google Antigravity

Áp dụng cho file **Bảng giá Thẻ bài + tem nhãn 18-7-25.xlsx** để thêm thư mục tính riêng cho các sheet:

- Void
- 27-42 - Mica
- Mác da
- Tem CN:
  - Báo giá tem nhiệt
  - Báo giá tem in PET
  - Báo giá tem UV / tem cao thành theo mét
  - Báo giá tem cao thành 1 màu
- Dây logo

## Các điểm đã chốt

1. **Void có cán:** ô cán dùng dạng số: `0 = không cán`, `1 = có cán`. Không cần chọn loại cán riêng.
2. **Mica:** giữ đúng công thức Excel; các ghi chú khoan/bo góc/xén là gia công khi cần, nên trên web phải có checkbox/select bật tắt gia công. Khi bật thì dùng đúng công thức Excel.
3. **Tem PET:** không dùng công thức cũ G6/G7 nữa; phải dùng **bảng đơn giá theo mét bên cạnh**.
4. **Tem UV/cao thành theo mét** và **Tem cao thành 1 màu** là 2 sản phẩm riêng.
5. **Dây logo:** phải tính theo **mốc Excel**, không tính theo số lượng thực tế lẻ. Ví dụ khách nhập 23.000 thì dùng đơn giá mốc >=20.000 và thành tiền theo 20.000 nếu muốn khớp Excel.

---

# 1. Quy ước thư mục đề xuất

Tạo thư mục:

```txt
src/pricing/extra-modules/
  index.ts
  shared.ts
  data.ts
  void.ts
  mica.ts
  mac-da.ts
  tem-nhiet.ts
  tem-pet.ts
  tem-uv.ts
  tem-cao-thanh-1-mau.ts
  day-logo.ts
```

Nếu muốn nhanh, có thể dùng file gộp `pricing-extra-modules.v2.ts` đi kèm tài liệu này.

---

# 2. Void - công thức cần sửa

## Input

```ts
interface VoidInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  colorCount: 1 | 2;
  quantityTierLabel: string;
  laminate: 0 | 1; // 0 = không cán, 1 = có cán
}
```

## Công thức

```ts
layout = maxLayout(9.5, 98, lengthCm, widthCm, 0.1)
itemsPerMeter = layout.items
meters = quantity / itemsPerMeter
factor = lookup(quantityTierLabel)

materialCost = (meters + 25) * 14200
printDieCost = max(quantity * 110, 800000) * factor / 0.6
laminateCost = 500 * meters * laminate
moldCost = 400000
secondColorFee = colorCount === 2 ? 500000 : 0

total = materialCost + printDieCost + laminateCost + moldCost + secondColorFee
unitPrice = total / quantity
```

---

# 3. Mica - giữ Excel nhưng thêm bật/tắt gia công

## Input

```ts
interface MicaInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  materialUnitPrice: number;
  colorCount: number;
  sideCount: 1 | 2;
  cut?: boolean;
  drillOrCorner?: boolean;
}
```

## Công thức Excel

```ts
layout = maxLayout(26, 40, lengthCm, widthCm, 0)
itemsPerSheet = layout.items
sheets = ceil(quantity / itemsPerSheet)

materialCost = ceilTo((100 + sheets) * materialUnitPrice * 27 * 42, 1000)
printCost = colorCount * 920000 * sideCount

// Chỉ tính khi khách/admin chọn gia công xén
cutCost = cut ? max(quantity / (itemsPerSheet * 100) * 50000, 250000) : 0

// Chỉ tính khi khách/admin chọn khoan/bo góc/gia công tương ứng
// giữ đúng công thức Excel hiện tại
processingCost = drillOrCorner ? (quantity * 10 > 200000 ? quantity * 20 : 200000) : 0

totalCost = materialCost + printCost + cutCost + processingCost
unitPrice = totalCost / (quantity * 0.6)
```

---

# 4. Mác da

Giữ công thức như bản v1.

```ts
area = lengthCm * widthCm
moldCost = quantity < 3000 ? 600000 : 0

if (area > 12) {
  baseUnit = area * 33 + moldCost / quantity
} else {
  baseUnit = 300 + 0.5 * moldCost / quantity
}

unitPrice = baseUnit / tierFactor
```

---

# 5. Tem nhiệt

Giữ công thức Excel.

```ts
layout = maxLayout(26, 40, lengthCm, widthCm, 0)
sheetsForFilm = ceil(quantity / itemsPerSheet) + 20
filmCost = sheetsForFilm > 500
  ? sheetsForFilm * 10000 / 0.55
  : sheetsForFilm * 12000 / 0.55

plateCost = colorCount > 2
  ? 2 * 200000 + (colorCount - 2) * 350000
  : colorCount * 200000

processingCost = quantity > 1000 ? quantity * 25 : quantity * 50
unitPrice = ceilTo((filmCost + plateCost + processingCost) / quantity, 10) + sizeSplitCount * 10
```

---

# 6. Tem PET - sửa sang bảng giá theo mét

Không dùng logic cũ:

```ts
meters <= 10 ? 150000 : 140000
```

Dùng bảng giá theo mét bên cạnh:

```ts
petMeterTiers = [
  { min: 0, max: 9.999999, rollPricePerMeter: 140000 },
  { min: 10, max: 59.999999, rollPricePerMeter: 115000 },
  { min: 60, max: 199.999999, rollPricePerMeter: 95000 },
  { min: 200, max: Infinity, rollPricePerMeter: 85000 }
]
```

Công thức:

```ts
layout = maxLayout(57.5, 90, lengthCm, widthCm, 0.2)
itemsPerMeter = layout.items
meters = quantity / itemsPerMeter
meterTier = findMeterTier(meters)
rollTotal = meters * meterTier.rollPricePerMeter
rollUnitPrice = rollTotal / quantity

// Nếu cần cắt rời: cộng công cắt theo Excel cũ +100đ/tem
cutUnitExtra = 100
cutUnitPrice = rollUnitPrice + cutUnitExtra
cutTotal = cutUnitPrice * quantity
```

Nếu sau này có bảng giá cắt riêng theo mét thì thay `cutUnitExtra` bằng bảng data.

---

# 7. Tem UV / tem cao thành theo mét

Là sản phẩm riêng: `tem_uv`.

```ts
layout = maxLayout(27, 95, lengthCm, widthCm, 0.15)
itemsPerMeter = layout.items / 1.02
metersOrSheets = quantity / itemsPerMeter * 5
tierPrice = lookup(uvTierLabel)
total = tierPrice * metersOrSheets
unitPrice = total / quantity
```

---

# 8. Tem cao thành 1 màu

Là sản phẩm riêng: `tem_cao_thanh_1_mau`.

Giữ công thức Excel hiện tại:

```ts
layout = maxLayout(55, 95, lengthCm, widthCm, 0.2)
itemsPerMeter = layout.items
meters = quantity / itemsPerMeter

rollUnitPrice = meters <= 10
  ? 260000 * meters / quantity
  : 260000 * 0.8 * meters / quantity

cutUnitPrice = meters <= 10
  ? 160000 * meters / quantity + 100
  : 150000 * meters / quantity + 100
```

---

# 9. Dây logo - sửa thành tính theo mốc Excel

Không tính theo số lượng thực tế.

```ts
selectedTier = largestTierLessOrEqual(quantity)
billQty = selectedTier.qty
unitPrice = selectedTier.price + (logoTwoSides ? 50 : 0)
total = ceilTo(unitPrice * billQty, 1000)
```

Ví dụ:

```txt
quantity = 23.000
selected tier = 20.000
billQty = 20.000
```

Lưu ý: nếu muốn báo khách chính xác theo số lượng thực tế, có thể hiển thị thêm `actualTotal = unitPrice * quantity`, nhưng giá khớp Excel phải dùng `tierTotal`.

---

# 10. Yêu cầu output chung

Mọi hàm tính phải trả:

```ts
{
  productType,
  quantity,
  total,
  unitPrice,
  breakdown: {
    ...chi tiết từng dòng Excel
  }
}
```

Không được chỉ trả 1 con số vì admin/sale cần đối chiếu với Excel.
