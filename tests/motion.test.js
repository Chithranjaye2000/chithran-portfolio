import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clamp,
  getCounterValue,
  getScrollProgress,
  getTilt,
  getTimelineProgress,
} from '../src/utils/motion.js'

test('invalid or overscrolled input stays within the supported range', () => {
  assert.equal(clamp(Number.NaN), 0)
  assert.equal(clamp(-1), 0)
  assert.equal(clamp(2), 1)
})

test('tilt is neutral at the centre and bounded at the edges', () => {
  const centre = getTilt(0.5, 0.5)
  assert.equal(Math.abs(centre.x), 0)
  assert.equal(centre.y, 0)
  assert.deepEqual(getTilt(1, 0), { x: 5, y: 5, imageX: 5, imageY: -5 })
  assert.deepEqual(getTilt(4, -2, 100), { x: 6, y: 6, imageX: 5, imageY: -5 })
  assert.equal(Math.abs(getTilt(0, 1, 3).x), 3)
})

test('scroll progress handles page limits and a page shorter than the viewport', () => {
  assert.equal(getScrollProgress(0, 2000, 1000), 0)
  assert.equal(getScrollProgress(500, 2000, 1000), 0.5)
  assert.equal(getScrollProgress(5000, 2000, 1000), 1)
  assert.equal(getScrollProgress(-50, 2000, 1000), 0)
  assert.equal(getScrollProgress(0, 500, 1000), 0)
})

test('timeline progress moves from not reached to complete without overshooting', () => {
  assert.equal(getTimelineProgress(900, 600, 1000), 0)
  assert.equal(getTimelineProgress(480, 600, 1000), 0.5)
  assert.equal(getTimelineProgress(-100, 600, 1000), 1)
  assert.equal(getTimelineProgress(0, 0, 1000), 1)
})

test('collection counters stay integral, never overshoot, and end at the real value', () => {
  for (const target of [4, 7, 9, 12]) {
    const values = Array.from({ length: 101 }, (_, index) => getCounterValue(index / 100, target))
    assert.equal(values[0], 0)
    assert.equal(values.at(-1), target)
    assert.ok(
      values.every(
        (value, index) =>
          Number.isInteger(value) && value <= target && (!index || value >= values[index - 1]),
      ),
    )
    assert.equal(getCounterValue(2, target), target)
  }
})
