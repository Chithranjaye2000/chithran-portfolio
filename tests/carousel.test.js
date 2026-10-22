import test from 'node:test'
import assert from 'node:assert/strict'
import { getDragDistance, getLoopShift, rotateItems } from '../src/utils/carousel.js'

test('rotation preserves every item and rotates in either direction without mutating input', () => {
  const items = Object.freeze([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }])

  assert.deepEqual(rotateItems(items, 1), [items[1], items[2], items[3], items[0]])
  assert.deepEqual(rotateItems(items, -1), [items[3], items[0], items[1], items[2]])
  assert.deepEqual(rotateItems(items, 6), [items[2], items[3], items[0], items[1]])
  assert.deepEqual(rotateItems(items, -6), [items[2], items[3], items[0], items[1]])
  assert.deepEqual(
    items.map((item) => item.id),
    ['a', 'b', 'c', 'd'],
  )
})

test('empty, single-item, and whole-cycle rotations always return a fresh array', () => {
  for (const items of [[], ['only'], ['a', 'b', 'c']]) {
    for (const steps of [0, items.length, -items.length, items.length * 3]) {
      const rotated = rotateItems(items, steps)
      assert.deepEqual(rotated, items)
      assert.notEqual(rotated, items)
    }
  }
})

test('loop recycling waits until a complete slide stride has left the viewport', () => {
  const stride = 320
  const count = 7
  const viewport = 900

  assert.equal(getLoopShift(-20, stride, count, viewport), 0)
  assert.equal(getLoopShift(0, stride, count, viewport), 0)
  assert.equal(getLoopShift(319.99, stride, count, viewport), 0)
  assert.equal(getLoopShift(320, stride, count, viewport), 1)
  assert.equal(getLoopShift(639.99, stride, count, viewport), 1)
  assert.equal(getLoopShift(640, stride, count, viewport), 2)
  assert.equal(getLoopShift(1000, stride, count, viewport), 3)
})

test('loop recycling requires enough overflow to replace one complete slide', () => {
  assert.equal(getLoopShift(320, 320, 2, 640), 0)
  assert.equal(getLoopShift(320, 320, 2, 321), 0)
  assert.equal(getLoopShift(320, 320, 2, 320), 1)
  assert.equal(getLoopShift(320, 320, 7, 1920.01), 0)
  assert.equal(getLoopShift(320, 320, 7, 1920), 1)
  assert.equal(getLoopShift(320, 320, 1, 100), 0)
  assert.equal(getLoopShift(320, 320, 0, 100), 0)
  assert.equal(getLoopShift(320, 0, 7, 900), 0)
})

test('drag detection ignores small movement and leaves vertical gestures untouched', () => {
  assert.equal(getDragDistance(50, 100, 50, 100), 0)
  assert.equal(getDragDistance(50, 100, 55.99, 100), 0)
  assert.equal(getDragDistance(50, 100, 44.01, 100), 0)
  assert.equal(getDragDistance(50, 100, 56, 106), 0)
  assert.equal(getDragDistance(50, 100, 44, 94), 0)
  assert.equal(getDragDistance(50, 100, 70, 121), 0)
  assert.equal(getDragDistance(50, 100, 30, 79), 0)
})

test('horizontal drag detection includes the six-pixel threshold and preserves direction', () => {
  assert.equal(getDragDistance(50, 100, 56, 100), 6)
  assert.equal(getDragDistance(50, 100, 44, 100), -6)
  assert.equal(getDragDistance(50, 100, 70, 119), 20)
  assert.equal(getDragDistance(50, 100, 30, 81), -20)
})
