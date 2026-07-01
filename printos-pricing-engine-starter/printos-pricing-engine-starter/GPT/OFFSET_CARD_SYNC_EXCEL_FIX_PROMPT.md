# PROMPT GỬI GOOGLE ANTIGRAVITY – SỬA MODULE IN OFFSET / THẺ BÀI ĐỂ KHỚP EXCEL

Bạn hãy sửa module `offset-card.ts` / `offset-card.antigravity.ts` trong dự án PrintQuote/PrintOS theo các yêu cầu dưới đây. Mục tiêu là khi chọn đúng cấu hình đầu vào thì kết quả phải khớp gần nhất với sheet Excel **Thẻ bài**.

## 1. Lỗi hiện tại cần sửa

Case test chuẩn từ Excel:

```ts
quantity = 10000
widthCm = 6
heightCm = 9
material = "OPP 250"
material.gsm = 250
material.unitPrice = 0.0028 // hoặc đơn giá trong database làm tròn đúng theo Excel
printMode = "NTN" // 2 mặt
printColor = "4 màu"
laminate = "không cán"
mount = "không bồi"
cut = "không xén"
drill = "không khoan"
diecut = "bế bóc thẻ" // có công bế bóc tối thiểu 250.000, nhưng không cộng tiền khuôn nếu chọn không khuôn
uv = "không UV"
foil = "không ép nhũ"
paperFormat = 545x395
paperSheetsBase = 278
wasteSheets = 70
totalSheets = 348
```

Kết quả Excel cần ra xấp xỉ:

```ts
paperCost = 524410
plateCost = 216000
printCost = 360000
laminateCost = 0
mountCost = 0
mountScoreCost = 0
cutCost = 0
drillCost = 0
diecutWorkCost = 250000
moldFee = 0
uvCost = 0
foilCost = 0
totalCost = 1350412
factoryUnitPrice = 135
sellingUnitPrice = 193
```

Hiện web đang ra khoảng:

```ts
totalCost = 1166264
factoryUnitPrice = 117
sellingUnitPrice = 167
```

Nguyên nhân:

1. Web dùng `material.unitPrice = 0.00278`, trong khi Excel case này đang tương đương khoảng `0.0028`.
2. Web đang cộng `cutCost = 69609` dù Excel đang chọn **Không xén**.
3. Web đang chọn **Không bế** nên `diecutCost = 0`, trong khi Excel vẫn có **công bế bóc thẻ tối thiểu 250.000**.
4. Code đang gộp sai giữa `tiền khuôn` và `công bế`. Excel cần tách 2 phần này.

---

## 2. Nguyên tắc sửa quan trọng

### 2.1. Tách riêng tiền khuôn và công bế

Không được gộp `diecutCost = moldFee + diecutWork` theo một option duy nhất.

Cần tách thành:

```ts
moldFee: tiền khuôn, có thể bằng 0 nếu không làm khuôn.
diecutWorkCost: công bế/bóc, vẫn có thể phát sinh 250.000 dù moldFee = 0.
```

Ví dụ:

```ts
Không bế                  => moldFee = 0, diecutWorkCost = 0
Bế bóc thẻ, không khuôn    => moldFee = 0, diecutWorkCost = max(totalSheets * sides * 200, 250000)
Bế thẻ khuôn nửa          => moldFee = 350000, diecutWorkCost = max(totalSheets * sides * 200, 250000)
Bế thẻ khuôn mới/full     => moldFee = 500000 hoặc 600000, diecutWorkCost = max(totalSheets * sides * 200, 250000)
```

Với case Excel đang test, dù dropdown hiện tên có thể hơi khó hiểu, nhưng dòng `Bế bóc thẻ` phải tính ra `250.000`.

---

## 3. Enum input nên dùng

Sửa type input để tách rõ:

```ts
export type OffsetCardCut = 'none' | 'normal' | 'mount_cut' | 'by_card';

export type OffsetCardDiecut =
  | 'none'
  | 'diecut_work_only'
  | 'half_mold'
  | 'full_mold';

export interface OffsetCardInput {
  quantity: number;
  widthCm: number;
  heightCm: number;
  materialCode: string;

  printMode: 'one_side' | 'ntn';
  printColor: 1 | 2 | 3 | 4;

  laminate: 'none' | 'matte' | 'glossy';
  mount: 'none' | 'mount_card';
  cut: OffsetCardCut;
  drill: 'none' | 'drill';
  diecut: OffsetCardDiecut;
  uv: 'none' | 'under_500' | 'under_1000' | 'over_1000' | 'one_side' | 'two_side';
  foil: 'none' | 'foil';

  foilMoldCount?: number;
  foilFaceCount?: number;

  forcedPaperFormat?: 'auto' | '650x430' | '545x395' | '395x360' | '430x325' | '395x272.5';
  paperSheetsOverride?: number;
  wasteSheetsOverride?: number;
  materialUnitPriceOverride?: number;
}
```

---

## 4. Bảng giá cố định phải sửa

### 4.1. Bảng in + kẽm

```ts
const PRINT_PRICE = {
  1: { base: 250000, overRate: 100, plate: 54000 },
  2: { base: 300000, overRate: 110, plate: 108000 },
  3: { base: 330000, overRate: 110, plate: 162000 },
  4: { base: 360000, overRate: 120, plate: 216000 },
} as const;
```

Công in:

```ts
function calcPrintCost(totalSheets: number, sides: number, color: 1 | 2 | 3 | 4): number {
  const impressions = totalSheets * sides;
  const rule = PRINT_PRICE[color];

  if (impressions <= 1000) return rule.base;
  return rule.base + (impressions - 1000) * rule.overRate;
}
```

Với `348 tờ * 2 mặt = 696 lượt`, 4 màu phải ra `360.000`.

---

## 5. Công thức tiền giấy phải đúng Excel

Excel dùng công thức dạng:

```ts
paperCost = totalSheets * paperWidthCm * paperHeightCm * materialUnitPrice * gsm
```

Với case test:

```ts
totalSheets = 348
paperWidthCm = 39.5
paperHeightCm = 54.5
gsm = 250
unitPrice = 0.0028
```

Kết quả:

```ts
348 * 39.5 * 54.5 * 250 * 0.0028 = 524410.6 ≈ 524410 hoặc 524411
```

Code cần ưu tiên:

```ts
const unitPrice = input.materialUnitPriceOverride ?? material.unitPrice;
const paperCost = Math.round(totalSheets * paperWidthCm * paperHeightCm * unitPrice * material.gsm);
```

Lưu ý: database material của OPP 250 nên để `0.0028` nếu muốn khớp case Excel. Nếu vẫn lưu `0.00278` thì sẽ lệch khoảng 3.700đ.

---

## 6. Công thức xén phải đúng lựa chọn

Nếu chọn `cut = 'none'` thì bắt buộc:

```ts
cutCost = 0
```

Không được tự cộng xén thường.

```ts
const CUT_RULE = {
  none: { capacity: 0, fee: 0 },
  normal: { capacity: 200, fee: 40000 },
  mount_cut: { capacity: 100, fee: 40000 },
  by_card: { capacity: 1, fee: 80000 },
} as const;

function calcCutCost(totalSheets: number, cut: OffsetCardCut): number {
  if (cut === 'none') return 0;
  if (cut === 'by_card') return 80000;

  const rule = CUT_RULE[cut];
  return Math.round((totalSheets / rule.capacity) * rule.fee);
}
```

---

## 7. Công thức bế phải tách khuôn và công bế

Thay đoạn cũ:

```ts
const moldFee = DIECUT_MOLD_FEE[input.diecut];
const diecutWork = input.diecut === 'none' ? 0 : Math.max(totalSheets * sides * 200, 250000);
const diecutCost = input.diecut === 'none' ? 0 : moldFee + diecutWork;
```

Bằng đoạn mới:

```ts
const DIECUT_MOLD_FEE = {
  none: 0,
  diecut_work_only: 0,
  half_mold: 350000,
  full_mold: 500000,
} as const;

function calcDiecut(input: OffsetCardInput, totalSheets: number, sides: number) {
  if (input.diecut === 'none') {
    return {
      moldFee: 0,
      diecutWorkCost: 0,
      diecutCost: 0,
    };
  }

  const moldFee = DIECUT_MOLD_FEE[input.diecut];
  const diecutWorkCost = Math.max(totalSheets * sides * 200, 250000);

  return {
    moldFee,
    diecutWorkCost,
    diecutCost: moldFee + diecutWorkCost,
  };
}
```

Với case Excel:

```ts
input.diecut = 'diecut_work_only'
totalSheets = 348
sides = 2
```

Kết quả:

```ts
moldFee = 0
diecutWorkCost = max(348 * 2 * 200, 250000) = 250000
diecutCost = 250000
```

---

## 8. Công thức cán, bồi, khoan, UV, ép nhũ

Giữ theo logic Excel:

```ts
const LAMINATE_UNIT = {
  none: 0,
  matte: 0.2,
  glossy: 0.2,
} as const;

function calcLaminateCost(totalSheets: number, paperWidthCm: number, paperHeightCm: number, sides: number, laminate: OffsetCardInput['laminate']) {
  return Math.round(totalSheets * paperWidthCm * paperHeightCm * sides * LAMINATE_UNIT[laminate]);
}

function calcMountCost(totalSheets: number, paperWidthCm: number, paperHeightCm: number, mount: OffsetCardInput['mount']) {
  if (mount === 'none') return 0;
  return Math.round(totalSheets * paperWidthCm * paperHeightCm * 0.18);
}

function calcMountScoreCost(totalSheets: number, mount: OffsetCardInput['mount']) {
  if (mount === 'none') return 0;
  return Math.max(totalSheets * 100, 100000);
}

function calcDrillCost(quantity: number, drill: OffsetCardInput['drill']) {
  return drill === 'drill' ? quantity * 10 : 0;
}

function calcUvCost(input: OffsetCardInput): number {
  if (input.uv === 'none') return 0;
  if (input.uv === 'under_500') return 450000;
  if (input.uv === 'under_1000') return 600000;
  if (input.uv === 'over_1000') return 595000;
  if (input.uv === 'one_side') return input.quantity * 30;
  if (input.uv === 'two_side') return input.quantity * 30 * 2;
  return 0;
}

function calcFoilCost(input: OffsetCardInput): number {
  if (input.foil === 'none') return 0;
  const moldCount = input.foilMoldCount ?? 1;
  const faceCount = input.foilFaceCount ?? 1;
  return 500000 * moldCount + input.quantity * 30 * faceCount;
}
```

---

## 9. Hàm tính tổng chuẩn Excel

Thay phần tổng bằng:

```ts
const sides = input.printMode === 'ntn' ? 2 : 1;
const totalSheets = paperSheetsBase + wasteSheets;

const paperCost = Math.round(totalSheets * paperWidthCm * paperHeightCm * unitPrice * material.gsm);
const plateCost = PRINT_PRICE[input.printColor].plate;
const printCost = calcPrintCost(totalSheets, sides, input.printColor);
const laminateCost = calcLaminateCost(totalSheets, paperWidthCm, paperHeightCm, sides, input.laminate);
const mountCost = calcMountCost(totalSheets, paperWidthCm, paperHeightCm, input.mount);
const mountScoreCost = calcMountScoreCost(totalSheets, input.mount);
const cutCost = calcCutCost(totalSheets, input.cut);
const drillCost = calcDrillCost(input.quantity, input.drill);
const { moldFee, diecutWorkCost, diecutCost } = calcDiecut(input, totalSheets, sides);
const uvCost = calcUvCost(input);
const foilCost = calcFoilCost(input);

const totalCost = Math.round(
  paperCost +
  plateCost +
  printCost +
  laminateCost +
  mountCost +
  mountScoreCost +
  cutCost +
  drillCost +
  diecutCost +
  uvCost +
  foilCost
);

const factoryUnitPrice = Math.round(totalCost / input.quantity);
const sellingUnitPrice = Math.round(factoryUnitPrice / 0.7);
const sellingTotal = sellingUnitPrice * input.quantity;
```

---

## 10. Breakdown phải trả về đủ để đối chiếu Excel

API phải trả breakdown như sau:

```ts
return {
  productType: 'offset_card',
  quantity: input.quantity,
  totalCost,
  factoryUnitPrice,
  sellingUnitPrice,
  sellingTotal,
  breakdown: {
    paper: {
      materialCode: input.materialCode,
      gsm: material.gsm,
      unitPrice,
      paperWidthCm,
      paperHeightCm,
      paperSheetsBase,
      wasteSheets,
      totalSheets,
      paperCost,
    },
    print: {
      printMode: input.printMode,
      sides,
      printColor: input.printColor,
      impressions: totalSheets * sides,
      plateCost,
      printCost,
    },
    finishing: {
      laminate: input.laminate,
      laminateCost,
      mount: input.mount,
      mountCost,
      mountScoreCost,
      cut: input.cut,
      cutCost,
      drill: input.drill,
      drillCost,
      diecut: input.diecut,
      moldFee,
      diecutWorkCost,
      diecutCost,
      uv: input.uv,
      uvCost,
      foil: input.foil,
      foilCost,
    }
  }
}
```

---

## 11. Case test bắt buộc phải pass

Sau khi sửa, chạy test này:

```ts
const result = calculateOffsetCard({
  quantity: 10000,
  widthCm: 6,
  heightCm: 9,
  materialCode: 'OPP_250',
  materialUnitPriceOverride: 0.0028,
  printMode: 'ntn',
  printColor: 4,
  laminate: 'none',
  mount: 'none',
  cut: 'none',
  drill: 'none',
  diecut: 'diecut_work_only',
  uv: 'none',
  foil: 'none',
  forcedPaperFormat: '545x395',
  paperSheetsOverride: 278,
  wasteSheetsOverride: 70,
});
```

Kỳ vọng:

```ts
result.breakdown.paper.paperCost ≈ 524410
result.breakdown.print.plateCost = 216000
result.breakdown.print.printCost = 360000
result.breakdown.finishing.cutCost = 0
result.breakdown.finishing.diecutWorkCost = 250000
result.breakdown.finishing.moldFee = 0
result.totalCost ≈ 1350412
result.factoryUnitPrice = 135
result.sellingUnitPrice = 193
```

Nếu vẫn lệch, in ra breakdown từng dòng và so với Excel theo thứ tự:

1. Tiền giấy
2. Kẽm in
3. Công in
4. Cán
5. Bồi
6. Xén
7. Khoan
8. Công bế bóc
9. Khuôn bế
10. UV
11. Ép nhũ

---

## 12. Yêu cầu UI cần sửa

Trong form web, dropdown **Bế khuôn** cần có ít nhất 4 lựa chọn rõ ràng:

```ts
Không bế                => diecut = 'none'
Bế bóc thẻ              => diecut = 'diecut_work_only'
Bế thẻ khuôn nửa        => diecut = 'half_mold'
Bế thẻ khuôn mới/full   => diecut = 'full_mold'
```

Dropdown **Xén**:

```ts
Không xén     => cut = 'none'
Xén thường    => cut = 'normal'
Xén bồi       => cut = 'mount_cut'
Xén theo bài  => cut = 'by_card'
```

Với case Excel trong ảnh, phải chọn:

```ts
cut = 'none'
diecut = 'diecut_work_only'
```

Không được chọn `cut = 'normal'` hoặc `diecut = 'none'`.

