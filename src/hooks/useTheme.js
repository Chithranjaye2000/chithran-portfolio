import { useEffect, useRef, useState } from 'react'
import {
  applyTheme,
  getInitialTheme,
  resolveTheme,
  saveTheme,
  THEME_STORAGE_KEY,
} from '../utils/theme'

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  const themeRef = useRef(theme)
  const transitionRef = useRef(null)

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
      const next = resolveTheme(event.newValue)
      themeRef.current = next
      transitionRef.current?.skipTransition()
      applyTheme(next)
      setTheme(next)
    }
    window.addEventListener('storage', syncTheme)
    return () => {
      window.removeEventListener('storage', syncTheme)
      transitionRef.current?.skipTransition()
    }
  }, [])

  function toggleTheme() {
    const next = themeRef.current === 'dark' ? 'light' : 'dark'
    themeRef.current = next
    const update = () => {
      if (themeRef.current !== next) return
      applyTheme(next)
      setTheme(next)
      saveTheme(next)
    }
    transitionRef.current?.skipTransition()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !document.startViewTransition) {
      update()
      return
    }
    // A short native crossfade leaves the existing entrance and hover transitions intact.
    try {
      const transition = document.startViewTransition(update)
      transitionRef.current = transition
      transition.ready.catch(() => {})
      const release = () => {
        if (transitionRef.current === transition) transitionRef.current = null
      }
      transition.finished.then(release, release)
    } catch {
      update()
    }
  }

  return { theme, toggleTheme }
}
