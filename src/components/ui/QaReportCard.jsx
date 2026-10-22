import { ArrowUpRight, ChevronDown, FileCheck2 } from 'lucide-react'
import { qaCategories } from '../../data/qaReports'
import { ExternalLink } from './Primitives'

const availableReports = new Set(__QA_REPORT_FILES__)

export default function QaReportCard({ report, inCarousel = false }) {
  const category = qaCategories.find((item) => item.id === report.category)
  const hasPublicReport =
    report.publicReportApproved &&
    (/^https:\/\//.test(report.reportUrl ?? '') ||
      (report.sourceReviewed && availableReports.has(report.reportUrl)))

  return (
    <article
      className="qa-report-card"
      data-reveal={inCarousel ? undefined : true}
      data-tilt={inCarousel ? undefined : 'quiet'}
    >
      <div className="qa-report-heading">
        <span className="qa-tool-icon" aria-hidden="true">
          <FileCheck2 size={22} strokeWidth={1.6} />
        </span>
        <div>
          <p className="qa-report-category">{category?.label}</p>
          {report.primaryTool && <p className="qa-report-tool">{report.primaryTool}</p>}
        </div>
      </div>
      <h3>{report.title}</h3>
      {report.reportOnly ? (
        <p className="qa-report-summary">Report link supplied by the portfolio owner.</p>
      ) : (
        <>
          <p className="qa-report-context">{report.context}</p>
          <p className="qa-report-summary">{report.summary}</p>
          <ul className="tags" aria-label="Supporting technologies">
            {report.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
          <dl className="qa-report-findings">
            <div>
              <dt>Scope</dt>
              <dd>{report.scope}</dd>
            </div>
            <div>
              <dt>Recorded result</dt>
              <dd>{report.result}</dd>
            </div>
          </dl>
          <p className="qa-report-caveat">{report.limitations}</p>
          <details className="qa-report-details">
            <summary>
              View Details<span className="sr-only">: {report.title}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div>
              <h4>Implementation & investigation</h4>
              <ul>
                {report.implementation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="qa-source-note">{report.sourceNote}</p>
            </div>
          </details>
        </>
      )}
      <div className="qa-report-action">
        {hasPublicReport ? (
          <ExternalLink
            className="text-link"
            href={report.reportUrl}
            aria-label={`View Report: ${report.title} (opens in a new tab)`}
          >
            View Report
            <ArrowUpRight size={16} aria-hidden="true" />
          </ExternalLink>
        ) : (
          <p>Public report not available</p>
        )}
      </div>
    </article>
  )
}
