import './App.css'
import Header from './components/Header'
import GroupPage from './pages/GroupPage'
import GroupJoinPage from './pages/GroupJoinPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/home"
            element={
              <>
                <Header />
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
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
