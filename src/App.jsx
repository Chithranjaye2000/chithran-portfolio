import { useRef } from 'react'
import usePortfolioMotion from './hooks/usePortfolioMotion'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import QaTools from './components/sections/QaTools'
import About from './components/sections/About'
import Experience from './components/sections/Experience'
import Projects from './components/sections/Projects'
import QaEvidence from './components/sections/QaEvidence'
import Skills from './components/sections/Skills'
import AiLiteracy from './components/sections/AiLiteracy'
import Content from './components/sections/Content'
import Certifications from './components/sections/Certifications'
import Contact from './components/sections/Contact'

export default function App() {
  const mainRef = useRef(null)
  usePortfolioMotion(mainRef)

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <Hero />
        <QaTools />
        <About />
        <Experience />
        <Projects />
        <QaEvidence />
        <Skills />
        <AiLiteracy />
        <Content />
        <Certifications />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
