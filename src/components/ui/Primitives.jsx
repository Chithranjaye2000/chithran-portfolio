import { ArrowUpRight } from 'lucide-react'
import { Github, Linkedin } from './BrandIcons'
import { siteConfig } from '../../data/siteConfig'

export function ExternalLink({ href, children, className = '', ...props }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

export function SocialLinks({ className = '' }) {
  return (
    <div className={`social-links ${className}`}>
      <ExternalLink href={siteConfig.linkedinUrl} aria-label="Chithran on LinkedIn">
        <Linkedin size={19} aria-hidden="true" />
        <span className="sr-only">LinkedIn</span>
      </ExternalLink>
      <ExternalLink href={siteConfig.githubUrl} aria-label="Chithran on GitHub">
        <Github size={19} aria-hidden="true" />
        <span className="sr-only">GitHub</span>
      </ExternalLink>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, children, id, light = false }) {
  return (
    <div className={`section-heading${light ? ' section-heading--light' : ''}`} data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {children && <p className="section-intro">{children}</p>}
    </div>
  )
}

export function TextLink({ href, children }) {
  return (
    <a className="text-link" href={href}>
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  )
}
