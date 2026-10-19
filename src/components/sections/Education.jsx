import { ArrowUpRight, GraduationCap, MapPin } from 'lucide-react'
import { education } from '../../data/portfolio'
import { SectionHeading } from '../ui/Primitives'
import { TimelineRail } from '../ui/MotionDecor'

export default function Education() {
  return (
    <section id="education" className="section education-section" aria-labelledby="education-title">
      <div className="container education-grid">
        <SectionHeading
          eyebrow="06 / Education"
          title={
            <>
              A foundation for
              <br />
              what comes next.
            </>
          }
          id="education-title"
        >
          Connecting academic learning with hands-on exploration.
        </SectionHeading>
        <div className="milestone-track" data-timeline>
          <TimelineRail />
          <article className="education-card" data-reveal data-timeline-entry>
            <span className="icon-tile">
              <GraduationCap size={27} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <p className="micro-label">UNIVERSITY EDUCATION</p>
              <h3>{education.degree}</h3>
              <p className="university-name">{education.institution}</p>
              <p className="education-location">
                <MapPin size={14} aria-hidden="true" />
                {education.location}
              </p>
              <p>{education.description}</p>
              <a href="#projects" className="text-link">
                Explore my academic work
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
