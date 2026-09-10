import { BrowserRouter } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './auth/AuthContext'
import { AppRoutes } from './routes/AppRoutes'
import { ContextProvider } from './components/navigation/NewContextManagement'
import { SpotifyAuthContextProvider } from './auth/SpotifyAuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ContextProvider>
          <SpotifyAuthContextProvider>
            <AppRoutes />
          </SpotifyAuthContextProvider>
        </ContextProvider>        
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
