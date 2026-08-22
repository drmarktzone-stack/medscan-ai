import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerClinicPwa } from '@/lib/clinic/pwa.js'

registerClinicPwa({
  env: import.meta.env,
  register: typeof navigator !== 'undefined'
    ? navigator.serviceWorker?.register?.bind(navigator.serviceWorker)
    : undefined,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
