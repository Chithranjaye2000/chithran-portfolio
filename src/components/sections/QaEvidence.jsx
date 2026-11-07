import { useState } from 'react'
import {
  Activity,
  Braces,
  Code2,
  FileSearch,
  ShieldCheck,
  Smartphone,
  Workflow,
} from 'lucide-react'
import { qaCategories, qaReports, testingApproach } from '../../data/qaReports'
import QaEvidenceCarousel from '../ui/QaEvidenceCarousel'
import ApiCollectionState from '../ui/ApiCollectionState'
import { SectionHeading } from '../ui/Primitives'
import '../../styles/qa-evidence.css'

const icons = {
  automation: Workflow,
  api: Braces,
  performance: Activity,
  mobile: Smartphone,
  security: ShieldCheck,
  analysis: Code2,
  reports: FileSearch,
}

const approved = qaReports.filter((report) => report.summaryApproved)

export default function QaEvidence() {
  const [filter, setFilter] = useState('all')
  const visible =
    filter === 'all' ? approved : approved.filter((report) => report.category === filter)

  return (
    <section id="qa-evidence" className="section qa-section" aria-labelledby="qa-evidence-title">
      <div className="container">
        <SectionHeading
          eyebrow="01 / QA reports & testing evidence"
          title="Featured QA Work"
          id="qa-evidence-title"
        >
          These reports cover testing work I’ve done with automation, APIs, performance tools, and
          code analysis. Each entry includes the scope, recorded results, and limitations.
        </SectionHeading>
        <ul className="qa-focus-areas" aria-label="QA areas of focus" data-reveal>
          {qaCategories
            .filter((category) => category.id !== 'reports')
            .map((category) => {
              const Icon = icons[category.icon]
              return (
                <li key={category.id}>
                  <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
                  {category.label}
                </li>
              )
            })}
        </ul>
        <div className="qa-approach" data-reveal>
          <div>
            <p className="eyebrow">Testing process</p>
            <h3>How I approach a test</h3>
            <p>
              I start with the requirements, run the checks, and document the results and any
              issues.
            </p>
          </div>
          <ol>
            {testingApproach.map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="project-filters qa-filters" role="group" aria-label="Filter QA evidence">
          {[{ id: 'all', label: 'All evidence' }, ...qaCategories].map((category) => (
            <button
              key={category.id}
              aria-pressed={filter === category.id}
              aria-controls="qa-results"
              onClick={() => setFilter(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <p className="qa-result-count" role="status" aria-atomic="true">
          Showing {visible.length} QA {visible.length === 1 ? 'entry' : 'entries'}
        </p>
        {visible.length === 0 && (
          <ApiCollectionState
            status="empty"
            title="No published QA evidence in this selection."
            message="Choose another category or check back later."
          />
        )}
        {visible.length > 0 && <QaEvidenceCarousel key={filter} reports={visible} />}
      </div>
    </section>
  )
}
