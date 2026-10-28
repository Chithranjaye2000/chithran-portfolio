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
import { qaCategories, qaEvidenceSource, testingApproach } from '../../data/qaReports'
import useApiCollection from '../../hooks/useApiCollection'
import { isQaEvidenceRecord } from '../../utils/catalogue'
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

export default function QaEvidence() {
  const [filter, setFilter] = useState('all')
  const path =
    filter === 'all'
      ? '/api/qa-evidence'
      : `/api/qa-evidence?${new URLSearchParams({ category: filter })}`
  const collection = useApiCollection(path, isQaEvidenceRecord)
  const approved = collection.data
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
        {collection.status === 'success' && (
          <p className="qa-result-count" role="status" aria-atomic="true">
            Showing {visible.length} QA {visible.length === 1 ? 'entry' : 'entries'}
          </p>
        )}
        {collection.status === 'loading' && (
          <ApiCollectionState
            status="loading"
            title="Loading QA evidence…"
            message="Retrieving the approved testing reports."
          />
        )}
        {collection.status === 'error' && (
          <ApiCollectionState
            status="error"
            title="QA evidence could not be loaded."
            message={collection.error}
            onRetry={collection.reload}
          />
        )}
        {collection.status === 'success' && visible.length === 0 && (
          <ApiCollectionState
            status="empty"
            title="No published QA evidence in this selection."
            message="Choose another category or check back later."
          />
        )}
        {collection.status === 'success' && visible.length > 0 && (
          <QaEvidenceCarousel key={`${filter}:${collection.revision}`} reports={visible} />
        )}
      </div>
    </section>
  )
}
