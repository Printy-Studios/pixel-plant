export function rangeOverlap(x1: number, x2: number, y1: number, y2: number) {
    return Math.max(0, Math.min (x2, y2) - Math.max (x1, y1) + 1);
}