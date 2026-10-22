import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navigation } from '../../data/siteConfig'
import useAnchorNavigation from '../../hooks/useAnchorNavigation'
import ThemeToggle from '../ui/ThemeToggle'

export default function Header() {
  const headerRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 960px)').matches)
  const [activeSection, setActiveSection] = useState('home')
  useAnchorNavigation(headerRef)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const sections = [...document.querySelectorAll('main > section[id]')]
    let observer
    let marker = 0

    function updateActiveSection() {
      let active = sections[0]
      for (const section of sections) {
        const bounds = section.getBoundingClientRect()
        if (bounds.top > marker) break
        active = section
        if (bounds.bottom > marker) break
      }
      if (active) setActiveSection(active.id)
    }

    function observeSections() {
      observer?.disconnect()
      const height = Math.max(1, window.innerHeight)
      marker = Math.floor(height * 0.2)
      const band = Math.max(1, Math.round(height * 0.01))
      const bottom = Math.max(0, height - marker - band)
      // Pixel margins keep this marker tied to viewport height in landscape too.
      // Percentage IntersectionObserver margins resolve against viewport width.
      observer = new IntersectionObserver(updateActiveSection, {
        rootMargin: `-${marker}px 0px -${bottom}px 0px`,
        threshold: 0,
      })
      sections.forEach((section) => observer.observe(section))
    }

    observeSections()
    window.addEventListener('resize', observeSections, { passive: true })
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', observeSections)
    }
  }, [])

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 960px)')
    const update = (event) => {
      setIsMobile(event.matches)
      if (!event.matches) setMenuOpen(false)
    }
    mobile.addEventListener('change', update)
    return () => mobile.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.getElementById('menu-toggle')?.focus()
      }
    }
    const outside = (event) => {
      if (!event.target.closest('.site-header')) setMenuOpen(false)
    }
    document.addEventListener('keydown', close)
    // Check before React swaps the menu icon, so the event target stays attached.
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [menuOpen])

  return (
    <header ref={headerRef} className="site-header">
      <div className="reading-progress" aria-hidden="true">
        <span data-scroll-progress />
      </div>
      <div className="container header-inner">
        <a
          href="#home"
          className="brand"
          aria-label="Chithran Jayathunga — home"
          aria-current={activeSection === 'home' ? 'location' : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-mark" aria-hidden="true">
            cj<span>.</span>
          </span>
          <span className="brand-name">
            Chithran<span>Jayathunga</span>
          </span>
        </a>
        <div className="header-controls">
          <nav
            id="primary-navigation"
            aria-label="Primary navigation"
            className={`primary-nav${menuOpen ? ' is-open' : ''}`}
            inert={isMobile && !menuOpen}
          >
            {navigation.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? 'location' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              className="button button--small"
              href="#contact"
              aria-current={activeSection === 'contact' ? 'location' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Let’s talk
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </nav>
          <ThemeToggle />
          <button
            id="menu-toggle"
            className="menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="menu-toggle-icon" aria-hidden="true">
              <Menu size={23} className="menu-icon-bars" />
              <X size={23} className="menu-icon-close" />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
