import test from 'node:test'
import assert from 'node:assert/strict'
import { canRotateCertificates, getCertificatePose } from '../src/utils/certificateRing.js'

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} != ${expected}`)
}

test('each certificate can occupy the full-size foreground position', () => {
  for (const count of [1, 2, 9, 14]) {
    for (let index = 0; index < count; index += 1) {
      const pose = getCertificatePose(index, index, count)
      for (const key of ['x', 'depth', 'rise', 'rotation']) {
        assertClose(pose[key], 0, `${count} certificates, ${index}, ${key}`)
      }
      for (const key of ['scale', 'opacity', 'brightness']) {
        assertClose(pose[key], 1, `${count} certificates, ${index}, ${key}`)
      }
    }
  }
  assert.ok(Object.values(getCertificatePose(0, 0, 0)).every(Number.isFinite))
})

test('cards on either side have mirrored placement with matching depth and appearance', () => {
  for (let distance = 1; distance <= 4; distance += 1) {
    const right = getCertificatePose(distance, 0, 9)
    const left = getCertificatePose(9 - distance, 0, 9)
    assert.ok(right.x > 0 && left.x < 0)
    assertClose(left.x, -right.x, 'horizontal placement')
    assertClose(left.rotation, -right.rotation, 'side angle')
    for (const key of ['depth', 'rise', 'scale', 'opacity', 'brightness']) {
      assertClose(left[key], right[key], key)
    }
  }
})

test('rear layers recede and remain visible instead of turning their backs to the viewer', () => {
  let previous = getCertificatePose(0, 0, 9)
  for (let index = 1; index <= 4; index += 1) {
    const pose = getCertificatePose(index, 0, 9)
    assert.ok(pose.depth < previous.depth)
    assert.ok(pose.rise > previous.rise)
    assert.ok(pose.scale < previous.scale)
    assert.ok(pose.opacity < previous.opacity && pose.opacity >= 0.5)
    assert.ok(pose.brightness < previous.brightness && pose.brightness >= 0.8)
    assert.ok(Math.abs(pose.rotation) < 90)
    previous = pose
  }
})

test('a complete revolution and last-to-first seam keep every card on a continuous path', () => {
  for (const count of [2, 9, 14]) {
    for (let index = 0; index < count; index += 1) {
      const initial = getCertificatePose(index, 0.25, count)
      const revolution = getCertificatePose(index, count + 0.25, count)
      const beforeSeam = getCertificatePose(index, count - 0.00001, count)
      const afterSeam = getCertificatePose(index, count + 0.00001, count)
      for (const key of Object.keys(initial)) {
        assertClose(revolution[key], initial[key], `${count} cards, ${index}, ${key}`)
        assert.ok(
          Math.abs(afterSeam[key] - beforeSeam[key]) < 0.01,
          `${count} cards, ${index}: ${key} must not jump at the seam`,
        )
      }
    }
  }
})

test('geometry adapts to added certificates without duplicate or invalid ring positions', () => {
  for (const count of [2, 9, 10, 14]) {
    for (const position of [-count - 0.5, 0, 0.4, count * 3]) {
      const poses = Array.from({ length: count }, (_, index) =>
        getCertificatePose(index, position, count),
      )
      assert.equal(
        new Set(poses.map(({ x, depth }) => `${x.toFixed(8)}:${depth.toFixed(8)}`)).size,
        count,
      )
      for (const pose of poses) {
        assert.ok(Object.values(pose).every(Number.isFinite))
        assert.ok(Math.abs(pose.x) <= 1 && pose.depth >= -2 && pose.depth <= 0)
        assert.ok(pose.rise >= 0 && pose.rise <= 1)
        assert.ok(pose.scale >= 0.72 && pose.scale <= 1)
      }
    }
  }
})

test('autoplay runs only when visible, allowed, and safe for the current interaction', () => {
  const ready = {
    enabled: true,
    reduced: false,
    visible: true,
    pageVisible: true,
    hovered: false,
    focused: false,
    dragging: false,
    dialogOpen: false,
    count: 9,
  }
  assert.equal(canRotateCertificates(ready), true)
  for (const key of ['enabled', 'visible', 'pageVisible']) {
    assert.equal(canRotateCertificates({ ...ready, [key]: false }), false, key)
  }
  for (const key of ['reduced', 'hovered', 'focused', 'dragging', 'dialogOpen']) {
    assert.equal(canRotateCertificates({ ...ready, [key]: true }), false, key)
  }
  for (const count of [0, 1]) {
    assert.equal(canRotateCertificates({ ...ready, count }), false)
  }
  assert.equal(canRotateCertificates({ ...ready, count: 2 }), true)
})
