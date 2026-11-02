import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getSwipeDirection, wrapIndex } from '../utils/carousel'

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const AUTOPLAY_DELAY = 3500

function subscribeMotion(callback) {
  const media = window.matchMedia(MOTION_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function readMotion() {
  return window.matchMedia(MOTION_QUERY).matches
}

function subscribeVisibility(callback) {
  document.addEventListener('visibilitychange', callback)
  return () => document.removeEventListener('visibilitychange', callback)
}

function readVisibility() {
  return !document.hidden
}

export default function useEvidenceCarousel(reports) {
  const regionRef = useRef(null)
  const stageRef = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const [index, setIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [reading, setReading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [visible, setVisible] = useState(false)
  const subscribe = useCallback(
    (notify) =>
      subscribeMotion(() => {
        if (readMotion()) setAutoplay(false)
        notify()
      }),
    [],
  )
  const reduced = useSyncExternalStore(subscribe, readMotion, () => true)
  const pageVisible = useSyncExternalStore(subscribeVisibility, readVisibility, () => false)
  const activeIndex = wrapIndex(index, reports.length)
  const rotating =
    autoplay &&
    !reduced &&
    !reading &&
    !hovered &&
    !focused &&
    !dragging &&
    visible &&
    pageVisible &&
    reports.length > 1

  function select(nextIndex, focusStage = false) {
    const stage = stageRef.current
    const current = stage?.querySelector('[data-active="true"]')
    if (focusStage || current?.contains(document.activeElement)) {
      stage?.focus({ preventScroll: true })
    }
    // Native disclosures remain uncontrolled, but a departing card must not stay expanded.
    current?.querySelectorAll('details[open]').forEach((details) => (details.open = false))
    setReading(false)
    setIndex(wrapIndex(nextIndex, reports.length))
  }

  function move(direction) {
    select(activeIndex + direction)
  }

  function toggleAutoplay() {
    if (reduced || reading || reports.length < 2) return
    setFocused(false)
    setAutoplay((enabled) => !enabled)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15),
      { threshold: 0.15 },
    )
    observer.observe(regionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!rotating) return
    // One timeout per dwell, replaced after navigation and cleared for every pause/unmount.
    const timer = window.setTimeout(() => {
      setIndex((current) => wrapIndex(current + 1, reports.length))
    }, AUTOPLAY_DELAY)
    return () => window.clearTimeout(timer)
  }, [rotating, reports.length, activeIndex])

  function clearDrag() {
    const current = drag.current
    drag.current = null
    setDragging(false)
    const stage = stageRef.current
    stage?.style.removeProperty('--coverflow-drag')
    if (stage) delete stage.dataset.dragging
    if (current && stage?.hasPointerCapture(current.id)) stage.releasePointerCapture(current.id)
  }

  function onPointerDown(event) {
    if (!event.isPrimary || event.button !== 0 || reports.length < 2) return
    if (event.target.closest('a, summary, input, textarea, select')) return
    setDragging(true)
    suppressClick.current = false
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false }
  }

  function onPointerMove(event) {
    const current = drag.current
    if (!current || event.pointerId !== current.id) return
    const x = event.clientX - current.x
    const y = event.clientY - current.y
    if (!current.active) {
      if (Math.abs(x) < 8 || Math.abs(x) <= Math.abs(y) * 1.2) return
      current.active = true
      stageRef.current.setPointerCapture(event.pointerId)
      stageRef.current.dataset.dragging = 'true'
    }
    event.preventDefault()
    suppressClick.current = true
    if (!reduced) {
      stageRef.current.style.setProperty(
        '--coverflow-drag',
        `${Math.max(-42, Math.min(42, x * 0.18))}px`,
      )
    }
  }

  function onPointerUp(event) {
    const current = drag.current
    if (!current || event.pointerId !== current.id) return
    const direction = current.active
      ? getSwipeDirection(current.x, current.y, event.clientX, event.clientY)
      : 0
    clearDrag()
    if (direction) move(direction)
  }

  return {
    regionRef,
    stageRef,
    activeIndex,
    autoplay: autoplay && !reduced,
    rotating,
    reduced,
    reading,
    move,
    select,
    toggleAutoplay,
    regionEvents: {
      onPointerEnter: (event) => {
        if (event.pointerType === 'mouse') setHovered(true)
      },
      onPointerLeave: (event) => {
        if (event.pointerType === 'mouse') setHovered(false)
      },
      onPointerDownCapture: () => setFocused(false),
      onFocusCapture: (event) => {
        setFocused(
          !event.target.closest('[data-coverflow-play]') && event.target.matches(':focus-visible'),
        )
      },
      onBlurCapture: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      },
      onKeyDown: (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
          setFocused(true)
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          select(event.key === 'Home' ? 0 : reports.length - 1)
          setFocused(true)
        }
      },
    },
    stageEvents: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: clearDrag,
      onLostPointerCapture: (event) => {
        // Touch transfers implicit capture from the touched text to the stage; ignore that loss.
        if (event.target === event.currentTarget && event.pointerId === drag.current?.id) {
          clearDrag()
        }
      },
      onPointerLeave: () => {
        if (drag.current && !drag.current.active) clearDrag()
      },
      onDragStart: (event) => event.preventDefault(),
      onClickCapture: (event) => {
        if (suppressClick.current && event.detail !== 0) {
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = false
        }
      },
      onToggleCapture: (event) => {
        if (event.target.tagName !== 'DETAILS') return
        if (!event.target.closest('[data-active="true"]')) return
        setReading(event.target.open)
      },
    },
  }
}
