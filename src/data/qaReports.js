export const qaCategories = [
  { id: 'automation', label: 'Test Automation', icon: 'automation' },
  { id: 'api', label: 'API Testing', icon: 'api' },
  { id: 'performance', label: 'Performance Testing', icon: 'performance' },
  { id: 'mobile', label: 'Mobile Testing', icon: 'mobile' },
  { id: 'security', label: 'Security Testing', icon: 'security' },
  { id: 'analysis', label: 'Static Code Analysis', icon: 'analysis' },
]

export const testingApproach = [
  'Requirements',
  'Test Design',
  'Test Execution',
  'Result Validation',
  'Defect Investigation',
  'Reporting',
]

export const qaEvidenceSource = {
  label: 'Owner-supplied work summaries',
  description:
    'These case studies are based on my supplied summaries of previous testing work. Original report PDFs have not been reviewed for this portfolio; public report copies are not available yet.',
}

// The owner approved these summaries as source material on 18 October 2026.
// Summary approval does not authorise publication of the original PDFs or Drive folder.
const summarySource = {
  summaryApproved: true,
  sourceReviewed: false,
  sourceNote: 'Based on the owner-supplied work summary. Original PDF not reviewed.',
  reportUrl: null,
  publicReportApproved: false,
}

export const qaReports = [
  {
    ...summarySource,
    id: 'jmeter-talenthub',
    title: 'TalentHub Performance Testing',
    category: 'performance',
    primaryTool: 'Apache JMeter',
    technologies: ['HTTP requests', 'Thread Groups', 'Timers', 'Result listeners'],
    context: 'TalentHub testing environment',
    summary:
      'Configured performance test plans and analysed response times, throughput, errors, and response-time percentiles.',
    scope: 'Baseline, load, stress, spike, and endurance testing work.',
    result: 'Previously recorded baseline and load runs showed a 0.00% error rate.',
    implementation: [
      'Configured Thread Groups, HTTP requests, cookies, headers, timers, and listeners.',
      'Worked with baseline, load, stress, spike, and endurance testing.',
      'Analysed response time, throughput, error rate, and response-time percentiles.',
    ],
    limitations:
      'Testing-environment measurements only. Server-side monitoring was unavailable; these results do not establish production capacity or that every workload passed.',
  },
  {
    ...summarySource,
    id: 'playwright-myslt',
    title: 'MySLT Portal Automation',
    category: 'automation',
    primaryTool: 'Playwright',
    technologies: ['Java', 'TestNG', 'Maven', 'IntelliJ IDEA', 'Chromium'],
    context: 'MySLT portal workflow',
    summary:
      'Automated a login-to-form workflow while investigating environment configuration and navigation-timeout behaviour.',
    scope: 'Login/authenticated state → New Services → Megaline → connection-request form.',
    result:
      'Verified the authenticated state and filled the form, stopping before a real connection request was submitted.',
    implementation: [
      'Verified login and authenticated state in the documented workflow.',
      'Navigated to New Services, selected Megaline, and filled a connection-request form.',
      'Worked on environment configuration and navigation-timeout debugging.',
    ],
    limitations:
      'This is a bounded Chromium workflow. No successful service submission or comprehensive cross-browser execution is claimed.',
  },
  {
    ...summarySource,
    id: 'rest-assured-api',
    title: 'API Checks with REST Assured',
    category: 'api',
    primaryTool: 'REST Assured',
    technologies: ['Java', 'Maven', 'TestNG', 'IntelliJ IDEA', 'JSONPlaceholder'],
    context: 'JSONPlaceholder sample API',
    summary:
      'Implemented request and response checks using Given–When–Then, validating HTTP status codes and selected JSON values.',
    scope: 'GET, POST, PUT, and DELETE checks against the /posts resource.',
    result: 'The previously documented execution recorded four tests passing.',
    implementation: [
      'Tested GET, POST, PUT, and DELETE requests against /posts.',
      'Validated HTTP status codes and selected JSON response values.',
      'Used REST Assured Given–When–Then syntax with TestNG and Maven.',
    ],
    limitations:
      'JSONPlaceholder simulates writes without permanent persistence. This exercise does not establish production API, security, or schema-validation coverage.',
  },
  {
    ...summarySource,
    id: 'appium-android',
    title: 'Android Settings Automation & Troubleshooting',
    category: 'mobile',
    primaryTool: 'Appium',
    technologies: ['Java', 'Maven', 'TestNG', 'Android emulator'],
    context: 'Android Settings on a local emulator',
    summary:
      'Worked on mobile session setup, element interaction, and execution troubleshooting in Android Settings.',
    scope: 'Local emulator sessions, locators, waits, and scrolling.',
    result:
      'Some planned tests encountered execution failures; the exercise includes troubleshooting work.',
    implementation: [
      'Worked with Java-based Appium session setup using Maven and TestNG.',
      'Investigated locator strategies, waits, and scrolling in Android Settings.',
      'Troubleshot execution failures rather than treating script failures as confirmed application defects.',
    ],
    limitations:
      'Not all planned checks passed. The available summary does not provide individual pass counts or establish confirmed Android application defects.',
  },
  {
    ...summarySource,
    id: 'sonarqube-bell-pepper',
    title: 'Bell Pepper Monitor Static Analysis',
    category: 'analysis',
    primaryTool: 'SonarQube Community Build',
    technologies: ['Java 21', 'SonarScanner CLI', 'sonar-project.properties'],
    context: 'Historical Bell Pepper Monitor analysis',
    summary:
      'Performed static code analysis and reviewed the recorded Quality Gate alongside the remaining issue findings.',
    scope: 'A recorded analysis of approximately 3.6k lines of code.',
    result:
      'Historical snapshot: Quality Gate passed, with 2 security, 25 reliability, and 57 maintainability issues recorded.',
    implementation: [
      'Used SonarQube Community Build, Java 21, Scanner CLI, and sonar-project.properties for analysis.',
      'Recorded approximately 3.6k lines of code and the security, reliability, and maintainability issue counts.',
      'The historical analysis measured 0.0% coverage for 758 lines to cover and 4.4% duplication.',
    ],
    limitations:
      'These are historical figures, not the current project state. A passed Quality Gate does not mean every issue was fixed; no subsequent fixes or analysis are claimed.',
  },
  {
    ...summarySource,
    id: 'zap-web-security',
    title: 'Web Security Scanning & Alert Review',
    category: 'security',
    primaryTool: 'OWASP ZAP',
    technologies: ['Firefox proxy', 'HTTP/HTTPS traffic inspection'],
    context: 'TalentHub testing environment',
    summary:
      'Configured proxy-based traffic inspection, ran security scans, and reviewed the resulting alerts.',
    scope: 'Security-testing exercise and alert review in a testing environment.',
    result:
      'Previously recorded scan: 33 alerts — 0 high, 10 medium, 12 low, and 11 informational.',
    implementation: [
      'Used Firefox proxy configuration to inspect HTTP/HTTPS traffic.',
      'Ran scans and reviewed alerts by risk level.',
      'This public summary excludes internal URLs, credentials, identifiable traffic, and confidential findings.',
    ],
    limitations:
      'Scanner alerts require verification; they are not automatically confirmed vulnerabilities. This exercise is not a penetration test or proof that the application is secure.',
  },
  {
    ...summarySource,
    id: 'selenium-data-driven-login',
    title: 'Data-Driven Login Automation with Selenium',
    category: 'automation',
    primaryTool: 'Selenium WebDriver',
    technologies: ['Python 3', 'Chrome / ChromeDriver', 'openpyxl', 'Excel', 'VS Code'],
    context: 'Facebook login automation exercise',
    summary:
      'Read test records from Excel, automated browser interactions, compared outcomes, and wrote execution results back to the workbook.',
    scope: 'Three login test cases with Excel-driven inputs and result reporting.',
    result: 'Two expected-success cases recorded FAIL; one expected-failure case recorded PASS.',
    implementation: [
      'Read test cases from Excel using openpyxl and launched Chrome through Selenium WebDriver.',
      'Entered test data, interacted with the login button, and compared expected and actual results.',
      'Wrote Actual Result and PASS/FAIL outcomes back to Excel.',
    ],
    limitations:
      'Facebook detected or restricted automation in the expected-success cases. Successful Facebook authentication was not achieved; no credentials or personal information are published.',
  },
]
