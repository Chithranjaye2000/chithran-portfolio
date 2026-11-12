import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getCoverflowOffset, getSwipeDirection, wrapIndex } from '../../utils/carousel'
import CertificateCard from './CertificateCard'

export default function CertificateRing({ certificates, availableImages, onSelect }) {
  const [position, setPosition] = useState(0)
  const stageRef = useRef(null)
  const ringRef = useRef(null)
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const count = certificates.length
  const active = wrapIndex(position, count)
  const step = 360 / count

  function move(distance) {
    // Keep turns cumulative so the last-to-first transition is one step, not a rewind.
    setPosition((current) => current + distance)
  }

  function finishGesture(event, cancelled = false) {
    const start = gesture.current
    if (!start || start.id !== event.pointerId) return
    gesture.current = null
    ringRef.current.style.removeProperty('--certificate-drag')
    stageRef.current.removeAttribute('data-dragging')
    if (stageRef.current.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId)
    }
    if (!cancelled && start.horizontal) {
      const direction = getSwipeDirection(start.x, start.y, event.clientX, event.clientY)
      if (direction) move(direction)
    }
  }

  return (
    <div
      className="certificate-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Certificates"
    >
      <p className="sr-only" id="certificate-ring-help">
        Use the left and right arrow keys, drag, or swipe to change certificates. Home and End
        select the first and last certificate. Select a side card to bring it to the front.
      </p>
      <div
        className="certificate-ring-stage"
        ref={stageRef}
        tabIndex={0}
        aria-label="Certificate ring"
        aria-describedby="certificate-ring-help"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          const distance = { ArrowLeft: -1, ArrowRight: 1, Home: -active, End: count - 1 - active }[
            event.key
          ]
          if (distance === undefined) return
          event.preventDefault()
          move(distance)
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return
          suppressClick.current = false
          gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            horizontal: false,
          }
        }}
        onPointerMove={(event) => {
          const start = gesture.current
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (!start.horizontal) {
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
              gesture.current = null
              return
            }
            if (Math.abs(dx) < 8) return
            start.horizontal = true
            suppressClick.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            event.currentTarget.dataset.dragging = 'true'
          }
          ringRef.current.style.setProperty(
            '--certificate-drag',
            `${Math.max(-step * 0.7, Math.min(step * 0.7, dx / 8))}deg`,
          )
        }}
        onPointerUp={finishGesture}
        onPointerCancel={(event) => finishGesture(event, true)}
        onLostPointerCapture={(event) => finishGesture(event, true)}
        onPointerLeave={(event) => {
          if (!gesture.current?.horizontal) finishGesture(event, true)
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current) return
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = false
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          className="certificate-ring"
          ref={ringRef}
          style={{ '--certificate-turn': `${-position * step}deg` }}
        >
          {certificates.map((certificate, index) => {
            const offset = getCoverflowOffset(index, active, count)
            return (
              <div
                className="certificate-ring-slide"
                key={certificate.id}
                style={{ '--certificate-angle': `${index * step}deg` }}
                data-active={index === active}
                data-near={Math.abs(offset) <= 2}
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
                    className="certificate-ring-select"
                    tabIndex={-1}
                    aria-label={`Show ${certificate.title}`}
                    onClick={() => {
                      stageRef.current.focus({ preventScroll: true })
                      move(offset)
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="certificate-ring-controls">
        <button type="button" aria-label="Previous certificate" onClick={() => move(-1)}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <p aria-live="polite" aria-atomic="true">
          <span>
            {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <span className="sr-only">: {certificates[active].title}</span>
        </p>
        <button type="button" aria-label="Next certificate" onClick={() => move(1)}>
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
      <p className="certificate-ring-hint">
        Drag or swipe to explore · Select a certificate to view it
      </p>
    </div>
  )
}
