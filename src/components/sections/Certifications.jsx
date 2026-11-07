import { useState } from 'react'
import { Info } from 'lucide-react'
import { certifications } from '../../data/certifications'
import CertificateCard from '../ui/CertificateCard'
import CertificateLightbox from '../ui/CertificateLightbox'
import { SectionHeading } from '../ui/Primitives'
import { TimelineRail } from '../ui/MotionDecor'

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
        <div className="certification-grid milestone-track" data-timeline data-stagger>
          <TimelineRail />
          {certifications.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              imageAvailable={availableImages.has(certificate.imagePath)}
              onSelect={openCertificate}
            />
          ))}
        </div>
        <p className="certificate-course-note">
          Simplilearn SkillUp certificates acknowledge course completion; they are not Microsoft
          certifications. University of Moratuwa links open the general verification portal.
        </p>
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
