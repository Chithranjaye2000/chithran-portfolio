import test from 'node:test'
import assert from 'node:assert/strict'
import { qaReports } from '../src/data/qaReports.js'
import { isQaEvidenceRecord } from '../src/utils/catalogue.js'

const records = qaReports.map((report, index) => ({
  ...report,
  id: String(index + 1),
  slug: report.id,
  reportOnly: false,
}))

test('QA DTO validation preserves all nine approved records and their separate review states', () => {
  assert.equal(records.length, 9)
  assert.ok(records.every(isQaEvidenceRecord))
  assert.equal(records.filter((record) => record.sourceReviewed).length, 2)
  assert.equal(records.filter((record) => !record.sourceReviewed).length, 7)
})

test('unapproved summaries and unapproved report URLs cannot enter the carousel', () => {
  assert.equal(isQaEvidenceRecord({ ...records[0], summaryApproved: false }), false)
  assert.equal(isQaEvidenceRecord({ ...records[0], publicReportApproved: false }), false)
  assert.equal(
    isQaEvidenceRecord({ ...records[0], publicReportApproved: false, reportUrl: null }),
    true,
  )
})

test('missing fields, invalid arrays, nonboolean flags, and private report paths are rejected', () => {
  for (const invalid of [
    null,
    {},
    { ...records[0], implementation: 'invalid' },
    { ...records[0], technologies: [123] },
    { ...records[0], sourceReviewed: 'true' },
    { ...records[0], reportUrl: 'D:/private/report.pdf' },
    { ...records[0], reportUrl: '/private/report.pdf' },
    { ...records[0], reportUrl: 'javascript:alert(1)' },
  ])
    assert.equal(isQaEvidenceRecord(invalid), false)
})
