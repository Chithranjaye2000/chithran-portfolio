import { CalendarDays, GraduationCap } from 'lucide-react'
import { education } from '../../data/portfolio'
import { TextLink } from '../ui/Primitives'

export default function Education() {
  return (
    <article
      id="education"
      className="education-card"
      aria-labelledby="education-title"
      data-reveal
    >
      <div className="education-card-top">
        <p className="micro-label">MY FOUNDATION</p>
        <GraduationCap
          className="education-card-icon"
          size={27}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
      <div className="education-card-content">
        <h3 id="education-title">{education.degree}</h3>
        <p className="university-name">{education.institution}</p>
        <p className="education-location">{education.location}</p>
        <p className="graduation-badge">
          <CalendarDays size={14} aria-hidden="true" />
          Expected Graduation: {education.expectedGraduation}
        </p>
        <div className="education-coursework">
          <h4>Selected coursework</h4>
          <ul>
            {education.coursework.map((course) => (
              <li key={course}>{course}</li>
            ))}
          </ul>
        </div>
        <TextLink href="#projects">Explore my academic work</TextLink>
      </div>
    </article>
  )
}
