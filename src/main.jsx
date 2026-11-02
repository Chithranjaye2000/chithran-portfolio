import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PortfolioPreloader from './components/ui/PortfolioPreloader.jsx'
import './styles/theme.css'
import './styles/index.css'
import './styles/motion.css'
import './styles/certifications.css'
import './styles/glass.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PortfolioPreloader>
      <App />
    </PortfolioPreloader>
  </React.StrictMode>,
)
