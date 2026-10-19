import { ArrowUpRight, BriefcaseBusiness, CalendarDays } from 'lucide-react'
import { SectionHeading } from '../ui/Primitives'
import { TimelineRail } from '../ui/MotionDecor'

const start = '2026-06-09'
const end = '2026-12-09'

export default function Experience() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' })
  const status =
    today < start
      ? 'Upcoming internship'
      : today <= end
        ? 'Internship in progress'
        : 'Internship period ended'
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
            Applying a testing mindset to real software, with care for the details and the people
            behind them.
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
            <p className="experience-company">Sri Lanka Telecom</p>
            <h3>Quality Assurance Intern</h3>
            <p className="experience-team">
              <BriefcaseBusiness size={15} aria-hidden="true" />
              Quality Engineering / Digital Platforms
            </p>
            <p className="experience-date">
              <CalendarDays size={15} aria-hidden="true" />
              <time dateTime={start}>09 Jun 2026</time>
              <span>—</span>
              <time dateTime={end}>09 Dec 2026</time>
            </p>
            <ul className="experience-activities">
              <li>API testing and software validation.</li>
              <li>Test case design for expected behavior and user workflows.</li>
              <li>Bug reporting and documentation of reproducible issues.</li>
            </ul>
            <p className="experience-discretion">
              A public overview of my internship responsibilities.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
