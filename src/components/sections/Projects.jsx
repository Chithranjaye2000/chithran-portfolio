import { useState } from 'react'
import { ArrowUpRight, Check, ExternalLink as ExternalLinkIcon, X } from 'lucide-react'
import { Github } from '../ui/BrandIcons'
import { projects } from '../../data/portfolio'
import ApiCollectionState from '../ui/ApiCollectionState'
import { ExternalLink, SectionHeading } from '../ui/Primitives'
import useDialog from '../../hooks/useDialog'
import { TimelineRail } from '../ui/MotionDecor'

function ProjectCard({ project, onSelect }) {
  return (
    <article className="project-card" data-reveal data-tilt data-timeline-entry>
      <button
        className="project-visual"
        onClick={() => onSelect(project)}
        aria-label={`Read case study: ${project.label}`}
      >
        <img
          src={project.image}
          alt={`Original conceptual illustration for ${project.label}; not an application screenshot`}
          width="800"
          height="480"
          loading="lazy"
        />
        <span className="project-number">{project.number}</span>
        <span className="illustration-label">Concept illustration</span>
        <span className="project-open" aria-hidden="true">
          <ArrowUpRight size={22} />
        </span>
      </button>
      <div className="project-content">
        <div className="project-meta">
          <span>{project.category}</span>
          <span>{project.date}</span>
        </div>
        <h3>
          <button onClick={() => onSelect(project)}>{project.label}</button>
        </h3>
        <p className="project-tagline">{project.title}</p>
        <p className="project-summary">{project.summary}</p>
        <ul className="tags" aria-label="Technologies">
          {project.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <div className="project-card-bottom">
          <span>{project.context}</span>
          <button className="text-link" onClick={() => onSelect(project)}>
            View case study
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

function ProjectDialog({ project, onClose }) {
  const { dialogRef, closeRef, containFocus } = useDialog()

  return (
    <dialog
      ref={dialogRef}
      className="project-dialog"
      aria-labelledby="case-study-title"
      onKeyDown={containFocus}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-inner">
        <button
          ref={closeRef}
          className="dialog-close"
          onClick={onClose}
          aria-label="Close case study"
        >
          <X size={22} />
        </button>
        <img
          className="dialog-visual"
          src={project.image}
          alt={`Concept illustration for ${project.label}`}
          width="800"
          height="480"
        />
        <div className="dialog-content">
          <p className="eyebrow">
            {project.context} / {project.category}
          </p>
          <h2 id="case-study-title">{project.fullTitle}</h2>
          <p className="dialog-date">{project.date} · Concept illustration above</p>
          <p>{project.overview}</p>
          <h3>Focus & contributions</h3>
          <ul className="contribution-list">
            {project.contributions.map((item) => (
              <li key={item}>
                <Check size={17} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <ul className="tags" aria-label="Technologies">
            {project.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <aside className="case-note">
            <strong>Project context</strong>
            <p>{project.note}</p>
          </aside>
          {project.repositoryUrl || project.demoUrl ? (
            <div className="dialog-actions">
              {project.repositoryUrl && (
                <ExternalLink className="button button--outline" href={project.repositoryUrl}>
                  <Github size={17} aria-hidden="true" />
                  Repository
                </ExternalLink>
              )}
              {project.demoUrl && (
                <ExternalLink className="button" href={project.demoUrl}>
                  <ExternalLinkIcon size={17} aria-hidden="true" />
                  Live demo
                </ExternalLink>
              )}
            </div>
          ) : (
            <p className="project-links-pending">Public project links are not available yet.</p>
          )}
        </div>
      </div>
    </dialog>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All projects')
  const [selected, setSelected] = useState(null)
  const visible =
    filter === 'All projects' ? projects : projects.filter((project) => project.category === filter)

  return (
    <section id="projects" className="section projects-section" aria-labelledby="projects-title">
      <div className="container">
        <div className="section-header-row">
          <SectionHeading
            eyebrow="03 / Selected work"
            title={
              <>
                Ideas built.
                <br />
                <span className="text-blue">Details tested.</span>
              </>
            }
            id="projects-title"
          >
            A selection of academic projects and research, viewed through development and quality
            assurance.
          </SectionHeading>
          <p className="section-side-note">
            From connected devices
            <br />
            to connected experiences.
          </p>
        </div>
        <div className="project-filters" role="group" aria-label="Filter projects by category">
          {['All projects', 'Research & IoT', 'Web & mobile'].map((category) => (
            <button
              key={category}
              aria-pressed={category === filter}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="sr-only" role="status">
          Showing {visible.length} projects for {filter}
        </p>
        {visible.length === 0 && (
          <ApiCollectionState
            status="empty"
            title="No published projects in this selection."
            message="Choose another category or check back later."
          />
        )}
        {visible.length > 0 && (
          <div className="project-grid milestone-track" data-stagger data-timeline>
            <TimelineRail />
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>
      {selected && <ProjectDialog project={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
