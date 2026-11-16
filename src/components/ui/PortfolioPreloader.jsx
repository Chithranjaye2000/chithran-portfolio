import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { siteConfig } from '../../data/siteConfig'
import { createStartupProgress, observeStartup } from '../../utils/startup'
import '../../styles/preloader.css'

export default function PortfolioPreloader({ children }) {
  const [status, setStatus] = useState('Preparing your portfolio')
  const [phase, setPhase] = useState('loading')
  const ringRef = useRef(null)
  const numberRef = useRef(null)
  const progressRef = useRef(null)
  const blocked = phase !== 'done'

  useLayoutEffect(() => {
    if (!blocked) return
    // The same flag paints the initial navy canvas before React and locks only page scrolling.
    document.documentElement.dataset.startup = 'pending'
    return () => document.documentElement.removeAttribute('data-startup')
  }, [blocked])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let ready = false
    let target = 0
    const immediate = () => motion.matches || document.hidden
    const animator = createStartupProgress({
      onUpdate: (value) => {
        const integer = String(Math.floor(value))
        ringRef.current?.style.setProperty('stroke-dashoffset', String(100 - value))
        if (numberRef.current && numberRef.current.textContent !== integer) {
          numberRef.current.textContent = integer
          progressRef.current?.setAttribute('aria-valuenow', integer)
          progressRef.current?.setAttribute('aria-valuetext', `${integer}% of startup preparation`)
        }
      },
      onComplete: () => {
        if (ready) setPhase(immediate() ? 'done' : 'exiting')
      },
    })
    const cancel = observeStartup({
      onProgress: (value) => {
        target = value
        animator.update(value, immediate())
      },
      onStatus: setStatus,
      onReady: () => {
        ready = true
        setPhase(immediate() ? 'done' : 'completing')
      },
    })
    const settleMotion = () => {
      if (!immediate()) return
      animator.update(target, true)
      if (ready) setPhase('done')
    }
    motion.addEventListener('change', settleMotion)
    document.addEventListener('visibilitychange', settleMotion)
    return () => {
      cancel()
      animator.cancel()
      motion.removeEventListener('change', settleMotion)
      document.removeEventListener('visibilitychange', settleMotion)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'exiting') return
    // A cancelled transition or a background tab must not leave the portfolio inert.
    const timer = window.setTimeout(() => setPhase('done'), 650)
    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    <>
      <div
        className="portfolio-app"
        data-startup={phase}
        inert={blocked}
        aria-hidden={blocked || undefined}
        aria-busy={blocked || undefined}
      >
        {children}
      </div>
      {blocked && (
        <div
          className="portfolio-preloader"
          data-state={phase}
          onTransitionEnd={(event) => {
            if (
              phase === 'exiting' &&
              event.target === event.currentTarget &&
              event.propertyName === 'opacity'
            ) {
              setPhase('done')
            }
          }}
        >
          <div className="preloader-grid" aria-hidden="true" />
          <div className="preloader-panel">
            <p className="preloader-name">{siteConfig.name}</p>
            <div className="preloader-emblem" aria-hidden="true">
              <svg className="preloader-ring" viewBox="0 0 200 200" fill="none">
                <defs>
                  <linearGradient
                    id="preloader-ring-gradient"
                    x1="0"
                    y1="0"
                    x2="200"
                    y2="200"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#5c87ff" />
                    <stop offset="1" stopColor="#80ddf7" />
                  </linearGradient>
                </defs>
                <circle className="preloader-ring-track" cx="100" cy="100" r="90" />
                <circle
                  className="preloader-ring-value"
                  ref={ringRef}
                  cx="100"
                  cy="100"
                  r="90"
                  pathLength="100"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />
              </svg>
              <span className="preloader-orbit" />
              <span className="preloader-logo">
                CJ<span>.</span>
              </span>
            </div>
            <div
              className="preloader-percentage"
              ref={progressRef}
              role="progressbar"
              aria-label="Portfolio startup progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
              aria-valuetext="0% of startup preparation"
            >
              <span ref={numberRef}>0</span>
              <span className="preloader-percent-sign">%</span>
            </div>
            <p className="preloader-status">
              {phase === 'exiting' ? 'Portfolio ready' : 'Loading Portfolio...'}
            </p>
            <p className="preloader-detail" role="status" aria-atomic="true">
              {status}
            </p>
            <p className="sr-only">Progress reflects startup preparation, not downloaded bytes.</p>
            <span className="preloader-rule" aria-hidden="true" />
          </div>
        </div>
      )}
    </>
  )
}
