import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import useEvidenceCarousel from '../../hooks/useEvidenceCarousel'
import { getCoverflowOffset } from '../../utils/carousel'
import QaReportCard from './QaReportCard'

export default function QaEvidenceCarousel({ reports }) {
  const {
    regionRef,
    stageRef,
    activeIndex,
    autoplay,
    rotating,
    reduced,
    reading,
    move,
    select,
    toggleAutoplay,
    regionEvents,
    stageEvents,
  } = useEvidenceCarousel(reports)
  const current = reports[activeIndex]

  return (
    <div
      ref={regionRef}
      className="qa-coverflow"
      role="region"
      aria-roledescription="carousel"
      aria-label="QA reports and testing evidence"
      data-reveal
      {...regionEvents}
    >
      <div className="qa-coverflow-heading">
        <p className="eyebrow">Testing reports</p>
        <p>Select a report to read the details.</p>
      </div>
      <p className="sr-only" id="qa-coverflow-help">
        Use the left and right arrow keys to change reports, or Home and End to reach the first and
        last. Select a side card to bring it into focus.
      </p>
      <div className="qa-coverflow-window">
        <ul
          ref={stageRef}
          className="qa-coverflow-stage"
          id="qa-results"
          tabIndex={0}
          aria-label="QA evidence coverflow"
          aria-describedby="qa-coverflow-help"
          {...stageEvents}
        >
          {reports.map((report, index) => {
            const offset = getCoverflowOffset(index, activeIndex, reports.length)
            const distance = Math.abs(offset)
            const active = index === activeIndex
            const visible = distance <= 2
            return (
              <li
                key={report.id}
                className="qa-coverflow-slide"
                data-active={active}
                data-position={offset}
                aria-hidden={!visible || undefined}
                style={{
                  '--coverflow-x': `${offset === 0 ? 0 : Math.sign(offset) * (distance === 1 ? 68 : 122)}%`,
                  '--coverflow-y': `${distance * 16}px`,
                  '--coverflow-z': `${distance * -155}px`,
                  '--coverflow-angle': `${Math.sign(offset) * (distance === 1 ? -38 : -52)}deg`,
                  '--coverflow-scale': active ? 1 : distance === 1 ? 0.88 : 0.76,
                  '--coverflow-opacity': !visible ? 0 : active ? 1 : distance === 1 ? 0.82 : 0.5,
                  zIndex: reports.length - distance,
                }}
              >
                <div className="qa-coverflow-card" inert={!active} aria-hidden={!active}>
                  <QaReportCard report={report} inCarousel />
                </div>
                {!active && visible && (
                  <button
                    type="button"
                    className="qa-coverflow-select"
                    onClick={() => select(index, true)}
                    aria-label={`Show ${report.title}`}
                    tabIndex={-1}
                  >
                    <span className="sr-only">Bring report {index + 1} into focus</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="qa-coverflow-footer">
        <div className="qa-coverflow-controls" role="group" aria-label="QA carousel controls">
          <button
            type="button"
            className="qa-coverflow-arrow"
            aria-label="Previous QA report"
            aria-controls="qa-results"
            disabled={reports.length < 2}
            onClick={() => move(-1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <p
            className="qa-coverflow-position"
            aria-live={rotating ? 'off' : 'polite'}
            aria-atomic="true"
          >
            <span>{String(activeIndex + 1).padStart(2, '0')}</span>
            <span aria-hidden="true"> / </span>
            <span className="sr-only">of </span>
            {String(reports.length).padStart(2, '0')}
            <span className="sr-only">: {current?.title}</span>
          </p>
          <button
            type="button"
            className="qa-coverflow-arrow"
            aria-label="Next QA report"
            aria-controls="qa-results"
            disabled={reports.length < 2}
            onClick={() => move(1)}
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="qa-coverflow-dots" aria-hidden="true">
          {reports.map((report, index) => (
            <span key={report.id} data-active={index === activeIndex} />
          ))}
        </div>
        <button
          type="button"
          className="qa-coverflow-play"
          data-coverflow-play
          aria-controls="qa-results"
          aria-pressed={autoplay}
          disabled={reduced || reading || reports.length < 2}
          onClick={toggleAutoplay}
        >
          {autoplay ? (
            <Pause size={15} aria-hidden="true" />
          ) : (
            <Play size={15} aria-hidden="true" />
          )}
          {autoplay ? 'Pause autoplay' : 'Resume autoplay'}
        </button>
      </div>
      {(reduced || reading) && (
        <p className="qa-coverflow-note" role="status">
          {reduced
            ? 'Autoplay is off for reduced motion. Navigate at your own pace.'
            : 'Autoplay is paused while the report details are open.'}
        </p>
      )}
    </div>
  )
}
