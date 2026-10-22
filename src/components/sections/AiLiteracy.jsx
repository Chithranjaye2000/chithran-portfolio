import { Check, ShieldCheck } from 'lucide-react'
import { aiLiteracy, aiMiniProjects } from '../../data/aiLiteracy'
import AiProjectCard from '../ui/AiProjectCard'
import { SectionHeading } from '../ui/Primitives'
import '../../styles/ai-literacy.css'

export default function AiLiteracy() {
  return (
    <section
      id="ai-literacy"
      className="section ai-literacy-section"
      aria-labelledby="ai-literacy-title"
    >
      <div className="container">
        <SectionHeading
          eyebrow="AI & quality engineering"
          title={aiLiteracy.title}
          id="ai-literacy-title"
        >
          {aiLiteracy.introduction}
        </SectionHeading>
        <div className="ai-competency-grid">
          <div className="ai-competencies" data-reveal>
            <h3>Key Competencies</h3>
            <ul>
              {aiLiteracy.competencies.map((competency) => (
                <li key={competency}>
                  <Check size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>{competency}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside
            className="ai-verification-note"
            aria-labelledby="ai-verification-title"
            data-reveal
          >
            <ShieldCheck size={28} strokeWidth={1.5} aria-hidden="true" />
            <h3 id="ai-verification-title">Human verification comes first.</h3>
            <p>
              AI supports the workflow. Human review remains essential for correctness, security,
              and privacy.
            </p>
          </aside>
        </div>
        <div className="ai-projects-heading" data-reveal>
          <h3>AI QA Mini-Projects</h3>
          <p>{aiLiteracy.projectsNote}</p>
        </div>
        <div className="ai-project-grid" data-stagger>
          {aiMiniProjects.map((project) => (
            <AiProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
