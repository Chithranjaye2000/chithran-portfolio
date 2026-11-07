import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { Github, Linkedin } from '../ui/BrandIcons'
import { siteConfig } from '../../data/siteConfig'
import { ExternalLink } from '../ui/Primitives'
import ContactForm from '../ui/ContactForm'

export default function Contact() {
  return (
    <section id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <div data-reveal>
          <p className="eyebrow">08 / Let’s connect</p>
          <h2 id="contact-title">
            Get in
            <br />
            touch<span>.</span>
          </h2>
          <p>For QA or development opportunities, or questions about my work, send me a message.</p>
          <a className="button button--white" href={`mailto:${siteConfig.email}`}>
            Say hello
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="contact-details" data-reveal>
          <a className="contact-row" href={`mailto:${siteConfig.email}`}>
            <Mail className="contact-row-icon" size={21} aria-hidden="true" />
            <span className="contact-row-content">
              <span className="contact-label">EMAIL</span>
              <strong>{siteConfig.email}</strong>
            </span>
            <ArrowUpRight className="contact-row-arrow" size={20} aria-hidden="true" />
          </a>
          {siteConfig.showPhone && (
            <a className="contact-row" href={siteConfig.phoneHref}>
              <Phone className="contact-row-icon" size={21} aria-hidden="true" />
              <span className="contact-row-content">
                <span className="contact-label">PHONE</span>
                <strong>{siteConfig.phone}</strong>
              </span>
              <ArrowUpRight className="contact-row-arrow" size={20} aria-hidden="true" />
            </a>
          )}
          <div className="contact-row">
            <MapPin className="contact-row-icon" size={21} aria-hidden="true" />
            <span className="contact-row-content">
              <span className="contact-label">BASED IN</span>
              <strong>{siteConfig.location}</strong>
            </span>
          </div>
          <div className="contact-socials">
            <ExternalLink href={siteConfig.linkedinUrl}>
              <Linkedin size={17} aria-hidden="true" />
              LinkedIn
              <ArrowUpRight size={15} aria-hidden="true" />
            </ExternalLink>
            <ExternalLink href={siteConfig.githubUrl}>
              <Github size={17} aria-hidden="true" />
              GitHub
              <ArrowUpRight size={15} aria-hidden="true" />
            </ExternalLink>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
