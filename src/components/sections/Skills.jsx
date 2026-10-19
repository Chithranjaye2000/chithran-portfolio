import {
  Braces,
  Code2,
  GitBranch,
  Layers3,
  ListChecks,
  Radio,
  ShieldCheck,
  ShieldHalf,
} from 'lucide-react'
import { projects, skillGroups } from '../../data/portfolio'
import { certifications } from '../../data/certifications'
import { videoProjects } from '../../data/videoProjects'
import { qaReports } from '../../data/qaReports'
import { SectionHeading } from '../ui/Primitives'

const icons = {
  testing: ShieldCheck,
  api: Braces,
  security: ShieldHalf,
  management: ListChecks,
  code: Code2,
  layers: Layers3,
  workflow: GitBranch,
  research: Radio,
}

const collections = [
  { label: 'Featured projects', value: projects.length },
  { label: 'QA case studies', value: qaReports.filter((report) => report.summaryApproved).length },
  { label: 'Certification records', value: certifications.length },
  { label: 'Technical videos', value: videoProjects.length },
]

export default function Skills() {
  return (
    <section id="skills" className="section skills-section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeading
          eyebrow="04 / Skills & tools"
          title="A connected set of skills."
          id="skills-title"
        >
          The technologies and practices behind my project work, research, and technical
          communication.
        </SectionHeading>
        <div className="skills-grid" data-stagger>
          {skillGroups.map((group) => {
            const Icon = icons[group.icon]
            return (
              <article className="skill-group" key={group.title} data-reveal>
                <Icon size={27} strokeWidth={1.6} aria-hidden="true" />
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <ul className="tags">
                  {group.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
        <p className="skills-footnote">
          A hands-on toolkit, with a testing mindset. Always learning, always refining.
        </p>
        <div className="portfolio-collections" data-reveal>
          <p className="micro-label">In this portfolio</p>
          <dl>
            {collections.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <span aria-hidden="true" data-count-to={value}>
                    {value}
                  </span>
                  <span className="sr-only">{value}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
