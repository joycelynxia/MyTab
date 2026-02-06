import './App.css'
import Header from './components/Header'
import GroupPage from './pages/GroupPage'
import GroupJoinPage from './pages/GroupJoinPage'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { AuthProvider } from './contexts/AuthContext'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/home"
            element={
              <>
                <Header />
                <HomePage />
              </>
            }
          />
          <Route path="/groups/join/:shareToken" element={<GroupJoinPage />} />
          <Route
            path="/groups/:groupId"
            element={
              <>
                <Header />
                <GroupPage />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;
