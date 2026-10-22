import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { qaToolRows } from '../../data/qaTools'
import { SectionHeading } from '../ui/Primitives'
import '../../styles/qa-tools.css'

function ToolLogo({ tool }) {
  const [failed, setFailed] = useState(false)

  return (
    <li className="qa-tool-item">
      <span className={`qa-tool-logo${tool.wide ? ' qa-tool-logo--wide' : ''}`} aria-hidden="true">
        {failed ? (
          <span className="qa-tool-logo-fallback">{tool.name}</span>
        ) : (
          <img
            src={tool.logo}
            alt=""
            width="56"
            height="40"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </span>
      <span className="qa-tool-name">{tool.name}</span>
      {tool.detail && <span className="qa-tool-detail">{tool.detail}</span>}
    </li>
  )
}

export default function QaTools() {
  const sectionRef = useRef(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        section.dataset.inView = String(entry.isIntersecting)
      },
      { rootMargin: '100px' },
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="qa-tools"
      className="qa-tools-section"
      aria-labelledby="qa-tools-title"
      ref={sectionRef}
      data-paused={paused}
      data-in-view="true"
    >
      <div className="container">
        <div className="qa-tools-heading">
          <SectionHeading
            eyebrow="The testing toolkit"
            title="QA Tools & Technologies"
            id="qa-tools-title"
          >
            Tools I use across test automation, API testing, quality analysis, and delivery
            workflows.
          </SectionHeading>
          <button
            type="button"
            className="qa-tools-pause button button--outline"
            onClick={() => setPaused(!paused)}
          >
            {paused ? (
              <Play size={16} aria-hidden="true" />
            ) : (
              <Pause size={16} aria-hidden="true" />
            )}
            {paused ? 'Resume motion' : 'Pause & show all'}
          </button>
        </div>
        <div className="qa-tools-rows">
          {qaToolRows.map((tools, index) => (
            <div className="qa-tools-row" key={index}>
              <div className={`qa-tools-track${index === 1 ? ' qa-tools-track--reverse' : ''}`}>
                <ul
                  className="qa-tools-group"
                  aria-label={index === 0 ? 'Testing tools' : 'Quality and delivery tools'}
                >
                  {tools.map((tool) => (
                    <ToolLogo key={tool.id} tool={tool} />
                  ))}
                </ul>
                <ul className="qa-tools-group qa-tools-copy" aria-hidden="true">
                  {tools.map((tool) => (
                    <ToolLogo key={tool.id} tool={tool} />
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p className="qa-tools-hint">
          Hover to pause, or choose “Pause & show all” to browse the full toolkit.
        </p>
      </div>
    </section>
  )
}
