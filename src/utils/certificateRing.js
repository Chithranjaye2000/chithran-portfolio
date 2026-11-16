// Keep rear certificates facing the viewer as they follow the gallery's elliptical path.
export function getCertificatePose(index, position, count) {
  const angle = count > 1 ? (((index - position) % count) / count) * Math.PI * 2 : 0
  const front = (Math.cos(angle) + 1) / 2
  const sine = Math.sin(angle)
  return {
    x: sine,
    depth: Math.cos(angle) - 1,
    rise: 1 - front,
    rotation: -sine * 52,
    scale: 0.72 + front * 0.28,
    opacity: 0.5 + front * 0.5,
    brightness: 0.8 + front * 0.2,
  }
}

export function canRotateCertificates({
  enabled,
  reduced,
  visible,
  pageVisible,
  hovered,
  focused,
  dragging,
  dialogOpen,
  count,
}) {
  return (
    enabled &&
    !reduced &&
    visible &&
    pageVisible &&
    !hovered &&
    !focused &&
    !dragging &&
    !dialogOpen &&
    count > 1
  )
}
