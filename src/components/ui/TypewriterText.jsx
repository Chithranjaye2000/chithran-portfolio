import { useEffect, useState } from 'react'

const roles = ['QA Automation', 'API Testing', 'Manual Testing', 'Performance Testing']

export default function TypewriterText() {
  const [text, setText] = useState('')
  const [isStatic, setIsStatic] = useState(false)

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timeout
    let wordIndex = 0
    let characterIndex = 0
    let deleting = false

    function clearAnimation() {
      window.clearTimeout(timeout)
    }

    function startAnimation() {
      clearAnimation()

      if (motionPreference.matches) {
        setText(roles[0])
        setIsStatic(true)
        return
      }

      setIsStatic(false)
      setText('')
      wordIndex = 0
      characterIndex = 0
      deleting = false

      function advance() {
        const role = roles[wordIndex]

        if (!deleting) {
          characterIndex += 1
          setText(role.slice(0, characterIndex))
          if (characterIndex === role.length) {
            deleting = true
            timeout = window.setTimeout(advance, 1250)
            return
          }
          timeout = window.setTimeout(advance, 78)
          return
        }

        characterIndex -= 1
        setText(role.slice(0, characterIndex))
        if (characterIndex === 0) {
          deleting = false
          wordIndex = (wordIndex + 1) % roles.length
          timeout = window.setTimeout(advance, 320)
          return
        }
        timeout = window.setTimeout(advance, 42)
      }

      timeout = window.setTimeout(advance, 180)
    }

    startAnimation()
    motionPreference.addEventListener('change', startAnimation)

    return () => {
      clearAnimation()
      motionPreference.removeEventListener('change', startAnimation)
    }
  }, [])

  return (
    <span className={`hero-role hero-typewriter${isStatic ? ' hero-typewriter--static' : ''}`}>
      <span className="hero-typewriter-reserve" aria-hidden="true">
        Performance Testing
      </span>
      <span className="hero-typewriter-line" aria-hidden="true">
        <span className="hero-typewriter-text">{text}</span>
        {!isStatic && <span className="hero-typewriter-cursor" />}
      </span>
    </span>
  )
}
