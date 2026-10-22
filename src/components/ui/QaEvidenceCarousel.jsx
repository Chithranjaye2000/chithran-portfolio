import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import useEvidenceCarousel from '../../hooks/useEvidenceCarousel'
import QaReportCard from './QaReportCard'

export default function QaEvidenceCarousel({ reports }) {
  const { order, status, viewportRef, controller } = useEvidenceCarousel(reports)
  const automatic = status.looping && !status.reduced
  const paused = status.paused || status.reading
  const PlaybackIcon = paused ? Play : Pause

  return (
    <div
      className="qa-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="QA reports and testing evidence"
      data-reveal
    >
      <div className="qa-carousel-toolbar">
        <p id="qa-carousel-help">
          Drag or swipe to explore. Use Tab to reach every report.
          <span>
            {status.reduced
              ? 'Automatic scrolling is off for reduced motion.'
              : 'Scrolling pauses on hover. Interact to pause; resume when ready.'}
          </span>
        </p>
        <div className="qa-carousel-controls" role="group" aria-label="QA carousel controls">
          <button
            type="button"
            aria-label="Previous QA report"
            aria-controls="qa-results"
            disabled={!status.scrollable}
            onClick={() => controller.current?.move(-1)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          {automatic && (
            <button
              type="button"
              className="qa-carousel-play"
              data-carousel-play
              aria-controls="qa-results"
              disabled={status.reading}
              onClick={() => controller.current?.toggle()}
            >
              <PlaybackIcon size={16} aria-hidden="true" />
              {paused ? 'Resume scrolling' : 'Pause scrolling'}
            </button>
          )}
          <button
            type="button"
            aria-label="Next QA report"
            aria-controls="qa-results"
            disabled={!status.scrollable}
            onClick={() => controller.current?.move(1)}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="qa-carousel-viewport"
        id="qa-results"
        ref={viewportRef}
        tabIndex={0}
        aria-label="Scrollable QA reports"
        aria-describedby="qa-carousel-help"
      >
        <ul className="qa-carousel-track">
          {order.map((report) => (
            <li key={report.id} className="qa-carousel-slide">
              <QaReportCard report={report} inCarousel />
            </li>
          ))}
        </ul>
      </div>
      <p className="qa-carousel-note" role="status">
        {status.reading
          ? 'Scrolling is paused. Close expanded details before resuming.'
          : status.paused
            ? 'Scrolling is paused for reading.'
            : automatic
              ? 'The collection scrolls gently while in view.'
              : 'Browse this selection with the arrows, scrollbar, or swipe.'}
      </p>
    </div>
  )
}
