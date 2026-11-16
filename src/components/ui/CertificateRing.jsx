import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { getCoverflowOffset, getSwipeDirection, wrapIndex } from '../../utils/carousel'
import { canRotateCertificates, getCertificatePose } from '../../utils/certificateRing'
import CertificateCard from './CertificateCard'

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const DWELL = 4500

function subscribeMotion(notify) {
  const media = window.matchMedia(MOTION_QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
function readMotion() {
  return window.matchMedia(MOTION_QUERY).matches
}
function subscribeVisibility(notify) {
  document.addEventListener('visibilitychange', notify)
  return () => document.removeEventListener('visibilitychange', notify)
}
function readVisibility() {
  return !document.hidden
}
function poseStyle(index, position, count) {
  return Object.fromEntries(
    Object.entries(getCertificatePose(index, position, count)).map(([key, value]) => [
      `--certificate-${key}`,
      Number(value.toFixed(6)),
    ]),
  )
}

export default function CertificateRing({
  certificates,
  availableImages,
  onSelect,
  dialogOpen = false,
  initialCertificateId,
}) {
  const [position, setPosition] = useState(() =>
    Math.max(
      0,
      certificates.findIndex((certificate) => certificate.id === initialCertificateId),
    ),
  )
  const [enabled, setEnabled] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [visible, setVisible] = useState(false)
  const stageRef = useRef(null)
  const regionRef = useRef(null)
  const ringRef = useRef(null)
  const gesture = useRef(null)
  const frame = useRef(0)
  const suppressClick = useRef(false)
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, () => true)
  const pageVisible = useSyncExternalStore(subscribeVisibility, readVisibility, () => false)
  const count = certificates.length
  const active = wrapIndex(position, count)
  const rotating = canRotateCertificates({
    enabled,
    reduced,
    visible,
    pageVisible,
    hovered,
    focused,
    dragging,
    dialogOpen,
    count,
  })

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
    const timer = window.setTimeout(() => setPosition((value) => value + 1), DWELL)
    return () => window.clearTimeout(timer)
  }, [rotating, position])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function draw(nextPosition) {
    for (const [index, slide] of [...ringRef.current.children].entries()) {
      for (const [name, value] of Object.entries(poseStyle(index, nextPosition, count)))
        slide.style.setProperty(name, value)
    }
  }

  function move(distance, focusStage = false) {
    if (
      focusStage ||
      stageRef.current.querySelector('[data-active="true"]')?.contains(document.activeElement)
    )
      stageRef.current.focus({ preventScroll: true })
    // Trigonometric poses repeat each turn: wrapping never rewinds the gallery.
    setPosition((current) => current + distance)
  }

  function finishGesture(event, cancelled = false) {
    const start = gesture.current
    if (!start || start.id !== event.pointerId) return
    gesture.current = null
    cancelAnimationFrame(frame.current)
    frame.current = 0
    setDragging(false)
    stageRef.current.removeAttribute('data-dragging')
    if (stageRef.current.hasPointerCapture(event.pointerId))
      stageRef.current.releasePointerCapture(event.pointerId)
    const direction =
      !cancelled && start.horizontal
        ? getSwipeDirection(start.x, start.y, event.clientX, event.clientY)
        : 0
    draw(position + direction)
    if (direction) move(direction)
  }

  return (
    <div
      className="certificate-carousel"
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Certificates"
      data-rotating={rotating}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setHovered(false)
      }}
      onPointerDownCapture={() => setFocused(false)}
      onFocusCapture={(event) =>
        setFocused(
          !event.target.closest('[data-certificate-play]') &&
            event.target.matches(':focus-visible'),
        )
      }
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || count < 2) return
        const distance = { ArrowLeft: -1, ArrowRight: 1, Home: -active, End: count - 1 - active }[
          event.key
        ]
        if (distance === undefined) return
        event.preventDefault()
        setFocused(true)
        move(distance, true)
      }}
    >
      <p className="sr-only" id="certificate-ring-help">
        Use the left and right arrow keys, drag, or swipe to change certificates. Home and End
        select the first and last certificate. Select a side card to bring it to the front. Autoplay
        pauses while hovering or using the keyboard.
      </p>
      <div
        className="certificate-ring-stage"
        ref={stageRef}
        tabIndex={0}
        aria-label="Certificate ring"
        aria-describedby="certificate-ring-help"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || count < 2) return
          suppressClick.current = false
          setDragging(true)
          gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            horizontal: false,
            progress: 0,
          }
        }}
        onPointerMove={(event) => {
          const start = gesture.current
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (!start.horizontal) {
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
              finishGesture(event, true)
              return
            }
            if (Math.abs(dx) < 8) return
            start.horizontal = true
            suppressClick.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            event.currentTarget.dataset.dragging = 'true'
          }
          start.progress = Math.max(-0.75, Math.min(0.75, -dx / 240))
          if (reduced || frame.current) return
          frame.current = requestAnimationFrame(() => {
            frame.current = 0
            if (gesture.current) draw(position + gesture.current.progress)
          })
        }}
        onPointerUp={finishGesture}
        onPointerCancel={(event) => finishGesture(event, true)}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) finishGesture(event, true)
        }}
        onPointerLeave={(event) => {
          if (!gesture.current?.horizontal) finishGesture(event, true)
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = false
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="certificate-ring" ref={ringRef}>
          {certificates.map((certificate, index) => (
            <div
              className="certificate-ring-slide"
              key={certificate.id}
              style={poseStyle(index, position, count)}
              data-active={index === active}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}: ${certificate.title}`}
            >
              <div
                className="certificate-ring-content"
                inert={index !== active}
                aria-hidden={index !== active}
              >
                <CertificateCard
                  certificate={certificate}
                  imageAvailable={availableImages.has(certificate.imagePath)}
                  onSelect={onSelect}
                />
              </div>
              {index !== active && (
                <button
                  type="button"
                  className="certificate-ring-select"
                  tabIndex={-1}
                  aria-label={`Show ${certificate.title}`}
                  onClick={() => move(getCoverflowOffset(index, active, count), true)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="certificate-ring-controls">
        <button
          type="button"
          aria-label="Previous certificate"
          disabled={count < 2}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <p aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
          <span>
            {String(count ? active + 1 : 0).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <span className="sr-only">: {certificates[active]?.title}</span>
        </p>
        <button
          type="button"
          aria-label="Next certificate"
          disabled={count < 2}
          onClick={() => move(1)}
        >
          <ArrowRight size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="certificate-play"
          data-certificate-play
          aria-pressed={enabled && !reduced}
          disabled={reduced || count < 2}
          onClick={() => {
            setFocused(false)
            setEnabled((value) => !value)
          }}
        >
          {enabled && !reduced ? (
            <Pause size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
          {enabled && !reduced ? 'Pause rotation' : 'Resume rotation'}
        </button>
      </div>
    </div>
  )
}
