# PRINTOS - Đặc tả module In Offset / Thẻ bài cho Google Antigravity

## Mục tiêu

Thêm module `offset_card` vào Pricing Engine để tính báo giá thẻ bài theo logic sheet **"Thẻ bài"** và file **"Xem khổ in.xlsx"**.

Yêu cầu quan trọng:

- Không cần copy Excel 100%, nhưng kết quả phải bám sát Excel.
- Admin/sale nhìn thấy toàn bộ breakdown: giấy, kẽm, công in, cán, bồi, xén, khoan, bế, UV, ép nhũ, tổng giá vốn, đơn giá bán.
- Khách hàng chỉ cần nhập ít thông số.
- Hệ thống tự chọn khổ giấy tối ưu trong các khổ:
  - 650 x 430 mm
  - 545 x 395 mm
  - 395 x 360 mm
  - 430 x 325 mm
  - 395 x 272.5 mm
- Nếu sản phẩm cần bế khuôn thì khoảng cách giữa các thẻ tối thiểu 3mm.
- Nếu không bế khuôn thì spacing có thể bằng 0 để khớp Excel ghép giấy.

---

## Inputs cần có trên giao diện

```ts
{
  quantity: number;
  widthCm: number;
  heightCm: number;
  materialCode: string;
  printMode: 'NTN' | 'ONE_SIDE';
  printColor: 1 | 2 | 3 | 4;
  laminate: 'none' | 'gloss' | 'matte';
  mount: 'none' | 'double_card' | 'by_job';
  cut: 'none' | 'normal' | 'mounted' | 'by_design';
  drill: 'none' | 'drill';
  diecut: 'none' | 'full_mold' | 'half_mold';
  uv?: 'none' | 'under_500' | 'under_1000' | 'over_1000' | 'one_side' | 'two_side';
  foil?: 'none' | 'foil';
  foilMoldCount?: number;
  foilFaceCount?: number;
  paperSheetsOverride?: number;
  wasteSheetsOverride?: number;
  requireDiecutSpacing?: boolean;
}
```

---

## Logic chọn khổ giấy tự động

### Danh sách khổ giấy

```ts
const formats = [
  { code: '650x430', widthMm: 650, heightMm: 430 },
  { code: '545x395', widthMm: 545, heightMm: 395 },
  { code: '395x360', widthMm: 395, heightMm: 360 },
  { code: '430x325', widthMm: 430, heightMm: 325 },
  { code: '395x272.5', widthMm: 395, heightMm: 272.5 },
];
```

### Vùng in an toàn

Theo file xem khổ in, giấy được chia thành **1 nửa giấy** để tính số bát mỗi bên.

Ví dụ khổ 650 x 430:

- nửa giấy: 325 x 430
- vùng an toàn: 323 x 418

Cách tính:

```ts
halfWidth = paperWidth / 2;
halfHeight = paperHeight;
safeWidth = halfWidth - 2;
safeHeight = halfHeight - 12;
```

Diễn giải:

- trừ mép ngang theo logic Excel nửa giấy: `2mm`
- trừ mép dọc: trên 2mm + dưới 10mm = `12mm`

### Tính số thẻ trên 1 nửa giấy

Nếu không bế:

```ts
spacing = 0;
```

Nếu bế khuôn:

```ts
spacing = 3;
```

Công thức:

```ts
cols = Math.floor((safeWidth + spacing) / (cardWidth + spacing));
rows = Math.floor((safeHeight + spacing) / (cardHeight + spacing));
itemsPerHalf = cols * rows;
```

Phải thử cả 2 chiều:

```ts
vertical: cardWidth = width, cardHeight = height
horizontal: cardWidth = height, cardHeight = width
```

Chọn phương án có:

1. số tờ giấy cần ít nhất
2. nếu bằng nhau, số bát mỗi bên cao hơn
3. nếu vẫn bằng nhau, khoảng dư thấp hơn

### Số lượng giấy cần

Để khớp ví dụ Excel:

```ts
paperSheetsBase = Math.ceil(quantity / (itemsPerHalf * 2));
```

Ví dụ:

```text
quantity = 10000
size = 6x9cm
printMode = NTN
format 650x430
itemsPerHalf = 18
paperSheetsBase = CEIL(10000 / (18 * 2)) = 278
```

Bù hao:

```ts
if quantity >= 10000 or paperSheetsBase >= 250 => 100 tờ
else if quantity >= 5000 or paperSheetsBase >= 150 => 70 tờ
else if quantity >= 1000 or paperSheetsBase >= 50 => 50 tờ
else => 5 tờ
```

Admin phải có quyền sửa `wasteSheetsOverride`.

```ts
paperSheetsTotal = paperSheetsBase + wasteSheets;
```

Ví dụ:

```text
278 + 100 = 378 tờ
```

---

## Công thức sheet Thẻ bài cần chuyển thành code

### 1. Tiền giấy

Excel:

```excel
H9 = H6 * H7 * H8 * VLOOKUP(F5,A6:C38,3,0) * H5
```

Code:

```ts
paperCost = paperSheetsTotal * paperWidthCm * paperHeightCm * material.unitPrice * material.gsm;
```

Với khổ 650x430, sheet Excel thường điền:

```text
paperWidthCm = 43
paperHeightCm = 32.5
```

---

### 2. Kẽm in

Excel:

```excel
H10 = VLOOKUP(G10,$P$4:$Q$7,2,0)
```

Bảng:

```ts
1 màu = 54_000
2 màu = 108_000
3 màu = 162_000
4 màu = 216_000
```

---

### 3. Công in

Excel:

```excel
H11 = IF((H6*H12)>1000,(G11+(H6*H12-1000)*120),G11)
```

Trong đó:

```text
H6 = số lượng giấy tổng
H12 = số lượt in: NTN = 2, in 1 mặt = 1
G11 = công in dưới 1000 lượt theo số màu
```

Bảng công in dưới 1.000 lượt:

```ts
1 màu = 250_000
2 màu = 300_000
3 màu = 330_000
4 màu = 360_000
```

Code:

```ts
printImpressions = paperSheetsTotal * sideMultiplier;
printCost = printImpressions > 1000
  ? printBase + (printImpressions - 1000) * 120
  : printBase;
```

---

### 4. Cán

Excel:

```excel
H13 = H7 * H8 * H6 * H12 * G13
```

Bảng:

```ts
không cán = 0
cán mờ = 0.2
cán bóng = 0.2
```

Code:

```ts
laminateCost = paperWidthCm * paperHeightCm * paperSheetsTotal * sideMultiplier * laminateUnit;
```

---

### 5. Bồi thẻ

Excel:

```excel
H14 = G14 * H7 * H8 * H6
```

Bảng:

```ts
không bồi = 0
bồi đôi thẻ = 0.18
```

Code:

```ts
mountCost = mountUnit * paperWidthCm * paperHeightCm * paperSheetsTotal;
```

### 6. Bế gân để bồi

Excel:

```excel
H15 = IF(H14>0,H6*100,0)
```

Code:

```ts
mountScoreCost = mountCost > 0 ? paperSheetsTotal * 100 : 0;
```

---

### 7. Xén thẻ

Excel:

```excel
H16 = H6 / VLOOKUP(F16,$P$15:$R$18,3,0) * G16
```

Bảng:

```ts
không xén = 0
xén thường = 40_000 / 200 tờ
xén bồi = 40_000 / 100 tờ
xén theo bài = 80_000 / 850 tờ
```

Code:

```ts
cutCost = paperSheetsTotal / capacity * fee;
```

---

### 8. Khoan thẻ

Excel:

```excel
H17 = G17 * H4
```

Bảng:

```ts
khoan thẻ = 10đ/thẻ
không khoan = 0
```

Code:

```ts
drillCost = drill ? quantity * 10 : 0;
```

---

### 9. Bế khuôn

Excel:

```excel
H18 = IF((H6*H12*200)<250000,(250000+G18),(G18+H6*H12*200))
```

Bảng khuôn:

```ts
bế thẻ khuôn cả = 500_000
bế thẻ khuôn nửa = 350_000
không bế = 0
```

Code:

```ts
diecutWork = Math.max(paperSheetsTotal * sideMultiplier * 200, 250_000);
diecutCost = moldFee + diecutWork;
```

Nếu `diecut = none` thì `diecutCost = 0`.

---

### 10. Tổng giá

Excel:

```excel
H26 = SUM(H9:H25)
H27 = H26/H4
H28 = H27/0.7
```

Code:

```ts
totalCost = paperCost + plateCost + printCost + laminateCost + mountCost + mountScoreCost + cutCost + drillCost + diecutCost + uvCost + foilCost;
factoryUnitPrice = totalCost / quantity;
sellingUnitPrice = factoryUnitPrice / 0.7;
sellingTotal = sellingUnitPrice * quantity;
```

---

## File code cần thêm

Tạo file:

```text
src/pricing/modules/offset-card.ts
```

Dán toàn bộ nội dung file `offset-card.antigravity.ts` vào.

Sau đó thêm vào router:

```ts
case 'offset_card':
  return calculateOffsetCard(input);
```

---

## Test bắt buộc

Test ví dụ:

```ts
calculateOffsetCard({
  quantity: 10000,
  widthCm: 6,
  heightCm: 9,
  materialCode: 'ốp 250',
  printMode: 'NTN',
  printColor: 4,
  laminate: 'none',
  mount: 'none',
  cut: 'normal',
  drill: 'none',
  diecut: 'none',
  wasteSheetsOverride: 100,
});
```

Kết quả layout cần ra gần đúng:

```text
khổ giấy: 650x430
itemsPerHalf: 18
paperSheetsBase: 278
wasteSheets: 100
paperSheetsTotal: 378
```

Nếu kết quả khác các số trên thì chưa khớp file `Xem khổ in.xlsx`.

---

## Cần cải thiện sau khi tích hợp

1. Cho admin sửa bảng giá giấy trong database, không hardcode lâu dài.
2. Cho admin override số giấy, bù hao, khổ giấy nếu cần.
3. Tách bảng `materials`, `paper_formats`, `print_cost_rules`, `finishing_rules` vào database.
4. Lưu breakdown từng dòng để dễ đối chiếu với Excel.
5. Thêm chế độ debug: hiển thị tất cả phương án khổ giấy, không chỉ phương án rẻ nhất.
