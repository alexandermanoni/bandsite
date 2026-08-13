import { BrowserRouter } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './auth/AuthContext'
import { AppRoutes } from './routes/AppRoutes'
import { ContextProvider } from './components/navigation/NewContextManagement'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ContextProvider>
          <AppRoutes />
        </ContextProvider>        
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
