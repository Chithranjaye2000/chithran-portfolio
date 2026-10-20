export const qaCategories = [
  { id: 'automation', label: 'Test Automation', icon: 'automation' },
  { id: 'api', label: 'API Testing', icon: 'api' },
  { id: 'performance', label: 'Performance Testing', icon: 'performance' },
  { id: 'mobile', label: 'Mobile Testing', icon: 'mobile' },
  { id: 'security', label: 'Security Testing', icon: 'security' },
  { id: 'analysis', label: 'Static Code Analysis', icon: 'analysis' },
  { id: 'reports', label: 'Additional Reports', icon: 'reports' },
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
  label: 'Evidence sources',
  description:
    'BrowserStack and Allure entries are based on reviewed, owner-supplied PDFs; the other seven use owner-supplied work summaries. Recorded results have not been independently rerun. Report links are supplied by the portfolio owner.',
}

// The owner approved these summaries as source material on 18 October 2026.
// Source review is separate from the owner's approval to display supplied report links.
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
    reportUrl:
      'https://drive.google.com/file/d/1hAXMtMY0IYMwKKd4SWbSrfQDMQthwZwj/view?usp=drive_link',
    publicReportApproved: true,
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
    reportUrl: 'https://drive.google.com/file/d/1KpY3WYghDkWQLGpU31j93B8KV1xEmQvd/view?usp=sharing',
    publicReportApproved: true,
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
    reportUrl:
      'https://drive.google.com/file/d/1UJhjuG4Xsbr6SnXSKz-sfwWVDoDtSD4Z/view?usp=drive_link',
    publicReportApproved: true,
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
    reportUrl: 'https://drive.google.com/file/d/1Is1MiWgQRucojhvnXPzzJF18hRL5k94e/view?usp=sharing',
    publicReportApproved: true,
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
    reportUrl:
      'https://drive.google.com/file/d/1D_roScySpSvPwO6NSPex8kOqAYHK2EMV/view?usp=drive_link',
    publicReportApproved: true,
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
    reportUrl: 'https://drive.google.com/file/d/1m9WnqAjWrXB7x2fVXXOxHrF7xxJj5of3/view?usp=sharing',
    publicReportApproved: true,
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
    reportUrl:
      'https://drive.google.com/file/d/1IxzKtnLBHlPMu6Gu7fmGjPax9rz7Wzvx/view?usp=drive_link',
    publicReportApproved: true,
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
  {
    id: 'browserstack-report',
    title: 'BrowserStack Cross-Browser Automation Testing',
    category: 'reports',
    primaryTool: 'BrowserStack Automate',
    technologies: ['Java 17', 'Selenium RemoteWebDriver', 'TestNG', 'Maven', 'IntelliJ IDEA'],
    context: 'Selenium Web Form / desktop cross-browser exercise',
    summary:
      'Ran one reusable form-submission workflow across Chrome, Edge, and Firefox through BrowserStack Automate, checking the page title and submission confirmation.',
    scope:
      'Three browser executions of the Selenium Web Form on Windows 11, validating the “Web form” title, text entry, submission, and “Received!” confirmation.',
    result:
      'The report records 3 tests and 3 passes, with 0 failures, 0 errors, and 0 skipped tests for the selected workflow.',
    implementation: [
      'Used a TestNG DataProvider to run the same test method on Chrome, Edge, and Firefox.',
      'Configured Windows 11 remote browser capabilities and Selenium RemoteWebDriver sessions.',
      'Asserted the page title and submission confirmation, and updated the BrowserStack session status.',
      'Executed the suite through Maven and reviewed console output alongside BrowserStack session evidence.',
      'Read connection credentials from environment variables and closed remote sessions in a finally block.',
    ],
    limitations:
      'This recorded result covers only the selected desktop web-form workflow. It does not establish whole-site compatibility, mobile coverage, or visual-regression testing. Tests were not independently rerun.',
    summaryApproved: true,
    sourceReviewed: true,
    sourceNote:
      'Based on the supplied BrowserStack PDF report and its result screenshots. The reported execution was reviewed, not independently rerun.',
    publicReportApproved: true,
    reportUrl: 'https://drive.google.com/file/d/1rQNz1V44eTi1gbwfRDfTEvjOoKnZqXUu/view?usp=sharing',
  },
  {
    id: 'allure-report',
    title: 'Allure Reporting for Automated Facebook Login Testing',
    category: 'reports',
    primaryTool: 'Allure Report',
    technologies: [
      'Python',
      'Selenium WebDriver',
      'Pytest',
      'Chrome / ChromeDriver',
      'PyCharm',
      'Allure CLI',
    ],
    context: 'Facebook negative-login automation and reporting exercise',
    summary:
      'Integrated Selenium and Pytest with Allure to capture negative-login execution results and review test status, diagnostic views, and step-level evidence.',
    scope: 'Three negative Facebook login scenarios using invalid inputs in Google Chrome.',
    result:
      'The supplied report records 3 passed negative-login tests, with a displayed 100% pass rate for that selected suite.',
    implementation: [
      'Refactored procedural Python scripts into discoverable Pytest tests with explicit assertions.',
      'Collected execution results with pytest --alluredir=allure-results and served them with the Allure CLI.',
      'Reviewed overview, category, suite, graph, timeline, behavior, and package views.',
      'Investigated individual test steps and attachments, including validation of failed login attempts.',
      'Used XPath locators and test_*.py naming to support element targeting and batch discovery.',
    ],
    limitations:
      'Passing negative checks means invalid login attempts were rejected; it does not demonstrate successful authentication, cross-browser coverage, or a security audit. The report includes retry history, so no first-attempt pass rate is claimed. Tests were not independently rerun.',
    summaryApproved: true,
    sourceReviewed: true,
    sourceNote:
      'Based on the supplied Allure PDF report and its result screenshots. The reported execution was reviewed, not independently rerun.',
    publicReportApproved: true,
    reportUrl:
      'https://drive.google.com/file/d/1vkCMdseZSlUQACUEZ209lRM6zVGy1Hlu/view?usp=drive_link',
  },
]
