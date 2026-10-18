import { useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import useDialog from '../../hooks/useDialog'
import { certificateIssuers } from '../../data/certifications'
import { siteConfig } from '../../data/siteConfig'
import { ExternalLink } from './Primitives'
import { CertificateDate, CertificateImageUnavailable } from './CertificateCard'

export default function CertificateLightbox({ certificate, showImage, onClose }) {
  const { dialogRef, closeRef, containFocus } = useDialog()
  const [imageFailed, setImageFailed] = useState(false)
  const issuer = certificateIssuers[certificate.issuer]
  const hasImage = showImage && !imageFailed

  return (
    <dialog
      ref={dialogRef}
      className="project-dialog certificate-dialog"
      aria-labelledby="certificate-dialog-title"
      aria-describedby="certificate-dialog-context"
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
        <div className="certificate-dialog-header">
          <div>
            <p className="eyebrow">Learning & development</p>
            <h2 id="certificate-dialog-title">{certificate.title}</h2>
          </div>
          <button
            ref={closeRef}
            className="certificate-close"
            aria-label="Close certificate"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        <div className="certificate-full-image">
          {hasImage ? (
            <img
              src={certificate.imagePath}
              alt={`Full ${certificate.title} certificate issued by ${issuer.name} to Chithran Jayathunga`}
              width="1200"
              height="825"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <CertificateImageUnavailable expected={!!certificate.imagePath} />
          )}
        </div>
        <div className="certificate-dialog-details">
          <div>
            <p className="certificate-dialog-issuer">{issuer.name}</p>
            {certificate.completedAt && (
              <p className="certificate-dialog-date">
                Completed <CertificateDate value={certificate.completedAt} />
              </p>
            )}
          </div>
          <p id="certificate-dialog-context">{issuer.note}</p>
          {!hasImage && certificate.imagePath && (
            <p className="certificate-pending-note">
              The original image is not available locally yet. The title, issuer, and month-level
              completion date are retained.
            </p>
          )}
          <div className="certificate-dialog-actions">
            {hasImage && (
              <ExternalLink className="button button--outline" href={certificate.imagePath}>
                Open original image
                <ArrowUpRight size={16} aria-hidden="true" />
              </ExternalLink>
            )}
            {certificate.issuer === 'moratuwa' && (
              <ExternalLink className="text-link" href={siteConfig.certificateVerificationUrl}>
                General university verification portal
                <ArrowUpRight size={16} aria-hidden="true" />
              </ExternalLink>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
