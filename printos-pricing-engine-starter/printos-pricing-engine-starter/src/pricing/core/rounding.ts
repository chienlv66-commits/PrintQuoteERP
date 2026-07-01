export function roundUp(value: number, precision = 0): number {
  if (precision >= 0) {
    const factor = Math.pow(10, precision);
    return Math.ceil(value * factor) / factor;
  }
  const factor = Math.pow(10, -precision);
  return Math.ceil(value / factor) * factor;
}

export function roundMoney(value: number, step = 1): number {
  return Math.round(value / step) * step;
}

export function ceilMoney(value: number, step = 1): number {
  return Math.ceil(value / step) * step;
}
