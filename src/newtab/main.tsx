import React from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import { NewTabApp } from './NewTabApp'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <React.StrictMode>
    <NewTabApp />
  </React.StrictMode>,
)
