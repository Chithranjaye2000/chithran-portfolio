import { Fragment, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Code2,
  Download,
  MapPin,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { siteConfig } from '../../data/siteConfig'
import { SocialLinks } from '../ui/Primitives'
import { AmbientBackground } from '../ui/MotionDecor'

const disciplines = [
  { Icon: ShieldCheck, title: 'Quality assurance', subtitle: 'API testing and automation' },
  { Icon: Code2, title: 'Software development', subtitle: 'Web and mobile projects' },
  { Icon: Video, title: 'Technical content', subtitle: 'Demos and system walkthroughs' },
]

export default function Hero() {
  const [imageFailed, setImageFailed] = useState(false)
  const isPlaceholder = imageFailed || siteConfig.profileImageIsPlaceholder

  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <AmbientBackground />
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title">
            <span className="hero-name-line" data-hero-step="1">
              Chithran
            </span>
            <br />
            <span className="hero-name-line hero-name-accent" data-hero-step="2">
              Jayathunga.
            </span>
          </h1>
          <p className="hero-headline">
            {siteConfig.headline.split(' | ').map((role, index, roles) => (
              <Fragment key={role}>
                <span className="hero-role" data-hero-step={3 + index * 0.5}>
                  {role}
                </span>
                {index < roles.length - 1 && ' | '}
              </Fragment>
            ))}
          </p>
          <p className="hero-intro" data-hero-step="4">
            I’m an Industrial Information Technology undergraduate with QA internship experience at
            SLT. I test software, build academic projects, and create technical videos.
          </p>
          <div className="hero-actions" data-hero-step="5">
            <a className="button" href="#projects">
              View projects
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="button button--outline" href="#contact">
              Contact me
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="hero-secondary" data-hero-step="6">
            <SocialLinks />
            <span className="vertical-divider" aria-hidden="true" />
            {__CV_AVAILABLE__ ? (
              <a className="download-link" href={siteConfig.cvPath} download>
                <Download size={16} aria-hidden="true" />
                Download CV
              </a>
            ) : (
              <span className="cv-pending">
                <Download size={16} aria-hidden="true" />
                CV coming soon
              </span>
            )}
          </div>
        </div>
        <div className="hero-visual" data-hero-step="2">
          <div className="portrait-frame">
            <div className="portrait-topline">
              <span className="small-cross" aria-hidden="true">
                +
              </span>
              <span>Software QA · Development · Technical videos</span>
              <span className="small-cross" aria-hidden="true">
                +
              </span>
            </div>
            <img
              className={isPlaceholder ? 'portrait-image is-placeholder' : 'portrait-image'}
              src={
                imageFailed
                  ? '/images/profile/profile-placeholder.svg'
                  : siteConfig.profileImagePath
              }
              alt={
                isPlaceholder
                  ? 'CJ monogram — professional photo placeholder'
                  : 'Chithran Jayathunga'
              }
              width="600"
              height="660"
              fetchPriority="high"
              onError={() => setImageFailed(true)}
            />
            {isPlaceholder && <span className="photo-note">Professional photo coming soon</span>}
            <div className="portrait-caption">
              <span className="location-pin">
                <MapPin size={17} aria-hidden="true" />
              </span>
              <div>
                <strong>{siteConfig.location}</strong>
                <span>Open to connecting</span>
              </div>
              <span className="sri-lanka-code" aria-hidden="true">
                LK
              </span>
            </div>
          </div>
          <div className="quality-note">
            <span>
              <Check size={17} strokeWidth={3} aria-hidden="true" />
            </span>
            <div>
              Completed QA internship
              <br />
              <strong>Sri Lanka Telecom (SLT)</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="container discipline-strip">
        {disciplines.map(({ Icon, title, subtitle }) => (
          <div className="discipline" key={title}>
            <Icon size={23} strokeWidth={1.6} aria-hidden="true" />
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>
        ))}
        <a className="explore-link" href="#about" aria-label="Explore more about Chithran">
          <ArrowDown size={21} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
