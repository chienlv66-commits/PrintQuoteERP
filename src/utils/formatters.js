/**
 * Format single or newline-separated numeric values (e.g. multi-product order quantities)
 * without producing NaN when a cell contains multiple lines or localized decimals.
 */
export function formatMultiLineNumber(val) {
    if (val === null || val === undefined || val === '') return '0';
    return String(val)
        .split(/\r?\n/)
        .map(part => {
            const trimmed = part.trim();
            if (!trimmed) return '';
            const num = Number(trimmed);
            return Number.isFinite(num) ? num.toLocaleString('vi-VN') : trimmed;
        })
        .join('\n');
}
