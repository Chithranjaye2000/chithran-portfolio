import { useState } from 'react'
import { ArrowUpRight, Award, CalendarDays, ImageOff, ScanSearch } from 'lucide-react'
import { certificateIssuers } from '../../data/certifications'
import { siteConfig } from '../../data/siteConfig'
import { ExternalLink } from './Primitives'

const completionFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const exactCompletionFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function CertificateDate({ value }) {
  if (!value) return null
  const monthOnly = value.length === 7
  const date = new Date(`${monthOnly ? `${value}-01` : value}T00:00:00Z`)
  return (
    <time dateTime={value}>
      {(monthOnly ? completionFormatter : exactCompletionFormatter).format(date)}
    </time>
  )
}

export function CertificateImageUnavailable({ expected = true }) {
  return (
    <div className="certificate-image-unavailable">
      {expected ? (
        <ImageOff size={27} strokeWidth={1.4} aria-hidden="true" />
      ) : (
        <Award size={32} strokeWidth={1.4} aria-hidden="true" />
      )}
      <span>{expected ? 'Certificate image not added yet' : 'Learning record from my CV'}</span>
    </div>
  )
}

export default function CertificateCard({ certificate, imageAvailable, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false)
  const issuer = certificateIssuers[certificate.issuer]
  const hasImage = imageAvailable && !imageFailed

  return (
    <article
      className={`certificate-card${certificate.imagePath ? '' : ' certificate-card--text'}`}
      data-reveal
      data-timeline-entry
    >
      {certificate.imagePath ? (
        <div className="certificate-media">
          {hasImage ? (
            <button
              className="certificate-image-button"
              onClick={() => onSelect(certificate, true)}
              aria-label={`View full certificate: ${certificate.title}`}
            >
              <img
                src={certificate.imagePath}
                alt={`${certificate.title} certificate issued by ${issuer.name} to Chithran Jayathunga`}
                loading="lazy"
                width="800"
                height="550"
                onError={() => setImageFailed(true)}
              />
              <span className="certificate-expand" aria-hidden="true">
                <ScanSearch size={18} />
              </span>
            </button>
          ) : (
            <CertificateImageUnavailable />
          )}
        </div>
      ) : (
        <div className="certificate-text-mark">
          <Award size={28} strokeWidth={1.5} aria-hidden="true" />
          <span>Learning record</span>
        </div>
      )}
      <div className="certificate-body">
        <p className="certificate-issuer-label">{issuer.label}</p>
        <h3>{certificate.title}</h3>
        <p className="certificate-issuer">{issuer.name}</p>
        {certificate.completedAt && (
          <p className="certificate-date">
            <CalendarDays size={14} aria-hidden="true" />
            <CertificateDate value={certificate.completedAt} />
          </p>
        )}
        <div className="certificate-actions">
          {certificate.detailsUrl ? (
            <ExternalLink
              className="text-link"
              href={certificate.detailsUrl}
              aria-label={`View Details: ${certificate.title} (opens in a new tab)`}
            >
              View Details
              <ArrowUpRight size={16} aria-hidden="true" />
            </ExternalLink>
          ) : (
            <button
              className="text-link"
              onClick={() => onSelect(certificate, hasImage)}
              aria-label={`${hasImage ? 'View certificate' : 'View details'}: ${certificate.title}`}
            >
              {hasImage ? 'View certificate' : 'View details'}
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          )}
          {certificate.issuer === 'moratuwa' && (
            <ExternalLink
              className="certificate-verification-link"
              href={siteConfig.certificateVerificationUrl}
            >
              Issuer verification
              <ArrowUpRight size={13} aria-hidden="true" />
            </ExternalLink>
          )}
        </div>
      </div>
    </article>
  )
}
