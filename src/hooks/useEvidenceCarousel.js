import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { getDragDistance, getLoopShift, rotateItems } from '../utils/carousel'

const SPEED = 24 // Pixels per second; a card takes around 18 seconds to pass.

export default function useEvidenceCarousel(reports) {
  const viewportRef = useRef(null)
  const controller = useRef(null)
  const [order, setOrder] = useState(reports)
  const [status, setStatus] = useState({ paused: false, reduced: false, scrollable: false })

  useEffect(() => {
    const viewport = viewportRef.current
    const track = viewport.firstElementChild
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const state = {
      manual: false,
      hover: false,
      focus: false,
      details: false,
      visible: false,
      reduced: media.matches,
      scrollable: false,
      looping: false,
      stride: 0,
    }
    let frame = 0
    let previousTime = 0
    let position = 0
    let drag = null
    let suppressClick = false
    let disposed = false

    function stop() {
      cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
    }

    function recycle(steps) {
      if (!steps) return
      const position = viewport.scrollLeft - steps * state.stride
      // Move keyed, offscreen cards only. There are no duplicate links or hidden copies.
      flushSync(() => setOrder((items) => rotateItems(items, steps)))
      viewport.scrollLeft = position
    }

    function tick(time) {
      frame = 0
      if (disposed) return
      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0
      previousTime = time
      // Retain subpixel travel even when the browser rounds scroll offsets.
      position += (SPEED * elapsed) / 1000
      viewport.scrollLeft = position
      const shift = getLoopShift(
        viewport.scrollLeft,
        state.stride,
        reports.length,
        viewport.clientWidth,
      )
      recycle(shift)
      position -= shift * state.stride
      frame = requestAnimationFrame(tick)
    }

    function sync() {
      const paused = state.manual || state.hover || state.focus || state.details || Boolean(drag)
      const running =
        !paused && !state.reduced && state.visible && state.looping && !document.hidden
      viewport.dataset.scrolling = String(running)
      setStatus((current) => {
        const next = {
          paused: state.manual,
          reduced: state.reduced,
          scrollable: state.scrollable,
          looping: state.looping,
          reading: state.details,
        }
        return Object.keys(next).every((key) => current[key] === next[key]) ? current : next
      })
      if (running && !frame) {
        position = viewport.scrollLeft
        frame = requestAnimationFrame(tick)
      } else if (!running) stop()
    }

    function measure() {
      const slides = track.children
      const width = slides[0]?.getBoundingClientRect().width ?? 0
      state.stride = width + (parseFloat(getComputedStyle(track).columnGap) || 0)
      state.scrollable = viewport.scrollWidth > viewport.clientWidth + 1
      state.looping =
        reports.length > 1 &&
        state.stride > 0 &&
        reports.length * state.stride - viewport.clientWidth >= state.stride
      sync()
    }

    function onPointerDown(event) {
      if (event.button !== 0) return
      state.manual = true
      suppressClick = false
      if (event.pointerType === 'mouse') {
        drag = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          scroll: viewport.scrollLeft,
          active: false,
        }
      }
      sync()
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.id) return
      const distance = getDragDistance(drag.x, drag.y, event.clientX, event.clientY)
      if (!drag.active && !distance) return
      if (!drag.active) {
        drag.active = true
        viewport.setPointerCapture(event.pointerId)
        viewport.dataset.dragging = 'true'
      }
      event.preventDefault()
      suppressClick = true
      viewport.scrollLeft = drag.scroll - (event.clientX - drag.x)
    }

    function onPointerUp(event) {
      if (!drag || event.pointerId !== drag.id) return
      if (viewport.hasPointerCapture(event.pointerId))
        viewport.releasePointerCapture(event.pointerId)
      drag = null
      delete viewport.dataset.dragging
      sync()
    }

    function onClick(event) {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault()
        event.stopPropagation()
        suppressClick = false
      }
    }

    function onDragStart(event) {
      event.preventDefault()
    }

    function onFocus(event) {
      state.focus = true
      if (!event.target.closest('[data-carousel-play]')) state.manual = true
      sync()
    }

    function onToggle() {
      state.details = Boolean(track.querySelector('details[open]'))
      if (state.details) state.manual = true
      sync()
    }

    function onEnter(event) {
      if (event.pointerType === 'mouse') state.hover = true
      sync()
    }

    function onLeave() {
      state.hover = false
      if (drag && !drag.active) drag = null
      sync()
    }

    function onWheel(event) {
      if (Math.abs(event.deltaX) > 0 || event.shiftKey) {
        state.manual = true
        sync()
      }
    }

    function onMediaChange() {
      state.reduced = media.matches
      sync()
    }

    controller.current = {
      toggle() {
        state.manual = !state.manual
        state.focus = false
        sync()
      },
      move(direction) {
        state.manual = true
        sync()
        if (state.looping && !state.details) {
          const shift = getLoopShift(
            viewport.scrollLeft,
            state.stride,
            reports.length,
            viewport.clientWidth,
          )
          recycle(direction < 0 && viewport.scrollLeft < state.stride ? -1 : shift)
        }
        viewport.scrollBy({
          left: direction * state.stride,
          behavior: state.reduced ? 'instant' : 'smooth',
        })
      },
    }

    const observer = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting
      sync()
    })
    const resizeObserver = new ResizeObserver(measure)
    observer.observe(viewport)
    resizeObserver.observe(viewport)
    resizeObserver.observe(track)
    const region = viewport.parentElement
    const listeners = [
      [viewport, 'pointerdown', onPointerDown],
      [viewport, 'pointermove', onPointerMove],
      [window, 'pointerup', onPointerUp],
      [window, 'pointercancel', onPointerUp],
      [viewport, 'lostpointercapture', onPointerUp],
      [region, 'pointerenter', onEnter],
      [region, 'pointerleave', onLeave],
      [viewport, 'click', onClick, true],
      [viewport, 'dragstart', onDragStart],
      [viewport, 'toggle', onToggle, true],
      [viewport, 'wheel', onWheel, { passive: true }],
      [region, 'focusin', onFocus],
      [document, 'visibilitychange', sync],
      [media, 'change', onMediaChange],
    ]
    listeners.forEach(([target, event, handler, options]) =>
      target.addEventListener(event, handler, options),
    )

    return () => {
      disposed = true
      stop()
      observer.disconnect()
      resizeObserver.disconnect()
      listeners.forEach(([target, event, handler, options]) =>
        target.removeEventListener(event, handler, options),
      )
      if (drag && viewport.hasPointerCapture(drag.id)) viewport.releasePointerCapture(drag.id)
      controller.current = null
    }
  }, [reports])

  return { order, status, viewportRef, controller }
}
