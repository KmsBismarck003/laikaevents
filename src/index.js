import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './styles/globals.css'
import './styles/theme.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <GoogleOAuthProvider clientId="894713662394-kj60pghcudhpc8oh3i2mnqqjptsppp7b.apps.googleusercontent.com">
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
)
