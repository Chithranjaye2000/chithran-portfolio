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
  { Icon: ShieldCheck, title: 'Quality assurance', subtitle: 'Confidence in every release' },
  { Icon: Code2, title: 'Software development', subtitle: 'Ideas turned into experiences' },
  { Icon: Video, title: 'Technical content', subtitle: 'Complexity made clear' },
]

export default function Hero() {
  const [imageFailed, setImageFailed] = useState(false)
  const isPlaceholder = imageFailed || siteConfig.profileImageIsPlaceholder

  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <AmbientBackground />
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow" data-hero-step="0">
            <span className="eyebrow-line" />
            Quality. Code. Clarity.
          </p>
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
            I build thoughtful software, test the details that matter, and turn technical ideas into
            stories people understand.
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
              <span>A little about the person behind the work</span>
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
                <strong>Based in Sri Lanka</strong>
                <span>Ratnapura · Open to connecting</span>
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
              Built with curiosity.
              <br />
              <strong>Refined through testing.</strong>
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
