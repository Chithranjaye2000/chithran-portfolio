export function rotateItems(items, steps) {
  if (!items.length) return []
  const offset = ((steps % items.length) + items.length) % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

export function getLoopShift(scrollLeft, stride, itemCount, viewportWidth) {
  if (
    !Number.isFinite(scrollLeft) ||
    !Number.isFinite(stride) ||
    stride <= 0 ||
    itemCount < 2 ||
    itemCount * stride - viewportWidth < stride
  ) {
    return 0
  }
  return Math.max(0, Math.floor(scrollLeft / stride))
}

export function getDragDistance(startX, startY, x, y) {
  const distance = x - startX
  return Math.abs(distance) >= 6 && Math.abs(distance) > Math.abs(y - startY) ? distance : 0
}
