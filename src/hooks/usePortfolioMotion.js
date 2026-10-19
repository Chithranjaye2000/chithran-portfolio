import { useLayoutEffect } from 'react'
import { getCounterValue, getScrollProgress, getTilt, getTimelineProgress } from '../utils/motion'

const easing = 'cubic-bezier(0.22, 1, 0.36, 1)'
const tiltProperties = ['--tilt-x', '--tilt-y', '--image-x', '--image-y', '--spot-x', '--spot-y']

export default function usePortfolioMotion(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const scope = root.parentElement
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const individualTransforms = CSS.supports('translate', '0 1px')
    const animations = new Map()
    const counters = new Map()
    const revealed = new WeakSet()
    const counted = new WeakSet()
    const visibleTracks = new Set()
    const hero = root.querySelector('.hero')
    const header = scope.querySelector('.site-header')
    const progressBar = scope.querySelector('[data-scroll-progress]')
    let frame = 0
    let scrollDirty = true
    let pointerSample
    let activeCard
    let observer
    let trackObserver
    let mutations
    let resizeObserver

    function cancel(element) {
      animations.get(element)?.cancel()
      animations.delete(element)
    }

    function resetTilt() {
      if (activeCard) {
        tiltProperties.forEach((name) => activeCard.style.removeProperty(name))
        delete activeCard.dataset.tiltActive
        activeCard = undefined
      }
      pointerSample = undefined
      hero?.style.removeProperty('--ambient-x')
      hero?.style.removeProperty('--ambient-y')
    }

    function schedule() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(update)
    }

    function updateScroll() {
      const height = window.innerHeight
      const progress = getScrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        height,
      )
      if (progressBar) progressBar.style.transform = `scaleX(${progress})`
      if (header) header.dataset.scrolled = String(window.scrollY > 16)
      visibleTracks.forEach((track) => {
        const rect = track.getBoundingClientRect()
        const progress = preference.matches ? 1 : getTimelineProgress(rect.top, rect.height, height)
        track.style.setProperty('--timeline-progress', progress)
        let closest
        let distance = Infinity
        const entries = [...track.querySelectorAll('[data-timeline-entry]')]
        entries.forEach((entry) => {
          const rect = entry.getBoundingClientRect()
          const next = Math.abs(rect.top + Math.min(rect.height / 2, 180) - height * 0.5)
          if (next < distance) {
            distance = next
            closest = entry
          }
        })
        entries.forEach((entry) => {
          entry.dataset.timelineCurrent = String(entry === closest && progress > 0)
        })
      })
    }

    function updatePointer() {
      const sample = pointerSample
      pointerSample = undefined
      if (!sample || preference.matches || !finePointer.matches || window.innerWidth <= 768) return
      const { card, x, y, overHero } = sample
      if (card?.isConnected) {
        const rect = card.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const px = (x - rect.left) / rect.width
        const py = (y - rect.top) / rect.height
        const tilt = getTilt(px, py, card.dataset.tilt === 'quiet' ? 3 : 5)
        card.style.setProperty('--tilt-x', `${tilt.x}deg`)
        card.style.setProperty('--tilt-y', `${tilt.y}deg`)
        card.style.setProperty('--image-x', `${tilt.imageX}px`)
        card.style.setProperty('--image-y', `${tilt.imageY}px`)
        card.style.setProperty('--spot-x', `${Math.min(100, Math.max(0, px * 100))}%`)
        card.style.setProperty('--spot-y', `${Math.min(100, Math.max(0, py * 100))}%`)
        card.dataset.tiltActive = 'true'
      } else if (overHero && hero) {
        const rect = hero.getBoundingClientRect()
        hero.style.setProperty('--ambient-x', `${((x - rect.left) / rect.width - 0.5) * 12}px`)
        hero.style.setProperty('--ambient-y', `${((y - rect.top) / rect.height - 0.5) * 10}px`)
      }
    }

    // Scroll, pointer, and integer counters share a scheduled frame; React never renders per frame.
    function update(now) {
      frame = 0
      if (scrollDirty) {
        updateScroll()
        scrollDirty = false
      }
      if (pointerSample) updatePointer()
      counters.forEach((counter, element) => {
        if (!element.isConnected) {
          counters.delete(element)
          return
        }
        const elapsed = (now - counter.start) / 800
        const value = getCounterValue(elapsed, counter.target)
        if (element.textContent !== String(value)) element.textContent = String(value)
        if (elapsed >= 1 || value === counter.target) counters.delete(element)
      })
      if (counters.size) schedule()
    }

    function onScroll() {
      scrollDirty = true
      schedule()
    }

    function enter(element, delay = 0, heroEntry = false) {
      if (preference.matches || !element.isConnected || !element.animate) return
      if (element.contains(document.activeElement)) return
      cancel(element)
      // Individual translate leaves CSS transform available for hover/3D tilt.
      const movement = individualTransforms
        ? [{ translate: `0 ${heroEntry ? 24 : 16}px` }, { translate: '0 0' }]
        : [{ transform: `translateY(${heroEntry ? 24 : 16}px)` }, { transform: 'translateY(0)' }]
      const animation = element.animate(
        [
          { ...movement[0], opacity: 0 },
          { ...movement[1], opacity: 1 },
        ],
        {
          duration: element.classList.contains('section-heading') ? 650 : heroEntry ? 680 : 520,
          delay,
          easing,
          fill: 'backwards',
        },
      )
      animations.set(element, animation)
      const release = () => {
        if (animations.get(element) === animation) animations.delete(element)
      }
      animation.finished.then(release, release)
    }

    function finishCounters() {
      counters.forEach((counter, element) => {
        element.textContent = String(counter.target)
      })
      counters.clear()
    }

    function stagger(element) {
      const group = element.closest('[data-stagger]')
      if (!group) return 0
      const siblings = [...group.querySelectorAll('[data-reveal]')].filter(
        (item) => item.closest('[data-stagger]') === group,
      )
      return (Math.max(0, siblings.indexOf(element)) % 4) * 55
    }

    function targetsWithin(node, selector) {
      if (!(node instanceof Element)) return []
      return [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]
    }

    function watch(node) {
      targetsWithin(node, '[data-reveal], [data-count-to]').forEach((element) =>
        observer?.observe(element),
      )
      targetsWithin(node, '[data-timeline], .hero').forEach((element) =>
        trackObserver?.observe(element),
      )
    }

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return
            observer.unobserve(target)
            if (target.hasAttribute('data-count-to')) {
              if (counted.has(target)) return
              counted.add(target)
              const value = Number(target.dataset.countTo)
              if (!Number.isFinite(value) || value < 0) return
              if (!preference.matches) {
                counters.set(target, { target: value, start: performance.now() })
                schedule()
              }
            } else if (!revealed.has(target)) {
              revealed.add(target)
              enter(target, stagger(target))
            }
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
      )
      trackObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (target === hero) hero.dataset.ambientActive = String(isIntersecting)
            else if (isIntersecting) visibleTracks.add(target)
            else visibleTracks.delete(target)
          })
          onScroll()
        },
        { rootMargin: '100px 0px' },
      )
      watch(scope)
      mutations = new MutationObserver((records) => {
        let structureChanged = false
        records.forEach((record) => {
          if (
            [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element)
          )
            structureChanged = true
          record.removedNodes.forEach((node) => {
            targetsWithin(node, '[data-reveal], [data-count-to]').forEach((element) => {
              observer.unobserve(element)
              cancel(element)
              counters.delete(element)
            })
            targetsWithin(node, '[data-timeline]').forEach((element) => {
              trackObserver.unobserve(element)
              visibleTracks.delete(element)
            })
          })
          record.addedNodes.forEach(watch)
        })
        if (activeCard && !activeCard.isConnected) resetTilt()
        // Counter text writes do not require another geometry/progress measurement.
        if (structureChanged) onScroll()
      })
      mutations.observe(scope, { childList: true, subtree: true })
    }

    scope.querySelectorAll('[data-hero-step]').forEach((element) => {
      enter(element, Number(element.dataset.heroStep) * 65, true)
    })

    function onPointerMove(event) {
      if (
        !finePointer.matches ||
        preference.matches ||
        !individualTransforms ||
        window.innerWidth <= 768 ||
        event.pointerType !== 'mouse'
      )
        return
      const card = event.target.closest('[data-tilt]')
      const overHero = !!event.target.closest('.hero')
      if (!card && !overHero) {
        if (activeCard || hero?.style.getPropertyValue('--ambient-x')) resetTilt()
        return
      }
      if (card !== activeCard) {
        resetTilt()
        activeCard = card
      }
      if (card?.matches(':focus-within')) {
        resetTilt()
        return
      }
      pointerSample = {
        card,
        x: event.clientX,
        y: event.clientY,
        overHero,
      }
      schedule()
    }

    function onPointerOut(event) {
      if (!event.relatedTarget || !scope.contains(event.relatedTarget)) resetTilt()
      else if (activeCard && !activeCard.contains(event.relatedTarget)) resetTilt()
    }

    function revealFocus(event) {
      resetTilt()
      animations.forEach((animation, element) => {
        if (element.contains(event.target)) cancel(element)
      })
    }

    function updatePreference() {
      resetTilt()
      if (preference.matches) {
        animations.forEach((animation) => animation.cancel())
        animations.clear()
        finishCounters()
      }
      onScroll()
    }

    function onResize() {
      resetTilt()
      onScroll()
    }

    function onVisibility() {
      document.documentElement.dataset.motionPaused = String(document.hidden)
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
        finishCounters()
        resetTilt()
      } else onScroll()
    }

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(onScroll)
      resizeObserver.observe(scope)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    preference.addEventListener('change', updatePreference)
    finePointer.addEventListener('change', updatePreference)
    scope.addEventListener('pointermove', onPointerMove, { passive: true })
    scope.addEventListener('pointerout', onPointerOut, { passive: true })
    scope.addEventListener('focusin', revealFocus)
    onScroll()
    return () => {
      observer?.disconnect()
      trackObserver?.disconnect()
      mutations?.disconnect()
      resizeObserver?.disconnect()
      cancelAnimationFrame(frame)
      animations.forEach((animation) => animation.cancel())
      finishCounters()
      resetTilt()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      preference.removeEventListener('change', updatePreference)
      finePointer.removeEventListener('change', updatePreference)
      scope.removeEventListener('pointermove', onPointerMove)
      scope.removeEventListener('pointerout', onPointerOut)
      scope.removeEventListener('focusin', revealFocus)
      delete document.documentElement.dataset.motionPaused
    }
  }, [rootRef])
}
