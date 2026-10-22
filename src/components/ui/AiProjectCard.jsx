import { ArrowUpRight, Braces, Bug, ClipboardList, Code2, ScanLine } from 'lucide-react'
import { ExternalLink } from './Primitives'

const icons = {
  'test-design': ClipboardList,
  api: Braces,
  automation: Code2,
  'bug-review': Bug,
  evaluation: ScanLine,
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export default function AiProjectCard({ project }) {
  const Icon = icons[project.icon]

  return (
    <article className="ai-project-card" aria-labelledby={`${project.id}-title`} data-reveal>
      <div className="ai-project-card-top">
        <span className="icon-tile" aria-hidden="true">
          <Icon size={23} strokeWidth={1.6} />
        </span>
        <span className="ai-project-status">{project.status}</span>
      </div>
      <h4 id={`${project.id}-title`}>{project.title}</h4>
      <p className="ai-project-description">{project.description}</p>
      <ul className="tags" aria-label="Relevant skills">
        {project.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
      <div className="ai-project-action">
        {isHttpsUrl(project.linkUrl) && (
          <ExternalLink
            href={project.linkUrl}
            className="text-link"
            aria-label={`${project.linkLabel}: ${project.title} (opens in a new tab)`}
          >
            {project.linkLabel}
            <ArrowUpRight size={16} aria-hidden="true" />
          </ExternalLink>
        )}
      </div>
    </article>
  )
}
