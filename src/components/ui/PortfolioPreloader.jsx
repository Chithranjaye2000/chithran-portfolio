import { useEffect, useState } from 'react'
import { siteConfig } from '../../data/siteConfig'
import { observeStartup } from '../../utils/startup'
import '../../styles/preloader.css'

export default function PortfolioPreloader({ children }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading')
  const blocked = phase !== 'done'

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cancel = observeStartup({
      onProgress: setProgress,
      onReady: () => setPhase(motion.matches ? 'done' : 'exiting'),
    })
    const reduceMotion = () => {
      if (motion.matches) setPhase((current) => (current === 'exiting' ? 'done' : current))
    }
    motion.addEventListener('change', reduceMotion)
    return () => {
      cancel()
      motion.removeEventListener('change', reduceMotion)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'exiting') return
    // A cancelled transition or a background tab must not leave the portfolio inert.
    const timer = window.setTimeout(() => setPhase('done'), 550)
    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    <>
      <div className="portfolio-app" inert={blocked} aria-hidden={blocked || undefined}>
        {children}
      </div>
      {blocked && (
        <div
          className="portfolio-preloader"
          data-state={phase}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget && event.propertyName === 'opacity') {
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
                  cx="100"
                  cy="100"
                  r="90"
                  pathLength="100"
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress}
                />
              </svg>
              <span className="preloader-orbit" />
              <span className="preloader-logo">
                CJ<span>.</span>
              </span>
            </div>
            <div
              className="preloader-percentage"
              role="progressbar"
              aria-label="Portfolio startup progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-valuetext={`${progress}% of startup preparation`}
            >
              {progress}
              <span>%</span>
            </div>
            <p className="preloader-status" role="status">
              Loading Portfolio...
            </p>
            <span className="preloader-rule" aria-hidden="true" />
          </div>
        </div>
      )}
    </>
  )
}
