// Progress represents startup milestones, not downloaded bytes. Lazy imagery is not a gate.
export function observeStartup({
  document: page = document,
  window: browser = window,
  onProgress,
  onReady,
  timeoutMs = 5000,
}) {
  const completed = new Set(['mounted'])
  const cleanups = []
  let stopped = false
  let timer

  function cleanup() {
    browser.clearTimeout(timer)
    cleanups.forEach((remove) => remove())
  }

  function finish() {
    if (stopped) return
    stopped = true
    cleanup()
    onProgress(100)
    onReady()
  }

  function complete(milestone) {
    if (stopped || completed.has(milestone)) return
    completed.add(milestone)
    if (completed.size === 4) finish()
    else onProgress(completed.size * 25)
  }

  function listen(target, type, callback) {
    target.addEventListener(type, callback, { once: true })
    cleanups.push(() => target.removeEventListener(type, callback))
  }

  timer = browser.setTimeout(finish, timeoutMs)
  onProgress(25)

  if (page.readyState === 'complete') complete('document')
  else listen(browser, 'load', () => complete('document'))

  try {
    Promise.resolve(page.fonts?.ready).then(
      () => complete('fonts'),
      () => complete('fonts'),
    )
  } catch {
    complete('fonts')
  }

  const portrait = page.querySelector('#home .portrait-image')
  function decodedPortrait() {
    try {
      Promise.resolve(portrait?.decode?.()).then(
        () => complete('portrait'),
        () => complete('portrait'),
      )
    } catch {
      complete('portrait')
    }
  }
  if (!portrait || portrait.complete) decodedPortrait()
  else {
    listen(portrait, 'load', decodedPortrait)
    listen(portrait, 'error', () => complete('portrait'))
  }

  return () => {
    stopped = true
    cleanup()
  }
}
