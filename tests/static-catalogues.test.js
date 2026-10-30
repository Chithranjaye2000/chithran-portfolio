import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { projects } from '../src/data/portfolio.js'
import { qaCategories, qaReports } from '../src/data/qaReports.js'

let server
let projectMarkup
let qaMarkup

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[character]
  })
}

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const { default: Projects } = await server.ssrLoadModule('/src/components/sections/Projects.jsx')
  const { default: QaEvidence } = await server.ssrLoadModule(
    '/src/components/sections/QaEvidence.jsx',
  )
  projectMarkup = renderToStaticMarkup(createElement(Projects))
  qaMarkup = renderToStaticMarkup(createElement(QaEvidence))
})

after(async () => {
  await server?.close()
})

test('all four static projects render immediately with their original visible content and images', async () => {
  assert.deepEqual(
    projects.map((project) => project.id),
    ['soil-monitoring', 'quickjob', 'innovation', 'task-tracker'],
  )
  assert.equal((projectMarkup.match(/class="project-card"/g) ?? []).length, 4)
  for (const project of projects) {
    for (const value of [
      project.label,
      project.title,
      project.summary,
      project.date,
      project.context,
      ...project.technologies,
    ]) {
      assert.ok(projectMarkup.includes(escapeHtml(value)), `${project.id}: ${value}`)
    }
    assert.ok(projectMarkup.includes(`src="${project.image}"`))
    await access(new URL(`../public${project.image}`, import.meta.url))
    assert.ok(project.overview && project.note && project.contributions.length)
  }
  assert.equal((projectMarkup.match(/View case study/g) ?? []).length, 4)
  assert.equal(projectMarkup.includes('Loading projects'), false)
  assert.equal(projectMarkup.includes('could not be loaded'), false)
})

test('all nine approved static QA entries retain complete details, report links, and review metadata', () => {
  assert.deepEqual(
    qaReports.map((report) => report.id),
    [
      'jmeter-talenthub',
      'playwright-myslt',
      'rest-assured-api',
      'appium-android',
      'sonarqube-bell-pepper',
      'zap-web-security',
      'selenium-data-driven-login',
      'browserstack-report',
      'allure-report',
    ],
  )
  assert.equal(qaReports.filter((report) => report.sourceReviewed).length, 2)
  assert.ok(qaReports.every((report) => report.summaryApproved && report.publicReportApproved))
  assert.equal((qaMarkup.match(/class="qa-report-card"/g) ?? []).length, 9)
  assert.equal((qaMarkup.match(/<details class="qa-report-details">/g) ?? []).length, 9)
  for (const report of qaReports) {
    for (const value of [
      report.title,
      report.primaryTool,
      report.context,
      report.summary,
      report.scope,
      report.result,
      report.limitations,
      report.sourceNote,
      ...report.technologies,
      ...report.implementation,
    ]) {
      assert.ok(qaMarkup.includes(escapeHtml(value)), `${report.id}: ${value}`)
    }
    assert.ok(qaMarkup.includes(`href="${escapeHtml(report.reportUrl)}"`))
  }
  assert.equal((qaMarkup.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 9)
  assert.equal(qaMarkup.includes('Public report not available'), false)
  assert.equal(qaMarkup.includes('Loading QA evidence'), false)
  assert.equal(qaMarkup.includes('could not be loaded'), false)
})

test('static sections retain category filters and the existing carousel controls', () => {
  for (const category of ['All projects', 'Research & IoT', 'Web & mobile']) {
    assert.ok(projectMarkup.includes(escapeHtml(category)))
  }
  assert.equal(projects.filter((project) => project.category === 'Research & IoT').length, 1)
  assert.equal(projects.filter((project) => project.category === 'Web & mobile').length, 3)
  for (const category of qaCategories) {
    assert.ok(qaMarkup.includes(escapeHtml(category.label)))
    assert.ok(qaReports.some((report) => report.category === category.id))
  }
  for (const label of ['Previous QA report', 'Next QA report', 'Scrollable QA reports']) {
    assert.ok(qaMarkup.includes(label))
  }
  assert.ok(qaMarkup.includes('qa-carousel-viewport'))
  assert.ok(qaMarkup.includes('Drag or swipe to explore'))
})

test('Projects and QA Evidence import static data without API hooks, request paths, or fetch calls', async () => {
  for (const [file, source] of [
    ['Projects', 'portfolio'],
    ['QaEvidence', 'qaReports'],
  ]) {
    const content = await readFile(
      new URL(`../src/components/sections/${file}.jsx`, import.meta.url),
      'utf8',
    )
    assert.ok(content.includes(`../../data/${source}`))
    assert.doesNotMatch(
      content,
      /useApiCollection|fetchCollection|\/api\/projects|\/api\/qa-evidence|\bfetch\s*\(/,
    )
    assert.doesNotMatch(content, /collection\.(status|data|reload|revision)/)
  }
  const moduleIds = [...server.environments.ssr.moduleGraph.idToModuleMap.keys()]
  assert.equal(
    moduleIds.some((id) => /\/hooks\/useApiCollection\.js/.test(id)),
    false,
  )
  assert.equal(
    moduleIds.some((id) => /\/utils\/api\.js/.test(id)),
    false,
  )
})
