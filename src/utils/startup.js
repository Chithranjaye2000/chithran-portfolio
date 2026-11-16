// Progress represents startup milestones, not downloaded bytes. Lazy imagery is not a gate.
export function observeStartup({
  document: page = document,
  window: browser = window,
  onProgress,
  onReady,
  onStatus = () => {},
  timeoutMs = 5000,
}) {
  const completed = new Set(['mounted'])
  const cleanups = []
  let stopped = false
  let timer
  let degraded = false

  function cleanup() {
    browser.clearTimeout(timer)
    cleanups.forEach((remove) => remove())
  }

  function finish(timedOut = false) {
    if (stopped) return
    stopped = true
    cleanup()
    onStatus(timedOut || degraded ? 'Opening with available assets' : 'Ready to explore')
    onProgress(100)
    onReady({ timedOut, degraded })
  }

  function status() {
    if (!completed.has('document')) onStatus('Preparing the page')
    else if (!completed.has('fonts')) onStatus('Loading typography')
    else if (!completed.has('portrait')) onStatus('Preparing your portrait')
  }

  function complete(milestone, failed = false) {
    if (stopped || completed.has(milestone)) return
    degraded ||= failed
    completed.add(milestone)
    if (completed.size === 4) finish()
    else {
      onProgress(completed.size * 25)
      status()
    }
  }

  function listen(target, type, callback) {
    target.addEventListener(type, callback, { once: true })
    cleanups.push(() => target.removeEventListener(type, callback))
  }

  timer = browser.setTimeout(() => finish(true), timeoutMs)
  onProgress(25)
  status()

  if (page.readyState === 'complete') complete('document')
  else listen(browser, 'load', () => complete('document'))

  try {
    Promise.resolve(page.fonts?.ready).then(
      () => complete('fonts'),
      () => complete('fonts', true),
    )
  } catch {
    complete('fonts', true)
  }

  const portrait = page.querySelector('#home .portrait-image')
  function decodedPortrait() {
    try {
      Promise.resolve(portrait?.decode?.()).then(
        () => complete('portrait'),
        () => complete('portrait', true),
      )
    } catch {
      complete('portrait', true)
    }
  }
  if (!portrait || portrait.complete) decodedPortrait()
  else {
    listen(portrait, 'load', decodedPortrait)
    listen(portrait, 'error', () => complete('portrait', true))
  }

  return () => {
    stopped = true
    cleanup()
  }
}

// Interpolate only toward settled readiness milestones; never invent new progress.
// DOM updates are isolated from React renders. The timer handles suspended animation frames.
export function createStartupProgress({
  window: browser = window,
  onUpdate,
  onComplete,
  durationMs = 320,
}) {
  let value = 0
  let target = 0
  let frame = 0
  let timer
  let stopped = false

  function clear() {
    browser.cancelAnimationFrame(frame)
    browser.clearTimeout(timer)
    frame = 0
  }

  function render(next) {
    if (stopped) return
    value = next
    onUpdate(value)
    if (value === 100) {
      stopped = true
      clear()
      onComplete()
    }
  }

  return {
    update(next, immediate = false) {
      if (stopped || !Number.isFinite(next)) return
      const bounded = Math.min(100, Math.max(target, next))
      if (bounded === target && !immediate) return
      clear()
      target = bounded
      if (immediate || durationMs <= 0) {
        render(target)
        return
      }
      const from = value
      const start = browser.performance.now()
      function tick(now) {
        const elapsed = Math.min(1, Math.max(0, (now - start) / durationMs))
        render(elapsed === 1 ? target : from + (target - from) * (1 - (1 - elapsed) ** 3))
        if (elapsed < 1 && !stopped) frame = browser.requestAnimationFrame(tick)
        else browser.clearTimeout(timer)
      }
      frame = browser.requestAnimationFrame(tick)
      timer = browser.setTimeout(() => {
        browser.cancelAnimationFrame(frame)
        render(target)
      }, durationMs + 80)
    },
    cancel() {
      stopped = true
      clear()
    },
  }
}
