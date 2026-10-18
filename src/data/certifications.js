// Use exact dates printed on the Simplilearn images; other months come from the CV.
// Keep unknown certificate IDs and individual verification URLs absent.
export const certificateIssuers = {
  moratuwa: {
    name: 'University of Moratuwa, CODL',
    label: 'CODL / University of Moratuwa',
    note: 'The university provides a general certificate verification portal. This is not an individual verification link.',
  },
  simplilearn: {
    name: 'Simplilearn SkillUp',
    label: 'Simplilearn SkillUp',
    note: 'A course-completion acknowledgement from Simplilearn SkillUp. This is not an official Microsoft certification.',
  },
  linkedin: {
    name: 'LinkedIn Learning',
    label: 'LinkedIn Learning',
    note: 'Learning record listed in my CV. A certificate image and individual verification link have not been provided.',
  },
}

export const certifications = [
  {
    id: 'agile-project-management',
    title: 'Agile Project Management in ICT Projects',
    issuer: 'moratuwa',
    completedAt: '2025-11',
    imagePath: '/images/certifications/agile-project-management.png',
  },
  {
    id: 'generative-ai-for-everyone',
    title: 'Generative AI for Everyone',
    issuer: 'simplilearn',
    completedAt: '2025-12-11',
    imagePath: '/images/certifications/generative-ai-for-everyone.jpg',
  },
  {
    id: 'software-quality-assurance',
    title: 'Introduction to Software Quality Assurance',
    issuer: 'moratuwa',
    completedAt: '2025-11',
    imagePath: '/images/certifications/software-quality-assurance.png',
  },
  {
    id: 'power-bi-for-beginners',
    title: 'Power BI for Beginners',
    issuer: 'simplilearn',
    completedAt: '2025-12-09',
    imagePath: '/images/certifications/power-bi-for-beginners.jpg',
  },
  {
    id: 'project-communication-stakeholder-management',
    title: 'Project Communication and Stakeholder Management',
    issuer: 'moratuwa',
    completedAt: '2025-12',
    imagePath: '/images/certifications/project-communication-stakeholder-management.png',
  },
  {
    id: 'prompt-engineering-github-copilot',
    title: 'Introduction to Prompt Engineering with GitHub Copilot',
    issuer: 'simplilearn',
    completedAt: '2025-12-10',
    imagePath: '/images/certifications/prompt-engineering-github-copilot.jpg',
  },
  {
    id: 'responsive-web-design',
    title: 'Responsive Web Design (Advanced)',
    issuer: 'linkedin',
    completedAt: '2025-07',
    imagePath: null,
    detailsUrl: 'https://lnkd.in/gb4tw5vX',
  },
  {
    id: 'python-collections',
    title: 'Python: Collections Practice',
    issuer: 'linkedin',
    completedAt: '2025-06',
    imagePath: null,
    detailsUrl: 'https://lnkd.in/gBeJN8Eq',
  },
  {
    id: 'generative-ai-negotiation',
    title: 'Generative AI Negotiation',
    issuer: 'linkedin',
    completedAt: '2025-06',
    imagePath: null,
    detailsUrl: 'https://lnkd.in/gHGUXiRE',
  },
]
