import { useLayoutEffect } from 'react'

export default function useAnchorNavigation(headerRef) {
  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return

    const root = document.documentElement
    const previousHeight = root.style.getPropertyValue('--header-height')
    const measureHeader = () => {
      root.style.setProperty(
        '--header-height',
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      )
    }
    measureHeader()

    const observer = 'ResizeObserver' in window ? new ResizeObserver(measureHeader) : undefined
    observer?.observe(header)
    if (!observer) window.addEventListener('resize', measureHeader, { passive: true })

    const initialHash = window.location.hash
    const restoringHistory = performance.getEntriesByType('navigation')[0]?.type === 'back_forward'
    let disposed = false
    let initialNavigationCancelled = false
    let frame = 0

    function alignInitialHash() {
      if (disposed || initialNavigationCancelled || window.location.hash !== initialHash) return
      let id
      try {
        id = decodeURIComponent(initialHash.slice(1))
      } catch {
        return
      }
      // Native links handle subsequent navigation, including history and reduced motion.
      // The initial fragment can be missed before React has created its target.
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' })
    }

    function scheduleInitialHash() {
      if (disposed || initialNavigationCancelled) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(alignInitialHash)
      })
    }

    function cancelInitialNavigation() {
      initialNavigationCancelled = true
      cancelAnimationFrame(frame)
    }

    const interactionEvents = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'hashchange']
    if (initialHash && !restoringHistory) {
      scheduleInitialHash()
      // Correct late image/font layout only until the visitor starts interacting.
      if (document.readyState !== 'complete') {
        window.addEventListener('load', scheduleInitialHash, { once: true })
      }
      document.fonts?.ready.then(scheduleInitialHash)
      interactionEvents.forEach((event) => {
        window.addEventListener(event, cancelInitialNavigation, { passive: true })
      })
    }

    return () => {
      disposed = true
      observer?.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureHeader)
      window.removeEventListener('load', scheduleInitialHash)
      interactionEvents.forEach((event) =>
        window.removeEventListener(event, cancelInitialNavigation),
      )
      if (previousHeight) root.style.setProperty('--header-height', previousHeight)
      else root.style.removeProperty('--header-height')
    }
  }, [headerRef])
}
