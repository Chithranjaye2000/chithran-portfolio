import test from 'node:test'
import assert from 'node:assert/strict'
import { observeStartup } from '../src/utils/startup.js'

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
