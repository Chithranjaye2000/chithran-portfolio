export const projects = [
  {
    id: 'soil-monitoring',
    number: '01',
    title: 'Sensor data and wireless communication',
    fullTitle:
      'LoRaWAN-Based Energy-Efficient Soil Nutrient Monitoring System for Bell Pepper Cultivation',
    label: 'Soil Nutrient Monitoring',
    date: 'Nov 2025 – Present',
    category: 'Research & IoT',
    context: 'Final year research project',
    image: '/images/projects/soil-monitoring.png',
    summary:
      'My final year research focuses on soil nutrient monitoring for bell pepper cultivation. I test sensor readings and wireless data transmission.',
    technologies: ['ESP32', 'LoRa / LoRaWAN concepts', 'TCP/IP'],
    overview:
      'I’m testing a soil nutrient monitoring system for bell pepper cultivation. The work covers sensor data collection, wireless transmission, deep-sleep energy saving, and a monitoring dashboard.',
    contributions: [
      'Checking sensor data accuracy and system performance.',
      'Testing data transmission between ESP32 devices and a cloud platform.',
      'Documenting network stability and data inconsistency issues.',
      'Exploring deep-sleep energy saving and sensor collection with ESP32 and RA-02 SX1278 modules at 433 MHz.',
    ],
    note: 'The wireless testing uses ESP32 devices and RA-02 SX1278 LoRa modules at 433 MHz.',
    repositoryUrl: null, // TODO: add only a verified, public, shareable URL.
    demoUrl: null,
  },
  {
    id: 'quickjob',
    number: '02',
    title: 'A web and mobile part-time job platform',
    fullTitle: 'QuickJob — Part-Time Job Offering Platform',
    label: 'QuickJob',
    date: 'May 2025 – Sep 2025',
    category: 'Web & mobile',
    context: 'Academic project',
    image: '/images/projects/quickjob.png',
    summary:
      'A web and mobile platform for part-time jobs. I tested job matching, real-time chat, and financial transaction workflows.',
    technologies: ['React', 'React Native + Expo', 'Node.js', 'MySQL + Azure', 'OpenRouter API'],
    overview:
      'QuickJob connects people with part-time jobs through web and mobile apps. It includes job matching, real-time chat, and financial transaction workflows.',
    contributions: [
      'Tested job matching and real-time chat across key user journeys.',
      'Assessed financial transaction workflows through functional test scenarios.',
      'Designed test scenarios to find issues in core functionality and user workflows.',
    ],
    note: 'Academic project. Repository and demo links are not listed yet.',
    repositoryUrl: null,
    demoUrl: null,
  },
  {
    id: 'innovation',
    number: '03',
    title: 'A PHP platform for managing ideas',
    fullTitle: 'Innovation Management System',
    label: 'Innovation Management',
    date: 'May 2024 – Oct 2024',
    category: 'Web & mobile',
    context: 'Academic project',
    image: '/images/projects/innovation.svg',
    summary:
      'An innovation platform built with PHP and MySQL. I checked CRUD operations, collaboration workflows, and the Gemini API integration.',
    technologies: ['PHP', 'MySQL', 'Bootstrap', 'JavaScript', 'Gemini API'],
    overview:
      'This academic project uses HTML, PHP, MySQL, Bootstrap, and JavaScript to manage ideas and collaboration, with Gemini API integration.',
    contributions: [
      'Validated create, read, update, and delete operations against expected behavior.',
      'Tested the Gemini API integration within the platform.',
      'Checked collaboration workflows and documented functional issues.',
    ],
    note: 'The testing covered CRUD operations, collaboration, and the Gemini API integration.',
    repositoryUrl: null,
    demoUrl: null,
  },
  {
    id: 'task-tracker',
    number: '04',
    title: 'Role-based waste-collection tracking',
    fullTitle: 'Task Tracker for Team Collaboration — Web Application',
    label: 'Team Task Tracker',
    date: 'Jul 2024 – Aug 2024',
    category: 'Web & mobile',
    context: 'Academic project',
    image: '/images/projects/task-tracker.png',
    summary:
      'A waste-collection and task-tracking web app with Admin, Driver, and User roles, CRUD operations, and a MySQL database.',
    technologies: ['Java', 'JSP / Servlets', 'MySQL', 'JavaScript', 'Bootstrap'],
    overview:
      'I built a web application for waste-collection and task tracking using JSP, Servlets, and MySQL. It has separate Admin, Driver, and User workflows and a responsive interface.',
    contributions: [
      'Developed role-based workflows for Admin, Driver, and User access.',
      'Implemented CRUD operations and MySQL database integration using JSP and Servlets.',
      'Built a responsive interface with JavaScript and Bootstrap.',
    ],
    note: 'Built as an academic project using JSP, Servlets, and MySQL.',
    repositoryUrl: null,
    demoUrl: null,
  },
]

// Hands-on tools explicitly confirmed by Chithran; no proficiency levels are implied.
export const skillGroups = [
  {
    icon: 'testing',
    title: 'Test automation',
    description: 'Browser and mobile automation, with test reports.',
    skills: ['Selenium', 'Playwright', 'Appium', 'Cucumber', 'Allure Reports'],
  },
  {
    icon: 'api',
    title: 'API & performance',
    description: 'API requests, response checks, and load tests.',
    skills: ['Postman', 'REST Assured', 'Apache JMeter'],
  },
  {
    icon: 'security',
    title: 'Security & code quality',
    description: 'Security scans and static code analysis.',
    skills: ['OWASP ZAP', 'SonarQube'],
  },
  {
    icon: 'management',
    title: 'Testing & reporting',
    description: 'Test cases, bug reports, and browser testing.',
    skills: ['BrowserStack', 'JIRA', 'Zephyr', 'Test case design', 'Bug reporting'],
  },
  {
    icon: 'code',
    title: 'Development',
    description: 'Languages and frameworks for web and mobile projects.',
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
    description: 'Frontend styling, databases, and API integrations.',
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
    description: 'Version control, builds, and CI/CD.',
    skills: ['Git', 'GitHub', 'Maven', 'CI/CD Pipelines', 'VS Code'],
  },
  {
    icon: 'research',
    title: 'Research & communication',
    description: 'Sensor projects, wireless communication, and technical videos.',
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
  expectedGraduation: 2027,
  coursework: [
    'Software Quality Assurance',
    'IT Project Management',
    'Business Analytics',
    'System Analysis and Design',
    'Technical Content Creation',
  ],
  description:
    'An academic foundation connecting software development, quality assurance, and applied technology research.',
}

// Editorial backlog only: these items are intentionally not published as claims.
export const contentTodos = {
  additionalCaseStudies: ['SDesk incident-transfer workflow testing'],
}
