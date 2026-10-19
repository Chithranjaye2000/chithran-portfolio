import { ArrowUp } from 'lucide-react'
import { SocialLinks } from '../ui/Primitives'
import { siteConfig } from '../../data/siteConfig'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top" data-reveal>
        <div>
          <a className="footer-name" href="#home">
            {siteConfig.name}
            <span>.</span>
          </a>
          <p>Quality. Code. Clarity.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#education">Education</a>
          <a href="#certifications">Certifications</a>
          <a href="#contact">Contact</a>
        </nav>
        <SocialLinks />
      </div>
      <div className="container footer-bottom" data-reveal>
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <p>Thoughtfully built in Sri Lanka.</p>
        <a href="#home">
          Back to top
          <ArrowUp size={15} aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}
