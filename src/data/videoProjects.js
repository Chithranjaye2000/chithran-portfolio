import { siteConfig } from './siteConfig'

// The shared folder has one source of truth; these are not individual video URLs.
export const videoCollectionUrl = siteConfig.googleDrivePortfolioUrl

export const videoCategories = {
  demonstrations: 'Software Demonstrations',
  walkthroughs: 'System Walkthroughs & Tutorials',
  explainers: 'Technical Explainers & Capability Videos',
  showcases: 'Product Launches & Project Showcases',
}

// Exact original filenames and project matches supplied by the portfolio owner.
// null renders a text-only missing-thumbnail state, without an image request.
export const videoProjects = [
  {
    id: 'digital-platform-division',
    title: 'Digital Platform Division Video',
    category: videoCategories.explainers,
    description: 'A video introduction to the Digital Platform Division and its capabilities.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190132.png',
    featured: true,
  },
  {
    id: 'security-attendance-management',
    title: 'Security Attendance Management System',
    category: videoCategories.demonstrations,
    description: 'A demonstration introducing the Security Attendance Management System.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190253.png',
  },
  {
    id: 'slt-trainee-guidelines',
    title: 'SLT Trainee Guidelines Agreement',
    category: videoCategories.walkthroughs,
    description: 'A walkthrough of the SLT trainee guidelines agreement.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190651.png',
  },
  {
    id: 'talenthub-onboarding',
    title: 'TalentHub Onboarding Video for SLT Interns',
    category: videoCategories.walkthroughs,
    description: 'An onboarding video introducing TalentHub to SLT interns.',
    thumbnailPath: '/images/videos/WhatsApp Image 2026-06-23 at 14.05.21.jpeg',
  },
  {
    id: 'talenttrail-onboarding',
    title: 'TalentTrail Onboarding Video for SLT Interns',
    category: videoCategories.walkthroughs,
    description: 'An onboarding video introducing TalentTrail to SLT interns.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 191314.png',
  },
  {
    id: 'talenthub-talenttrail-capability',
    title: 'SLTMobitel TalentHub TalentTrail Capability Video',
    category: videoCategories.explainers,
    description: 'A capability overview of SLTMobitel TalentHub and TalentTrail.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190725.png',
  },
  {
    id: 'smart-employee-overview',
    title: 'Smart Employee System – Solution Overview',
    category: videoCategories.explainers,
    description: 'A solution overview introducing the Smart Employee System.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190815.png',
  },
  {
    id: '118-launch',
    title: '118 Launching Video',
    category: videoCategories.showcases,
    description: 'A video presentation for the 118 launch.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190021.png',
  },
  {
    id: 'police-emergency-launch',
    title: 'Police Emergency Call Centre Launch 2026',
    category: videoCategories.showcases,
    description: 'A launch video for the Police Emergency Call Centre in 2026.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190048.png',
  },
  {
    id: 'ntmi-appointment-launch',
    title: 'NTMI Smart Appointment Launch',
    category: videoCategories.showcases,
    description: 'A launch presentation introducing NTMI Smart Appointment.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190156.png',
  },
  {
    id: 'internship-management-launch',
    title: 'SLT-MOBITEL Internship Management System Official Launch',
    category: videoCategories.showcases,
    description: 'The official launch video for the SLT-MOBITEL Internship Management System.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190215.png',
  },
  {
    id: 'police-inventory-launch',
    title: 'Sri Lanka Police Inventory Management System Launch',
    category: videoCategories.showcases,
    description: 'A launch video introducing the Sri Lanka Police Inventory Management System.',
    thumbnailPath: '/images/videos/Screenshot 2026-10-18 190843.png',
  },
]
