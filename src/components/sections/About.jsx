import { MessageSquareText, ScanLine, Workflow } from 'lucide-react'
import { SectionHeading, TextLink } from '../ui/Primitives'
import Education from './Education'

const approaches = [
  {
    Icon: ScanLine,
    title: 'Software QA',
  },
  {
    Icon: Workflow,
    title: 'Test automation',
  },
  {
    Icon: MessageSquareText,
    title: 'Technical content',
  },
]

export default function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container about-grid">
        <div className="about-introduction">
          <SectionHeading
            eyebrow="01 / About me"
            title={
              <>
                Curious by nature.
                <br />
                Precise by practice.
              </>
            }
            id="about-title"
          />
          <div className="about-copy" data-reveal>
            <p className="about-lead">
              I’m Chithran, an Industrial Information Technology undergraduate focused on software
              quality, test automation, and clear technical communication.
            </p>
            <p>
              At Uva Wellassa University, I’m building a foundation in software quality and
              development. As a Quality Assurance Intern at Sri Lanka Telecom, I put that learning
              into practice through workflow validation, test design, and defect documentation.
            </p>
            <p>
              I work with automation tools to make checks repeatable, and create technical demos,
              walkthroughs, and explainers that help people understand how systems work.
            </p>
          </div>
          <ul className="about-focus" aria-label="Professional focus" data-stagger>
            {approaches.map(({ Icon, title }) => (
              <li key={title} data-reveal>
                <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                <span>{title}</span>
              </li>
            ))}
          </ul>
          <TextLink href="#experience">Get to know my experience</TextLink>
        </div>
        <Education />
      </div>
    </section>
  )
}
