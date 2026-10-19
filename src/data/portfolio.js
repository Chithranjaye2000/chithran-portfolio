export const projects = [
  {
    id: 'soil-monitoring',
    number: '01',
    title: 'Smarter insights. Healthier soil.',
    fullTitle:
      'LoRaWAN-Based Energy-Efficient Soil Nutrient Monitoring System for Bell Pepper Cultivation',
    label: 'Soil Nutrient Monitoring',
    date: 'Nov 2025 – Present',
    category: 'Research & IoT',
    context: 'Final year research project',
    image: '/images/projects/soil-monitoring.png',
    summary:
      'Exploring reliable, energy-efficient soil monitoring for bell pepper cultivation through sensor validation and wireless communication testing.',
    technologies: ['ESP32', 'LoRa / LoRaWAN concepts', 'TCP/IP'],
    overview:
      'A final year research project investigating soil nutrient monitoring, sensor data collection, energy saving, and a monitoring dashboard for bell pepper cultivation.',
    contributions: [
      'Validate sensor data accuracy and observe system performance.',
      'Design and execute scenarios for data transmission between ESP32 devices and a cloud platform.',
      'Identify and document network stability and data inconsistency issues.',
      'Explore deep-sleep energy saving and sensor collection with ESP32 and RA-02 SX1278 modules at 433 MHz.',
    ],
    note: 'The research LoRaWAN. The implemented radio communication is LoRaWAN',
    repositoryUrl: null, // TODO: add only a verified, public, shareable URL.
    demoUrl: null,
  },
  {
    id: 'quickjob',
    number: '02',
    title: 'Connecting people to opportunity.',
    fullTitle: 'QuickJob — Part-Time Job Offering Platform',
    label: 'QuickJob',
    date: 'May 2025 – Sep 2025',
    category: 'Web & mobile',
    context: 'Academic project',
    image: '/images/projects/quickjob.png',
    summary:
      'A cross-platform job offering platform, with a focus on validating matching, real-time conversations, and financial transaction workflows.',
    technologies: ['React', 'React Native + Expo', 'Node.js', 'MySQL + Azure', 'OpenRouter API'],
    overview:
      'A web and mobile platform connecting people with part-time job opportunities. The project brings together job matching, real-time chat, and financial transaction workflows.',
    contributions: [
      'Validate job matching and real-time chat across key user journeys.',
      'Assess financial transaction workflows through functional test scenarios.',
      'Design scenarios to identify potential issues in core functionality and user workflows.',
    ],
    note: 'This case study describes the project scope and validation work. No production deployment, public repository, or quantified test results are claimed.',
    repositoryUrl: null,
    demoUrl: null,
  },
  {
    id: 'innovation',
    number: '03',
    title: 'A space for ideas to move forward.',
    fullTitle: 'Innovation Management System',
    label: 'Innovation Management',
    date: 'May 2024 – Oct 2024',
    category: 'Web & mobile',
    context: 'Academic project',
    image: '/images/projects/innovation.svg',
    summary:
      'A PHP and MySQL platform for innovation and collaboration, with validation of core workflows and the Gemini API integration.',
    technologies: ['PHP', 'MySQL', 'Bootstrap', 'JavaScript', 'Gemini API'],
    overview:
      'An innovation platform built with HTML, PHP, MySQL, Bootstrap, and JavaScript, with a Gemini API integration to support the platform experience.',
    contributions: [
      'Validate create, read, update, and delete functionality against expected behavior.',
      'Test the Gemini API integration and review its behavior within the platform.',
      'Check collaboration workflows and document functional issues.',
    ],
    note: 'The case study focuses on functional validation. Repository and demonstration links are pending confirmation.',
    repositoryUrl: null,
    demoUrl: null,
  },
  {
    id: 'task-tracker',
    number: '04',
    title: 'Clearer tasks. Connected teams.',
    fullTitle: 'Task Tracker for Team Collaboration — Web Application',
    label: 'Team Task Tracker',
    date: 'Jul 2024 – Aug 2024',
    category: 'Web & mobile',
    context: 'Academic project',
    image: '/images/projects/task-tracker.png',
    summary:
      'A role-based waste-collection and task-tracking web application, connecting Admin, Driver, and User workflows in one responsive interface.',
    technologies: ['Java', 'JSP / Servlets', 'MySQL', 'JavaScript', 'Bootstrap'],
    overview:
      'A full-stack web application for waste-collection and task tracking. Admin, Driver, and User roles support distinct workflows with database integration and a responsive interface.',
    contributions: [
      'Develop role-based workflows for Admin, Driver, and User access.',
      'Implement CRUD operations and MySQL database integration using JSP and Servlets.',
      'Build a responsive interface with JavaScript and Bootstrap.',
    ],
    note: 'This is an academic application. Public repository and demo links will be added once verified.',
    repositoryUrl: null,
    demoUrl: null,
  },
]

// Hands-on tools explicitly confirmed by Chithran; no proficiency levels are implied.
export const skillGroups = [
  {
    icon: 'testing',
    title: 'Test automation',
    description: 'Making repeatable checks part of the workflow.',
    skills: ['Selenium', 'Playwright', 'Appium', 'Cucumber', 'Allure Reports'],
  },
  {
    icon: 'api',
    title: 'API & performance',
    description: 'Checking behavior across services and under load.',
    skills: ['Postman', 'REST Assured', 'Apache JMeter'],
  },
  {
    icon: 'security',
    title: 'Security & code quality',
    description: 'Looking beyond functional behavior.',
    skills: ['OWASP ZAP', 'SonarQube'],
  },
  {
    icon: 'management',
    title: 'Testing & reporting',
    description: 'Organizing coverage, findings, and browser checks.',
    skills: ['BrowserStack', 'JIRA', 'Zephyr', 'Test case design', 'Bug reporting'],
  },
  {
    icon: 'code',
    title: 'Development',
    description: 'Building across the web and mobile.',
    skills: [
      'Java',
      'JavaScript',
      'React',
      'React Native + Expo',
      'Node.js',
      'PHP',
      'JSP / Servlets',
    ],
  },
  {
    icon: 'layers',
    title: 'Interfaces & data',
    description: 'Connecting useful interfaces with structured data.',
    skills: [
      'HTML',
      'CSS',
      'Tailwind CSS',
      'Bootstrap',
      'MySQL',
      'Azure',
      'Gemini API',
      'OpenRouter API',
    ],
  },
  {
    icon: 'workflow',
    title: 'Tools & workflow',
    description: 'Keeping development and testing connected.',
    skills: ['Git', 'GitHub', 'Maven', 'CI/CD Pipelines', 'VS Code'],
  },
  {
    icon: 'research',
    title: 'Research & communication',
    description: 'Making technical ideas tangible and understandable.',
    skills: [
      'ESP32',
      'LoRa / LoRaWAN concepts',
      'IoT sensors',
      'TCP/IP',
      'Technical walkthroughs',
      'CapCut',
    ],
  },
]

export const education = {
  degree: 'BSc (Hons) in Industrial Information Technology',
  institution: 'Uva Wellassa University',
  location: 'Sri Lanka',
  description:
    'An academic foundation connecting software development, quality assurance, and applied technology research.',
}

// Editorial backlog only: these items are intentionally not published as claims.
export const contentTodos = {
  additionalCaseStudies: ['SDesk incident-transfer workflow testing'],
}
