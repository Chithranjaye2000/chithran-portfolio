import { MessageSquareText, ScanLine, Workflow } from 'lucide-react'
import { SectionHeading, TextLink } from '../ui/Primitives'
import { siteConfig } from '../../data/siteConfig'
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
          <SectionHeading eyebrow="01 / About me" title="My background" id="about-title" />
          <div className="about-copy" data-reveal>
            <p className="about-lead">
              I’m Chithran, an Industrial Information Technology undergraduate at Uva Wellassa
              University. I’m based in {siteConfig.location}.
            </p>
            <p>
              My main interest is software QA, especially test automation and API testing. I
              completed my QA internship at Sri Lanka Telecom (SLT), where I tested workflows, wrote
              test cases, and documented defects.
            </p>
            <p>
              I also build web and mobile projects and make software demos, onboarding videos, and
              technical walkthroughs.
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
          <TextLink href="#experience">Read about my internship</TextLink>
        </div>
        <Education />
      </div>
    </section>
  )
}
