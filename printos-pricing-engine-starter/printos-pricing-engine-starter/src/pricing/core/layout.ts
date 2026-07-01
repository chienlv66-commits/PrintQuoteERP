export function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

export function ceilDiv(a: number, b: number): number {
  return Math.ceil(a / b);
}

export interface LayoutResult {
  itemsPerSheet: number;
  orientation: 'normal' | 'rotated';
  normal: number;
  rotated: number;
}

export function maxLayout(sheetW: number, sheetH: number, itemW: number, itemH: number, gap = 0): LayoutResult {
  const normalX = Math.floor(sheetW / (itemW + gap));
  const normalY = Math.floor(sheetH / (itemH + gap));
  const rotatedX = Math.floor(sheetW / (itemH + gap));
  const rotatedY = Math.floor(sheetH / (itemW + gap));
  const normal = Math.max(0, normalX * normalY);
  const rotated = Math.max(0, rotatedX * rotatedY);
  const itemsPerSheet = Math.max(normal, rotated);
  if (itemsPerSheet <= 0) {
    throw new Error(`Không xếp được sản phẩm ${itemW}x${itemH}cm vào khổ ${sheetW}x${sheetH}cm`);
  }
  return { itemsPerSheet, orientation: rotated > normal ? 'rotated' : 'normal', normal, rotated };
}
