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
import { qaCategories, qaEvidenceSource, qaReports, testingApproach } from '../../data/qaReports'
import QaReportCard from '../ui/QaReportCard'
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

export default function QaEvidence() {
  const [filter, setFilter] = useState('all')
  const approved = qaReports.filter((report) => report.summaryApproved === true)
  const visible =
    filter === 'all' ? approved : approved.filter((report) => report.category === filter)

  return (
    <section id="qa-evidence" className="section qa-section" aria-labelledby="qa-evidence-title">
      <div className="container">
        <SectionHeading
          eyebrow="Quality in practice"
          title="QA Reports & Testing Evidence"
          id="qa-evidence-title"
        >
          I approach quality assurance through structured test design, repeatable automation,
          evidence-based analysis, and clear defect investigation.
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
        <p className="qa-provenance" data-reveal>
          <strong>{qaEvidenceSource.label}.</strong> {qaEvidenceSource.description}
        </p>
        <div className="qa-approach" data-reveal>
          <div>
            <p className="eyebrow">My testing approach</p>
            <h3>Understand. Validate. Investigate.</h3>
            <p>A personal framework for making checks repeatable and findings useful.</p>
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
        {approved.length > 0 ? (
          <>
            <div
              className="project-filters qa-filters"
              role="group"
              aria-label="Filter QA evidence"
            >
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
            <div className="qa-report-grid" id="qa-results" data-stagger>
              {visible.map((report) => (
                <QaReportCard key={report.id} report={report} />
              ))}
            </div>
            {visible.length === 0 && (
              <p className="qa-empty-category">No case studies in this category yet.</p>
            )}
          </>
        ) : (
          <div className="qa-evidence-pending" data-reveal>
            <FileSearch size={30} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h3>QA case studies are being prepared.</h3>
              <p>
                Selected testing reports will appear here after their results and public-sharing
                suitability have been reviewed.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
