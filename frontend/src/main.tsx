import { StrictMode } from 'react'
import { AppErrorBoundary } from './components/ui/AppErrorBoundary'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './features/auth/AuthProvider'
import { AuthGate } from './features/auth/AuthGate'
import { App } from './app/App'
import './styles/globals.css'
import './styles/ui-system.css'
import './styles/nature-theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
