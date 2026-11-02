<div align="center">

# Chithran Jayathunga – Personal Portfolio

### Software Quality Assurance | Test Automation | Software Development

A modern, responsive personal portfolio showcasing my professional journey, software development projects, QA engineering experience, research work, certifications, and technical content creation.

<br/>

<a href="https://chithran-portfolio.vercel.app/">
  <img src="https://img.shields.io/badge/Live%20Portfolio-Visit%20Website-06B6D4?style=for-the-badge&logo=vercel&logoColor=white"/>
</a>
<a href="https://github.com/Chithranjaye2000">
  <img src="https://img.shields.io/badge/GitHub-Profile-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>
<a href="https://www.linkedin.com/in/chithran-jayathunga/">
  <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/>
</a>

</div>

---

## 📌 Project Overview

This portfolio is designed to present my skills and practical experience in Software Quality Assurance, Test Automation, Software Development, IoT Research, and Technical Content Creation.

The application uses a modern single-page design with responsive layouts, interactive components, smooth animations, and a customizable theme.

It provides a central place to explore my projects, QA testing evidence, technical skills, certifications, and professional background.

## ✨ Key Features

### 👨‍💻 Professional Profile

* Personal introduction and professional background.
* Education and internship experience.
* Downloadable CV.
* Social media and professional contact links.

### 🧪 QA Engineering Showcase

* QA Tools and Technologies showcase.
* Automated testing tools and frameworks.
* QA Reports and Testing Evidence.
* Interactive testing report cards.
* Testing categories and detailed test case information.

### 🚀 Projects Showcase

* Software development projects.
* IoT and research projects.
* Project descriptions and technology information.
* Interactive project cards.

### 🎬 Technical Content Creation

* Video portfolio containing 12 projects.
* Four content categories.
* Google Drive portfolio integration.
* Featured video collection.

### 🎓 Certifications

* Nine learning and certification records.
* Certificate image previews.
* Interactive certificate viewing.

### 🌙 Modern User Interface

* Glassmorphism design.
* Dark and Light themes.
* Responsive navigation.
* Smooth scrolling and subtle animations.
* Interactive UI components.
* Accessibility and reduced-motion support.

### 🤖 AI Literacy

* AI-related competencies.
* Planned AI mini-projects.
* Future learning and development goals.

---

## 🛠️ Technology Stack

### Frontend

<p>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>
</p>

### Backend

<p>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white"/>
</p>

### Database & Services

<p>
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
<img src="https://img.shields.io/badge/Aiven-FF4F8B?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Gmail-EA4335?style=for-the-badge&logo=gmail&logoColor=white"/>
</p>

### Development Tools

<p>
<img src="https://img.shields.io/badge/Git- F05032?style=for-the-badge&logo=git&logoColor=white"/>
<img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white"/>
<img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black"/>
</p>

---

## 📂 Project Structure

```text
chithran-portfolio/
│
├── public/
│   ├── documents/
│   └── images/
│       ├── profile/
│       ├── projects/
│       ├── certifications/
│       ├── videos/
│       └── tools/
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── sections/
│   │   └── ui/
│   │
│   ├── data/
│   │   ├── siteConfig.js
│   │   ├── portfolio.js
│   │   ├── qaReports.js
│   │   ├── qaTools.js
│   │   ├── certifications.js
│   │   ├── videoProjects.js
│   │   └── aiLiteracy.js
│   │
│   ├── hooks/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── backend/
│
├── docs/
│
├── index.html
├── package.json
└── vite.config.js
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js 20.19+ or 22.12+
* npm
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/Chithranjaye2000/chithran-portfolio.git
```

### 2. Navigate to the Project

```bash
cd chithran-portfolio
```

### 3. Install Dependencies

```bash
npm install
```

For a clean installation using the committed lockfile:

```bash
npm ci
```

### 4. Start Development Server

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

The frontend Projects and QA Evidence sections use static data and do not require a running backend.

### 5. Backend Configuration

The separate Express backend handles Contact submissions and optional catalogue endpoints.

Refer to:

`backend/README.md`

Configure the required database and Gmail settings privately using the backend configuration instructions.

Never expose database passwords, SMTP credentials, or API secrets in frontend environment variables.

---

## 🧪 Testing & Quality Assurance

The project includes automated checks for code quality, functionality, formatting, and production builds.

Run the following commands:

| Command                | Purpose                   |
| ---------------------- | ------------------------- |
| `npm run lint`         | ESLint code analysis      |
| `npm run test`         | Run automated tests       |
| `npm run format:check` | Check code formatting     |
| `npm run build`        | Generate production build |
| `npm run preview`      | Preview production build  |

Additional QA information is available in the portfolio's QA Evidence section.

---

## 🌐 Deployment

The project includes Vercel deployment configuration and deployment documentation.

**Live Portfolio:**

https://chithran-portfolio.vercel.app/

Deployment configuration:

`docs/vercel-services-deployment.md`

---

## 🔮 Future Improvements

* Expand automated testing coverage.
* Add more software development projects.
* Publish additional QA testing evidence.
* Expand technical content collections.
* Continue improving accessibility and performance.
* Develop and publish planned AI mini-projects.

---

## 👨‍💻 Author

**Chithran Jayathunga**

Software Quality Assurance | Test Automation | Software Development

* GitHub: [@Chithranjaye2000](https://github.com/Chithranjaye2000)
* LinkedIn: [Chithran Jayathunga](https://www.linkedin.com/in/chithran-jayathunga/)
* Portfolio: [chithran-portfolio.vercel.app](https://chithran-portfolio.vercel.app/)

---

<div align="center">

**Built with React, Vite, and a passion for technology.**

⭐ If you find this project interesting, consider giving it a star!

</div>
