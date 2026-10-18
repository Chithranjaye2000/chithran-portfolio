import { useLayoutEffect } from 'react'

const easing = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function usePortfolioMotion(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !Element.prototype.animate) return

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const animations = new Map()
    const revealed = new WeakSet()
    let observer
    let mutations

    function cancel(element) {
      animations.get(element)?.cancel()
      animations.delete(element)
    }

    function enter(element, delay = 0, hero = false) {
      if (preference.matches || !element.isConnected) return
      // Focused content must remain immediately visible to keyboard users.
      if (element.contains(document.activeElement)) return
      cancel(element)
      const animation = element.animate(
        [
          { opacity: 0, transform: `translate3d(0, ${hero ? 22 : 16}px, 0)` },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: hero ? 620 : 520, delay, easing, fill: 'backwards' },
      )
      animations.set(element, animation)
      const release = () => {
        if (animations.get(element) === animation) animations.delete(element)
      }
      animation.finished.then(release, release)
    }

    function targetsWithin(node) {
      if (!(node instanceof Element)) return []
      return [
        ...(node.matches('[data-reveal]') ? [node] : []),
        ...node.querySelectorAll('[data-reveal]'),
      ]
    }

    function watch(node) {
      targetsWithin(node).forEach((element) => {
        if (!revealed.has(element)) observer.observe(element)
      })
    }

    function start(hero = false) {
      if (preference.matches) return
      if (hero) {
        root.querySelectorAll('[data-hero-step]').forEach((element) => {
          enter(element, Number(element.dataset.heroStep) * 60, true)
        })
      }
      if (!('IntersectionObserver' in window)) return

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (!entry.isIntersecting) return
            revealed.add(entry.target)
            observer.unobserve(entry.target)
            enter(entry.target, Math.min(index * 45, 135))
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
      )
      watch(root)

      // Project filters mount new cards; removed cards must not remain observed.
      mutations = new MutationObserver((records) => {
        records.forEach((record) => {
          record.removedNodes.forEach((node) => {
            targetsWithin(node).forEach((element) => {
              observer.unobserve(element)
              cancel(element)
            })
          })
          record.addedNodes.forEach(watch)
        })
      })
      mutations.observe(root, { childList: true, subtree: true })
    }

    function stop() {
      observer?.disconnect()
      mutations?.disconnect()
      animations.forEach((animation) => animation.cancel())
      animations.clear()
    }

    function updatePreference() {
      stop()
      start()
    }

    function revealFocus(event) {
      animations.forEach((animation, element) => {
        if (element.contains(event.target)) cancel(element)
      })
    }

    start(true)
    preference.addEventListener('change', updatePreference)
    root.addEventListener('focusin', revealFocus)
    return () => {
      stop()
      preference.removeEventListener('change', updatePreference)
      root.removeEventListener('focusin', revealFocus)
    }
  }, [rootRef])
}
