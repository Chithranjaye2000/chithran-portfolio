import { ArrowUpRight, BriefcaseBusiness, CalendarDays } from 'lucide-react'
import { SectionHeading } from '../ui/Primitives'
import { TimelineRail } from '../ui/MotionDecor'

const start = '2026-05-09'
const end = '2026-11-09'
const status = 'Completed QA Internship'

export default function Experience() {
  return (
    <section id="experience" className="experience-section" aria-labelledby="experience-title">
      <div className="container experience-grid">
        <div>
          <SectionHeading
            eyebrow="02 / Experience"
            title={
              <>
                Learning in practice.
                <br />
                Growing through quality.
              </>
            }
            id="experience-title"
            light
          >
            Applied a testing mindset to real software at Sri Lanka Telecom (SLT), with care for the
            details and the people behind them.
          </SectionHeading>
          <a className="experience-contact" href="#contact">
            Let’s connect
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="milestone-track" data-timeline>
          <TimelineRail />
          <article className="experience-card" data-reveal data-timeline-entry>
            <div className="experience-card-top">
              <span className="company-mark" aria-hidden="true">
                SLT<span>TELECOM</span>
              </span>
              <span className="status-badge">
                <span />
                {status}
              </span>
            </div>
            <p className="experience-company">Sri Lanka Telecom (SLT)</p>
            <h3>Quality Assurance Intern</h3>
            <p className="experience-team">
              <BriefcaseBusiness size={15} aria-hidden="true" />
              Quality Engineering / Digital Platforms
            </p>
            <p className="experience-date">
              <CalendarDays size={15} aria-hidden="true" />
              <time dateTime={start}>09 May 2026</time>
              <span> – </span>
              <time dateTime={end}>09 Nov 2026</time>
            </p>
            <ul className="experience-activities">
              <li>Tested APIs and validated software behavior.</li>
              <li>Designed test cases for expected behavior and user workflows.</li>
              <li>Reported bugs and documented reproducible issues.</li>
            </ul>
            <p className="experience-discretion">
              A public overview of responsibilities I carried out during my QA internship.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
