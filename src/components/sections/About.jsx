import { Code2, MessageSquareText, ScanLine } from 'lucide-react'
import { SectionHeading, TextLink } from '../ui/Primitives'

const approaches = [
  {
    Icon: ScanLine,
    title: 'Think like a tester',
    text: 'Ask what could go wrong. Understand the workflow. Make findings useful.',
  },
  {
    Icon: Code2,
    title: 'Build with purpose',
    text: 'Connect technical decisions to the people who will use the software.',
  },
  {
    Icon: MessageSquareText,
    title: 'Make it understandable',
    text: 'Explain the how and the why through clear technical content.',
  },
]

export default function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container about-grid">
        <div>
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
            <p>
              I’m Chithran, with an academic background in Industrial Information Technology at Uva
              Wellassa University and an interest in the space where software quality, development,
              and communication meet.
            </p>
            <p>
              My project work spans web and mobile applications, IoT research, and functional
              testing. I work with test automation tools to make checks repeatable. As a Quality
              Assurance Intern at Sri Lanka Telecom, I’m continuing to develop a practical,
              detail-oriented approach to software validation.
            </p>
            <p>
              I also enjoy making technical videos: demonstrations, walkthroughs, and explainers
              that help people see how a system works.
            </p>
          </div>
          <TextLink href="#experience">Get to know my experience</TextLink>
        </div>
        <div className="approach-list" data-stagger>
          <p className="micro-label">HOW I APPROACH THE WORK</p>
          {approaches.map(({ Icon, title, text }) => (
            <div className="approach" key={title} data-reveal>
              <span className="icon-tile">
                <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
