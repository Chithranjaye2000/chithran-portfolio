import test from 'node:test'
import assert from 'node:assert/strict'
import { createStartupProgress, observeStartup } from '../src/utils/startup.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

class TrackedTarget extends EventTarget {
  listeners = new Map()

  addEventListener(type, callback, options) {
    const callbacks = this.listeners.get(type) ?? new Map()
    const wrapped = (event) => {
      if (options?.once) callbacks.delete(callback)
      callback(event)
    }
    callbacks.set(callback, wrapped)
    this.listeners.set(type, callbacks)
    super.addEventListener(type, wrapped, options)
  }

  removeEventListener(type, callback) {
    const callbacks = this.listeners.get(type)
    const wrapped = callbacks?.get(callback)
    callbacks?.delete(callback)
    if (wrapped) super.removeEventListener(type, wrapped)
  }

  emit(type) {
    this.dispatchEvent(new Event(type))
  }

  get listenerCount() {
    return [...this.listeners.values()].reduce((sum, callbacks) => sum + callbacks.size, 0)
  }
}

function environment({ readyState = 'loading', complete = false } = {}) {
  const fonts = deferred()
  const decode = deferred()
  const browser = new TrackedTarget()
  const portrait = new TrackedTarget()
  const pendingTimers = new Map()
  const selectors = []
  let timerId = 0
  let decodeCalls = 0
  let now = 0
  let maxTimers = 0

  browser.setTimeout = (callback, delay) => {
    const id = ++timerId
    pendingTimers.set(id, { callback, at: now + delay })
    maxTimers = Math.max(maxTimers, pendingTimers.size)
    return id
  }
  browser.clearTimeout = (id) => pendingTimers.delete(id)
  portrait.complete = complete
  portrait.decode = () => {
    decodeCalls += 1
    return decode.promise
  }
  const page = {
    readyState,
    fonts: { ready: fonts.promise },
    querySelector(selector) {
      selectors.push(selector)
      assert.equal(selector, '#home .portrait-image')
      return portrait
    },
    get images() {
      throw new Error('Startup must not wait for lazy project, certificate, or video images.')
    },
  }

  return {
    browser,
    portrait,
    page,
    fonts,
    decode,
    selectors,
    get decodeCalls() {
      return decodeCalls
    },
    get timerCount() {
      return pendingTimers.size
    },
    get maxTimers() {
      return maxTimers
    },
    advance(milliseconds) {
      now += milliseconds
      for (const [id, timer] of pendingTimers) {
        if (timer.at <= now) {
          pendingTimers.delete(id)
          timer.callback()
        }
      }
    },
  }
}

function observe(env, options = {}) {
  const progress = []
  let ready = 0
  const cancel = observeStartup({
    document: env.page,
    window: env.browser,
    onProgress: (value) => progress.push(value),
    onReady: () => (ready += 1),
    ...options,
  })
  return {
    progress,
    cancel,
    get ready() {
      return ready
    },
  }
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

function assertClean(env) {
  assert.equal(env.timerCount, 0)
  assert.equal(env.browser.listenerCount, 0)
  assert.equal(env.portrait.listenerCount, 0)
}

test('cached startup completes without advancing a clock or imposing a minimum display time', async () => {
  const env = environment({ readyState: 'complete', complete: true })
  env.fonts.resolve()
  env.decode.resolve()
  const state = observe(env)
  await flush()

  assert.deepEqual(state.progress, [25, 50, 75, 100])
  assert.equal(state.ready, 1)
  assert.equal(env.decodeCalls, 1)
  assert.deepEqual(env.selectors, ['#home .portrait-image'])
  assertClean(env)
})

test('each real readiness milestone advances progress, including portrait decoding', async () => {
  const env = environment()
  const state = observe(env)
  assert.deepEqual(state.progress, [25])
  env.browser.emit('load')
  assert.deepEqual(state.progress, [25, 50])
  env.fonts.resolve()
  await flush()
  assert.deepEqual(state.progress, [25, 50, 75])
  env.portrait.emit('load')
  await flush()
  assert.equal(env.decodeCalls, 1)
  assert.equal(state.ready, 0)
  assert.deepEqual(state.progress, [25, 50, 75])
  env.decode.resolve()
  await flush()
  assert.deepEqual(state.progress, [25, 50, 75, 100])
  assert.equal(state.ready, 1)
  assertClean(env)
})

test('failed fonts and a broken portrait settle safely rather than trapping the visitor', async () => {
  const env = environment({ readyState: 'complete' })
  const state = observe(env)
  env.fonts.reject(new Error('Synthetic font failure'))
  env.portrait.emit('error')
  await flush()

  assert.equal(state.ready, 1)
  assert.equal(state.progress.at(-1), 100)
  assert.equal(env.decodeCalls, 0)
  assertClean(env)
})

test('missing optional font/image APIs and synchronously throwing decoders do not block startup', async () => {
  for (const absentPortrait of [true, false]) {
    const env = environment({ readyState: 'complete', complete: true })
    Object.defineProperty(env.page, 'fonts', {
      get() {
        throw new Error('Font readiness API is unavailable')
      },
    })
    env.portrait.decode = () => {
      throw new Error('Synthetic decode failure')
    }
    if (absentPortrait) env.page.querySelector = () => null
    const state = observe(env)
    await flush()
    assert.equal(state.ready, 1)
    assert.equal(state.progress.at(-1), 100)
    assertClean(env)
  }
})

test('the maximum wait fails open and removes pending listeners without waiting for lazy imagery', async () => {
  const env = environment()
  const state = observe(env, { timeoutMs: 1200 })
  env.advance(1199)
  assert.equal(state.ready, 0)
  assert.deepEqual(state.progress, [25])
  env.advance(1)
  assert.equal(state.ready, 1)
  assert.deepEqual(state.progress, [25, 100])
  assertClean(env)

  env.browser.emit('load')
  env.portrait.emit('error')
  env.fonts.resolve()
  env.decode.resolve()
  await flush()
  env.advance(10_000)
  assert.equal(state.ready, 1)
  assert.deepEqual(state.progress, [25, 100])
})

test('cancelling on unmount suppresses late events, promises, and timeout updates', async () => {
  const env = environment({ readyState: 'complete', complete: true })
  const state = observe(env)
  state.cancel()
  state.cancel()
  const before = [...state.progress]
  assertClean(env)
  env.fonts.resolve()
  env.decode.reject(new Error('Late cancelled decode failure'))
  env.browser.emit('load')
  await flush()
  env.advance(10_000)
  assert.equal(state.ready, 0)
  assert.deepEqual(state.progress, before)
})

test('StrictMode-style setup, cleanup, and setup retain only one observer lifecycle', async () => {
  const env = environment()
  const cancelled = observe(env)
  cancelled.cancel()
  const current = observe(env)
  assert.equal(env.timerCount, 1)
  assert.equal(env.maxTimers, 1)
  env.browser.emit('load')
  env.portrait.emit('load')
  env.fonts.resolve()
  env.decode.resolve()
  await flush()
  assert.equal(cancelled.ready, 0)
  assert.deepEqual(cancelled.progress, [25])
  assert.equal(current.ready, 1)
  assert.deepEqual(current.progress, [25, 50, 75, 100])
  assertClean(env)
})

test('duplicate and out-of-order asset events cannot regress progress or finish twice', async () => {
  const env = environment()
  const state = observe(env)
  env.portrait.emit('load')
  env.portrait.emit('load')
  env.portrait.emit('error')
  env.browser.emit('load')
  env.browser.emit('load')
  env.fonts.resolve()
  await flush()
  env.decode.resolve()
  await flush()
  assert.equal(env.decodeCalls, 1)
  assert.equal(state.ready, 1)
  assert.deepEqual(state.progress, [25, 50, 75, 100])
  assertClean(env)
})

test('startup status names the pending milestone and reports healthy readiness without asset details', async () => {
  const env = environment()
  const statuses = []
  const readiness = []
  const state = observe(env, {
    onStatus: (status) => statuses.push(status),
    onReady: (result) => readiness.push(result),
  })
  assert.deepEqual(statuses, ['Preparing the page'])
  env.browser.emit('load')
  assert.equal(statuses.at(-1), 'Loading typography')
  env.fonts.resolve()
  await flush()
  assert.equal(statuses.at(-1), 'Preparing your portrait')
  env.portrait.emit('load')
  env.decode.resolve()
  await flush()

  assert.equal(statuses.at(-1), 'Ready to explore')
  assert.deepEqual(readiness, [{ timedOut: false, degraded: false }])
  assert.equal(state.progress.at(-1), 100)
  assertClean(env)
})

test('failed asset status is generic and readiness records degraded completion', async () => {
  const env = environment({ readyState: 'complete', complete: true })
  const statuses = []
  const readiness = []
  const state = observe(env, {
    onStatus: (status) => statuses.push(status),
    onReady: (result) => readiness.push(result),
  })
  env.fonts.reject(new Error('Private asset source must never appear in status'))
  env.decode.reject(new Error('Private decoding details must never appear in status'))
  await flush()

  assert.equal(statuses.at(-1), 'Opening with available assets')
  assert.ok(statuses.every((status) => !status.includes('Private')))
  assert.deepEqual(readiness, [{ timedOut: false, degraded: true }])
  assert.equal(state.progress.at(-1), 100)
  assertClean(env)
})

test('timeout readiness distinguishes unresolved assets from known failures and ignores late status changes', async () => {
  for (const failed of [false, true]) {
    const env = environment()
    const statuses = []
    const readiness = []
    const state = observe(env, {
      timeoutMs: 100,
      onStatus: (status) => statuses.push(status),
      onReady: (result) => readiness.push(result),
    })
    if (failed) env.portrait.emit('error')
    env.advance(100)
    const settledStatuses = [...statuses]
    assert.equal(statuses.at(-1), 'Opening with available assets')
    assert.deepEqual(readiness, [{ timedOut: true, degraded: failed }])
    assert.equal(state.progress.at(-1), 100)
    assertClean(env)

    env.fonts.reject(new Error('Late font failure'))
    env.browser.emit('load')
    env.portrait.emit('load')
    await flush()
    assert.deepEqual(statuses, settledStatuses)
    assert.equal(readiness.length, 1)
  }
})

function animationClock() {
  const frames = new Map()
  const timers = new Map()
  let now = 0
  let id = 0
  let maxFrames = 0
  let maxTimers = 0
  const browser = {
    performance: { now: () => now },
    requestAnimationFrame(callback) {
      const next = ++id
      frames.set(next, callback)
      maxFrames = Math.max(maxFrames, frames.size)
      return next
    },
    cancelAnimationFrame(frame) {
      frames.delete(frame)
    },
    setTimeout(callback, delay) {
      const next = ++id
      timers.set(next, { callback, at: now + delay })
      maxTimers = Math.max(maxTimers, timers.size)
      return next
    },
    clearTimeout(timer) {
      timers.delete(timer)
    },
  }
  return {
    browser,
    get frameCount() {
      return frames.size
    },
    get timerCount() {
      return timers.size
    },
    get maxFrames() {
      return maxFrames
    },
    get maxTimers() {
      return maxTimers
    },
    advance(milliseconds, runFrame = true) {
      now += milliseconds
      for (const [timer, entry] of timers) {
        if (entry.at <= now) {
          timers.delete(timer)
          entry.callback()
        }
      }
      if (runFrame) {
        const callbacks = [...frames.values()]
        frames.clear()
        callbacks.forEach((callback) => callback(now))
      }
    },
  }
}

function animatedProgress(clock, options = {}) {
  const updates = []
  let completed = 0
  const controller = createStartupProgress({
    window: clock.browser,
    onUpdate: (value) => updates.push(value),
    onComplete: () => (completed += 1),
    ...options,
  })
  return {
    ...controller,
    updates,
    get completed() {
      return completed
    },
  }
}

function assertAnimationClean(clock) {
  assert.equal(clock.frameCount, 0)
  assert.equal(clock.timerCount, 0)
}

test('display progress interpolates monotonically toward a real milestone and remains there', () => {
  const clock = animationClock()
  const state = animatedProgress(clock)
  state.update(25)
  assert.deepEqual(state.updates, [])
  for (let step = 0; step < 4; step += 1) clock.advance(80)

  assert.ok(state.updates[0] > 0 && state.updates[0] < 25)
  assert.equal(state.updates.at(-1), 25)
  assert.ok(state.updates.every((value, index, values) => value >= (values[index - 1] ?? 0)))
  assert.ok(state.updates.every((value) => value <= 25))
  assert.equal(state.completed, 0)
  assertAnimationClean(clock)

  const before = [...state.updates]
  clock.advance(10_000)
  state.update(25)
  state.update(10)
  state.update(Number.NaN)
  state.update(Infinity)
  assert.deepEqual(state.updates, before)
  assertAnimationClean(clock)
})

test('rapid readiness updates keep one frame and timeout, stay bounded, and complete exactly once', () => {
  const clock = animationClock()
  const state = animatedProgress(clock)
  state.update(25)
  state.update(50)
  state.update(75)
  assert.equal(clock.frameCount, 1)
  assert.equal(clock.timerCount, 1)
  clock.advance(80)
  const previous = state.updates.at(-1)
  state.update(100)
  assert.equal(clock.frameCount, 1)
  assert.equal(clock.timerCount, 1)
  clock.advance(80)
  assert.ok(state.updates.at(-1) > previous && state.updates.at(-1) < 100)
  clock.advance(240)

  assert.equal(state.updates.at(-1), 100)
  assert.ok(state.updates.every((value, index, values) => value >= (values[index - 1] ?? 0)))
  assert.ok(state.updates.every((value) => value >= 0 && value <= 100))
  assert.equal(state.completed, 1)
  assert.equal(clock.maxFrames, 1)
  assert.equal(clock.maxTimers, 1)
  assertAnimationClean(clock)
  const before = [...state.updates]
  state.update(100)
  state.update(50, true)
  clock.advance(10_000)
  assert.equal(state.completed, 1)
  assert.deepEqual(state.updates, before)
})

test('reduced-motion updates settle immediately and cancel outstanding animation work', () => {
  const clock = animationClock()
  const state = animatedProgress(clock)
  state.update(25, true)
  assert.deepEqual(state.updates, [25])
  assertAnimationClean(clock)
  state.update(75)
  clock.advance(80)
  state.update(75, true)
  assert.equal(state.updates.at(-1), 75)
  assert.equal(state.completed, 0)
  assertAnimationClean(clock)
  state.update(100, true)
  assert.equal(state.updates.at(-1), 100)
  assert.equal(state.completed, 1)
  assertAnimationClean(clock)
})

test('zero-duration progress settles without scheduling animation frames or fallback timers', () => {
  const clock = animationClock()
  const state = animatedProgress(clock, { durationMs: 0 })
  state.update(25)
  assert.deepEqual(state.updates, [25])
  assert.equal(state.completed, 0)
  state.update(120)
  assert.deepEqual(state.updates, [25, 100])
  assert.equal(state.completed, 1)
  assertAnimationClean(clock)
})

test('cancellation removes progress resources and ignores later milestones', () => {
  const clock = animationClock()
  const state = animatedProgress(clock)
  state.update(100)
  clock.advance(80)
  state.cancel()
  state.cancel()
  const before = [...state.updates]
  assertAnimationClean(clock)
  clock.advance(10_000)
  state.update(100, true)
  assert.deepEqual(state.updates, before)
  assert.equal(state.completed, 0)
  assertAnimationClean(clock)
})

test('suspended frames settle through the fallback without inventing readiness or completing early', () => {
  for (const target of [25, 100]) {
    const clock = animationClock()
    const state = animatedProgress(clock)
    state.update(target)
    clock.advance(399, false)
    assert.deepEqual(state.updates, [])
    assert.equal(state.completed, 0)
    clock.advance(1, false)
    assert.deepEqual(state.updates, [target])
    assert.equal(state.completed, target === 100 ? 1 : 0)
    assertAnimationClean(clock)
    clock.advance(10_000)
    assert.deepEqual(state.updates, [target])
    if (target === 25) {
      state.update(50)
      clock.advance(400, false)
      assert.deepEqual(state.updates, [25, 50])
      assert.equal(state.completed, 0)
      assertAnimationClean(clock)
    }
  }
})
