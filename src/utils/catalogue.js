const isText = (value) => typeof value === 'string'
const isTextArray = (value) => Array.isArray(value) && value.every(isText)

export function isProjectRecord(project) {
  return Boolean(
    project &&
      isText(project.id) &&
      /^\d+$/.test(project.id) &&
      [
        'slug',
        'number',
        'label',
        'fullTitle',
        'title',
        'date',
        'category',
        'context',
        'summary',
        'overview',
        'note',
      ].every((key) => isText(project[key])) &&
      isTextArray(project.technologies) &&
      isTextArray(project.contributions),
  )
}

export function isQaEvidenceRecord(report) {
  return Boolean(
    report &&
      isText(report.id) &&
      /^\d+$/.test(report.id) &&
      report.summaryApproved === true &&
      typeof report.sourceReviewed === 'boolean' &&
      typeof report.publicReportApproved === 'boolean' &&
      [
        'slug',
        'title',
        'category',
        'primaryTool',
        'context',
        'summary',
        'scope',
        'result',
        'limitations',
        'sourceNote',
      ].every((key) => isText(report[key])) &&
      isTextArray(report.technologies) &&
      isTextArray(report.implementation) &&
      (report.reportUrl === null ||
        (report.publicReportApproved &&
          isText(report.reportUrl) &&
          /^https:\/\//.test(report.reportUrl))),
  )
}
