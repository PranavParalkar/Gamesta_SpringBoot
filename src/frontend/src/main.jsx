import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // If the request starts with /api, prepend the backend API URL
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    resource = `${baseUrl}${resource}`;
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
