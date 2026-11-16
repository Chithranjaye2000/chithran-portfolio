import { useState } from 'react'
import { Info } from 'lucide-react'
import { certifications } from '../../data/certifications'
import CertificateRing from '../ui/CertificateRing'
import CertificateLightbox from '../ui/CertificateLightbox'
import { SectionHeading } from '../ui/Primitives'

const availableImages = new Set(__CERTIFICATE_IMAGES__)

export default function Certifications() {
  const [selected, setSelected] = useState(null)
  const missingImages = certifications.some(
    (certificate) => certificate.imagePath && !availableImages.has(certificate.imagePath),
  )

  function openCertificate(certificate, showImage) {
    setSelected({ certificate, showImage })
  }

  return (
    <section
      id="certifications"
      className="section certifications-section"
      aria-labelledby="certifications-title"
    >
      <div className="container">
        <SectionHeading
          eyebrow="07 / Certifications"
          title={
            <>
              Courses &
              <br />
              <span className="text-blue">certifications.</span>
            </>
          }
          id="certifications-title"
        >
          Courses I’ve completed in testing, development, project management, data analysis, and AI.
          Open a certificate for details.
        </SectionHeading>
        {missingImages && (
          <p className="certificate-assets-notice">
            <Info size={17} aria-hidden="true" />
            <span>
              Original certificate images are being added. The learning records below remain
              available in the meantime.
            </span>
          </p>
        )}
        <CertificateRing
          certificates={certifications}
          initialCertificateId="software-quality-assurance"
          availableImages={availableImages}
          onSelect={openCertificate}
          dialogOpen={selected !== null}
        />
      </div>
      {selected && (
        <CertificateLightbox
          certificate={selected.certificate}
          showImage={selected.showImage}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
