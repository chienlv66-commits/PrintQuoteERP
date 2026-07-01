export function floorDiv(n: number, d: number): number {
  return Math.floor(n / d);
}

export function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function roundMoney(value: number): number {
  return Math.round(value);
}

export function maxLayout(sheetW: number, sheetH: number, itemW: number, itemH: number, spacing = 0) {
  const aCols = floorDiv(sheetW, itemW + spacing);
  const aRows = floorDiv(sheetH, itemH + spacing);
  const a = aCols * aRows;

  const bCols = floorDiv(sheetW, itemH + spacing);
  const bRows = floorDiv(sheetH, itemW + spacing);
  const b = bCols * bRows;

  if (a >= b) return { items: a, cols: aCols, rows: aRows, orientation: 'normal' as const };
  return { items: b, cols: bCols, rows: bRows, orientation: 'rotated' as const };
}

export function findByLabel<T extends { label: string }>(rows: T[], label: string): T {
  const found = rows.find((r) => r.label === label);
  if (!found) throw new Error(`Không tìm thấy label: ${label}`);
  return found;
}

export function findMeterTier<T extends { min: number; max: number }>(rows: T[], meters: number): T {
  const found = rows.find((r) => meters > r.min && meters <= r.max);
  if (!found) throw new Error(`Không tìm thấy mốc mét cho ${meters}`);
  return found;
}
