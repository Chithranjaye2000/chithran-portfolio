import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import {
  THEME_STORAGE_KEY,
  resolveTheme,
  applyTheme,
  getInitialTheme,
  saveTheme,
} from '../src/utils/theme.js'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

function createBrowser({ stored = null, readBlocked = false, writeBlocked = false } = {}) {
  const root = { dataset: {}, style: {} }
  const meta = {
    content: '#215be2',
    setAttribute(name, value) {
      this[name] = value
    },
  }
  const reads = []
  const writes = []
  const localStorage = {
    getItem(key) {
      reads.push(key)
      if (readBlocked) throw new Error('Storage access denied')
      return stored
    },
    setItem(key, value) {
      if (writeBlocked) throw new Error('Storage access denied')
      writes.push([key, value])
    },
  }
  const document = {
    documentElement: root,
    querySelector(selector) {
      return selector === 'meta[name="theme-color"]' || selector === "meta[name='theme-color']"
        ? meta
        : null
    },
  }
  const browser = { document, localStorage }
  browser.window = browser
  return { browser, root, meta, reads, writes }
}

function assertAppearance(environment, theme) {
  assert.equal(environment.root.dataset.theme, theme)
  assert.equal(environment.root.style.colorScheme, theme)
  assert.equal(environment.meta.content, theme === 'dark' ? '#0b1220' : '#215be2')
}

function runBootstrap(options) {
  const environment = createBrowser(options)
  const script = html.match(/<script\b[^>]*\bid=["']theme-init["'][^>]*>([\s\S]*?)<\/script>/i)
  assert.ok(script, 'A synchronous theme bootstrap must be present in the document head')
  assert.doesNotMatch(script[0], /\b(?:async|defer|type\s*=\s*["']module["'])/i)
  runInNewContext(script[1], environment.browser)
  return environment
}

function withBrowser(environment, callback) {
  const keys = ['document', 'window', 'localStorage']
  const descriptors = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  try {
    for (const key of keys) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value: environment.browser[key],
      })
    }
    return callback()
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
}

test('theme bootstrap runs in the head before the application module', () => {
  const bootstrapIndex = html.indexOf('id="theme-init"')
  const headEnd = html.indexOf('</head>')
  const moduleIndex = html.indexOf('type="module"')
  assert.ok(bootstrapIndex >= 0 && bootstrapIndex < headEnd)
  assert.ok(bootstrapIndex < moduleIndex)
})

test('first visit defaults to Light without reading a system preference', () => {
  const environment = runBootstrap()
  assertAppearance(environment, 'light')
  assert.deepEqual(environment.reads, ['portfolio-theme'])
  assert.deepEqual(environment.writes, [])
})

test('bootstrap restores saved Dark and Light appearance before React', () => {
  for (const theme of ['dark', 'light']) {
    const environment = runBootstrap({ stored: theme })
    assertAppearance(environment, theme)
    assert.deepEqual(environment.writes, [])
  }
})

test('bootstrap falls back to Light for empty, invalid, or blocked storage', () => {
  for (const stored of [null, '', 'system', 'Dark', 'invalid']) {
    assertAppearance(runBootstrap({ stored }), 'light')
  }
  assertAppearance(runBootstrap({ readBlocked: true }), 'light')
})

test('theme resolution only accepts the explicit Dark value', () => {
  assert.equal(THEME_STORAGE_KEY, 'portfolio-theme')
  assert.equal(resolveTheme('dark'), 'dark')
  for (const value of ['light', undefined, null, '', 'Dark', 'system', 1, {}, []]) {
    assert.equal(resolveTheme(value), 'light')
  }
})

test('applying themes updates the root, browser color scheme, and theme metadata together', () => {
  const environment = createBrowser()
  withBrowser(environment, () => {
    for (const theme of ['dark', 'light']) {
      applyTheme(theme)
      assertAppearance(environment, theme)
    }
  })
})

test('React initial state reads the bootstrapped root and defaults invalid values to Light', () => {
  const environment = createBrowser({ readBlocked: true })
  withBrowser(environment, () => {
    for (const [value, expected] of [
      ['dark', 'dark'],
      ['light', 'light'],
      ['invalid', 'light'],
      [undefined, 'light'],
    ]) {
      environment.root.dataset.theme = value
      assert.equal(getInitialTheme(), expected)
    }
    assert.deepEqual(environment.reads, [])
  })
})

test('saving a preference uses the shared key and tolerates blocked storage', () => {
  const environment = createBrowser()
  withBrowser(environment, () => {
    saveTheme('dark')
    saveTheme('light')
  })
  assert.deepEqual(environment.writes, [
    ['portfolio-theme', 'dark'],
    ['portfolio-theme', 'light'],
  ])
  withBrowser(createBrowser({ writeBlocked: true }), () => {
    assert.doesNotThrow(() => saveTheme('dark'))
  })
})
