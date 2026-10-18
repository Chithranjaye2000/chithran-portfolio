import { existsSync, openSync, readSync, closeSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { siteConfig } from './src/data/siteConfig.js'
import { certifications } from './src/data/certifications.js'
import { qaReports } from './src/data/qaReports.js'

function hasPdf(publicPath) {
  const path = fileURLToPath(new URL(`./public${publicPath}`, import.meta.url))
  if (!existsSync(path)) return false
  let file
  try {
    file = openSync(path, 'r')
    const header = Buffer.alloc(5)
    readSync(file, header, 0, 5, 0)
    return header.toString() === '%PDF-'
  } catch {
    return false
  } finally {
    if (file !== undefined) closeSync(file)
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Preserve Vite's default deny rules and keep unreviewed evidence off the dev server.
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc',
        '.yarnrc.yml',
        '**/.git/**',
        '**/reports-source/**',
        '**/tmp/pdfs/**',
      ],
    },
  },
  // Re-evaluated when Vite starts/builds: an absent or invalid CV never creates a download link.
  define: {
    __CV_AVAILABLE__: JSON.stringify(hasPdf(siteConfig.cvPath)),
    __QA_REPORT_FILES__: JSON.stringify(
      qaReports
        .filter((report) => report.sourceReviewed && report.publicReportApproved)
        .map((report) => report.reportUrl)
        .filter(
          (path) =>
            typeof path === 'string' &&
            /^\/documents\/qa-reports\/[a-z0-9-]+\.pdf$/.test(path) &&
            hasPdf(path),
        ),
    ),
    __CERTIFICATE_IMAGES__: JSON.stringify(
      certifications
        .map((certificate) => certificate.imagePath)
        .filter(
          (path) => path && existsSync(fileURLToPath(new URL(`./public${path}`, import.meta.url))),
        ),
    ),
  },
})
