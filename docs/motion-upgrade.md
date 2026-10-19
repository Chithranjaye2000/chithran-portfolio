# Portfolio motion upgrade

19 October 2026. Implemented locally in the existing React/Vite application. No dependencies installed and no commit, push, or deployment performed.

## What changed

1. **Ambient hero:** three blue/cyan gradient orbs and six light points animate transform/opacity, with a subtle grid and small desktop pointer offset. No canvas, WebGL, animated blur, or video background. Offscreen/hidden-page animation pauses; mobile and reduced-motion backgrounds are static.
2. **Hero reveals:** existing content enters by name line and role, followed by the introduction, buttons, social links, and photo. Screen readers retain the complete name and role text. A single underline entrance accents the existing surname; no copy was replaced.
3. **Card depth:** all four main project cards, seven QA case-study cards, and twelve video cards opt into the same delegated tilt system. Main cards cap each axis at 5 degrees; quieter cards cap it at 3. Image parallax composes with existing zoom/lift. Controls remain visible and keyboard accessible.
4. **Viewport timelines:** decorative progress rails and current-entry borders sit beside the existing internship, project, education, and certification layouts. No dates, entries, achievements, or chronological claims were added. Child reveals use controlled staggering.
5. **Skills and collections:** existing skill categories receive restrained icon/card hover motion. Certification previews retain their original images and dialogs, with grouped reveals and hover feedback. Four one-time counters derive from current data: 4 projects, 7 approved QA summaries, 9 certification records, 12 videos. These are portfolio collection sizes. Final accessible values stay constant while decorative digits animate.
6. **Navigation:** a thin reading-progress indicator, scrolling header shadow, active underline, Contact active state, and button press feedback extend the existing navigation. Native anchors, direct hashes, browser history, mobile menu, and focus states are retained.

## Architecture and fallbacks

The existing `usePortfolioMotion` hook owns one frame scheduler shared by scroll/pointer updates and counters. It uses a reveal observer, one persistent track/ambient observer, and resize/mutation observation for dynamic filters and content size changes. One passive scroll listener serves the document; no handlers are attached to individual cards. React does not render per pointer or scroll frame. Cleanup cancels scheduled work, native animations, counters, observers, and listeners.

Entrances animate individual `translate` plus opacity, leaving CSS `transform` for hover/tilt. Browsers without individual-translate support use the previous transform entrance with tilt disabled. Content/final counts are visible before enhancement; missing IntersectionObserver or Web Animations support does not hide rendered content. Reduced-motion changes cancel in-flight work. Focus restores neutral depth and reveals focused content immediately. No permanent `will-change` is applied.

`data-reveal`, `data-stagger`, `data-hero-step`, `data-tilt`, `data-timeline`, `data-timeline-entry`, and `data-count-to` are the reusable opt-ins. See the README for timings and maintenance guidance.

## Files

Created:

- `src/utils/motion.js`
- `src/components/ui/MotionDecor.jsx`
- `tests/motion.test.js`
- `docs/motion-upgrade.md`

Modified:

- `src/hooks/usePortfolioMotion.js`, `src/styles/motion.css`
- `src/components/layout/Header.jsx`, `src/components/layout/Footer.jsx`
- `src/components/sections/Hero.jsx`, `About.jsx`, `Experience.jsx`, `Projects.jsx`, `QaEvidence.jsx`, `Skills.jsx`, `Content.jsx`, `Education.jsx`, `Certifications.jsx`
- `src/components/ui/CertificateCard.jsx`, `QaReportCard.jsx`, `VideoCard.jsx`
- `package.json` (adds the native Node test command only)
- `README.md`, `QA.md`

The pre-existing uncommitted project PNG replacements and portfolio-data edits are preserved. No portfolio data module, asset, dependency version, lockfile, or deployment setting was changed by this upgrade.

## Verification and limits

Validation uses Chromium in the local browser plus Node's built-in test runner; no additional test library is installed. Browser checks include real native hero keyframes, ambient pause state, 3D matrices on all four main project cards plus Bell Pepper Monitor and the featured video, project-rail state, reading progress reaching 100% at the footer, and counters reaching their data-derived totals without replaying on a second visit.

All four project dialogs and six image-certificate dialogs opened and closed with Escape and restored focus. Certificate focus containment was checked with Shift+Tab. The mobile menu was tested with Tab, Enter, Escape, and link selection, including its closed inert state. All 23 displayed images decoded successfully. Internal anchors resolve to real elements; new-tab links retain both safety attributes; email/telephone destinations match the existing configuration.

The CV action triggered an actual download whose SHA-256 matched the supplied PDF. No email was sent and no telephone call was placed. Third-party account/sharing permissions, remote production availability, other browser engines, physical mobile devices, and a formal screen-reader audit are outside this local verification. The Vercel production build is checked locally; no deployment is published.

Responsive checks cover **320, 375, 768, 1024, and 1440px**, with no horizontal overflow, clipped name, or desktop navigation overlap. Reduced-motion emulation yielded no hero animations, no tilt, final counter values, full static rails, and readable content. Temporary test viewport/media overrides are reset after review.

Commands: `npm run test`, `npm run lint`, `npm run format:check`, `npm run build`. Use the installed npm CLI workaround in README if the machine's default launcher still points to the missing roaming installation.
