import test from 'node:test'
import assert from 'node:assert/strict'
import { getCoverflowOffset, getSwipeDirection, wrapIndex } from '../src/utils/carousel.js'

test('coverflow index navigation wraps in either direction without changing the collection', () => {
  const items = Object.freeze(['first', 'second', 'third', 'fourth'])
  assert.equal(items[wrapIndex(4, items.length)], 'first')
  assert.equal(items[wrapIndex(-1, items.length)], 'fourth')
  assert.equal(wrapIndex(9, items.length), 1)
  assert.equal(wrapIndex(-10, items.length), 2)
  assert.deepEqual(items, ['first', 'second', 'third', 'fourth'])
})

test('empty, single-item, and invalid navigation values resolve safely', () => {
  for (const index of [0, -1, 1, 10]) {
    assert.equal(wrapIndex(index, 0), 0)
    assert.equal(wrapIndex(index, 1), 0)
  }
  for (const index of [NaN, Infinity, -Infinity, 0.5, undefined, '1']) {
    assert.equal(wrapIndex(index, 9), 0)
  }
  for (const count of [NaN, Infinity, -2, 0.5, undefined, '9']) {
    assert.equal(wrapIndex(3, count), 0)
  }
})

test('all nine coverflow cards receive shortest signed offsets around the center', () => {
  assert.deepEqual(
    Array.from({ length: 9 }, (_, index) => getCoverflowOffset(index, 0, 9)),
    [0, 1, 2, 3, 4, -4, -3, -2, -1],
  )
  for (let active = 0; active < 9; active += 1) {
    assert.equal(getCoverflowOffset(active, active, 9), 0)
    assert.equal(getCoverflowOffset(active + 1, active, 9), 1)
    assert.equal(getCoverflowOffset(active - 1, active, 9), -1)
    const positions = Array.from({ length: 9 }, (_, index) => getCoverflowOffset(index, active, 9))
    assert.equal(new Set(positions).size, 9)
    assert.ok(positions.every((position) => Math.abs(position) <= 4))
  }
})

test('filtered one- and two-card sets keep deterministic coverflow positions', () => {
  assert.equal(getCoverflowOffset(0, 0, 1), 0)
  assert.equal(getCoverflowOffset(1, 0, 2), 1)
  assert.equal(getCoverflowOffset(0, 1, 2), 1)
  assert.deepEqual(
    Array.from({ length: 4 }, (_, index) => getCoverflowOffset(index, 0, 4)),
    [0, 1, 2, -1],
  )
})

test('coverflow offset calculations normalize wrapped indices and reject invalid input', () => {
  assert.equal(getCoverflowOffset(9, 8, 9), 1)
  assert.equal(getCoverflowOffset(-1, 0, 9), -1)
  assert.equal(getCoverflowOffset(8, 18, 9), -1)
  for (const values of [
    [0, 0, 0],
    [0, 0, -1],
    [NaN, 0, 9],
    [0, Infinity, 9],
    [0, 0, 1.5],
    ['1', 0, 9],
  ]) {
    assert.equal(getCoverflowOffset(...values), 0)
  }
})

test('left and right swipes choose one neighboring card at the threshold', () => {
  assert.equal(getSwipeDirection(100, 100, 60, 100), 1)
  assert.equal(getSwipeDirection(100, 100, 140, 100), -1)
  assert.equal(getSwipeDirection(100, 100, 20, 130), 1)
  assert.equal(getSwipeDirection(100, 100, 180, 70), -1)
  assert.equal(getSwipeDirection(100, 100, 50, 100, 50), 1)
})

test('short, vertical, and diagonal gestures leave page scrolling and card selection alone', () => {
  for (const [x, y] of [
    [100, 100],
    [60.01, 100],
    [139.99, 100],
    [100, 20],
    [140, 140],
    [148, 140],
    [52, 60],
    [160, 160],
  ]) {
    assert.equal(getSwipeDirection(100, 100, x, y), 0)
  }
})

test('invalid gesture coordinates and thresholds cannot trigger navigation', () => {
  for (const invalid of [NaN, Infinity, undefined, '100']) {
    assert.equal(getSwipeDirection(invalid, 100, 0, 100), 0)
    assert.equal(getSwipeDirection(100, invalid, 0, 100), 0)
    assert.equal(getSwipeDirection(100, 100, invalid, 100), 0)
    assert.equal(getSwipeDirection(100, 100, 0, invalid), 0)
    if (invalid !== undefined) assert.equal(getSwipeDirection(100, 100, 0, 100, invalid), 0)
  }
  assert.equal(getSwipeDirection(100, 100, 0, 100, undefined), 1)
  assert.equal(getSwipeDirection(100, 100, 0, 100, 0), 0)
  assert.equal(getSwipeDirection(100, 100, 0, 100, -1), 0)
})
