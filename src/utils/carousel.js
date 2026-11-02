export function wrapIndex(index, count) {
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(count) || count < 1) return 0
  return ((index % count) + count) % count
}

export function getCoverflowOffset(index, active, count) {
  if (
    !Number.isSafeInteger(index) ||
    !Number.isSafeInteger(active) ||
    !Number.isSafeInteger(count) ||
    count < 1
  ) {
    return 0
  }
  const distance = wrapIndex(wrapIndex(index, count) - wrapIndex(active, count), count)
  return distance > count / 2 ? distance - count : distance
}

export function getSwipeDirection(startX, startY, x, y, threshold = 40) {
  if (![startX, startY, x, y, threshold].every(Number.isFinite) || threshold <= 0) return 0
  const distance = x - startX
  if (Math.abs(distance) < threshold || Math.abs(distance) <= Math.abs(y - startY) * 1.2) {
    return 0
  }
  return distance < 0 ? 1 : -1
}
