# Portfolio interaction audit

22 October 2026. Local React/Vite implementation and browser verification.

| Requirement                               | Before this task                                                                                                                                                                                                | After this task                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA Evidence carousel                      | Missing. Evidence used a filtered card grid, so carousel movement, looping, controls, and drag behavior were absent.                                                                                            | Implemented a native scrolling row with one keyed card per report. Offscreen cards recycle for continuous movement without duplicate report links.                                                                                                                                                 |
| Automatic movement and reading controls   | Missing carousel behavior.                                                                                                                                                                                      | Moves at 24px/second through a visible-only animation frame loop. Previous/next and pause/resume controls are available. Movement stops on hover, focus, drag, expanded details, hidden pages, and reduced motion. Interaction pauses movement until resumed.                                      |
| Mouse and touch browsing                  | Missing carousel interaction.                                                                                                                                                                                   | Mouse dragging uses a 6px threshold, suppresses the resulting accidental click, and disables native link dragging. Native horizontal touch scrolling is retained with `overflow-x: auto`; actual touch swipe verification remains pending.                                                         |
| Details, card alignment, and report links | Native details and supplied report links already existed.                                                                                                                                                       | Preserved both. Expanding details aligns the full card row and disables resume until details close. Carousel cards omit tilt so it does not compete with dragging or scrolling.                                                                                                                    |
| Section navigation                        | Partially implemented. Native smooth anchors and accessible mobile menu behavior existed; offsets were fixed, initial fragments needed correction, and the active link could become stale in landscape layouts. | The header is measured for dynamic CSS offsets. Initial fragments align after React mount until interaction begins. Active navigation uses section geometry and a height-based observer band that is rebuilt on resize. Native links, hashes, history, and reduced-motion scrolling remain intact. |
| Appearance and motion preferences         | Glass surfaces, existing animations, reduced-motion support, and theme behavior were already present.                                                                                                           | Preserved. The carousel adds its own reduced-motion stop behavior.                                                                                                                                                                                                                                 |

## Validation

- Responsive browser checks at **320, 375, 768, 1024, and 1440px** found no document horizontal overflow. Measured header offsets were **71, 71, 76, 87, and 87px**, respectively.
- The mobile menu opened and closed, Escape restored focus to the toggle, and selecting a navigation link closed it. Every configured navigation target resolves to an existing element.
- All nine desktop navigation destinations were clicked in a 1071 × 572 landscape viewport. Each selected its correct active link and aligned its section around 99px below the viewport top (87px header + 12px section margin). The former percentage-based observer could lose its usable band in landscape; it now uses pixel margins calculated from viewport height and geometry-based selection.
- All eight QA filters produced the expected counts: **All evidence 9; Test Automation 2; API Testing 1; Performance Testing 1; Mobile Testing 1; Security Testing 1; Static Code Analysis 1; Additional Reports 2**.
- All **nine View Report destinations** and their safe new-tab behavior were preserved. External report contents were not reviewed during this task.
- Hover held movement at **0px over 45 frames**; leaving hover resumed movement by **18px over 45 frames**. Previous/next controls cycled all nine unique cards. Loop-boundary movement stayed at or below **1px per frame** during the sampled check.
- Hovering the toolbar also held movement at 0px over 30 frames; leaving the whole carousel resumed by 12px over 30 frames.
- A **140px mouse drag** moved the row without opening details. Enter opened and closed a native details disclosure; all nine cards matched heights, and resume was disabled while details remained open.
- Keyboard Tab reached all nine disclosures and all nine report links with visible focus, automatically revealing offscreen controls. Focusing the playback button held movement at 0px; explicit keyboard resume restarted it. A mobile-width loop crossed a recycling boundary with nine unique cards and a maximum sampled movement of 1px per frame.
- Reduced-motion emulation stopped carousel movement (0px over 60 frames), removed playback controls, disabled smooth anchors, and made both tools rows static. Manual report browsing remained available. The separate tools pause/show-all control retained all 14 logos without changing the QA selection or horizontal position.
- With the theme storage key removed, reload selected Dark Mode. Selecting Light Mode and reloading restored Light Mode; the original saved Dark preference was restored after testing. The synchronous bootstrap and existing theme tests cover application before React renders.
- The existing project and certificate dialogs opened by keyboard, Escape restored opener focus, and certificate Shift+Tab remained inside the dialog. The local CV returned HTTP 200 with a `%PDF-` signature. Contact mail/telephone/social destinations and safe external-link attributes were inspected without sending messages or opening external reports.
- Isolated navigation checks passed for header resize and cleanup, initial fragments, late load/font alignment, interaction cancellation, encoded/malformed/missing fragments, history preservation, and valid navigation IDs. Targeted navigation ESLint and Prettier checks passed.

Final checks after the navigation correction all exited successfully:

| Command                | Result                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run format:check` | Passed; all matched files follow Prettier formatting.                   |
| `npm run lint`         | Passed with zero warnings allowed.                                      |
| `npm run test`         | Passed all 20 tests: 6 carousel, 5 motion, and 9 theme/bootstrap tests. |
| `npm run build`        | Passed; Vite generated `dist/` successfully.                            |

The installed npm CLI was invoked through Node because the default PowerShell npm launcher points to a missing roaming installation. The exact workaround remains in the README. Targeted Prettier formatting was applied before the project-wide checks.

No browser console errors, failed recorded resource requests, or broken loaded images were observed in the local browser session. No dependencies were added. The development site remains available at `http://127.0.0.1:5173/`.

## Manual checks remaining

- Verify native horizontal swiping and vertical page scrolling on a physical touch device. The in-app browser rejected `Input.dispatchTouchEvent`, so native touch swiping was not verified here.
- Check other browser engines and assistive technology if required; current browser results cover the local Chromium environment.

No publishing or deployment was performed.

## Files changed by this audit

- `src/components/sections/QaEvidence.jsx`, `src/components/ui/QaEvidenceCarousel.jsx`, and `src/components/ui/QaReportCard.jsx`: carousel integration while preserving existing report content.
- `src/hooks/useEvidenceCarousel.js`, `src/utils/carousel.js`, and `src/styles/qa-evidence.css`: motion, interaction, controls, and responsive containment.
- `src/components/layout/Header.jsx`, `src/hooks/useAnchorNavigation.js`, and the scroll-padding declarations in `src/styles/index.css`: measured navigation offsets and initial fragment handling.
- `tests/carousel.test.js`, `README.md`, and this audit record: regression checks and maintenance/testing instructions.

The workspace already contained default-Dark changes in `index.html`, `src/utils/theme.js`, `src/styles/theme.css`, `tests/theme.test.js`, and `README.md`. Those changes were preserved; this audit did not introduce a second theme system.
