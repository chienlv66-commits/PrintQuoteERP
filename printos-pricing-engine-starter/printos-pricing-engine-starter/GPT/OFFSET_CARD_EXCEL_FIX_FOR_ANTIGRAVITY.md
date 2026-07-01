# Sửa module In Offset / Thẻ bài để khớp Excel

## Mục tiêu
Sửa `offset-card.ts` để kết quả gần khớp sheet **Thẻ bài** trong file Excel. Web không được chỉ chọn khổ có nhiều bát nhất; phải chọn **phương án chi phí thấp nhất** sau khi tính giấy + bù hao, vì Excel có thể chọn khổ 545x395 rẻ hơn 650x430 dù số bát ít hơn.

Ví dụ chuẩn cần test:

```ts
quantity: 10000
widthCm: 6
heightCm: 9
materialCode: 'ốp 250'
printMode: 'NTN'
printColor: 4
laminate: 'none'
mount: 'none'
cut: 'none'
drill: 'none'
diecut: 'half_mold'
uv: 'none'
foil: 'none'
wasteSheetsOverride: 70
```

Kết quả cần gần Excel:

```txt
Khổ giấy chọn: 545x395
Số bát mỗi bên thực tế: 18
Số lượng giấy cơ bản: 278
Bù hao: 70
Tổng giấy: 348
Tiền giấy: khoảng 524.410
Kẽm: 216.000
Công in: 360.000
Bế khuôn nửa: 600.000
Tổng: khoảng 1.700.412
Đơn giá SX: khoảng 170
Đơn giá báo khách: khoảng 243
```

---

## Các lỗi cần sửa

### 1. Sai tiêu chí chọn khổ
Code hiện tại chọn khổ theo `sheetsNeeded` thấp nhất. Điều này khiến 650x430 được chọn vì có thể ghép nhiều bát hơn.

Excel thực tế cần chọn khổ theo **tổng chi phí thấp nhất**, vì:

```txt
650x430: ít tờ hơn nhưng diện tích giấy lớn hơn
545x395: nhiều tờ hơn một chút nhưng tổng tiền giấy rẻ hơn
```

Vì vậy cần thay `findBestOffsetCardFormat()` thành hàm có xét `material`, `wasteSheets`, `paperCostEstimate`.

---

### 2. Sai cách tính khổ giấy đưa vào tiền giấy
Công thức Excel:

```excel
H9 = H6 * H7 * H8 * VLOOKUP(F5,A6:C38,3,0) * H5
```

Trong đó:

```txt
H6 = tổng số lượng giấy
H7 = khổ giấy chiều 1, đơn vị cm
H8 = khổ giấy chiều 2, đơn vị cm
H5 = định lượng giấy
```

Với khổ 545x395 phải tính:

```txt
348 * 39.5 * 54.5 * 0.0028 * 250 = 524.410
```

Không được dùng `halfWidth = 27.25cm` để tính tiền giấy trong trường hợp này.

---

### 3. Bù hao cần là field admin chọn
Excel có các mức bù hao 5 / 50 / 70 / 100. Không nên tự ép `quantity >= 10000 => 100`.

Với ví dụ trên Excel đang dùng:

```txt
278 + 70 = 348
```

Nên UI cần có ô chọn bù hao, mặc định có thể gợi ý 70 nhưng admin/sale được sửa.

---

### 4. Công thức thành phẩm cần giữ đúng Excel
Các công thức chuẩn:

```ts
paperCost = round(totalSheets * paperWidthCm * paperHeightCm * material.unitPrice * material.gsm)
plateCost = printColorTable[color].plate
printImpressions = totalSheets * sides
printCost = printImpressions > 1000
  ? printBase + (printImpressions - 1000) * 120
  : printBase
laminateCost = round(paperWidthCm * paperHeightCm * totalSheets * sides * laminateUnit)
mountCost = round(mountUnit * paperWidthCm * paperHeightCm * totalSheets)
mountScoreCost = mountCost > 0 ? totalSheets * 100 : 0
cutCost = cut === 'none' ? 0 : totalSheets / cutCapacity * cutFee
drillCost = drill === 'drill' ? quantity * 10 : 0
diecutWork = diecut === 'none' ? 0 : Math.max(totalSheets * sides * 200, 250000)
diecutCost = diecut === 'none' ? 0 : moldFee + diecutWork
foilCost = foil === 'foil' ? moldCount * foilMoldFee + quantity * 30 * foilFaceCount : 0
totalCost = sum(all)
factoryUnitPrice = totalCost / quantity
sellingUnitPrice = factoryUnitPrice / 0.7
```

---

## Bản code thay thế khuyến nghị
Dùng file `offset-card.excel-compatible.ts` đi kèm. Nếu sửa vào source hiện tại, thay toàn bộ module offset card bằng file đó.
