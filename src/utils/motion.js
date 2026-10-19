export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

export function getTilt(x, y, strength = 5) {
  const horizontal = clamp(x) * 2 - 1
  const vertical = clamp(y) * 2 - 1
  const limit = clamp(strength, 0, 6)
  return {
    x: -vertical * limit,
    y: horizontal * limit,
    imageX: horizontal * 5,
    imageY: vertical * 5,
  }
}

export function getScrollProgress(scrollY, documentHeight, viewportHeight) {
  const distance = documentHeight - viewportHeight
  return distance > 0 ? clamp(scrollY / distance) : 0
}

export function getTimelineProgress(top, height, viewportHeight) {
  return height > 0 ? clamp((viewportHeight * 0.78 - top) / height) : 1
}

export function getCounterValue(progress, target) {
  return Math.round(Math.max(0, target) * (1 - (1 - clamp(progress)) ** 3))
}
